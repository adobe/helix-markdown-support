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

const fse = require('fs-extra');
const path = require('path');
const assert = require('assert');
const {
  root,
  paragraph,
  table,
  tableRow,
  tableCell,
  text,
  heading,
  strong,
  brk,
  code,
} = require('mdast-builder');
const stringify = require('remark-stringify');
const unified = require('unified');
const gfm = require('remark-gfm');

const softBreaks = require('../src/remark-breaks-as-spaces.js');
const robustTables = require('../src/mdast-robust-tables.js');

async function assertMD(mdast, fixture) {
  const expected = await fse.readFile(path.resolve(__dirname, 'fixtures', fixture), 'utf-8');
  const actual = unified()
    .use(stringify, {
      strong: '*',
      emphasis: '_',
      bullet: '-',
      fence: '`',
      fences: true,
      incrementListMarker: true,
      rule: '-',
      ruleRepetition: 3,
      ruleSpaces: false,
    })
    .use(softBreaks)
    .use(gfm)
    .stringify(mdast);
  assert.equal(actual, expected);
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
    await assertMD(mdast, 'simple-table.md');
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
    await assertMD(mdast, 'table-with-lines.md');
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
    await assertMD(mdast, 'table-with-code.md');
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
    await assertMD(mdast, 'table-with-paragraph.md');
  });
});
