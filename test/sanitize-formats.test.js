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

const nodeWithChildren = (type) => (...args) => {
  const node = strong(...args);
  node.type = type;
  return node;
};

const superscript = nodeWithChildren('superscript');
const subscript = nodeWithChildren('subscript');
const underline = nodeWithChildren('underline');

describe('sanitize-formats tests', () => {
  const specs = {
    strong,
    emphasis,
    strike,
    superscript,
    subscript,
    underline,
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

  it('Merges a bold paragraph with an italic sub-word (bold applied outermost)', async () => {
    // this is the shape produced for a paragraph that is bold overall, with one
    // word that is additionally italic, when bold is the outer decoration
    const mdast = root([
      paragraph([
        strong(text('foo ')),
        emphasis(strong(text('bar'))),
        strong(text(' baz')),
      ]),
    ]);
    const expected = root([
      paragraph([
        strong([
          text('foo '),
          emphasis(text('bar')),
          text(' baz'),
        ]),
      ]),
    ]);
    sanitizeFormats(mdast);
    assert.deepEqual(mdast, expected);
  });

  it('Merges an italic paragraph with a bold sub-word (italic applied outermost)', async () => {
    // same scenario as above, but with the roles reversed: italic is the format
    // that spans the whole paragraph, and bold only applies to a sub-word
    const mdast = root([
      paragraph([
        emphasis(text('foo ')),
        strong(emphasis(text('bar'))),
        emphasis(text(' baz')),
      ]),
    ]);
    const expected = root([
      paragraph([
        emphasis([
          text('foo '),
          strong(text('bar')),
          text(' baz'),
        ]),
      ]),
    ]);
    sanitizeFormats(mdast);
    assert.deepEqual(mdast, expected);
  });

  it('Merges runs whose common decoration is nested differently in each sibling', async () => {
    // "underline" spans the whole paragraph, "strong" only applies to the middle
    // word, but is (per docx run ordering) always nested *outside* underline
    const mdast = root([
      paragraph([
        underline(text('foo ')),
        strong(underline(text('bar'))),
        underline(text(' baz')),
      ]),
    ]);
    const expected = root([
      paragraph([
        underline([
          text('foo '),
          strong(text('bar')),
          text(' baz'),
        ]),
      ]),
    ]);
    sanitizeFormats(mdast);
    assert.deepEqual(mdast, expected);
  });

  it('Merges formats where one sibling already has mixed (non-peelable) children', async () => {
    const mdast = root([
      paragraph([
        strong(text('foo ')),
        strong([
          text('bar '),
          emphasis(text('baz')),
        ]),
      ]),
    ]);
    const expected = root([
      paragraph([
        strong([
          text('foo '),
          text('bar '),
          emphasis(text('baz')),
        ]),
      ]),
    ]);
    sanitizeFormats(mdast);
    assert.deepEqual(mdast, expected);
  });

  it('Leaves a lone formatting node with mixed children untouched', async () => {
    const mdast = root([
      paragraph([
        strong([
          text('foo '),
          emphasis(text('bar')),
        ]),
      ]),
    ]);
    const expected = root([
      paragraph([
        strong([
          text('foo '),
          emphasis(text('bar')),
        ]),
      ]),
    ]);
    sanitizeFormats(mdast);
    assert.deepEqual(mdast, expected);
  });
});
