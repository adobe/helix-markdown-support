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
  link,
} = require('mdast-builder');

const unified = require('unified');
const directive = require('remark-directive');
const stringify = require('remark-stringify');
const u = require('unist-builder');
const inspect = require('unist-util-inspect');

const block = (attributes = {}, children) => u('containerDirective', { name: 'block', attributes }, children);
const split = (attributes = {}) => u('leafDirective', { name: 'split', attributes });
const next = (attributes = {}) => u('leafDirective', { name: 'next', attributes });
const brk = (attributes = {}) => u('leafDirective', { name: 'break', attributes });

const tree = root([
  heading(1, text('Helix Blocks')),
  heading(2, text('single block')),
  block({ class: 'special' }, [
    heading(3, text('My Title')),
    paragraph(text('foo')),
  ]),

  heading(2, text('single block, 2 columns')),
  block({ class: ['video', 'text'] }, [
    paragraph(link('https://www.adobe.com')),
    u('leafDirective', { name: 'next' }),
    paragraph(text('Adobe')),
  ]),

  heading(2, text('multi block with changing columns')),
  block({ class: 'special' }, [
    paragraph(text('foo')),
    split({ class: 'animation' }),
    paragraph(text('bar')),
    next({ class: 'image' }),
    paragraph(text('img')),
    brk({ class: 'foot' }),
    paragraph(text('footer')),
  ]),
]);

process.stdout.write(inspect(tree));
process.stdout.write('\n');

const res = unified()
  .use(directive)
  .use(stringify)
  .stringify(tree);

// eslint-disable-next-line no-console
console.log(res);
