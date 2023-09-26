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
  inlineCode, link,
  paragraph,
  root,
  strike,
  strong,
  text,
  brk,
} from 'mdast-builder';
import { assertMD } from './utils.js';
import { remarkGfmNoLink as gfm, sanitizeLinks } from '../src/index.js';

describe('sanitize-links Tests', () => {
  it('unwraps formatting', async () => {
    const mdast = root([
      heading(2, text('Sanitize Links')),
      paragraph([
        link('https://www.adobe.com', '', text('adobe')),
      ]),
      paragraph([
        link('https://www.adobe.com', '', [
          strong(text('adobe')),
        ]),
      ]),
      paragraph([
        link('https://www.adobe.com', '', [
          strike(text('adobe')),
        ]),
      ]),
      paragraph([
        link('https://www.adobe.com', '', [
          emphasis(text('adobe')),
        ]),
      ]),
      paragraph([
        link('https://www.adobe.com', '', [
          emphasis(),
        ]),
      ]),
      paragraph([
        link('https://www.adobe.com', '', [
          inlineCode('adobe'),
        ]),
      ]),
      paragraph([
        link('https://www.adobe.com', '', [
          strong([
            text('Curves '),
            text('on the '),
            text('ipad. '),
          ]),
        ]),
        text('The curves are nice.'),
      ]),
      paragraph([
        link('https://www.adobe.com', '', [
          strong([
            text('Curves on '),
            emphasis(text('the')),
            text(' ipad. '),
          ]),
        ]),
        text('The curves are nice.'),
      ]),
      paragraph([
        text('Trailing links:'),
        link('https://www.adobe.com', '', [
          text('adobe'),
          brk,
          brk,
        ]),
        text('rules.'),
      ]),
      paragraph([
        text('Leading links:'),
        link('https://www.adobe.com', '', [
          brk,
          brk,
          text('adobe rules.'),
        ]),
      ]),
      paragraph([
        text('Links inside:'),
        link('https://www.adobe.com', '', [
          text('adobe'),
          brk,
          text('rules.'),
        ]),
      ]),
      paragraph([
        text('only breaks'),
        link('https://www.adobe.com', '', [
          brk,
          brk,
          brk,
        ]),
      ]),
    ]);
    sanitizeLinks(mdast);
    await assertMD(mdast, 'sanitized-links.md', [gfm]);
  });
});
