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
const stringify = require('remark-stringify');
const unified = require('unified');

async function assertMD(mdast, fixture, plugins = []) {
  const expected = await fse.readFile(path.resolve(__dirname, 'fixtures', fixture), 'utf-8');
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
    });
  processor = plugins.reduce((proc, plug) => (proc.use(plug)), processor);
  const actual = processor.stringify(mdast);
  assert.equal(actual, expected);
}

module.exports = {
  assertMD,
};
