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
/* eslint-disable no-use-before-define,no-underscore-dangle,no-param-reassign */
import { codes } from 'micromark-util-symbol/codes.js';
import { types } from 'micromark-util-symbol/types.js';
import { constants } from 'micromark-util-symbol/constants.js';
import {
  markdownLineEnding,
  markdownSpace,
} from 'micromark-util-character';
import {
  TYPE_HEADER, TYPE_BODY, TYPE_FOOTER, TYPE_TABLE, TYPE_CELL, TYPE_ROW,
} from './to-markdown.js';

// the cell divider: | or +
const TYPE_CELL_DIVIDER = 'cellDivider';

// a line within a row. can have cells or dividers or both, in case of row spans
const TYPE_GRID_LINE = 'gridLine';

// the grid divider: - / =
const TYPE_GRID_DIVIDER = 'gridDivider';

/*

enter row
enter cell (a0)
enter chunk (a0.0)
exit chunk
exit cell
enter cell (b0)
enter chunk (b0.0)
exit chunk
exit cell
enter cell (c0)
enter chunk (c0.0)
exit chunk
exit cell
enter chunk (a0.1)
exit chunk
enter chunk (b0.1)
exit chunk
enter chunk (c0.1)
exit chunk
enter chunk (a0.2)
exit chunk
enter chunk (b0.2)
exit chunk
enter chunk (c0.2)
exit chunk
exit row
....



 */
