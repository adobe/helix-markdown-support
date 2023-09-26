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
import { find } from 'unist-util-find';

/**
 * Sanitizes links:
 * - unwraps formatting in links if possible. eg: [_text_](...) -> _[test](...)_
 * - moves leading, trailing BREAKs out of link
 * - converts BREAKs inside link to <br>.
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function sanitizeLinks(tree) {
  visit(tree, (node, index, parent) => {
    const { children = [] } = node;
    if (node.type === 'link' && children.length === 1) {
      const [linkText] = children;
      if (linkText.type === 'emphasis' || linkText.type === 'strong' || linkText.type === 'delete') {
        // collapse consecutive texts
        for (let i = 1; i < linkText.children.length; i += 1) {
          if (linkText.children[i].type === 'text' && linkText.children[i - 1].type === 'text') {
            linkText.children[i - 1].value += linkText.children[i].value;
            linkText.children.splice(i, 1);
            i -= 1;
          }
        }

        // set the link's children to the inner nodes
        // eslint-disable-next-line no-param-reassign
        node.children = linkText.children;

        // replace the node with the formatting
        // eslint-disable-next-line no-param-reassign
        parent.children[index] = linkText;

        // set the formatting children to the link
        linkText.children = [node];

        // check if link text last trailing space, this would now result in wrong md:
        // **[Curves on the iPad. ](https://....)**The curves
        const text = find(node, (n) => n.type === 'text');
        if (text) {
          const trimmed = text.value.trimEnd();
          if (trimmed !== text.value) {
            text.value = trimmed;
            // insert text node after
            parent.children.splice(index + 1, 0, {
              type: 'text',
              value: ' ',
            });
          }
        }
      }
    } else if (node.type === 'link' && children.length > 1) {
      // move leading breaks outside of link
      while (children[0]?.type === 'break') {
        const brk = children.shift();
        parent.children.splice(index, 0, brk);
        // eslint-disable-next-line no-param-reassign
        index += 1;
      }
      // move trailing breaks after link
      let last = children.length - 1;
      while (children[last]?.type === 'break') {
        const brk = children.pop();
        parent.children.splice(index + 1, 0, brk);
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
      return index + 1;
    }
    return CONTINUE;
  });
  return tree;
}
