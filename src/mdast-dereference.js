/*
 * Copyright 2022 Adobe. All rights reserved.
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
 * Dereferences image and link references. Removes definitions no longer used.
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function dDereference(tree) {
  const definitions = new Map();

  // first find all definitions
  visit(tree, (node, idx, parent) => {
    if (node.type === 'definition') {
      definitions.set(node.identifier, {
        node,
        parent,
        refCount: 0,
      });
    }
    return CONTINUE;
  });

  // find references
  visit(tree, (node) => {
    if (node.type === 'imageReference' || node.type === 'linkReference') {
      const { identifier } = node;
      const def = definitions.get(identifier);
      if (def) {
        def.refCount += 1;
        node.url = def.node.url;
        if (def.node.title) {
          node.title = def.node.title;
        }
        node.type = node.type === 'imageReference'
          ? 'image'
          : 'link';
        delete node.identifier;
        delete node.referenceType;
      }
    }
    return CONTINUE;
  });

  // clean used definitions
  for (const def of definitions.values()) {
    if (def.refCount) {
      const idx = def.parent.children.indexOf(def.node);
      def.parent.children.splice(idx, 1);
    }
  }
  return tree;
}
