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
import { phrasing } from 'mdast-util-phrasing';

function wrap(children, from, to) {
  const para = {
    type: 'paragraph',
  };
  para.children = children.splice(from, to - from, para);
}

/**
 * ensures that the root node has no phrasing children.
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function fixRootPhrasing(tree) {
  const { children } = tree;
  let firstPhrasing = -1;
  for (let i = 0; i < children.length; i += 1) {
    if (phrasing(children[i])) {
      if (firstPhrasing < 0) {
        firstPhrasing = i;
      }
    } else if (firstPhrasing >= 0) {
      wrap(children, firstPhrasing, i);
      i = firstPhrasing;
      firstPhrasing = -1;
    }
  }
  if (firstPhrasing >= 0) {
    wrap(children, firstPhrasing, children.length);
  }
  return tree;
}
