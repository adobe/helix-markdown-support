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
import {
  code, heading, paragraph, root, text, inlineCode, strong, brk,
} from 'mdast-builder';
import { assertMD } from './utils.js';
import { fixRootPhrasing } from '../src/index.js';

describe('fix-root-phrasing Tests', () => {
  it('Keeps code as paragraph sibling', async () => {
    const mdast = root([
      heading(2, text('Ensure proper code flow')),
      paragraph([
        text('Hello.'),
      ]),
      code('js', 'const x = y *2;'),
      paragraph([
        text('Cool code. eh?'),
      ]),
    ]);
    fixRootPhrasing(mdast);
    await assertMD(mdast, 'code-flow-sibling.md');
  });

  it('wraps phasing with paragraphs', async () => {
    const mdast = root([
      heading(2, text('Ensure proper phrasing')),
      text('Hello, '),
      inlineCode('world'),
      heading(2, text('and some more')),
      text('Hello, '),
      strong(text('world.')),
      heading(2, text('and some at the end')),
      text('Hello, '),
      brk,
      text('world.'),
    ]);
    fixRootPhrasing(mdast);
    await assertMD(mdast, 'root-phrasing.md');
  });
});
