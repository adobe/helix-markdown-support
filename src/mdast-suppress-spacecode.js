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
 * Looks for text starting with 4 spaces. As this would render as code in some markdown,
 * we suppress it.
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function suppressSpaceCode(tree) {
  visit(tree, (child, index, parent) => {
    const { children } = parent || {};
    if (child.type === 'text'
      && (index === 0 || children[index - 1].type === 'break')
      && child.value.startsWith('    ')) {
      // eslint-disable-next-line no-param-reassign
      child.value = child.value.replace(/^\s+/, ' ');
    }
    return CONTINUE;
  });
  return tree;
}
