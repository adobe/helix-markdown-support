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
  brk, code,
  blockquote,
  heading, image,
  paragraph,
  root,
  tableCell,
  tableRow,
  text,
  list as originalList,
  listItem as originalListItem,
  strong,
  emphasis,
} from 'mdast-builder';
import { assertMD } from './utils.js';
import { remarkGridTable } from '../src/index.js';

// eslint-disable-next-line no-unused-vars
const LARUM_XL = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus rhoncus elit nibh, sed vestibulum metus tincidunt a. Integer interdum tempus consectetur. Phasellus tristique auctor tortor, tincidunt semper odio blandit eu. Proin et aliquet est. Curabitur ac augue ornare, iaculis sem luctus, feugiat tellus.';
const LARUM_L = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus rhoncus elit nibh, sed vestibulum metus tincidunt a.';
const LARUM_M = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
const TEST_M = '0 1 2 3 4 5 6 7 8 9 0 a b c d e f 0 1 2 3 4 5 6 7 8 9 0 a b c d e f';

const LARUM_MD = [
  text('Lorem ipsum dolor '),
  strong(text('sit amet')),
  text(', consectetur adipiscing elit. Vivamus rhoncus elit nibh, sed vestibulum metus tincidunt a. '),
  emphasis(text('Integer')),
  text(' interdum tempus consectetur. Phasellus tristique auctor tortor, tincidunt semper odio blandit eu. Proin et aliquet est. Curabitur ac augue ornare, iaculis sem luctus, feugiat tellus.'),
];

const CODE = `for (const row of this.rows) {
  for (let i = 0; i < row.length; i += 1) {
    let col = cols[i];
    if (!col) {
      col = {};
      cols.push(col);
    }
    const cell = row[i];
    if (cell.value) {
      col.size = Math.max(col.size || 0, cell.value.length);
    }
  }
}`;

function listItem(kids) {
  const li = originalListItem(kids);
  li.spread = false;
  return li;
}

function list(ordered, kids) {
  const li = originalList(ordered, kids);
  li.spread = false;
  return li;
}

function gtCell(children, align, verticalAlign, rowSpan, colSpan) {
  const node = tableCell(children);
  if (align) {
    node.align = align;
  }
  if (verticalAlign) {
    node.valign = verticalAlign;
  }
  if (rowSpan) {
    node.rowSpan = rowSpan;
  }
  if (colSpan) {
    node.colSpan = colSpan;
  }
  node.type = 'gtCell';
  return node;
}

function gridTable(children) {
  const node = blockquote(children);
  node.type = 'gridTable';
  return node;
}

function gtHeader(children) {
  const node = blockquote(children);
  node.type = 'gtHeader';
  return node;
}

function gtBody(children) {
  const node = blockquote(children);
  node.type = 'gtBody';
  return node;
}

function gtFooter(children) {
  const node = blockquote(children);
  node.type = 'gtFooter';
  return node;
}

function gtRow(children) {
  const node = tableRow(children);
  node.type = 'gtRow';
  return node;
}

