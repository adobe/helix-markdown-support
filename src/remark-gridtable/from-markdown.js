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
import { TYPE_CELL, TYPE_HEADER, TYPE_ROW, TYPE_TABLE } from './to-markdown.js';

function enterTable(token) {
  this.enter({ type: TYPE_TABLE, children: [] }, token);
}

function enterHeader(token) {
  this.enter({ type: token.type, children: [] }, token);
}

function enterRow(token) {
  this.enter({ type: TYPE_ROW, children: [] }, token);
  this.setData('rowInfo', {
    cells: [],
    pos: 0,
  });
}

function enterCell(token) {
  // this.enter({ type: TYPE_CELL }, token);
  this.buffer();
}

function exitCell(token) {
  this.config.enter.data.call(this, token);
  this.config.exit.data.call(this, token);
  const data = this.resume();
  // const node = this.exit(token);
  const info = this.getData('rowInfo');
  if (!info.cells[info.pos]) {
    info.cells[info.pos] = [];
  }
  info.cells[info.pos].push(data);
  info.pos += 1;
}

function exit(token) {
  this.exit(token);
}

function enterRowLine() {
  const info = this.getData('rowInfo');
  info.pos = 0;
}

function exitRow(token) {
  const info = this.getData('rowInfo');
  // emit cells
  for (let i = 0; i < info.cells.length - 1; i += 1) {
    const node = {
      type: TYPE_CELL,
      children: info.cells[i].map((text) => ({
        type: 'text',
        value: text,
      })),
    };
    const fakeToken = {
      type: TYPE_CELL,
      start: { line: 0, column: 0, offset: 0 },
      end: { line: 0, column: 0, offset: 0 },
    };
    this.enter(node, fakeToken);
    this.exit(fakeToken);
  }
  this.exit(token);
}

// eslint-disable-next-line no-unused-vars
export default function fromMarkdown(options = {}) {
  return {
    enter: {
      [TYPE_TABLE]: enterTable,
      [TYPE_HEADER]: enterHeader,
      [TYPE_ROW]: enterRow,
      [TYPE_CELL]: enterCell,
      rowLine: enterRowLine,
    },
    exit: {
      [TYPE_TABLE]: exit,
      [TYPE_HEADER]: exit,
      [TYPE_ROW]: exitRow,
      [TYPE_CELL]: exitCell,
      // rowLine: exitRowLine,
    },
  };
}
