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

/* eslint-env mocha */

'use strict';

const {
  root,
  paragraph,
  table,
  tableRow,
  tableCell: originalCell,
  text,
  heading,
  strong,
  brk,
  code,
  image,
  html,
} = require('mdast-builder');
const gfm = require('remark-gfm');

const softBreaks = require('../src/remark-breaks-as-spaces.js');
const robustTables = require('../src/mdast-robust-tables.js');

const { assertMD } = require('./utils.js');

function tableCell(children, align, verticalAlign) {
  const node = originalCell(children);
  if (align) {
    node.align = align;
  }
  if (verticalAlign) {
    node.valign = verticalAlign;
  }
  return node;
}

describe('mdast-robust-table Tests', () => {
  it('Simple table remains markdown', async () => {
    const mdast = root([
      heading(2, text('Simple Table')),
      table(null, [
        tableRow([
          tableCell(text('a')),
          tableCell(text('b')),
          tableCell(text('c')),
        ]),
        tableRow([
          tableCell(text('1')),
          tableCell(text('2')),
          tableCell(text('3')),
        ]),
      ]),
    ]);
    robustTables(mdast);
    await assertMD(mdast, 'simple-table.md', [gfm, softBreaks]);
  });

  it('table cell with multiple lines converts to html', async () => {
    const mdast = root([
      heading(2, text('Table with lines')),
      table(null, [
        tableRow([
          tableCell(text('a')),
          tableCell(text('b')),
          tableCell(text('c')),
        ]),
        tableRow([
          tableCell([
            text('line 1'),
            brk,
            text('line 2'),
          ]),
          tableCell(text('2')),
          tableCell(text('3')),
        ]),
      ]),
    ]);
    robustTables(mdast);
    await assertMD(mdast, 'table-with-lines.md', [gfm, softBreaks]);
  });

  it('table cell with inline code breaks converts to html', async () => {
    const mdast = root([
      heading(2, text('Table with code')),
      table(null, [
        tableRow([
          tableCell(text('a')),
          tableCell(text('b')),
          tableCell(text('c')),
        ]),
        tableRow([
          tableCell([
            code('js', 'const a=1;\nconst b=2;'),
          ]),
          tableCell(text('2')),
          tableCell(text('3')),
        ]),
      ]),
    ]);
    robustTables(mdast);
    await assertMD(mdast, 'table-with-code.md', [gfm, softBreaks]);
  });

  it('table cell with inline images converts to html', async () => {
    const mdast = root([
      heading(2, text('Table with images')),
      table(null, [
        tableRow([
          tableCell(text('a')),
          tableCell(text('b')),
          tableCell(text('c')),
          tableCell(text('d')),
        ]),
        tableRow([
          tableCell(image('https://hlx.blob.core.windows.net/external/19c0cf25413106c81920d75078ee2ef30a55d52e7')),
          tableCell(image('https://hlx.blob.core.windows.net/external/19c0cf25413106c81920d75078ee2ef30a55d52e7', 'title')),
          tableCell(image('https://hlx.blob.core.windows.net/external/19c0cf25413106c81920d75078ee2ef30a55d52e7', 'title', 'alt')),
          tableCell(image('https://hlx.blob.core.windows.net/external/19c0cf25413106c81920d75078ee2ef30a55d52e7', undefined, 'alt')),
        ]),
      ]),
    ]);
    robustTables(mdast);
    await assertMD(mdast, 'table-with-images.md', [gfm, softBreaks]);
  });

  it('table cell with single paragraph converts correctly', async () => {
    const mdast = root([
      heading(2, text('Table with paragraph')),
      table(null, [
        tableRow([
          tableCell(text('a')),
          tableCell(text('b')),
          tableCell(text('c')),
        ]),
        tableRow([
          tableCell(paragraph([
            text('hello, '),
            strong(text('world!')),
            brk,
            text('how are you?'),
          ])),
          tableCell(text('2')),
          tableCell(text('3')),
        ]),
      ]),
    ]);
    robustTables(mdast);
    await assertMD(mdast, 'table-with-paragraph.md', [gfm, softBreaks]);
  });

  it('table cell with multiple paragraph converts correctly', async () => {
    const mdast = root([
      heading(2, text('Table with multiple paragraph')),
      table(null, [
        tableRow([
          tableCell(text('a')),
          tableCell(text('b')),
          tableCell(text('c')),
        ]),
        tableRow([
          tableCell([
            paragraph([text('hello')]),
            paragraph([text('world')]),
          ]),
          tableCell([
            heading(2, text('title')),
            paragraph([text('world')]),
          ]),
          tableCell(text('3')),
        ]),
      ]),
    ]);
    robustTables(mdast);
    await assertMD(mdast, 'table-with-multiple-paragraph.md', [gfm, softBreaks]);
  });

  it('table alignments converts correctly', async () => {
    const mdast = root([
      heading(2, text('Table with alignments')),
      table(null, [
        tableRow([
          tableCell(text('top left'), 'left', 'top'),
          tableCell(text('top center'), 'center', 'top'),
          tableCell(text('top right'), 'right', 'top'),
          tableCell(text('top justify'), 'both', 'top'),
          tableCell([text('1'), brk, text('2'), brk, text('3')]),
        ]),
        tableRow([
          tableCell(text('middle left'), 'left', 'middle'),
          tableCell(text('middle center'), 'center', 'middle'),
          tableCell(text('middle right'), 'right', 'middle'),
          tableCell(text('middle justify'), 'both', 'middle'),
          tableCell([text('1'), brk, text('2'), brk, text('3')]),
        ]),
        tableRow([
          tableCell(text('bottom left'), 'left', 'bottom'),
          tableCell(text('bottom center'), 'center', 'bottom'),
          tableCell(text('bottom right'), 'right', 'bottom'),
          tableCell(text('bottom justify'), 'both', 'bottom'),
          tableCell([text('1'), brk, text('2'), brk, text('3')]),
        ]),
      ]),
    ]);
    robustTables(mdast);
    await assertMD(mdast, 'table-with-align.md', [gfm, softBreaks]);
  });

  it('Table with html items should not produce error', async () => {
    const mdast = root([
      heading(2, text('Table with HTML in cells')),
      table(null, [
        tableRow([
          tableCell(paragraph([
            text('This is the 4'),
            html('<sup>'),
            text('th'),
            html('</sup>'),
            text(' time'),
          ])),
        ]),
        tableRow([
          tableCell(paragraph([
            html('<u>'),
            text('https://www.example.com'),
            html('</u>'),
          ])),
        ]),
      ]),
    ]);
    robustTables(mdast);
    await assertMD(mdast, 'table-with-html.md', [gfm, softBreaks]);
  });
});
