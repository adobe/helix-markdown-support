/*
 * Copyright 2023 Adobe. All rights reserved.
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

const FORMATS = {
  subscript: {
    open: '<sub>',
    close: '</sub>',
  },
  superscript: {
    open: '<sup>',
    close: '</sup>',
  },
  underline: {
    open: '<u>',
    close: '</u>',
  },
};

/**
 * Renders the special html formats
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function renderHtmlFormats(tree) {
  visit(tree, (node, index, parent) => {
    const { children: siblings = [] } = parent || {};
    const fmt = FORMATS[node.type];
    if (fmt) {
      siblings.splice(
        index,
        1,
        {
          type: 'html',
          value: fmt.open,
        },
        ...node.children,
        {
          type: 'html',
          value: fmt.close,
        },
      );
      return index + node.children.length;
    }
    return CONTINUE;
  });
  return tree;
}
