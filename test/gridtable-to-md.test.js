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

/* eslint-env mocha */
import { readFile } from 'fs/promises';
import {
  brk, code,
  blockquote,
  heading, image,
  paragraph,
  root,
  text,
  list as originalList,
  listItem as originalListItem,
  strong,
  emphasis,
  inlineCode,
} from 'mdast-builder';
import {
  assertMD, gridTable, gtBody, gtCell, gtFooter, gtHeader, gtRow,
} from './utils.js';
import { remarkGridTable } from '../src/gridtable/index.js';

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

describe('gridtable to md', () => {
  it('one cell table', async () => {
    const mdast = root([
      heading(2, text('Single Cell Grid Table')),
      gridTable([
        gtCell(text('A1')),
      ]),
      heading(2, text('Empty cell')),
      gridTable([
        gtCell(text('')),
      ]),
      heading(2, text('Empty cell with align')),
      gridTable([
        gtCell(text(''), 'center', 'middle'),
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
            gtCell([
              // test trimming cell content
              paragraph(text('')),
              paragraph(text('b2')),
              paragraph(text('')),
            ]),
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
      heading(2, text('Grid Table only header')),
      gridTable([
        gtHeader([
          gtRow([
            gtCell(text('A1')),
            gtCell(text('B1')),
            gtCell(text('C1')),
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
        gtRow([
          cell(text('A567'), 3, 1),
          cell(text('BC5'), 1, 2),
        ]),
        gtRow([
          cell(text('B6')),
          cell(text('C678'), 3, 1),
        ]),
        gtRow([
          cell(text('B7'), 1, 1),
        ]),
        gtRow([
          cell(text('AB8'), 1, 2),
        ]),
      ]),
      heading(2, text('Table with overlapping spans')),
      gridTable([
        gtRow([
          cell(text('A1234'), 4, 1),
          cell(text('B1')),
          cell(text('CD1'), 1, 2),
        ]),
        gtRow([
          cell(text('BC23'), 2, 2),
          cell(text('D2')),
        ]),
        gtRow([
          cell(text('D34'), 2, 1),
        ]),
        gtRow([
          cell(text('B4')),
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
        gtHeader([
          gtRow([
            gtCell(text('top left'), 'left', 'top'),
            gtCell(text('top center'), 'center', 'top'),
            gtCell(text('top justify'), 'justify', 'top'),
            gtCell(text('top right'), 'right', 'top'),
            gtCell(paragraph([text('1'), brk, text('2'), brk, text('3')])),
          ]),
        ]),
        gtBody([
          gtRow([
            gtCell(text('middle left'), 'left', 'middle'),
            gtCell(text('middle center'), 'center', 'middle'),
            gtCell(text('top justify'), 'justify', 'middle'),
            gtCell(text('middle right'), 'right', 'middle'),
            gtCell(paragraph([text('1'), brk, text('2'), brk, text('3')])),
          ]),
          gtRow([
            gtCell(text('bottom left'), 'left', 'bottom'),
            gtCell(text('bottom center'), 'center', 'bottom'),
            gtCell(text('top justify'), 'justify', 'bottom'),
            gtCell(text('bottom right'), 'right', 'bottom'),
            gtCell(paragraph([text('1'), brk, text('2'), brk, text('3')])),
          ]),
          gtRow([
            gtCell(text('middle center'), 'center', 'middle', 1, 4),
          ]),
          gtRow([
            gtCell(text('top left'), 'left', 'top', 1, 2),
            gtCell(text('bottom right'), 'right', 'bottom', 1, 2),
          ]),
          gtRow([
            gtCell(text('middle justify'), 'justify', 'middle', 1, 4),
          ]),
        ]),
      ]),
      heading(2, text('Super small table with align')),
      gridTable([
        gtCell(text('A'), 'justify', 'middle'),
      ]),
    ]);
    await assertMD(mdast, 'gt-with-align.md', [remarkGridTable]);
  });

  it('tables in tables in tables', async () => {
    const innerTable = gridTable([
      gtHeader([
        gtRow([
          gtCell(text('A0')),
          gtCell(text('B0')),
        ]),
      ]),
      gtBody([
        gtRow([
          gtCell(text('A1')),
          gtCell(text('B1')),
        ]),
        gtRow([
          gtCell(text('some text with a | in it')),
          gtCell(text('| or at the beginning')),
        ]),
        gtRow([
          gtCell(paragraph([
            text('or some in code: '),
            inlineCode('a + b = c'),
            text('.'),
          ]), '', '', 1, 2),
        ]),
      ]),
    ]);

    const nestedTable = gridTable([
      gtHeader([
        gtRow([
          gtCell(text('nested tables are fun!'), '', '', 1, 2),
        ]),
      ]),
      gtBody([
        gtRow([
          gtCell(text('r0')),
          gtCell(innerTable, '', '', 3),
        ]),
        gtRow([
          gtCell(text('r1')),
        ]),
        gtRow([
          gtCell(text('r2')),
        ]),
      ]),
    ]);

    const mdast = root([
      heading(2, text('Tables in tables in tables')),
      gridTable([
        gtHeader([
          gtRow([
            gtCell(text('Cards (one, two, many)'), '', '', 1, 2),
          ]),
        ]),
        gtBody([
          gtRow([
            gtCell(text('One')),
            gtCell(innerTable),
          ]),
          gtRow([
            gtCell(text('two')),
            gtCell(text('three')),
          ]),
          gtRow([
            gtCell(innerTable, '', '', 1, 2),
          ]),
          gtRow([
            gtCell(text('four')),
            gtCell(text('five')),
          ]),
          gtRow([
            gtCell(text('nested')),
            gtCell(nestedTable),
          ]),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-tables-in-tables.md', [remarkGridTable]);
  });

  it('table with delimiters in code', async () => {
    const mdast = root([
      heading(2, text('Table with delimiters in code')),
      gridTable([
        gtRow([
          gtCell(inlineCode('a + b = c')),
        ]),
        gtRow([
          gtCell(code('js', 'a + b = c;\nif (a || b) {\n  throw Error();\n}')),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-code-with-delim.md', [remarkGridTable]);
  });

  it('unbalanced tables', async () => {
    const mdast = root([
      heading(2, text('Table with larger colspan')),
      gridTable([
        gtRow([
          gtCell(text('ABC0 (colspan=3)'), '', '', 1, 3),
        ]),
        gtRow([
          gtCell(text('A1')),
          gtCell(text('B1')),
        ]),
        gtRow([
          gtCell(text('A2')),
          gtCell(text('B2')),
        ]),
      ]),
      heading(2, text('Table with unbalanced rows')),
      gridTable([
        gtRow([
          gtCell(text('ABC0 (colspan=3)'), '', '', 1, 3),
        ]),
        gtRow([
          gtCell(text('A1')),
          gtCell(text('B1')),
        ]),
        gtRow([
          gtCell(text('A2')),
          gtCell(text('B2')),
        ]),
        gtRow([
          gtCell(text('A3')),
          gtCell(text('B3')),
          gtCell(text('C3')),
        ]),
        gtRow([
          gtCell(text('A4')),
          gtCell(text('B4')),
        ]),
        gtRow([
          gtCell(text('A5')),
          gtCell(text('B5')),
          gtCell(text('C5')),
          gtCell(text('D5')),
        ]),
        gtRow([
          gtCell(text('A6')),
          gtCell(text('B6')),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-unbalanced.md', [remarkGridTable]);
  });

  it('non break space', async () => {
    const mdast = root([
      heading(2, text('Table with non break space')),
      gridTable([
        gtRow([
          gtCell(text('A1')),
          gtCell(text('B1')),
        ]),
        gtRow([
          gtCell(text('A2')),
          gtCell(text('B2 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022 2022')),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-nbsp.md', [remarkGridTable]);
  });

  it('text with breaks', async () => {
    const p = paragraph([
      text('“People use these things for their own needs,” says Rivas of stock imagery.\n'
        + '“If they are using things that were not co-created in a process that was not\n'
        + 'intentional, especially when it comes to Indigenous imagery, then we are\n'
        + 'using something that does not really belong to us.”'),
      brk,
      brk,
      text('Adobe Stock Senior Director, Content, Sarah Casillas echoes Rivas’ sentiments.'),
    ]);

    const mdast = root([
      heading(2, text('Text with breaks')),
      p,
      gridTable([
        gtRow([
          gtCell(text('Left')),
          gtCell(text('Right')),
        ]),
        gtRow([
          gtCell(p, '', '', '', 2),
        ]),
      ]),
    ]);
    await assertMD(mdast, 'gt-with-breaks.md', [remarkGridTable]);
  });

  /**
   * spot test for edge cases detected in production. disabled by default.
   * for debugging, create a broken.json of the mdast and a broken.md
   */
  it.skip('broken', async () => {
    const mdast = JSON.parse(await readFile(new URL('./fixtures/broken.json', import.meta.url), 'utf-8'));
    await assertMD(mdast, 'broken.md', [remarkGridTable]);
  });
});
