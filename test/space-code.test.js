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
  brk, heading, paragraph, root, text,
} from 'mdast-builder';

import { assertMD } from './utils.js';

import { suppressSpaceCode } from '../src/index.js';

describe('suppress-spacecode Tests', () => {
  it('Converts text with 4 leading spaces to html', async () => {
    const mdast = root([
      heading(2, text('Ensure no code Blocks')),
      paragraph([
        text('Hello.'),
        brk,
        text('    This is not          code!'),
        brk,
        text('              Really.'),
      ]),
    ]);
    suppressSpaceCode(mdast);
    await assertMD(mdast, 'spacecode.md');
  });
});
