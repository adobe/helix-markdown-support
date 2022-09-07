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
import { visit } from 'unist-util-visit';

/**
 * Sanitizes headings:
 * - (re)move images ('before', 'both', 'after')
 * - converts BREAKs inside headings to <br>.
 *
 * @param {object} tree
 * @param {object} [opts] options
 * @param {string} [opts.imageHandling] specifies how images are handled. defaults to 'after'.
 * @returns {object} The modified (original) tree.
 */
export default function sanitizeHeading(tree, opts = {}) {
  const { imageHandling = 'after' } = opts;
  visit(tree, (node, index, parent) => {
    const { children: siblings = [] } = parent || {};
    const { children = [] } = node;
    let after = index + 1;
    if (node.type === 'heading') {
      for (let i = 0; i < children.length; i += 1) {
        const child = children[i];
        if (child.type === 'image') {
          const para = {
            type: 'paragraph',
            children: [child],
          };
          children.splice(i, 1);
          i -= 1;
          if ((i < 0 && imageHandling !== 'after') || imageHandling === 'before') {
            // move before heading
            siblings.splice(index, 0, para);
            // eslint-disable-next-line no-param-reassign
            index += 1;
            after += 1;
          } else {
            // move after heading
            siblings.splice(after, 0, para);
            after += 1;
          }
        }
      }

      // remove leading breaks
      while (children[0]?.type === 'break') {
        children.shift();
      }
      // remove trailing breaks
      let last = children.length - 1;
      while (children[last]?.type === 'break') {
        children.pop();
        last -= 1;
      }
      // convert inline breaks to <br>
      for (let i = 0; i < children.length; i += 1) {
        if (children[i].type === 'break') {
          children[i] = {
            type: 'html',
            value: '<br>',
          };
        }
      }

      // remove empty headings
      if (!children.length) {
        siblings.splice(index, 1);
        // eslint-disable-next-line no-param-reassign
        index -= 1;
      }
      return index + 1;
    }

    return index + 1;
  });
  return tree;
}
