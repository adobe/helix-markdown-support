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
/* eslint-disable no-unused-vars,no-param-reassign */
import { text as textHandler } from 'mdast-util-to-markdown/lib/handle/text.js';

export const TYPE_TABLE = 'gridTable';
export const TYPE_HEADER = 'gtHeader';
export const TYPE_BODY = 'gtBody';
export const TYPE_FOOTER = 'gtFooter';
export const TYPE_ROW = 'gtRow';
export const TYPE_CELL = 'gtCell';

function* distribute(size, times) {
  const delta = size / times;
  let len = delta;
  let prevLen = 0;
  for (let i = 0; i < times - 1; i += 1) {
    yield [Math.round(len - prevLen), i];
    prevLen = Math.round(len);
    len += delta;
  }
  yield [Math.round(size - prevLen), times - 1];
}

function spanWidth(cols, idx, cell) {
  let width = 0;
  for (let i = 0; i < cell.colSpan; i += 1) {
    width += cols[idx + i].width;
  }
  return width;
}

export function lineWrapTextHandler(node, parent, context, safeOptions) {
  let value = textHandler(node, parent, context, safeOptions);
  const { lineWidth } = context.options;
  if (lineWidth && value.length > lineWidth) {
    // check if in heading
    if (context.stack.includes('headingAtx')) {
      return value;
    }
    const lines = [];
    const words = value.split(' ');
    let len = safeOptions.now.column - 1;
    let line = [];
    for (const word of words) {
      const wordLen = word.length;
      if (len + wordLen > lineWidth && line.length > 0) {
        lines.push(line.join(' '));
        line = [];
        len = 0;
      }
      line.push(word);
      len += wordLen + 1;
    }
    if (line.length) {
      lines.push(line.join(' '));
    }
    value = lines.join('\n');
  }
  return value;
}
// don't wrap for peek operations
lineWrapTextHandler.peek = textHandler;

class Table {
  constructor() {
    Object.assign(this, {
      lastRow: null,
      rows: [],
      headerSize: 0,
      footerSize: 0,
      // default desired width of a table (including delimiters)
      width: 120,
      // minimum cell content width (excluding delimiters)
      minCellWidth: 12,
    });
  }

  addHeaderRow(row) {
    this.addRow(row, this.headerSize);
    this.headerSize += 1;
  }

  addRow(cells, idx = this.rows.length - this.footerSize) {
    const row = {
      height: 0,
      cells: [],
    };
    this.rows.splice(idx, 0, row);
    this.lastRow = this.rows[this.rows.length - 1];
    for (const cell of cells) {
      this.addCell(cell, row);
    }
  }

  addFooterRow(row) {
    this.addRow(row, this.rows.length);
    this.footerSize += 1;
  }

  addCell(cell, row) {
    if (!this.lastRow) {
      this.lastRow = {
        height: 0,
        cells: [],
      };
      this.rows.push(this.lastRow);
    }
    row = row || this.lastRow;
    row.cells.push(cell);
    for (let i = 1; i < cell.colSpan; i += 1) {
      row.cells.push({});
    }
  }

  renderCell(cell, context, maxWidth) {
    // set line wrap to width
    const oldWidth = context.options.lineWidth;
    // it's easier to calculate in the padding (+2) and border (+1) here than everywhere else.
    // so the column width is equal to the cell.width
    context.options.lineWidth = maxWidth - 3;
    context.options.minLineWidth = this.minCellWidth;

    cell.value = context.handle(cell.tree, null, context, {
      before: '\n',
      after: '\n',
      now: { line: 1, column: 1 },
      lineShift: 0,
    });

    context.options.lineWidth = oldWidth;
    // calculate actual width and height of cell
    cell.lines = cell.value.split('\n');
    cell.height = cell.lines.length;
    cell.width = 0;
    for (const line of cell.lines) {
      cell.width = Math.max(cell.width, line.length);
    }
    cell.width += 3;
    return cell;
  }

