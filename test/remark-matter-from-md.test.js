/*
 * Copyright 2018 Adobe. All rights reserved.
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
import jsYaml from 'js-yaml';
import { unified } from 'unified';
import remark from 'remark-parse';
import { inspectNoColor as inspect } from 'unist-util-inspect';
import { visit } from 'unist-util-visit';
import {
  heading, paragraph, root, text,
} from 'mdast-builder';

import { remarkMatter } from '../src/index.js';

const yaml = (payload, yamlDump) => ({
  type: 'yaml',
  value: yamlDump ? jsYaml.dump(payload) : undefined,
  payload,
});

const thematicBreak = () => ({
  type: 'thematicBreak',
});

const multiline = (str) => {
  // Discard the leading & trailing line
  const lines = str.split('\n');

  // Strip the first and the last line
  if (lines[0].match(/^\s*$/)) {
    lines.shift();
  }
  if (lines.length > 0 && lines[lines.length - 1].match(/^\s*$/)) {
    lines.pop();
  }

  const prefixLen = lines
    .filter((line) => !line.match(/^\s*$/))
    .map((line) => line.match(/^ */)[0].length)
    .reduce((min, len) => Math.min(len, min), Infinity);

  return lines.map((line) => line.slice(prefixLen)).join('\n');
};

function removePositions(tree) {
  visit(tree, (node) => {
    // eslint-disable-next-line no-param-reassign
    delete node.position;
    return visit.CONTINUE;
  });
  return tree;
}

let errors = [];

const procMd = (md, noErrorHandler, yamlDump) => {
  const source = multiline(md).replace(/@/g, ' ');
  // console.log(source);

  // parse w/o frontmatter plugin
  const orig = unified()
    .use(remark, {
      position: false,
    })
    .parse(source);
  removePositions(orig);

  // parse with frontmatter plugin
  const settings = {
    yamlDump,
  };
  if (!noErrorHandler) {
    settings.errorHandler = (e) => {
      // console.error(e.toString(true));
      errors.push(e.toString(true));
    };
  }

  const proc = unified()
    .use(remark)
    .use(remarkMatter, settings)
    .parse(source);
  removePositions(proc);

  return {
    orig,
    proc,
  };
};

const assertCorrect = (md, expected, yamlDump) => {
  const { proc } = procMd(md, false, yamlDump);
  const actual = inspect(proc);
  assert.strictEqual(actual, inspect(expected));
};

const assertNop = (md, noErrorHandler) => {
  const { proc, orig } = procMd(md, noErrorHandler);
  const actual = inspect(proc);
  const expected = inspect(orig);
  assert.strictEqual(actual, expected);
};

const assertError = (md, expectedErrors = []) => {
  assertNop(md);
  assert.deepEqual(errors, expectedErrors);
};

