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
import { ok as assert } from 'uvu/assert';
import { codes } from 'micromark-util-symbol/codes.js';
import { types } from 'micromark-util-symbol/types.js';
// import { constants } from 'micromark-util-symbol/constants.js';
import {
  markdownLineEnding,
  markdownLineEndingOrSpace,
  markdownSpace,
} from 'micromark-util-character';
import {
  TYPE_HEADER, TYPE_BODY, TYPE_FOOTER, TYPE_ROW, TYPE_TABLE, TYPE_CELL,
} from './to-markdown.js';

const TYPE_GRID_LINE = 'gridLine';
const TYPE_CELL_DIVIDER = 'cellDivider';
const TYPE_ROW_LINE = 'rowLine';

function parse() {
  return {
    tokenize: tokenizeTable,
    resolve: resolveTable,
  };

  function tokenizeTable(effects, ok, nok) {
    let wasWS = false;
    // positions of columns
    const cols = [0];
    let colPos = 0;
    let gridLine = null;
    return start;

    function start(code) {
      assert(code === codes.plusSign, 'table starts with +');
      effects.enter(TYPE_TABLE);
      effects.enter(TYPE_BODY);
      return gridLineStart(code);
    }

    function gridLineStart(code) {
      if (code === codes.plusSign) {
        gridLine = effects.enter(TYPE_GRID_LINE);
        effects.consume(code);
        colPos = 0;
        return gridDivider;
      }
      return nok(code);
    }

    function gridDividerStart(code) {
      // code is after the `+` of a grid column divider
      if (code === codes.eof || markdownLineEndingOrSpace(code)) {
        wasWS = false;
        effects.exit(TYPE_GRID_LINE);
        return gridDividerEnd(code);
      }
      return gridDivider(code);
    }

    function gridDividerEnd(code) {
      if (markdownLineEndingOrSpace(code)) {
        if (!wasWS) {
          effects.enter(types.whitespace);
          wasWS = true;
        }
        effects.consume(code);
      }

      if (markdownSpace(code)) {
        return gridDividerEnd;
      }

      if (wasWS) {
        effects.exit(types.whitespace);
      }

      if (code === codes.eof) {
        effects.exit(TYPE_BODY);
        effects.exit(TYPE_TABLE);
        return ok(code);
      }

      if (markdownLineEnding(code)) {
        return rowStart;
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
      if (code === codes.plusSign) {
        // remember cols
        const idx = cols.indexOf(colPos);
        if (idx < 0) {
          cols.push(colPos);
          cols.sort((c0, c1) => c0 - c1);
        }
        effects.consume(code);
        return gridDividerStart;
      }
      return nok(code);
    }

    function rowStart(code) {
      // todo: leading whitespace
      if (code !== codes.verticalBar) {
        // if (rows.length === 0) {
        //   return nok(code);
        // }
        effects.exit(TYPE_BODY);
        effects.exit(TYPE_TABLE);
        return ok(code);
      }
      effects.enter(TYPE_ROW);
      return rowLineStart(code);
    }

    function rowLineStart(code) {
      effects.enter(TYPE_ROW_LINE);
      effects.enter(TYPE_CELL_DIVIDER);
      effects.consume(code);
      effects.exit(TYPE_CELL_DIVIDER);
      effects.enter(TYPE_CELL);
      colPos = 0;
      return cell;
    }

    function cell(code) {
      colPos += 1;
      // find existing col
      if (code === codes.verticalBar) {
        const idx = cols.indexOf(colPos);
        if (idx >= 0) {
          effects.exit(TYPE_CELL);
          effects.enter(TYPE_CELL_DIVIDER);
          effects.consume(code);
          effects.exit(TYPE_CELL_DIVIDER);
          effects.enter(TYPE_CELL);
          return cell;
        }
        effects.consume(code);
        return cell;
      }
      if (code === codes.eof) {
        // row with cells never terminate eof
        return nok(code);
      }
      if (markdownLineEnding(code)) {
        effects.consume(code);
        effects.exit(TYPE_CELL);
        effects.exit(TYPE_ROW_LINE);
        // todo: construct row?
        return rowOrGridStart;
      }

      effects.consume(code);
      return cell;
    }

    function rowOrGridStart(code) {
      if (code === codes.verticalBar) {
        return rowLineStart(code);
      }
      if (code === codes.plusSign) {
        effects.exit(TYPE_ROW);
        return gridLineStart(code);
      }
      return nok(code);
    }
  }

  function resolveTable(events, context) {
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
      } else if (type === TYPE_GRID_LINE && e === 'enter' && node._type === codes.equalsTo) {
        fatLines.push(idx);
      }
    }

    // consolidate the cells in the same row
    // const result = [];
    // let row = [];
    // let pos = 0;
    // for (const evt of events) {
    //   const [e, node, context] = evt;
    //   const { type } = node;
    //   if (type === TYPE_CELL) {
    //     if (!row[pos]) {
    //       row[pos] = [];
    //     }
    //     const text = {
    //       type: types.chunkText,
    //       start: node.start,
    //       end: node.end,
    //       contentType: constants.contentTypeText,
    //     };
    //     row[pos].push([e, text, context]);
    //     if (e === 'exit') {
    //       pos += 1;
    //     }
    //   } else if (type === TYPE_ROW_LINE) {
    //     if (e === 'enter') {
    //       pos = 0;
    //     }
    //   } else if (type === TYPE_ROW) {
    //     if (e === 'enter') {
    //       result.push(evt);
    //       row = [];
    //     } else {
    //       // create combines cells
    //       for (const cells of row) {
    //         const cell = {
    //           type: TYPE_CELL,
    //           contentType: constants.contentTypeDocument,
    //         };
    //         result.push(['enter', cell, context]);
    //         result.push(...cells);
    //         result.push(['exit', cell, context]);
    //       }
    //       result.push(evt);
    //     }
    //   } else {
    //     result.push(evt);
    //   }
    // }
    // return result;
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
