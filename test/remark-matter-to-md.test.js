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
import jsYaml from 'js-yaml';
import { heading, root, text } from 'mdast-builder';
import { assertMD } from './utils.js';
import { breaksAsSpaces } from '../src/index.js';
import { remarkMatter } from '../src/matter/index.js';

const yaml = (payload) => ({
  type: 'yaml',
  value: jsYaml.dump(payload),
  payload,
});

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
    await assertMD(mdast, 'simple-yaml.md', [remarkMatter, breaksAsSpaces]);
  });
});
