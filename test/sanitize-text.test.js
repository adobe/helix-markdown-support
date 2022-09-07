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
  emphasis,
  heading,
  image,
  inlineCode,
  paragraph,
  root,
  strike,
  strong,
  text,
} from 'mdast-builder';
import gfm from 'remark-gfm';
import { unified } from 'unified';
import remark from 'remark-parse';
import { sanitizeHeading, sanitizeText } from '../src/index.js';
import { assertMD } from './utils.js';

const separator = () => ({
  type: 'thematicBreak',
});

const brk = () => ({
  type: 'break',
});

describe('sanitize-embeds Tests', () => {
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
      heading(2, text('works with leading brekas')),
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
    ]);
    sanitizeHeading(mdast);
    sanitizeText(mdast);
    const source = await assertMD(mdast, 'sanitized-text.md', [gfm]);

    const actual = unified()
      .use(remark)
      .use(gfm)
      .parse(source);

    // convert back.
    await assertMD(actual, 'sanitized-text.md', [gfm]);
  });
});
