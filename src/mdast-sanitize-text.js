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

/**
 * Sanitizes text:
 * - collapses consecutive text blocks
 * - trims ends of texts before break
 * - trims ends of texts at the end
 * - moves leading and trailing whitespaces out of formats
 * - removes leading whitespaces before images
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function sanitizeText(tree) {
  visit(tree, (node, index, parent) => {
    const { children: siblings = [] } = parent || {};
    const { children = [] } = node;

    // collapse text blocks
    if (index > 0 && node.type === 'text' && siblings[index - 1].type === 'text') {
      siblings[index - 1].value += node.value;
      siblings.splice(index, 1);
      return index - 1;
    }

    if ((node.type === 'strong' || node.type === 'emphasis' || node.type === 'delete') && children.length) {
      // check if last text block has a trailing whitespace
      const last = children[children.length - 1];
      if (last.type === 'text') {
        const trimmed = last.value.trimEnd();
        if (trimmed !== last.value) {
          const newText = {
            type: 'text',
            value: last.value.substring(trimmed.length),
          };
          if (!trimmed && children.length === 1) {
            // if formatting block would now be empty, remove it
            siblings.splice(index, 1, newText);
            return index - 1;
          } else {
            // add space after
            last.value = trimmed;
            siblings.splice(index + 1, 0, newText);
          }
          return index;
        }
      }
      // check if the first text block has a leading whitespace
      const first = children[0];
      if (first.type === 'text') {
        const trimmed = first.value.trimStart();
        if (trimmed !== first.value) {
          const newText = {
            type: 'text',
            value: first.value.substring(0, first.value.length - trimmed.length),
          };
          first.value = trimmed;
          // insert before
          siblings.splice(index, 0, newText);
          return index;
        }
      }
    }

    // remove leading whitespace in paragraphs
    if (parent && index === 0 && parent.type === 'paragraph' && node.type === 'text') {
      // eslint-disable-next-line no-param-reassign
      node.value = node.value.trimStart();
      if (!node.value) {
        siblings.splice(index, 1);
        return index;
      }
    }

    // remove trailing whitespace if last text block
    if (node.type === 'text' && index === siblings.length - 1) {
      // eslint-disable-next-line no-param-reassign
      node.value = node.value.trimEnd();
      if (!node.value) {
        siblings.splice(index, 1);
        return index - 1;
      }
    }
    // remove trailing whitespace before break blocks
    if (node.type === 'break') {
      // eslint-disable-next-line no-param-reassign
      delete node.value;
      if (index > 0) {
        const prev = siblings[index - 1];
        if (prev.type === 'text') {
          prev.value = prev.value.trimEnd();
          if (!prev.value) {
            siblings.splice(index - 1, 1);
            return index - 1;
          }
        }
      }
    }
    return CONTINUE;
  });
  return tree;
}
