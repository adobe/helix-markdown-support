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

const {
  root,
  paragraph,
  text,
  heading,
  image,
} = require('mdast-builder');
const { assertMD } = require('./utils.js');

const sanitizeHeading = require('../src/mdast-sanitize-heading.js');

describe('sanitize-heading Tests', () => {
  it('Moves images in heading to next paragraph.', async () => {
    const mdast = root([
      heading(2, [
        text('This contains an image: '),
        image('https://dummyimage.com/300', 'Dummy Image'),
        text('.'),
      ]),
      paragraph([
        text('Hello, world.'),
      ]),
    ]);
    sanitizeHeading(mdast);
    await assertMD(mdast, 'sanitized-heading.md');
  });

  it('Removes empty headings.', async () => {
    const mdast = root([
      heading(2, [
        image('https://dummyimage.com/300', 'Dummy Image'),
      ]),
      paragraph([
        text('Hello, world.'),
      ]),
    ]);
    sanitizeHeading(mdast);
    await assertMD(mdast, 'sanitized-heading-removed.md');
  });
});