describe('gridtable to md', () => {
  it('one cell table', async () => {
    const mdast = root([
      heading(2, text('Single Cell Grid Table')),
      gridTable([
        gtCell(text('A1')),
      ]),
    ]);
    await assertMD(mdast, 'gt-single-cell.md', [remarkGridTable]);
  });

  it('simple correct table', async () => {
    const mdast = root([
      heading(2, text('Simple Grid Table')),
      gridTable([
        gtHeader([
          gtRow([
            gtCell(text('A1')),
            gtCell(text('B1')),
            gtCell(text('C1')),
          ]),
        ]),
        gtBody([
          gtRow([
            gtCell(text('a2')),
            gtCell(text('b2')),
            gtCell(text('c2')),
          ]),
          gtRow([
            gtCell(text('a3')),
            gtCell(text('b3')),
            gtCell(text('c3')),
          ]),
        ]),
        gtFooter([
          gtRow([
            gtCell(text('af')),
            gtCell(text('bf')),
            gtCell(text('cf')),
          ]),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-simple.md', [remarkGridTable]);
  });

  it('footer but no header table', async () => {
    const mdast = root([
      heading(2, text('Grid Table no header')),
      gridTable([
        gtBody([
          gtRow([
            gtCell(text('a2')),
            gtCell(text('b2')),
            gtCell(text('c2')),
          ]),
          gtRow([
            gtCell(text('a3')),
            gtCell(text('b3')),
            gtCell(text('c3')),
          ]),
        ]),
        gtFooter([
          gtRow([
            gtCell(text('af')),
            gtCell(text('bf')),
            gtCell(text('cf')),
          ]),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-footer-no-header.md', [remarkGridTable]);
  });

  it('header but no footer table', async () => {
    const mdast = root([
      heading(2, text('Grid Table no footer')),
      gridTable([
        gtHeader([
          gtRow([
            gtCell(text('A1')),
            gtCell(text('B1')),
            gtCell(text('C1')),
          ]),
        ]),
        gtBody([
          gtRow([
            gtCell(text('a2')),
            gtCell(text('b2')),
            gtCell(text('c2')),
          ]),
          gtRow([
            gtCell(text('a3')),
            gtCell(text('b3')),
            gtCell(text('c3')),
          ]),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-header-no-footer.md', [remarkGridTable]);
  });

  it('simple table large and mixed content', async () => {
    const mdast = root([
      heading(2, text('Large Grid Table')),
      gridTable([
        gtHeader([
          gtRow([
            gtCell(text('A1')),
            gtCell(text('B1')),
            gtCell(heading(2, text(LARUM_M))),
          ]),
        ]),
        gtBody([
          gtRow([
            gtCell([
              heading(2, text('My Heading 1')),
              paragraph([
                image('https://hlx.blob.core.windows.net/external/19c0cf25413106c81920d75078ee2ef30a55d52e7'),
                brk,
                ...LARUM_MD,
                brk,
                text(TEST_M),
              ]),
            ]),
            gtCell(code('js', CODE)),
            gtCell([
              blockquote([
                text('My quote'),
                text(LARUM_L),
              ]),
              list(false, [
                listItem(text('item one')),
                listItem(text('item two')),
                listItem(text(LARUM_L)),
              ]),
            ]),
          ]),
          gtRow([
            gtCell(text('a3')),
            gtCell(text('b3')),
            gtCell(text('c3')),
          ]),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-large.md', [remarkGridTable]);
  });

  it('table spans converts correctly', async () => {
    function cell(children, rowSpan, colSpan) {
      const node = gtCell(children);
      if (rowSpan) {
        node.rowSpan = rowSpan;
      }
      if (colSpan) {
        node.colSpan = colSpan;
      }
      return node;
    }

    const mdast = root([
      heading(2, text('Table with spans')),
      gridTable([
        gtRow([
          cell(text(`AB0 - ${LARUM_M}`), 0, 2),
          cell(text('C0')),
        ]),
        gtRow([
          cell(text('A1')),
          cell(text('B1')),
          cell(text('C1')),
        ]),
        gtRow([
          cell(text('A2')),
          cell(text('BC2'), 0, 2),
        ]),
        gtRow([
          cell(text('A3')),
          cell([
            heading(1, text('B34')),
            list('ordered', [
              listItem(text('item one')),
              listItem(text('item two')),
              listItem(text('item three')),
              listItem(text('item four')),
              listItem(text(LARUM_L)),
            ]),
          ], 2),
          cell(text('C3')),
        ]),
        gtRow([
          cell([
            heading(1, text('A4')),
            text(LARUM_M),
          ]),
          cell(text('C4')),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-spans.md', [remarkGridTable]);
  });

  it('table alignments converts correctly', async () => {
    const mdast = root([
      heading(2, text('Table with alignments')),
      gridTable([
        gtBody([
          gtRow([
            gtCell(text('top left'), 'left', 'top'),
            gtCell(text('top center'), 'center', 'top'),
            gtCell(text('top right'), 'right', 'top'),
            gtCell(paragraph([text('1'), brk, text('2'), brk, text('3')])),
          ]),
          gtRow([
            gtCell(text('middle left'), 'left', 'middle'),
            gtCell(text('middle center'), 'center', 'middle'),
            gtCell(text('middle right'), 'right', 'middle'),
            gtCell(paragraph([text('1'), brk, text('2'), brk, text('3')])),
          ]),
          gtRow([
            gtCell(text('bottom left'), 'left', 'bottom'),
            gtCell(text('bottom center'), 'center', 'bottom'),
            gtCell(text('bottom right'), 'right', 'bottom'),
            gtCell(paragraph([text('1'), brk, text('2'), brk, text('3')])),
          ]),
          gtRow([
            gtCell(text('middle center'), 'center', 'middle', 1, 3),
          ]),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-with-align.md', [remarkGridTable]);
  });
});
