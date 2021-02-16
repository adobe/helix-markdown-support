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

const remarkMatter = require('./remark-matter');
const robustTables = require('./mdast-robust-tables.js');
const breaksAsSpaces = require('./remark-breaks-as-spaces.js');
const sanitizeHeading = require('./mdast-sanitize-heading.js');
const suppressSpaceCode = require('./mdast-suppress-spacecode.js');
const sanitizeFormats = require('./mdast-sanitize-formats.js');
const fixCodeFlow = require('./mdast-fix-code-flow.js');

module.exports = {
  remarkMatter,
  robustTables,
  breaksAsSpaces,
  sanitizeHeading,
  suppressSpaceCode,
  sanitizeFormats,
  fixCodeFlow,
};
