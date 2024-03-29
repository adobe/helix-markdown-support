/*
 * Copyright 2019 Adobe. All rights reserved.
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
import * as index from '../src/index.js';

const MODS = [
  'robustTables',
  'sanitizeHeading',
  'suppressSpaceCode',
  'fixCodeFlow',
  'fixRootPhrasing',
  'sanitizeLinks',
  'breaksAsSpaces',
  'sanitizeFormats',
  'sanitizeText',
  'sanitizeTextAndFormats',
  'imageReferences',
  'dereference',
  'remarkGfmNoLink',
  'renderHtmlFormats',
];

describe('Index Tests', () => {
  for (const mod of MODS) {
    it(`index exports ${mod}`, () => {
      assert.ok(mod in index);
    });
  }

  it('all mods tested', () => {
    const missing = Object.keys(index).filter((m) => !MODS.includes(m));
    assert.deepStrictEqual([], missing, `The following modules are not covered in this test: ${missing.join()}`);
  });
});
