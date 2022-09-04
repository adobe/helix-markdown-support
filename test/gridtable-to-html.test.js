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
import { readFile } from 'fs/promises';
import { unified } from 'unified';
import remark from 'remark-parse';
import { toHast as mdast2hast } from 'mdast-util-to-hast';
// import { raw } from 'hast-util-raw';
import { toHtml as hast2html } from 'hast-util-to-html';
import rehypeFormat from 'rehype-format';
import { mdast2hastGridTableHandler, remarkGridTable, TYPE_TABLE } from '../src/gridtable/index.js';

async function testMD(spec, mdast) {
  const expected = await readFile(new URL(`./fixtures/${spec}.html`, import.meta.url), 'utf-8');
  let expectedLean;
  try {
    expectedLean = await readFile(new URL(`./fixtures/${spec}.lean.html`, import.meta.url), 'utf-8');
  } catch (e) {
    // ignore
  }

  if (!mdast) {
    const source = await readFile(new URL(`./fixtures/${spec}.md`, import.meta.url), 'utf-8');
    // eslint-disable-next-line no-param-reassign
    mdast = unified()
      .use(remark)
      .use(remarkGridTable, {})
      .parse(source);
  }

  // make hast
  const hast = mdast2hast(mdast, {
    handlers: {
      [TYPE_TABLE]: mdast2hastGridTableHandler(),
    },
    allowDangerousHtml: true,
  });

  // make html
  rehypeFormat({ indent: 4 })(hast);
  const actual = hast2html(hast);

  assert.strictEqual(actual.trim(), expected.trim());

  if (expectedLean) {
    const hastLean = mdast2hast(mdast, {
      handlers: {
        [TYPE_TABLE]: mdast2hastGridTableHandler({ noHeader: true }),
      },
      allowDangerousHtml: true,
    });

    // make html
    rehypeFormat({ indent: 4 })(hastLean);
    const actualLean = hast2html(hastLean);

    assert.strictEqual(actualLean.trim(), expectedLean.trim());
  }
}

describe('html from markdown gridtable', () => {
  it('simple table', async () => {
    await testMD('gt-simple');
  });

  it('large table', async () => {
    await testMD('gt-large');
  });

  it('footer no header table', async () => {
    await testMD('gt-footer-no-header');
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

  it('table with nbsp', async () => {
    await testMD('gt-nbsp');
  });

  it('table with no gtHead', async () => {
    const mdast = {
      type: 'root',
      children: [{
        type: 'gridTable',
        children: [{
          type: 'gtRow',
          children: [{
            type: 'gtCell',
            children: [{
              type: 'text',
              value: 'Hello, world.',
            }],
          }],
        }],
      }],
    };
    await testMD('gt-lean', mdast);
  });
});