function parse() {
  return {
    tokenize: tokenizeTable,
    resolve: resolveTable,
  };

  function tokenizeTable(effects, ok, nok) {
    // positions of columns
    const cols = [0];
    let numRows = 0;
    let numCols = 0;
    let colPos = 0;
    let gridLine = null;
    // open cells
    let cells = null;
    return start;

    function closeCells() {
      // for (const chunk of cells) {
      //   if (chunk) {
      //     effects.exit(TYPE_CELL);
      //   }
      // }
      effects.exit(TYPE_ROW);
      cells = null;
    }

    function start(code) {
      effects.enter(TYPE_TABLE)._cols = cols;
      effects.enter(TYPE_BODY);
      return lineStart(code);
    }

    function lineStart(code) {
      // if (code === codes.plusSign || code === codes.verticalBar) {
      if (code === codes.plusSign) {
        if (cells) {
          closeCells();
        }
        gridLine = effects.enter(TYPE_GRID_LINE);
        effects.enter(TYPE_CELL_DIVIDER);
        effects.consume(code);
        effects.exit(TYPE_CELL_DIVIDER);
        colPos = 0;
        numCols = 0;
        return cellOrGridStart;
      }
      if (code === codes.verticalBar) {
        if (gridLine) {
          effects.exit(TYPE_GRID_LINE);
          gridLine = null;
        }
        if (!cells) {
          // start new row
          effects.enter(TYPE_ROW);
          cells = [];
        }
        effects.enter(TYPE_CELL_DIVIDER);
        effects.consume(code);
        effects.exit(TYPE_CELL_DIVIDER);
        colPos = 0;
        numCols = 0;
        return cellOrGridStart;
      }
      if (numRows < 3) {
        return nok(code);
      }
      effects.exit(TYPE_GRID_LINE);
      effects.exit(TYPE_BODY);
      effects.exit(TYPE_TABLE);
      return ok(code);
    }

    function cellOrGridStart(code) {
      if (code === codes.dash || code === codes.equalsTo) {
        effects.enter(TYPE_GRID_DIVIDER)._colStart = colPos;
        return gridDivider(code);
      }

      if (code === codes.eof || markdownLineEnding(code)) {
        return lineEnd(code);
      }

      let cellInfo = cells[numCols];
      if (!cellInfo) {
        // open new cell
        effects.enter(TYPE_CELL)._colStart = colPos;
        cellInfo = {
          open: true,
        };
        cells[numCols] = cellInfo;
      }
      const { previous } = cellInfo;

      // continue or start chunked document
      const token = effects.enter(types.chunkDocument, {
        contentType: constants.contentTypeDocument,
        previous,
      });

      // remember token
      if (previous) {
        previous.next = token;
      }
      cellInfo.previous = token;

      colPos += 1;
      effects.consume(code);

      if (markdownSpace(code)) {
        return cellSpace;
      }
      return cell(code);
    }

    function cellSpace(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit(types.chunkDocument);
        // effects.exit(TYPE_CELL);
        return lineEnd(code);
      }
      if (markdownSpace(code)) {
        colPos += 1;
        effects.consume(code);
        return cellSpace;
      }
      return cell(code);
    }

    function lineEnd(code) {
      if (numCols === 0) {
        return nok(code);
      }
      if (markdownLineEnding(code)) {
        effects.enter(types.lineEnding);
        effects.consume(code);
        effects.exit(types.lineEnding);
      }
      if (code === codes.eof) {
        closeCells();
        effects.exit(TYPE_BODY);
        effects.exit(TYPE_TABLE);
        return ok(code);
      }
      if (markdownLineEnding(code)) {
        numRows += 1;
        return lineStart;
      }
      return nok(code);
    }

    function gridDivider(code) {
      colPos += 1;
      if (code === codes.dash || code === codes.equalsTo) {
        if (!gridLine._type) {
          gridLine._type = code;
        }
        effects.consume(code);
        return gridDivider;
      }
      if (code === codes.plusSign || code === codes.verticalBar) {
        // remember cols
        const idx = cols.indexOf(colPos);
        if (idx < 0) {
          cols.push(colPos);
          cols.sort((c0, c1) => c0 - c1);
        }
        effects.exit(TYPE_GRID_DIVIDER)._colEnd = colPos;
        effects.enter(TYPE_CELL_DIVIDER);
        effects.consume(code);
        effects.exit(TYPE_CELL_DIVIDER);
        numCols += 1;
        return cellOrGridStart;
      }
      return nok(code);
    }

    function cell(code) {
      colPos += 1;
      // find existing col
      if (code === codes.verticalBar || code === codes.plusSign) {
        const idx = cols.indexOf(colPos);
        if (idx >= 0) {
          // check if cell is still open
          const cellInfo = cells[numCols];
          effects.exit(types.chunkDocument);
          if (cellInfo.open) {
            effects.exit(TYPE_CELL)._colEnd = colPos;
            cellInfo.open = false;
          }
          effects.enter(TYPE_CELL_DIVIDER);
          effects.consume(code);
          effects.exit(TYPE_CELL_DIVIDER);
          numCols += 1;
          return cellOrGridStart;
        }
        effects.consume(code);
        return cell;
      }
      if (code === codes.eof) {
        // row with cells never terminate eof
        return nok(code);
      }

      effects.consume(code);
      return cell;
    }
  }

  function resolveHeaderAndFooter(events, context) {
    // detect headers:
    // no `=` lines -> only body
    // 1 `=` line -> header + body
    // 2 `=` lines -> header + body + footer
    const fatLines = [];
    let bodyStart = -1; // should default to 1. but just be sure

    for (let idx = 0; idx < events.length; idx += 1) {
      const [e, node] = events[idx];
      const { type } = node;
      if (type === TYPE_BODY) {
        if (e === 'enter') {
          bodyStart = idx;
        } else {
          // eslint-disable-next-line prefer-const
          let [hdrIdx, ftrIdx] = fatLines;
          const bdy = node;
          if (hdrIdx > bodyStart + 1) {
            // insert header above body
            const hdr = {
              type: TYPE_HEADER,
              start: bdy.start,
              end: events[hdrIdx][1].end,
            };
            bdy.start = hdr.end;
            events[bodyStart][1] = hdr;
            events.splice(
              hdrIdx,
              0,
              ['exit', hdr, context],
              ['enter', bdy, context],
            );
            idx += 2;
            ftrIdx += 2;
          }

          if (ftrIdx) {
            // insert footer below body
            const ftr = {
              type: TYPE_FOOTER,
              start: events[ftrIdx][1].start,
              end: bdy.end,
            };
            bdy.end = ftr.start;
            events.splice(
              ftrIdx,
              0,
              ['exit', bdy, context],
              ['enter', ftr, context],
            );
            idx += 2;
            events[idx][1] = ftr;
          }
        }
      } else if (type === TYPE_ROW_LINE && e === 'enter' && node._type === codes.equalsTo) {
        fatLines.push(idx);
      }
    }
    return events;
  }

  function resolveTable(events, context) {
    // events = resolveHeaderAndFooter(events, context);
    // let i = 0;
    // for (const [d, { type }] of events) {
    //   if (d === 'exit') {
    //     i -= 2;
    //   }
    //   console.log(' '.repeat(i), d, type);
    //   if (d === 'enter') {
    //     i += 2;
    //   }
    // }
    return events;
  }
}

export default function create(options = {}) {
  return {
    flow: {
      [codes.plusSign]: parse(options),
    },
  };
}
