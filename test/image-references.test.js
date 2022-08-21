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
  heading, image, root, text,
} from 'mdast-builder';
import { assertMD } from './utils.js';
import { imageReferences } from '../src/index.js';

describe('image-references Tests', () => {
  it('creates image reference', async () => {
    const mdast = root([
      heading(2, text('No alt text no title')),
      image('https://dummyimage.com/300'),
      heading(2, text('No alt text but title')),
      image('https://dummyimage.com/300', 'This is no Bob Ross'),
      heading(2, text('No alt text but different title')),
      image('https://dummyimage.com/300', 'This is no Bob Ross either.'),
      heading(2, text('Same image with alt text')),
      image('https://dummyimage.com/300', undefined, 'A example 300x300 image'),
      heading(2, text('Different image with alt text')),
      image('https://dummyimage.com/200', undefined, '  A example 200x200 image  '),
      heading(2, text('Same image with title')),
      image('https://dummyimage.com/300', 'This is no Bob Ross', 'This is 300x300'),
    ]);
    imageReferences(mdast);
    await assertMD(mdast, 'image-references.md');
  });
});
