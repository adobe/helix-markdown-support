/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/*
copied from
https://github.com/micromark/micromark-extension-gfm/blob/main/index.js
*/

/**
 * @typedef {import('micromark-extension-gfm-footnote').HtmlOptions} HtmlOptions
 * @typedef {import('micromark-extension-gfm-strikethrough').Options} Options
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */

import {
  combineExtensions,
  combineHtmlExtensions,
} from 'micromark-util-combine-extensions';
// import {
//   gfmAutolinkLiteral,
//   gfmAutolinkLiteralHtml
// } from 'micromark-extension-gfm-autolink-literal'
import { gfmFootnote, gfmFootnoteHtml } from 'micromark-extension-gfm-footnote';
import {
  gfmStrikethrough,
  gfmStrikethroughHtml,
} from 'micromark-extension-gfm-strikethrough';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';
import { gfmTagfilterHtml } from 'micromark-extension-gfm-tagfilter';
import {
  gfmTaskListItem,
  gfmTaskListItemHtml,
} from 'micromark-extension-gfm-task-list-item';

/**
 * Create an extension for `micromark` to enable GFM syntax.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 *
 *   Passed to `micromark-extens-gfm-strikethrough`.
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions` to enable GFM
 *   syntax.
 */
export function gfm(options) {
  return combineExtensions([
    // gfmAutolinkLiteral(),
    gfmFootnote(),
    gfmStrikethrough(options),
    gfmTable(),
    gfmTaskListItem(),
  ]);
}

/**
 * Create an extension for `micromark` to support GFM when serializing to HTML.
 *
 * @param {HtmlOptions | null | undefined} [options]
 *   Configuration (optional).
 *
 *   Passed to `micromark-extens-gfm-footnote`.
 * @returns {HtmlExtension}
 *   Extension for `micromark` that can be passed in `htmlExtensions` to
 *   support GFM when serializing to HTML.
 */
/* c8 ignore next 10 */
export function gfmHtml(options) {
  return combineHtmlExtensions([
    // gfmAutolinkLiteralHtml(),
    gfmFootnoteHtml(options),
    gfmStrikethroughHtml(),
    gfmTableHtml(),
    gfmTagfilterHtml(),
    gfmTaskListItemHtml(),
  ]);
}
