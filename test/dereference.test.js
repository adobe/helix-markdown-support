/*
 * Copyright 2022 Adobe. All rights reserved.
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
import { unified } from 'unified';
import remark from 'remark-parse';
import remarkGridTable from '@adobe/remark-gridtables';
import {
  assertMD,
  gridTable,
  gtBody,
  gtCell,
  gtHeader,
  gtRow,
  mdast2md,
} from './utils.js';
import { imageReferences, dereference } from '../src/index.js';

describe('dereferences Tests', () => {
  it('dereferences images and links in tables', async () => {
    const link1 = {
      type: 'linkReference',
      identifier: 'adobe-ref',
      referenceType: 'full',
      children: [text('Adobe')],
    };

    const def1 = {
      type: 'definition',
      identifier: 'adobe-ref',
      title: 'Adobe Title',
      url: 'https://www.adobe.com',
    };

    const def2 = {
      type: 'definition',
      identifier: 'unused',
      title: 'Unused Definition',
      url: 'https://www.adobe.com',
    };

    const mdast = root([
      heading(2, text('Grid Table with images')),
      gridTable([
        gtHeader([
          gtRow([
            gtCell(text('A1')),
            gtCell(text('B1')),
          ]),
        ]),
        gtBody([
          gtRow([
            gtCell(text('a2')),
            gtCell(image('https://dummyimage.com/300')),
          ]),
          gtRow([
            gtCell(text('a3')),
            gtCell(image('https://dummyimage.com/300', 'This is no Bob Ross')),
          ]),
          gtRow([
            gtCell(text('a4')),
            gtCell(image('https://dummyimage.com/300', 'This is no Bob Ross either.')),
          ]),
          gtRow([
            gtCell(text('a5')),
            gtCell(image('https://dummyimage.com/300', undefined, 'A example 300x300 image')),
          ]),
          gtRow([
            gtCell(text('a6')),
            gtCell(image('https://dummyimage.com/200', undefined, '  A example 200x200 image  ')),
          ]),
          gtRow([
            gtCell(text('a7')),
            gtCell(image('https://dummyimage.com/300', 'This is no Bob Ross', 'This is 300x300')),
          ]),
          gtRow([
            gtCell(text('a8')),
            gtCell(link1),
          ]),
        ]),
      ]),
      link1,
      def1,
      def2,
    ]);

    imageReferences(mdast);
    // const md = await assertMD(mdast, 'gt-with-references.md', [gridTablePlugin]);
    const md = mdast2md(mdast, [remarkGridTable]);

    // reparse the md
    const actual = unified()
      .use(remark)
      .use(remarkGridTable, {})
      .parse(md);

    dereference(actual);

    await assertMD(actual, 'gt-with-dereferenced.md', [remarkGridTable]);
  });

  it('dereferences images and links outside tables', async () => {
    const link1 = {
      type: 'linkReference',
      identifier: 'adobe-ref',
      referenceType: 'full',
      children: [text('Adobe')],
    };

    const def1 = {
      type: 'definition',
      identifier: 'adobe-ref',
      title: 'Adobe Title',
      url: 'https://www.adobe.com',
    };

    const def2 = {
      type: 'definition',
      identifier: 'unused',
      title: 'Unused Definition',
      url: 'https://www.adobe.com',
    };

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
      heading(2, text('Links refs')),
      link1,
      def1,
      def2,
    ]);

    imageReferences(mdast);
    // const md = await assertMD(mdast, 'gt-with-references.md', [gridTablePlugin]);
    const md = await mdast2md(mdast);

    // reparse the md
    const actual = unified()
      .use(remark)
      .use(remarkGridTable, {})
      .parse(md);

    dereference(actual);

    await assertMD(actual, 'image-dereferenced.md');
  });
});
