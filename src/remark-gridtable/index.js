/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import fromMarkdown from './from-markdown.js';
import toMarkdown from './to-markdown.js';
import syntax from './syntax.js';

/**
 * GridTables remark plugin and micromark extension.
 *
 * GridTables look like this:
 *
 * ```
 * +-------------------+------+
 * | Table Headings    | Here |
 * |--------+----------+------|
 * | Sub    | Headings | Too  |
 * |========+=================|
 * | cell   | column spanning |
 * | spans  +---------<+------|
 * | rows   |   normal | cell |
 * |--------+>---------------<|
 * |        | cells can be    |
 * |        | *formatted*     |
 * |        | **paragraphs**  |
 * |        | ```             |
 * | multi  | and contain     |
 * | line   | blocks          |
 * ^ cells  | ```             |
 * |========+=========<+======|
 * | footer |    cells |      |
 * +--------+----------+------+
 * ```
 *
 * - the top of a cell must be indicated by +- followed by some - or + and finished by -+.
 * - if the table contains a footer but no header, the top row should use `=` as grid line.
 * - col spans are indicated by missing column (|) delimiters
 * - row spans are indicated by missing row (-) delimiters
 * - cells can be left, center, or right aligned; indicated by the placement of arrows (> <)
 * - cells can be top, middle, or bottom v-aligned; indicated by the placement of arrows (v ^ X)
 * - the header and footer sections are delimited by section delimiters (=).
 * - if no section delimiters are present, all cells are placed in the table body.
 * - if only 1 section delimiter is present, it delimits header from body.
 * - the content in cells can be a full Markdown document again. note, that the cell boundaries (|)
 *   need to exactly match with the column markers (+) in the row delimiters, if the cell content
 *   contains `|`, otherwise the correct layout of the table can't be guaranteed.
 *
 * Layout
 * ======
 *
 * The table layout tries to keep the table within a certain width (default 120). For example,
 * if the table has 3 columns, each column will be max 40 characters wide. If all text in a column
 * is smaller, it will shrink the columns. However, cells have a minimum width (default 10) when
 * text needs to be broken. If the cell contents need more space, e.g. with a nested table or
 * code block, it will grow accordingly.
 *
 * Align
 * =====
 *
 * Horizontal align is indicated by placing markers at the grid line above the cell:
 *
 * ```
 * with '<>'
 *
 * Justify     Center     Left       Right
 * +>-----<+  +---x---+  +>------+  +------<+
 * | A b C |  |  ABC  |  | ABC   |  |   ABC |
 * +-------+  +-------+  +-------+  +-------+
 * ```
 *
 * with ':'
 *
 * Justify     Center     Left       Right
 * +:-----:+  +---:---+  +:------+  +------:+
 * | A b C |  |  ABC  |  | ABC   |  |   ABC |
 * +-------+  +-------+  +-------+  +-------+
 * ```
 *
 * Vertical align is indicated by placing markers at the grid line left of the cell:
 *
 * ```
 * Top        Middle     Bottom     Middle (condensed)
 * +-------+  +-------+  +-------+  +---------------+
 * v Larum |  v       |  |       |  X This is small |
 * | Ipsum |  | Larum |  |       |  +---------------+
 * |       |  | Ipsum |  | Larum |
 * |       |  ^       |  ^ Ipsum |
 * +-------+  +-------+  +-------+
 * ```
 *
 * Stringify options
 * =================
 *
 * @property {string} [gtHLineEnds = '|'] the character to use for the horizontal grid line ends.
 * @property {string} [gtVLineEnds = '+'] the character to use for the vertical grid line ends.
 * @property {string} [gtAlignStyle = ':'] the character to use for the align (':' or '><')
 */
export default function gridTablePlugin(options) {
  const data = this.data();

  function add(field, value) {
    /* c8 ignore next 2 */
    if (data[field]) {
      data[field].push(value);
    } else {
      data[field] = [value];
    }
  }

  add('micromarkExtensions', syntax(options));
  add('fromMarkdownExtensions', fromMarkdown(options));
  add('toMarkdownExtensions', toMarkdown(options));
}
