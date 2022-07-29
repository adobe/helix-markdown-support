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
/* eslint-disable no-unused-vars */
export const TYPE_TABLE = 'gridTable';
export const TYPE_HEADER = 'gtHeader';
export const TYPE_BODY = 'gtBody';
export const TYPE_FOOTER = 'gtFooter';
export const TYPE_ROW = 'gtRow';
export const TYPE_CELL = 'gtCell';

class Table {
  constructor() {
    Object.assign(this, {
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

  addRow(row, idx = this.rows.length - this.footerSize) {
    this.rows.splice(idx, 0, row);
  }

  addFooterRow(row) {
    this.addRow(row, this.rows.length);
    this.footerSize += 1;
  }

  addCell(cell) {
    if (this.rows.length === 0) {
      this.rows.push([]);
    }
    this.rows[this.rows.length - 1].push(cell);
  }

  toMarkdown() {
    // get number of columns
    const cols = [];
    for (const row of this.rows) {
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
    }

    const lines = [];
    // eslint-disable-next-line no-nested-ternary
    const headerIdx = this.headerSize
      ? this.headerSize
      : (this.footerSize ? 0 : -1);
    const footerIdx = this.rows.length - this.footerSize;
    for (let y = 0; y < this.rows.length; y += 1) {
      const grid = [];
      const line = [];
      const row = this.rows[y];
      const c = y === headerIdx || y === footerIdx ? '=' : '-';
      for (let x = 0; x < row.length; x += 1) {
        const col = cols[x];
        const cell = row[x];
        grid.push(c.repeat(col.size + 2));
        line.push(` ${cell.value.padEnd(col.size, ' ')} `);
      }
      if (y === 0) {
        lines.push(`+${grid.join('+')}+`);
      } else {
        lines.push(`|${grid.join('+')}|`);
      }
      lines.push(`|${line.join('|')}|`);
    }
    const grid = [];
    for (const col of cols) {
      grid.push('-'.repeat(col.size + 2));
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
  const fakeRoot = {
    type: 'root',
    children: node.children,
  };
  const value = context.handle(fakeRoot, null, context, {
    before: '\n',
    after: '\n',
    now: { line: 1, column: 1 },
    lineShift: 0,
  });
  return {
    colspan: node.colspan,
    rowspan: node.rowspan,
    align: node.align,
    valign: node.valign,
    value,
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

  return popTable(context).toMarkdown();
}

export default function toMarkdown() {
  return {
    handlers: {
      gridTable,
      // gtHeader,
      // gtBody,
      // gtFooter,
      // gtCell,
      // gtRow,
    },
  };
}
