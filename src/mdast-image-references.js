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
/* eslint-disable no-param-reassign */
import { visit, CONTINUE } from 'unist-util-visit';

/**
 * Creates image references. Replaces images with a `imageReference` and respective `definition`
 * nodes.
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function imageReferences(tree) {
  const images = new Map();
  const definitions = [];

  visit(tree, (node) => {
    if (node.type === 'image') {
      // todo: support title ?
      const { url } = node;
      let identifier = images.get(url);
      if (!identifier) {
        identifier = `image${images.size}`;
        images.set(url, identifier);
        definitions.push({
          type: 'definition',
          identifier,
          url,
        });
      }
      node.type = 'imageReference';
      node.identifier = identifier;
      node.referenceType = 'full';
    }
    return CONTINUE;
  });

  tree.children.push(...definitions);
  return tree;
}
