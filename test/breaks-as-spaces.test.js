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

import {
  brk,
  heading,
  paragraph,
  root,
  strong,
  table,
  tableCell,
  tableRow,
  text,
} from 'mdast-builder';

import { remarkGfmNoLink as gfm, breaksAsSpaces } from '../src/index.js';
import { assertMD } from './utils.js';

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
    await assertMD(mdast, 'simple-text.md', [breaksAsSpaces]);
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
    await assertMD(mdast, 'simple-table-with-breaks.md', [gfm, breaksAsSpaces]);
  });
});
