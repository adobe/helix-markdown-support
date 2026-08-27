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
import { isFormat } from './mdast-sanitize-text-and-formats.js';

/**
 * Decomposes a chain of nested single-child formatting nodes (eg `emphasis > strong > text`)
 * into the ordered list of decoration types (outer to inner) and the actual content that
 * carries them.
 *
 * @param {object} node a formatting node
 * @returns {{ decorations: string[], content: object[] }}
 */
function decompose(node) {
  const decorations = [];
  let cur = node;
  while (isFormat(cur.type)) {
    decorations.push(cur.type);
    if (cur.children.length !== 1) {
      // can't peel further: whatever is left becomes the (opaque) content
      return { decorations, content: cur.children };
    }
    [cur] = cur.children;
  }
  return { decorations, content: [cur] };
}

/**
 * Re-wraps content with the given decorations (outer to inner order).
 *
 * @param {string[]} decorations decoration types, outer to inner
 * @param {object[]} content content nodes to wrap
 * @returns {object[]} the wrapped content (same array if no decorations given)
 */
function wrap(decorations, content) {
  let children = content;
  for (let i = decorations.length - 1; i >= 0; i -= 1) {
    children = [{ type: decorations[i], children }];
  }
  return children;
}

/**
 * Tries to merge a contiguous run of formatting siblings that share one or more common
 * decorations, regardless of how those decorations are nested in each individual sibling.
 *
 * eg a paragraph that is entirely bold, with one word that is additionally italic, can be
 * represented either as `strong` + `emphasis(strong)` + `strong` (bold is the "outer" format)
 * or as `emphasis` + `strong(emphasis)` + `emphasis` (italic is the "outer" format), depending
 * on the order the source document applied the formats. Regardless of that nesting order, the
 * decorations shared by *all* siblings in the run (here: bold) are factored out into a single
 * outer wrapper, while the decorations that only apply to some of the siblings (here: italic)
 * are kept nested inside, closest to the affected text.
 *
 * @param {object[]} group contiguous run of formatting nodes
 * @returns {object[]} the (possibly merged) replacement nodes
 */
function mergeGroup(group) {
  if (group.length < 2) {
    return group;
  }
  const decomposed = group.map(decompose);
  const sets = decomposed.map(({ decorations }) => new Set(decorations));
  const common = decomposed[0].decorations.filter((d) => sets.every((s) => s.has(d)));
  if (!common.length) {
    return group;
  }
  const commonSet = new Set(common);
  const mergedChildren = decomposed.flatMap(({ decorations, content }) => (
    wrap(decorations.filter((d) => !commonSet.has(d)), content)
  ));
  return wrap(common, mergedChildren);
}

function isEmptyFormat(node) {
  const { children } = node;
  if (!children || !children.length) {
    return true;
  }
  return children.length === 1 && children[0].type === 'text' && !children[0].value;
}

/**
 * Sanitizes text:
 * - collapses consecutive formatting blocks, merging the decorations they have in common into
 *   a single outer wrapper, irrespective of how the decorations are nested within each sibling
 * - removes empty formatting blocks (no or empty text)
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function sanitizeFormats(tree) {
  visit(tree, (node) => {
    const { children } = node;
    if (!children || !children.length) {
      return CONTINUE;
    }
    // remove empty format nodes first
    for (let i = children.length - 1; i >= 0; i -= 1) {
      if (isFormat(children[i].type) && isEmptyFormat(children[i])) {
        children.splice(i, 1);
      }
    }
    // merge contiguous runs of formatting siblings that share decorations
    let i = 0;
    while (i < children.length) {
      if (isFormat(children[i].type)) {
        let j = i;
        while (j + 1 < children.length && isFormat(children[j + 1].type)) {
          j += 1;
        }
        const replacement = mergeGroup(children.slice(i, j + 1));
        children.splice(i, j - i + 1, ...replacement);
        i += replacement.length;
      } else {
        i += 1;
      }
    }
    return CONTINUE;
  });
  return tree;
}
