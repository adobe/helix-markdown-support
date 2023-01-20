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
import assert from 'assert';
import { readFile } from 'fs/promises';
import stringify from 'remark-stringify';
import { visit, CONTINUE } from 'unist-util-visit';
import { unified } from 'unified';
import { blockquote, tableCell, tableRow } from 'mdast-builder';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export function removePositions(tree) {
  visit(tree, (node) => {
    // eslint-disable-next-line no-param-reassign
    delete node.position;
    return CONTINUE;
  });
  return tree;
}

/**
 * Converts the mdast to md using common settings.
 * @param mdast
 * @param plugins
 * @param opts
 * @returns {string}
 */
export function mdast2md(mdast, plugins = [], opts = {}) {
  let processor = unified()
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
      setext: false,
      ...opts,
    });
  processor = plugins.reduce((proc, plug) => (proc.use(plug)), processor);
  return processor.stringify(mdast);
}

// eslint-disable-next-line import/prefer-default-export
export async function assertMD(mdast, fixture, plugins, opts) {
  // console.log(require('unist-util-inspect')(mdast));
  const expected = await readFile(new URL(`./fixtures/${fixture}`, import.meta.url), 'utf-8');
  const actual = mdast2md(mdast, plugins, opts);
  // console.log(actual);
  assert.strictEqual(actual, expected);
  return actual;
}

export async function assertHTML(fixture, plugins, opts) {
  // console.log(require('unist-util-inspect')(mdast));
  const source = await readFile(new URL(`./fixtures/${fixture}.md`, import.meta.url), 'utf-8');
  const expected = await readFile(new URL(`./fixtures/${fixture}.html`, import.meta.url), 'utf-8');
  let processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify, {
      strong: '*',
      emphasis: '_',
      bullet: '-',
      fence: '`',
      fences: true,
      incrementListMarker: true,
      rule: '-',
      ruleRepetition: 3,
      ruleSpaces: false,
      setext: false,
      ...opts,
    });
  processor = plugins.reduce((proc, plug) => (proc.use(plug)), processor);
  const actual = String(await processor.process(source));
  // console.log(actual);
  assert.strictEqual(actual.trim(), expected.trim());
  return actual;
}

export function gtCell(children, align, verticalAlign, rowSpan, colSpan) {
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

export function gridTable(children) {
  const node = blockquote(children);
  node.type = 'gridTable';
  return node;
}

export function gtHeader(children) {
  const node = blockquote(children);
  node.type = 'gtHeader';
  return node;
}

export function gtBody(children) {
  const node = blockquote(children);
  node.type = 'gtBody';
  return node;
}

export function gtFooter(children) {
  const node = blockquote(children);
  node.type = 'gtFooter';
  return node;
}

export function gtRow(children) {
  const node = tableRow(children);
  node.type = 'gtRow';
  return node;
}
