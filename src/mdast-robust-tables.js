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
const md2hast = require('mdast-util-to-hast');
const hast2html = require('hast-util-to-html');
const visit = require('unist-util-visit');

/**
 * Converts table cell content to HTML if it cannot be represented nicely as markdown.
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
function robustTables(tree) {
  visit(tree, (node) => {
    if (node.type !== 'tableCell') {
      return visit.CONTINUE;
    }
    /* istanbul ignore next */
    const { children = [] } = node;
    if (children.length > 1 || (children.length === 1 && children[0].type !== 'paragraph')) {
      // ...then convert the problematic children to html nodes
      node.children.forEach((child) => {
        const html = hast2html(md2hast(child));
        switch (child.type) {
          case 'code': {
            // code needs special treatment, otherwise the newlines disappear.
            child.value = html.replace(/\r?\n/g, '<br>');
            break;
          }
          default: {
            // convert the rest to html
            child.value = html.replace(/\r?\n/g, ' ');
          }
        }
        child.type = 'html';
      });
    }
    return visit.CONTINUE;
  });
  return tree;
}

module.exports = robustTables;