describe('remark-matter from markdown', () => {
  beforeEach(() => {
    errors = [];
  });
  it('Ignore: Empty document', () => assertNop(''));

  it('Ignore: Just some text', () => assertNop('Foo'));

  it('Ignore: Hash based second level header', () => assertNop('## Foo'));

  it('Ignore: Underline second level header', () => assertNop(`
    Hello World
    ---
  `));

  it('Ignore: Single <hr>', () => assertNop(`
    ---
  `));

  it('Ignore: h2 with underline followed by <hr>', () => assertNop(`
    Hello
    ---

    ---
  `, true));

  it('Ignore: diversity of h2 with underline and <hr>', () => assertNop(`
    Hello
    ---

    Bar
    ---

    ---

    Bang
  `));

  it('Ignore: resolving ambiguity by using h2 underlined with 4 dashes', () => assertNop(`
    Foo
    ----
    Hello
    ----
  `));

  it('Ignore: resolving ambiguity by using hr with spaces between dashes', () => assertNop(`
    Foo
    - - -
    Hello
  `));

  it('Ignore: resolving ambiguity by using hr with spaces between dashes', () => assertNop(`
    Foo

    - - -
    Hello: 13
    - - -

    Bar
  `));

  it('Ignore: resolving ambiguity by using hr with asterisk', () => assertNop(`
    Foo
    ***
    Hello
  `));

  it('Ignore: resolving ambiguity by using hr with asterisk #2', () => assertNop(`
    ***
    Foo: 42
    ***
  `));

  it('Ignore: fence must start at the beginning of the line', () => assertNop(`
     ---
    Foo: 42
    ---
  `));

  it('Ignore: fence must not have additional non whitespace', () => assertNop(`
    ---  hello
    Foo: 42
    ---
  `));

  it('Ignore: no frontmatter due to empty lines', () => assertNop(`
    # Multimedia Test
    ---

    ![](https://hlx.blob.core.windows.net/external/20f9d6dff67514da262230822bda5f3b50ef28c6#image.png)

    ---

    PUBLISHED ON 28-04-2020

    ---

    ### SlideShare

    <https://www.slideshare.net/adobe/adobe-digital-insights-holiday-recap-2019>

    ---
    Topics: Bar, Baz
    Products: Stock, Creative Cloud
  `));

  it('Ignore: no frontmatter with embeds', () => assertNop(`
    ---
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ78BeYUV4gFee4bSxjN8u86aV853LGYZlwv1jAUMZFnPn5TnIZteDJwjGr2GNu--zgnpTY1E_KHXcF/pubhtml

    Is foo {{foo}}?"
    ---
  `));

  it('Reject: reject invalid yaml', () => assertError(`
    ---
    - Foo
    hello: 42
    ---
  `, []));

  it('Reject: reject more invalid yaml', () => assertError(`
    ---
    Foo
    hello: 42
    ---
  `, ['YAMLException: end of the stream or a document separator is expected (2:6)']));

  it('Reject: reject more invalid yaml (no error handler)', () => assertNop(`
    ---
    Foo
    hello: 42
    ---
  `, true));

  it('Reject: reject yaml with list', () => assertError(`
    ---
    - Foo
    ---
  `, []));

  it('Ignore: reject yaml with json style list', () => assertNop(`
    ---
    [1,2,3,4]
    ---
  `));

  it('Ignore: Ignore: reject yaml with number', () => assertNop(`
    ---
    42
    ---
  `));

  it('Ignore: reject yaml with string', () => assertNop(`
    ---
    Hello
    ---
  `));

  it('Reject: Reject yaml with null', () => assertError(`
    ---
    null
    ---
  `, [
    'Found ambiguous frontmatter block: Block contains valid yaml, but it\'s data type is "null" instead of Object. Make sure your yaml blocks contain only key-value pairs at the root level!',
  ]));

  it('Reject: Reject yaml with null (no error handler)', () => assertNop(`
    ---
    null
    ---
  `, true));

  it('Ignore: frontmatter with insufficient space before it', () => assertNop(`
      Foo
      ---
      Bar: 42
      ---
    `));

  it('Ok: frontmatter with empty line before it', () => assertCorrect(`
      Foo

      ---
      Bar: 42
      ---
    `, root([
    paragraph(text('Foo')),
    yaml({
      Bar: 42,
    }),
  ])));

  it('Ok: frontmatter with space before it', () => assertCorrect(`
      Foo
      @@@@
      ---
      Bar: 42
      ---
    `, root([
    paragraph(text('Foo')),
    yaml({
      Bar: 42,
    }),
  ])));

  it('Ok: frontmatter with space after it', () => assertCorrect(`
      ---
      Bar: 42
      ---
      @@@
    `, root([
    yaml({
      Bar: 42,
    }),
  ])));

  it('Reject: frontmatter with insufficient space after it', () => assertError(`
      ---
      Bar: 42
      ---
      XXX
    `));

  it('Ignore: frontmatter with insufficient space on both ends', () => assertNop(`
      ab: 33
      ---
      Bar: 22
      ---
      XXX: 44
  `));

  it('Ignore: section with emoticons', () => assertNop(`
      ---

      :normal:

      ---

      - [home](#)
      - [menu](#menu)
  `));

  it('Ignore: just sections', () => assertNop(`
      # Title

      ---

      Lorem ipsum 1

      ---

      Lorem ipsum 2

      ---

      Lorem ipsum 3
  `));

  it('Reject: frontmatter with empty line between paragraphs', () => assertError(`
      echo

      ---
      hello: 42

      world: 13
      ---

      delta
    `));

  it('Ok: frontmatter at the start of the document with empty line', () => assertCorrect(`
      ---
      hello: 42

      world: 13
      ---
    `, root(
    yaml({
      hello: 42,
      world: 13,
    }),
  )));

  it('Reject: frontmatter in the middle of the document with empty line', () => assertError(`
    This is normal.

    Really normal stuff.

    ---
    hello: 42

    world: 13
    ---
  `));

  it('Ok: frontmatter at the start of the document with empty line filled with space', () => assertCorrect(`
      ---
      hello: 42
      @@@@
      world: 13
      ---
    `, root(
    yaml({
      hello: 42,
      world: 13,
    }),
  )));

  it('Reject: frontmatter in the middle of the document with empty line filled with space', () => assertError(`
    This is normal.

    Really normal stuff.

    ---
    hello: 42
    @@@@
    world: 13
    ---
  `));

  it('Ok: Entire doc is frontmatter', () => assertCorrect(
    `
      ---
      foo: 42
      ---
    `,
    root(yaml({ foo: 42 })),
  ));

  it('Ok: Entire doc is frontmatter (with yaml dump value)', () => assertCorrect(
    `
      ---
      foo: 42
      ---
    `,
    root(yaml({ foo: 42 }, true)),
    true,
  ));

  it('Ok: Entire doc is frontmatter w trailing space after open fence', () => assertCorrect(
    `
    ---@@@
    foo: 42
    ---
  `,
    root(yaml({ foo: 42 })),
  ));

  it('Ok: Entire doc is frontmatter w trailing space after close fence', () => assertCorrect(
    `
    ---
    foo: 42
    ---@@@
  `,
    root(yaml({ foo: 42 })),
  ));

  it('Ok: Frontmatter; underline h2; frontmatter', () => assertCorrect(
    `
    ---
    foo: 42
    ---

    Hello
    ---

    ---
    my: 42
    ---
  `,
    root([
      yaml({ foo: 42 }),
      heading(2, text('Hello')),
      yaml({ my: 42 }),
    ]),
  ));

  it('Ok: frontmatter; frontmatter', () => assertCorrect(`
    ---
    {x: 23}
    ---

    ---
    my: 42
    ---
  `, root([
    yaml({ x: 23 }),
    yaml({ my: 42 }),
  ])));

  it('Ok: frontmatter, <hr>, frontmatter', () => assertCorrect(
    `
    ---
    {x: 23}
    ---

    ---

    ---
    my: 42
    ---
  `,
    root([
      yaml({ x: 23 }),
      thematicBreak(),
      yaml({ my: 42 }),
    ]),
  ));

  it('Ok: frontmatter, text, frontmatter', () => assertCorrect(
    `
    ---
    {x: 23}
    ---

    Hurtz

    ---
    my: 42
    ---
  `,
    root([
      yaml({ x: 23 }),
      paragraph(text('Hurtz')),
      yaml({ my: 42 }),
    ]),
  ));

  it('Ok: frontmatter, <hr>, frontmatter, <hr>', () => assertCorrect(
    `
    ---
    {x: 23}
    ---

    ---

    ---
    my: 42
    ---

    ---
  `,
    root([
      yaml({ x: 23 }),
      thematicBreak(),
      yaml({ my: 42 }),
      thematicBreak(),
    ]),
  ));

  it('Ok: frontmatter, text, frontmatter, text, frontmatter, text, frontmatter, text', () => assertCorrect(
    `
    ---
    {x: 23}
    ---

    Hurtz

    ---
    my: 42
    ---

    Bong

    ---
    nom: foo
    ---

    Huck

    ---
    nom: foo
    ---

    Huck

  `,
    root([
      yaml({ x: 23 }),
      paragraph(text('Hurtz')),
      yaml({ my: 42 }),
      paragraph(text('Bong')),
      yaml({ nom: 'foo' }),
      paragraph(text('Huck')),
      yaml({ nom: 'foo' }),
      paragraph(text('Huck')),
    ]),
  ));
});
