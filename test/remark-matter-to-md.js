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

'use strict';

const fse = require('fs-extra');
const path = require('path');
const assert = require('assert');
const jsYaml = require('js-yaml');
const {
  root,
  text,
  heading,
} = require('mdast-builder');
const stringify = require('remark-stringify');
const unified = require('unified');

const softBreaks = require('../src/remark-breaks-as-spaces.js');
const remarkMatter = require('../src/remark-matter');

const yaml = (payload) => ({
  type: 'yaml',
  value: jsYaml.dump(payload),
  payload,
});

async function assertMD(mdast, fixture) {
  const expected = await fse.readFile(path.resolve(__dirname, 'fixtures', fixture), 'utf-8');
  const actual = unified()
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
    })
    .use(remarkMatter)
    .use(softBreaks)
    .stringify(mdast);
  assert.equal(actual, expected);
}

describe('remark-matter to md', () => {
  it('Generates front matter correctly', async () => {
    const mdast = root([
      heading(2, text('Some Yaml')),
      yaml({
        foo: 'bar',
        hello: 'world',
        answer: 42,
      }),
    ]);
    await assertMD(mdast, 'simple-yaml.md');
  });
});
