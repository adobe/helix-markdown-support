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
const visit = require('unist-util-visit');

/**
 * Sanitizes headings:
 * - (re)move images
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
function sanitizeHeading(tree) {
  visit(tree, (node, index, parent) => {
    const { children: siblings = [] } = parent || {};
    const { children = [] } = node;
    if (node.type === 'heading') {
      for (let i = 0; i < children.length; i += 1) {
        const child = children[i];
        if (child.type === 'image') {
          // move after heading
          children.splice(i, 1);
          i -= 1;
          const para = {
            type: 'paragraph',
            children: [child],
          };
          siblings.splice(index + 1, 0, para);
        }
      }
      // remove empty headings
      if (!children.length) {
        siblings.splice(index, 1);
        return index;
      }
    }
    return visit.CONTINUE;
  });
  return tree;
}

module.exports = sanitizeHeading;
