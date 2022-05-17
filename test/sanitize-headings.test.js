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
  heading, image, paragraph, root, text,
} from 'mdast-builder';
import { assertMD } from './utils.js';
import { sanitizeHeading } from '../src/index.js';

const brk = () => ({ type: 'break' });

describe('sanitize-heading Tests', () => {
  it('Moves images in heading to next paragraph. by default', async () => {
    const mdast = root([
      heading(2, [
        image('https://dummyimage.com/300', 'Dummy Image 1'),
        text('This contains an image: '),
        image('https://dummyimage.com/300', 'Dummy Image 2'),
        text('.'),
      ]),
      paragraph([
        text('Hello, world.'),
      ]),
    ]);
    sanitizeHeading(mdast);
    await assertMD(mdast, 'sanitized-heading.md');
  });

  it('Moves images in heading to next paragraph if enabled', async () => {
    const mdast = root([
      heading(2, [
        image('https://dummyimage.com/300', 'Dummy Image 1'),
        text('This contains an image: '),
        image('https://dummyimage.com/300', 'Dummy Image 2'),
        text('.'),
      ]),
      paragraph([
        text('Hello, world.'),
      ]),
    ]);
    sanitizeHeading(mdast, { imageHandling: 'after' });
    await assertMD(mdast, 'sanitized-heading.md');
  });

  it('Moves images in heading to previous paragraph if enabled', async () => {
    const mdast = root([
      heading(2, [
        image('https://dummyimage.com/300', 'Dummy Image 1'),
        text('This contains an image: '),
        image('https://dummyimage.com/300', 'Dummy Image 2'),
        text('.'),
      ]),
      paragraph([
        text('Hello, world.'),
      ]),
    ]);
    sanitizeHeading(mdast, { imageHandling: 'before' });
    await assertMD(mdast, 'sanitized-heading-before.md');
  });

  it('Moves images in heading to previous and next paragraph if enabled', async () => {
    const mdast = root([
      heading(2, [
        image('https://dummyimage.com/300', 'Dummy Image 1'),
        image('https://dummyimage.com/300', 'Dummy Image 2'),
        text('This contains an image: '),
        image('https://dummyimage.com/300', 'Dummy Image 3'),
        image('https://dummyimage.com/300', 'Dummy Image 4'),
        text('.'),
      ]),
      heading(2, [
        image('https://dummyimage.com/300', 'Dummy Image 5'),
        image('https://dummyimage.com/300', 'Dummy Image 6'),
        text('This also contains images: '),
        image('https://dummyimage.com/300', 'Dummy Image 7'),
        image('https://dummyimage.com/300', 'Dummy Image 8'),
        text('.'),
      ]),
      paragraph([
        text('Hello, world.'),
      ]),
    ]);
    sanitizeHeading(mdast, { imageHandling: 'both' });
    await assertMD(mdast, 'sanitized-heading-both.md');
  });

  it('Removes empty headings after all images moved out.', async () => {
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

  it('Removes empty headings.', async () => {
    const mdast = root([
      heading(2, [
      ]),
      paragraph([
        text('Hello, world.'),
      ]),
    ]);
    sanitizeHeading(mdast);
    await assertMD(mdast, 'sanitized-heading-empty.md');
  });

  it('Converts soft breaks to <br>s.', async () => {
    const mdast = root([
      heading(2, [
        text('Adobe'),
        brk(),
        text('Rules'),
      ]),
    ]);
    sanitizeHeading(mdast);
    await assertMD(mdast, 'sanitized-heading-breaks.md');
  });
});
