/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { visit, CONTINUE } from 'unist-util-visit';
import { asciiPunctuation, markdownSpace, unicodePunctuation } from 'micromark-util-character';

export function isFormat(type) {
  return type === 'strong'
    || type === 'emphasis'
    || type === 'delete'
    || type === 'superscript'
    || type === 'subscript'
    || type === 'underline';
}

function isSnug(type) {
  return type === 'superscript' || type === 'subscript';
}

const FLOW_SORT_ORDER = [
  'delete',
  'strong',
  'emphasis',
  'link',
  'underline',
  'subscript',
  'superscript',
];

export function sort(tree) {
  if (!tree.children) {
    return;
  }
  for (let i = 0; i < tree.children.length; i += 1) {
    let node = tree.children[i];
    let key = FLOW_SORT_ORDER.indexOf(node.type);
    if (key >= 0) {
      // find the longest chain of formats
      const chain = [];
      while (key >= 0) {
        chain.push({ node, key });
        node = node.children?.length === 1 ? node.children[0] : null;
        key = node ? FLOW_SORT_ORDER.indexOf(node?.type) : -1;
      }
      if (chain.length > 1) {
        // remember children of last node in chain
        const lastChildren = chain[chain.length - 1].node.children;

        // sort chain
        chain.sort((n0, n1) => (n0.key - n1.key));

        // relink chain
        for (let j = 0; j < chain.length - 1; j += 1) {
          chain[j].node.children = [chain[j + 1].node];
        }
        chain[chain.length - 1].node.children = lastChildren;

        // eslint-disable-next-line no-param-reassign
        tree.children[i] = chain[0].node;
      }
      // continue on last node
      sort(chain[chain.length - 1].node);
    } else {
      sort(node);
    }
  }
}

function collapse(tree) {
  visit(tree, (node, index, parent) => {
    const { children: siblings = [] } = parent || {};
    const { children = [] } = node;

    if (isFormat(node.type)) {
      // collapse consecutive formats
      while (siblings[index + 1]?.type === node.type) {
        children.push(...siblings[index + 1].children);
        siblings.splice(index + 1, 1);
      }
      // remove empty formats
      if (!children.length) {
        siblings.splice(index, 1);
        return index - 1;
      }
    }
    return CONTINUE;
  });
}

function whitespace(tree) {
  visit(tree, (node, index, parent) => {
    const { children: siblings = [] } = parent || {};
    const { children = [] } = node;

    if (isFormat(node.type)) {
      // check if last text block has trailing whitespace
      const last = children[children.length - 1];
      if (last?.type === 'text') {
        const trimmed = last.value.trimEnd();
        if (!trimmed) {
          // if text is empty, discard
          children.pop();
        }
        if (trimmed !== last.value) {
          const newText = {
            type: 'text',
            value: last.value.substring(trimmed.length),
          };
          if (!children.length) {
            // if format is empty, discard
            siblings[index] = newText;
            return index;
          }
          last.value = trimmed;
          // add space after
          siblings.splice(index + 1, 0, newText);
          // return index;
        }
      }
      // check if the first text block has a leading whitespace
      const first = children[0];
      if (first?.type === 'text') {
        const trimmed = first.value.trimStart();
        if (trimmed !== first.value) {
          const newText = {
            type: 'text',
            value: first.value.substring(0, first.value.length - trimmed.length),
          };
          first.value = trimmed;
          if (!trimmed) {
            // remove
            children.shift();
          }
          if (isFormat(parent.type)) {
            // special case for nested formats, discard the text
            // ignore
          } else {
            // insert before
            siblings.splice(index, 0, newText);
            // eslint-disable-next-line no-param-reassign
            index += 1;
          }
        }
      }

      // ensure that text before format has trailing whitespace
      const prev = siblings[index - 1];
      if (prev?.type === 'text' && !isSnug(node.type)) {
        const code = prev.value.charCodeAt(prev.value.length - 1);
        if (!asciiPunctuation(code) && !markdownSpace(code) && !unicodePunctuation(code)) {
          prev.value += ' ';
        }
      }

      // ensure that text after format has leading whitespace
      const next = siblings[index + 1];
      if (children.length && next?.type === 'text' && !isSnug(node.type)) {
        const code = next.value.charCodeAt(0);
        if (!asciiPunctuation(code) && !markdownSpace(code) && !unicodePunctuation(code)) {
          next.value = ` ${next.value}`;
        }
      }
    }
    return CONTINUE;
  });
}

function cleanup(tree) {
  visit(tree, (node, index, parent) => {
    const { children: siblings = [] } = parent || {};

    if (node.type === 'text') {
      // collapse text blocks
      while (siblings[index + 1]?.type === 'text') {
        // eslint-disable-next-line no-param-reassign
        node.value += siblings[index + 1].value;
        siblings.splice(index + 1, 1);
      }

      // remove trailing whitespace if last text block
      if (index === siblings.length - 1) {
        // eslint-disable-next-line no-param-reassign
        node.value = node.value.trimEnd();
      }

      // remove trailing whitespace before break
      if (siblings[index + 1]?.type === 'break') {
        // eslint-disable-next-line no-param-reassign
        node.value = node.value.trimEnd();
      }

      // remove leading whitespace in paragraphs
      if (index === 0 && parent?.type === 'paragraph') {
        // eslint-disable-next-line no-param-reassign
        node.value = node.value.trimStart();
      }

      // remove empty text nodes
      if (!node.value) {
        siblings.splice(index, 1);
        return index - 1;
      }
    }

    // remove trailing breaks altogether
    if (node.type === 'break') {
      if (index === siblings.length - 1) {
        siblings.splice(index, 1);
        return index - 1;
      }

      // eslint-disable-next-line no-param-reassign
      delete node.value;
    }

    return CONTINUE;
  });
}

/**
 * remove empty text, formats, paragraphs
 * @param node
 * @return {boolean}
 */
function prune(node) {
  const { children, type } = node;
  if (type === 'text') {
    return !node.value;
  }
  if (!children) {
    return false;
  }
  for (let i = 0; i < children.length; i += 1) {
    if (prune(children[i])) {
      children.splice(i, 1);
      i -= 1;
    }
  }
  if (type === 'paragraph' || isFormat(type)) {
    return children.length === 0;
  }
  return false;
}

/**
 * Sanitizes text:
 * - collapses consecutive formats
 * - collapses consecutive text blocks
 * - trims ends of texts before break
 * - trims ends of texts at the end
 * - moves leading and trailing whitespaces out of formats
 * - ensures spaces after formats
 * - removes trailing breaks in containers
 *   see https://github.com/micromark/micromark/issues/118#issuecomment-1238225086
 * - removes empty text blocks, formats, paragraphs
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function sanitizeTextAndFormats(tree) {
  collapse(tree);
  prune(tree);
  sort(tree);
  // collapse again, because sorting the nodes might have produce new collapsable siblings
  collapse(tree);
  whitespace(tree);
  cleanup(tree);
  prune(tree);
  return tree;
}
