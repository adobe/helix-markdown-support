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
import {
  emphasis, paragraph, root, strike, strong, text,
} from 'mdast-builder';
import { sanitizeFormats } from '../src/index.js';

describe('sanitize-formats tests', () => {
  const specs = {
    strong,
    emphasis,
    strike,
  };

  Object.entries(specs).forEach(([name, node]) => {
    it(`Removes ${name} as first child if empty`, async () => {
      const mdast = root([
        paragraph([
          node([]),
          text('Hello, world.'),
        ]),
      ]);
      const expected = root([
        paragraph([
          text('Hello, world.'),
        ]),
      ]);
      sanitizeFormats(mdast);
      assert.deepEqual(mdast, expected);
    });

    it(`Removes ${name} as 2nd child if empty`, async () => {
      const mdast = root([
        paragraph([
          text('Hello, '),
          node([]),
          text('world.'),
        ]),
      ]);
      const expected = root([
        paragraph([
          text('Hello, '),
          text('world.'),
        ]),
      ]);
      sanitizeFormats(mdast);
      assert.deepEqual(mdast, expected);
    });

    it(`Removes ${name} as last child if empty`, async () => {
      const mdast = root([
        paragraph([
          text('Hello, world.'),
          node([]),
        ]),
      ]);
      const expected = root([
        paragraph([
          text('Hello, world.'),
        ]),
      ]);
      sanitizeFormats(mdast);
      assert.deepEqual(mdast, expected);
    });

    it(`Removes ${name} with empty text`, async () => {
      const mdast = root([
        paragraph([
          text('Hello, '),
          node(text('')),
          text('world.'),
        ]),
      ]);
      const expected = root([
        paragraph([
          text('Hello, '),
          text('world.'),
        ]),
      ]);
      sanitizeFormats(mdast);
      assert.deepEqual(mdast, expected);
    });

    it(`Collapses consecutive ${name}`, async () => {
      const mdast = root([
        paragraph([
          node(text('Hello, ')),
          node(),
          node(text('world.')),
        ]),
      ]);
      const expected = root([
        paragraph([
          node([
            text('Hello, '),
            text('world.'),
          ]),
        ]),
      ]);
      sanitizeFormats(mdast);
      assert.deepEqual(mdast, expected);
    });
  });

  it('Don\'t collapse mixed formats', async () => {
    const mdast = root([
      paragraph([
        strong(text('Hello, ')),
        strike(text('world.')),
      ]),
    ]);
    const expected = root([
      paragraph([
        strong(text('Hello, ')),
        strike(text('world.')),
      ]),
    ]);
    sanitizeFormats(mdast);
    assert.deepEqual(mdast, expected);
  });
});
