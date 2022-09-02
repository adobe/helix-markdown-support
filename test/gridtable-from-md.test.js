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
import assert from 'assert';
import { readFile, lstat } from 'fs/promises';
import { unified } from 'unified';
import remark from 'remark-parse';
import { inspectNoColor as inspect } from 'unist-util-inspect';
import { visit, CONTINUE } from 'unist-util-visit';
import gfm from 'remark-gfm';
import { remarkGridTable } from '../src/gridtable/index.js';
import { assertMD } from './utils.js';

function removePositions(tree) {
  visit(tree, (node) => {
    // eslint-disable-next-line no-param-reassign
    delete node.position;
    return CONTINUE;
  });
  return tree;
}

async function testMD(spec) {
  const source = await readFile(new URL(`./fixtures/${spec}.md`, import.meta.url), 'utf-8');
  let expectedTree;
  try {
    expectedTree = await readFile(new URL(`./fixtures/${spec}.txt`, import.meta.url), 'utf-8');
    expectedTree = expectedTree.trim();
  } catch (e) {
    // ignore
  }

  const actual = unified()
    .use(remark)
    .use(remarkGridTable, {})
    .parse(source);

  removePositions(actual);
  const actualTree = inspect(actual);
  // eslint-disable-next-line no-console
  // console.log(actualTree);

  if (expectedTree) {
    assert.strictEqual(actualTree, expectedTree);
  }

  // convert back. check if round-trip md exists
  try {
    await lstat(new URL(`./fixtures/${spec}.rt.md`, import.meta.url));
    // eslint-disable-next-line no-param-reassign
    spec += '.rt';
  } catch {
    // ignore
  }
  await assertMD(actual, `${spec}.md`, [gfm, remarkGridTable]);
}

describe('gridtable from markdown', () => {
  it('test no tables', async () => {
    await testMD('gt-no-tables');
  });

  it('test wrong tables', async () => {
    await testMD('gt-double-divider');
  });

  it('simple table', async () => {
    await testMD('gt-simple');
  });

  it('single-cell table', async () => {
    await testMD('gt-single-cell');
  });

  it('large table', async () => {
    await testMD('gt-large');
  });

  it('footer no header table', async () => {
    await testMD('gt-footer-no-header');
  });

  it('header no footer table', async () => {
    await testMD('gt-header-no-footer');
  });

  it('table with spans', async () => {
    await testMD('gt-spans');
  });

  it('table in tables', async () => {
    await testMD('gt-tables-in-tables');
  });

  it('table with align', async () => {
    await testMD('gt-with-align');
  });

  it('table with divider in content', async () => {
    await testMD('gt-divider-in-content');
  });
});
