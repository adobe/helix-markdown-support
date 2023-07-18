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
 * Sanitizes text:
 * - collapses consecutive formatting blocks
 * - removes empty formatting blocks (no or empty text)
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function sanitizeFormats(tree) {
  visit(tree, (node, index, parent) => {
    const { children: siblings = [] } = parent || {};
    const { children } = node;
    if (isFormat(node.type)) {
      // remove empty nodes
      if (!children || !children.length) {
        siblings.splice(index, 1);
        return index - 1;
      }
      // remove formats with empty text nodes
      if (children.length === 1 && children[0].type === 'text' && !children[0].value) {
        siblings.splice(index, 1);
        return index - 1;
      }
      if (index > 0) {
        const prev = siblings[index - 1];
        if (prev.type === node.type) {
          prev.children.push(...node.children);
          siblings.splice(index, 1);
          return index - 1;
        }
      }
    }
    return CONTINUE;
  });
  return tree;
}
