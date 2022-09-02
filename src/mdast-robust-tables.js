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
import { toHast as md2hast } from 'mdast-util-to-hast';
import { toHtml as hast2html } from 'hast-util-to-html';
import { visit, CONTINUE } from 'unist-util-visit';

/**
 * Converts tables to HTML
 *
 * @param {object} tree
 * @returns {object} The modified (original) tree.
 */
export default function robustTables(tree) {
  visit(tree, (node) => {
    if (node.type !== 'table') {
      return CONTINUE;
    }
    let html = '<table>\n';
    (node.children /* c8 ignore next */ || []).forEach((row) => {
      html += '  <tr>\n';
      (row.children /* c8 ignore next */ || []).forEach((cell) => {
        let attrs = '';
        if (cell.align === 'right') {
          attrs = ' align="right"';
        } else if (cell.align === 'center') {
          attrs = ' align="center"';
        } else if (cell.align === 'justify') {
          attrs = ' align="justify"';
        }
        if (cell.valign === 'middle') {
          attrs += ' valign="middle"';
        } else if (cell.valign === 'bottom') {
          attrs += ' valign="bottom"';
        }
        if (cell.rowSpan > 1) {
          attrs += ` rowspan="${cell.rowSpan}"`;
        }
        if (cell.colSpan > 1) {
          attrs += ` colspan="${cell.colSpan}"`;
        }
        html += `    <td${attrs}>`;

        // if cell contains only 1 single paragraph, unwrap it
        let { children } = cell;
        if (children && children.length === 1 && children[0].type === 'paragraph') {
          children = children[0].children;
        }

        (children /* c8 ignore next */ || []).forEach((child) => {
          if (child.type === 'html') {
            html += child.value;
          } else {
            const hast = md2hast(child, { allowDangerousHtml: true });
            const cellHtml = hast2html(hast, { allowDangerousHtml: true });
            if (child.type === 'code') {
              // code needs special treatment, otherwise the newlines disappear.
              html += cellHtml.replace(/\r?\n/g, '<br>');
            } else {
              html += cellHtml.replace(/\r?\n/g, ' ');
            }
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
    return CONTINUE;
  });
  return tree;
}
