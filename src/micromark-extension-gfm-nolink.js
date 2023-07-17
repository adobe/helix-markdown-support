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

/**
copied from
https://github.com/micromark/micromark-extension-gfm/blob/main/index.js

 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 * @typedef {import('micromark-extension-gfm-strikethrough').Options} Options
 * @typedef {import('micromark-extension-gfm-footnote').HtmlOptions} HtmlOptions
 */

import {
  combineExtensions,
  combineHtmlExtensions,
} from 'micromark-util-combine-extensions';
// import {
//   gfmAutolinkLiteral,
//   gfmAutolinkLiteralHtml,
// } from 'micromark-extension-gfm-autolink-literal';
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
 * Add support for parsing GFM in markdown.
 *
 * Function that can be called to get a syntax extension for micromark (passed
 * in `extensions`).
 *
 * @param {Options} [options]
 *   Configuration (optional).
 *   Passed to `micromark-extens-gfm-strikethrough`.
 * @returns {Extension}
 *   Syntax extension for micromark (passed in `extensions`).
 */
export function gfm(options) {
  return combineExtensions([
    // gfmAutolinkLiteral,
    gfmFootnote(),
    gfmStrikethrough(options),
    gfmTable,
    gfmTaskListItem,
  ]);
}

/**
 * Add support for turning GFM in markdown to HTML.
 *
 * Function that can be called to get an HTML extension for micromark (passed
 * in `htmlExtensions`).
 *
 * @param {HtmlOptions} [options]
 *   Configuration (optional).
 *   Passed to `micromark-extens-gfm-footnote`.
 * @returns {HtmlExtension}
 *   HTML extension for micromark (passed in `htmlExtensions`).
 */
export function gfmHtml(options) {
  return combineHtmlExtensions([
    // gfmAutolinkLiteralHtml,
    gfmFootnoteHtml(options),
    gfmStrikethroughHtml,
    gfmTableHtml,
    gfmTagfilterHtml,
    gfmTaskListItemHtml,
  ]);
}
