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
  code, heading, paragraph, root, text,
} from 'mdast-builder';
import { assertMD } from './utils.js';
import { fixCodeFlow } from '../src/index.js';

describe('fix-code=flow Tests', () => {
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
    fixCodeFlow(mdast);
    await assertMD(mdast, 'code-flow-sibling.md');
  });

  it('Moves code up (middle)', async () => {
    const mdast = root([
      heading(2, text('Ensure proper code flow')),
      paragraph([
        text('Hello. here\'s some code in the middle'),
        code('js', 'const x = y * 1;'),
        text('Cool code. eh?'),
        code('js', 'const x = y * 2;'),
        text('yup.'),
      ]),
    ]);
    fixCodeFlow(mdast);
    await assertMD(mdast, 'code-flow-middle.md');
  });

  it('Moves code up (end)', async () => {
    const mdast = root([
      heading(2, text('Ensure proper code flow')),
      paragraph([
        text('Hello. here\'s some code at the end'),
        code('js', 'const x = y *2;'),
      ]),
      paragraph([
        text('Cool code. eh?'),
      ]),
    ]);
    fixCodeFlow(mdast);
    await assertMD(mdast, 'code-flow-end.md');
  });

  it('Moves code up (beginning)', async () => {
    const mdast = root([
      heading(2, text('Ensure proper code flow')),
      paragraph([
        text('Hello. here\'s some code at the beginning'),
      ]),
      paragraph([
        code('js', 'const x = y *2;'),
        text('Cool code. eh?'),
      ]),
    ]);
    fixCodeFlow(mdast);
    await assertMD(mdast, 'code-flow-beginning.md');
  });

  it('Moves code up (lonely)', async () => {
    const mdast = root([
      heading(2, text('Ensure proper code flow')),
      paragraph([
        text('Hello. here\'s a lonely code'),
      ]),
      paragraph([
        code('js', 'const x = y *2;'),
      ]),
      paragraph([
        text('Cool code. eh?'),
      ]),
    ]);
    fixCodeFlow(mdast);
    await assertMD(mdast, 'code-flow-lonely.md');
  });

  it('Moves code up (multi)', async () => {
    const mdast = root([
      heading(2, text('Ensure proper code flow')),
      paragraph([
        text('Hello. here\'s are multiple codes'),
      ]),
      paragraph([
        code('js', 'const x = y * 1;'),
        code('js', 'const x = y * 2;'),
        code('js', 'const x = y * 3;'),
      ]),
      paragraph([
        text('Cool code. eh?'),
      ]),
    ]);
    fixCodeFlow(mdast);
    await assertMD(mdast, 'code-flow-multi.md');
  });

  it('Moves code up (mixed)', async () => {
    const mdast = root([
      heading(2, text('Ensure proper code flow')),
      paragraph([
        text('Hello. here\'s are mixed examples'),
      ]),
      paragraph([
        code('js', 'const x = y * 1;'),
        text('some code'),
      ]),
      code('js', 'const x = y * 2;'),
      paragraph([
        code('js', 'const x = y * 3;'),
        code('js', 'const x = y * 4;'),
        text('more code'),
        code('js', 'const x = y * 5;'),
      ]),
      paragraph([
        text('Cool code. eh?'),
      ]),
    ]);
    fixCodeFlow(mdast);
    await assertMD(mdast, 'code-flow-mixed.md');
  });
});
