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
 * Converts tables to HTML
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
function robustTables(tree) {
  visit(tree, (node) => {
    if (node.type !== 'table') {
      return visit.CONTINUE;
    }
    let html = '<table>\n';
    /* istanbul ignore next */
    (node.children || []).forEach((row) => {
      html += '  <tr>\n';
      /* istanbul ignore next */
      (row.children || []).forEach((cell) => {
        let align = '';
        if (cell.align === 'right') {
          align = ' align="right"';
        } else if (cell.align === 'center') {
          align = ' align="center"';
        } else if (cell.align === 'both') {
          align = ' align="justify"';
        }
        if (cell.valign === 'middle') {
          align += ' valign="middle"';
        } else if (cell.valign === 'bottom') {
          align += ' valign="bottom"';
        }
        html += `    <td${align}>`;

        // if cell contains only 1 single paragraph, unwrap it
        let { children } = cell;
        if (children && children.length === 1 && children[0].type === 'paragraph') {
          children = children[0].children;
        }

        /* istanbul ignore next */
        (children || []).forEach((child) => {
          const cellHtml = hast2html(md2hast(child));
          if (child.type === 'code') {
            // code needs special treatment, otherwise the newlines disappear.
            html += cellHtml.replace(/\r?\n/g, '<br>');
          } else {
            html += cellHtml.replace(/\r?\n/g, ' ');
          }
        });
        html += '</td>\n';
      });
      html += '  </tr>\n';
    });
    html += '</table>';
    node.type = 'html';
    node.value = html;
    delete node.children;
    return visit.CONTINUE;
  });
  return tree;
}

module.exports = robustTables;