  toMarkdown(context) {
    // populate the matrix with the rowspans and compute max width
    // (the empty cells for the colspans are already created during insert).
    const cols = [];
    for (let y = 0; y < this.rows.length; y += 1) {
      const row = this.rows[y];
      for (let x = 0; x < row.cells.length; x += 1) {
        let col = cols[x];
        if (!col) {
          col = {
            width: 0,
          };
          cols[x] = col;
        }
        const cell = row.cells[x];
        cell.x = x;
        cell.y = y;
        if (cell.rowSpan > 1) {
          // insert colspan amount of null cells below
          for (let i = 1; i < cell.rowSpan; i += 1) {
            const yy = i + y;
            if (yy < this.rows.length) {
              // create empty linked cells for the rows, so that it can render the lines
              // correctly.
              const empty = [{ linked: cell }].fill({}, 1, cell.colSpan);
              this.rows[yy].cells.splice(x, 0, ...empty);
            }
          }
        }
      }
    }
    const numCols = cols.length;

    // add empty cells if needed
    for (const row of this.rows) {
      for (let i = row.cells.length; i < numCols; i += 1) {
        row.cells.push({});
      }
    }

    // populate the columns with default max widths
    for (const [d, idx] of distribute(this.width, numCols)) {
      cols[idx].maxWidth = d;
    }

    // render cells
    for (const row of this.rows) {
      for (let x = 0; x < row.cells.length; x += 1) {
        const cell = row.cells[x];
        if (cell.tree) {
          // get the max width from the columns it spans
          let maxWidth = 0;
          for (let i = 0; i < cell.colSpan; i += 1) {
            maxWidth += cols[x + i].maxWidth;
          }
          this.renderCell(cell, context, maxWidth);
          // distribute effective cell.width among the columns it spans
          for (const [avgColWidth, idx] of distribute(cell.width, cell.colSpan)) {
            const col = cols[x + idx];
            col.width = Math.max(col.width, avgColWidth);
          }
          // todo factor in rowspans?
          row.height = Math.max(row.height, cell.height);
        }
      }
    }
    // re-render cells where elements dictated the min-width (eg, large headings)
    for (const row of this.rows) {
      row.height = 0;
      for (let x = 0; x < row.cells.length; x += 1) {
        const cell = row.cells[x];
        if (cell.tree) {
          // get the max width from the columns it spans
          const width = spanWidth(cols, x, cell);
          if (width >= cell.width) {
            this.renderCell(cell, context, width);
            // if the new cell width is bigger now (most probably due to a problem in the line
            // break renderer), fix the columns.
            if (cell.width > width) {
              for (const [avgColWidth, idx] of distribute(cell.width, cell.colSpan)) {
                const col = cols[x + idx];
                col.width = Math.max(col.width, avgColWidth);
              }
            } else {
              cell.width = width;
            }
          } else {
            cell.width = width;
          }
          row.height = Math.max(row.height, cell.height);
        }
      }
    }

    // create grid and table
    const lines = [];
    // eslint-disable-next-line no-nested-ternary
    const headerIdx = this.headerSize
      ? this.headerSize
      : (this.footerSize ? 0 : -1);
    const footerIdx = this.rows.length - this.footerSize;
    for (let y = 0; y < this.rows.length; y += 1) {
      const row = this.rows[y];

      // first, draw the grid line
      const grid = [];
      const c = y === headerIdx || y === footerIdx ? '=' : '-';
      let b = y === 0 ? '+' : '|';
      for (let x = 0; x < row.cells.length; x += 1) {
        const cell = row.cells[x];
        const col = cols[x];
        if (cell.tree) {
          grid.push(`${b}${c.repeat(col.width - 1)}`);
        } else if (cell.linked) {
          grid.push(`${b}${' '.repeat(col.width - 1)}`);
        } else {
          grid.push(c.repeat(col.width));
        }
        b = '+';
      }
      lines.push(`${grid.join('')}${y === 0 ? '+' : '|'}`);

      // then draw the cells
      for (let yy = 0; yy < row.height; yy += 1) {
        const line = [];
        for (let x = 0; x < row.cells.length; x += 1) {
          const cell = row.cells[x];
          if (cell.tree) {
            const width = spanWidth(cols, x, cell);
            const text = cell.lines[yy] || '';
            line.push(` ${text.padEnd(width - 3, ' ')} `);
          } else if (cell.linked) {
            const width = spanWidth(cols, x, cell.linked);
            line.push(`${' '.repeat(width - 1)}`);
          }
        }
        lines.push(`|${line.join('|')}|`);
      }
    }

    // add last grid line
    const grid = [];
    for (const col of cols) {
      grid.push('-'.repeat(col.width - 1));
    }
    lines.push(`+${grid.join('+')}+`);

    return lines.join('\n');
  }
}

function pushTable(context, table) {
  if (!context.gridTables) {
    context.gridTables = [];
  }
  context.gridTables.push(table);
  return table;
}

function popTable(context) {
  return context.gridTables.pop();
}

function peekTable(context) {
  return context.gridTables[context.gridTables.length - 1];
}

function handleCell(node, parent, context, safeOptions) {
  return {
    tree: {
      type: 'root',
      children: node.children,
    },
    colSpan: node.colSpan || 1,
    rowSpan: node.rowSpan || 1,
    align: node.align,
    valign: node.valign,
  };
}

function handleRow(node, parent, context, safeOptions) {
  const row = [];
  for (const child of node.children || []) {
    if (child.type === TYPE_CELL) {
      row.push(handleCell(child, node, context, safeOptions));
    }
  }
  return row;
}

function handleHeader(node, parent, context, safeOptions) {
  const table = peekTable(context);
  for (const child of node.children || []) {
    if (child.type === TYPE_ROW) {
      table.addHeaderRow(handleRow(child, node, context, safeOptions));
    }
  }
}

function handleBody(node, parent, context, safeOptions) {
  const table = peekTable(context);
  for (const child of node.children || []) {
    if (child.type === TYPE_ROW) {
      table.addRow(handleRow(child, node, context, safeOptions));
    }
  }
}

function handleFooter(node, parent, context, safeOptions) {
  const table = peekTable(context);
  for (const child of node.children || []) {
    if (child.type === TYPE_ROW) {
      table.addFooterRow(handleRow(child, node, context, safeOptions));
    }
  }
}

function gridTable(node, parent, context, safeOptions) {
  const exit = context.enter(TYPE_TABLE);

  const table = pushTable(context, new Table());

  for (const child of node.children || []) {
    if (child.type === TYPE_HEADER) {
      handleHeader(child, node, context, safeOptions);
    } else if (child.type === TYPE_BODY) {
      handleBody(child, node, context, safeOptions);
    } else if (child.type === TYPE_FOOTER) {
      handleFooter(child, node, context, safeOptions);
    } else if (child.type === TYPE_ROW) {
      table.addRow(handleRow(child, node, context, safeOptions));
    } else if (child.type === TYPE_CELL) {
      table.addCell(handleCell(child, node, context, safeOptions));
    }
  }

  exit();

  return popTable(context).toMarkdown(context);
}

export default function toMarkdown() {
  return {
    handlers: {
      // for now, we only line wrap 'text' nodes. all other would need more support in
      // the default mdast-to-markdown handlers
      text: lineWrapTextHandler,
      gridTable,
      // gtHeader,
      // gtBody,
      // gtFooter,
      // gtCell,
      // gtRow,
    },
  };
}
