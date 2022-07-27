/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-param-reassign */
import { visit, CONTINUE } from 'unist-util-visit';

/**
 * ensures that `code` is at a flow level. i.e. outside a paragraph
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function fixCodeFlow(tree) {
  visit(tree, (node, index, parent) => {
    if (node.type === 'paragraph' && node.children) {
      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        if (child.type === 'code') {
          // split paragraph
          const newChildren = node.children.splice(i, node.children.length - i);
          // remove 'code'
          newChildren.shift();

          // if parent is now empty, replace it with code
          if (!node.children.length) {
            parent.children[index] = child;
          } else {
            // insert code at parent
            index += 1;
            parent.children.splice(index, 0, child);
          }

          if (newChildren.length) {
            // insert 2nd half of paragraph at parent
            index += 1;
            parent.children.splice(index, 0, {
              type: 'paragraph',
              children: newChildren,
            });
          }
        }
      }
    }
    // return index;
    return CONTINUE;
  });
  return tree;
}
