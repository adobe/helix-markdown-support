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
  text,
  heading,
  strong,
  brk,
  table,
  tableRow,
  tableCell,
} = require('mdast-builder');
const gfm = require('remark-gfm');
const { assertMD } = require('./utils.js');

const softBreaks = require('../src/remark-breaks-as-spaces.js');

describe('breaks-as-spaces Tests', () => {
  it('Uses spaces as softbreaks', async () => {
    const mdast = root([
      heading(2, text('Simple Text')),
      paragraph([
        text('Hello,'),
        brk,
        text('world!'),
      ]),
    ]);
    await assertMD(mdast, 'simple-text.md', [softBreaks]);
  });

  it('table cell with breaks dont create new lines', async () => {
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
    await assertMD(mdast, 'simple-table-with-breaks.md', [gfm, softBreaks]);
  });
});
