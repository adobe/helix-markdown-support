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
  emphasis,
  heading,
  image,
  inlineCode, link,
  paragraph,
  root,
  strike,
  strong,
  text,
} from 'mdast-builder';
import gfm from 'remark-gfm';
import { unified } from 'unified';
import remark from 'remark-parse';
import { renderHtmlFormats, sanitizeHeading, sanitizeTextAndFormats } from '../src/index.js';
import { assertMD } from './utils.js';

const separator = () => ({
  type: 'thematicBreak',
});

const brk = () => ({
  type: 'break',
});

const nodeWithChildren = (type) => (...args) => {
  const node = strong(...args);
  node.type = type;
  return node;
};

const superscript = nodeWithChildren('superscript');
const subscript = nodeWithChildren('subscript');
const underline = nodeWithChildren('underline');

describe('sanitize-text Tests', () => {
  it('sanitize', async () => {
    const mdast = root([
      heading(2, text('Consecutive Text Blocks')),
      paragraph([
        text('Lorem ipsum '),
        text('dolor sit amet,  '),
        text('consectetur adipiscing elit. '),
      ]),
      heading(2, text('Trims ends before break and ends')),
      paragraph([
        text('Lorem ipsum dolor sit amet, '),
        brk(),
        text('    '),
        brk(),
        text('consectetur adipiscing elit.     '),
      ]),
      heading(2, text('works with leading breaks')),
      paragraph([
        brk(),
        text('    '),
        brk(),
        text('consectetur adipiscing elit.     '),
      ]),
      heading(2, text('Trims ends in formats')),
      paragraph([
        strong(text('   strong   ')),
        emphasis(text('   emphasis   ')),
        strike(text('   strike   ')),
        text('what a strong'),
        strong(text('    ')),
        text('ending.'),
      ]),
      heading(2, text('works with formats and non texts')),
      paragraph([
        strong([
          inlineCode('  inline  '),
          text(' normal text '),
          inlineCode('  more inline  '),
        ]),
      ]),
      heading(2, text('Removes empty text in paragraphs')),
      separator(),
      paragraph([
        text('   '),
      ]),
      separator(),
      heading(2, text('Removes empty paragraphs')),
      paragraph([]),
      paragraph([]),
      paragraph([]),
      separator(),
      heading(2, text('Removes empty text before images')),
      paragraph([
        text('   '),
        image('https://dummyimage.com/300', 'Dummy Image'),
      ]),
      separator(),
      heading(2, text('trims trailing breaks')),
      paragraph([
        text('Hello, world.'),
        brk(),
        brk(),
        brk(),
      ]),
      heading(2, text('trims trailing breaks with empty text')),
      paragraph([
        text('Hello, world.'),
        brk(),
        brk(),
        brk(),
        text('    '),
      ]),
      separator(),
      heading(2, text('removes empty texts')),
      paragraph([
        text(''),
      ]),
    ]);
    sanitizeHeading(mdast);
    sanitizeTextAndFormats(mdast);
    const source = await assertMD(mdast, 'sanitized-text-and-formats.md', [gfm]);

    const actual = unified()
      .use(remark)
      .use(gfm)
      .parse(source);

    // convert back.
    await assertMD(actual, 'sanitized-text-and-formats.md', [gfm]);
  });

  it('sanitize whitespace', async () => {
    const mdast = root([
      heading(2, text('Ensure surrounding whitespace')),
      paragraph([
        text('Lorem ipsum'),
        strong(text('dolor')),
        text('sit amet.'),
      ]),
      paragraph([
        text('Lorem ipsum,'),
        strong(text('dolor')),
        text('sit amet.'),
      ]),
      paragraph([
        text('Lorem ipsum'),
        strong(text('dolor')),
        text(',sit amet.'),
      ]),
      paragraph([
        text('Water is H'),
        subscript(text('2')),
        text('O.'),
      ]),
      paragraph([
        text('We ranked the 4'),
        superscript(text('th')),
        text(' place'),
      ]),
      paragraph([
        text('We are very'),
        underline(text('pleased')),
        text('with the outcome.'),
      ]),
      paragraph([
        text('“'),
        emphasis(text('My favourite announcement this year has to be Photoshop for iPad.')),
        text('“'),
      ]),
      heading(2, text('Moves leading whitespace in inner text')),
      paragraph([
        text('Lorem ipsum'),
        emphasis(text(' dolor')),
        text('sit amet.'),
      ]),
      heading(2, text('Moves leading whitespace in inner text of link')),
      paragraph([
        link('https://www.adobe.com', 'adobe', [
          emphasis([
            text(' '),
            strong(text('dolor')),
          ]),
        ]),
      ]),
      paragraph([
        emphasis(text(' begin')),
        text('sit amet.'),
      ]),
      heading(2, text('Moves trailing whitespace in inner text')),
      paragraph([
        text('Lorem ipsum'),
        emphasis(text('dolor ')),
        text('sit amet.'),
      ]),
      paragraph([
        text('Lorem ipsum'),
        emphasis(text('dolor. ')),
      ]),
      heading(2, text('Moves enclosing whitespace in inner text')),
      paragraph([
        text('Lorem ipsum'),
        strike(text(' dolor ')),
        text('sit amet.'),
      ]),
      heading(2, text('detects nested formats')),
      paragraph([
        text('Lorem ipsum'),
        strong(emphasis(text('dolor'))),
        text('sit amet.'),
      ]),
      paragraph([
        text('Lorem ipsum'),
        strong(emphasis(text(' dolor '))),
        text('sit amet.'),
      ]),
    ]);
    sanitizeTextAndFormats(mdast);
    renderHtmlFormats(mdast);

    const source = await assertMD(mdast, 'sanitized-whitespace.md', [gfm]);

    const actual = unified()
      .use(remark)
      .use(gfm)
      .parse(source);

    // convert back.
    await assertMD(actual, 'sanitized-whitespace.md', [gfm]);
  });

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
      sanitizeTextAndFormats(mdast);
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
          text('Hello, world.'),
        ]),
      ]);
      sanitizeTextAndFormats(mdast);
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
      sanitizeTextAndFormats(mdast);
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
      sanitizeTextAndFormats(mdast);
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
            text('Hello, world.'),
          ]),
        ]),
      ]);
      sanitizeTextAndFormats(mdast);
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
        strong(text('Hello,')),
        text(' '),
        strike(text('world.')),
      ]),
    ]);
    sanitizeTextAndFormats(mdast);
    assert.deepEqual(mdast, expected);
  });
});
