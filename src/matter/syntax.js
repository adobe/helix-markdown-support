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
/* eslint-disable no-use-before-define */
import jsYaml from 'js-yaml';
import { codes, types } from 'micromark-util-symbol';
import { markdownLineEnding, markdownSpace } from 'micromark-util-character';
import { TYPE_YAML } from './types.js';

const type = (v) => ((v !== undefined && v !== null) ? v.constructor : v);

function validYaml(str, errorHandler) {
  // console.log('validate yaml', str);
  try {
    const payload = jsYaml.load(str);

    // ensure we only accept YAML objects
    let payloadType = type(payload);
    if (payloadType !== Object) {
      if (payloadType === String || payloadType === Number) {
        // ignore scalar
        return false;
      }

      if (errorHandler) {
        if (Array.isArray(payload)) {
          payloadType = 'Array';
        }
        errorHandler('Found ambiguous frontmatter block: Block contains valid yaml, but '
          + `it's data type is "${payloadType}" instead of Object. `
          + 'Make sure your yaml blocks contain only key-value pairs at the root level!', str);
      }
      return false;
    }
    return true;
  } catch (e) {
    if (errorHandler) {
      errorHandler(e);
    }
    return false;
  }
}

function parse(options) {
  const yamlValue = 'yamlValue';
  const yamlFence = 'yamlFence';
  const yamlSequence = 'yamlSequence';
  const { errorHandler } = options;

  const fenceConstruct = {
    tokenize: tokenizeFence,
    partial: true,
  };

  return {
    tokenize: tokenizeFrontmatter,
  };

  function tokenizeFrontmatter(effects, ok, nok) {
    const self = this;
    let wasWS = false;
    let startLine;

    return start;

    function start(code) {
      const position = self.now();

      // fence must start at beginning of line
      if (position.column !== 1) {
        return nok(code);
      }

      // remember start line
      startLine = position.line;

      // check if blank line before
      const { events } = self;
      for (let idx = events.length - 1; idx >= 0; idx -= 1) {
        const { type: eventType } = events[idx][1];
        if (eventType === 'lineEndingBlank') {
          break;
        }
        if (eventType !== 'lineEnding') {
          return nok(code);
        }
      }

      effects.enter(TYPE_YAML);

      // after the fence `---` is detected, we are at the end of the line
      return effects.attempt(fenceConstruct, lineEnd, nok)(code);
    }

    function lineStart(code) {
      // set the whitespace flag to true
      wasWS = true;
      if (code === codes.eof || markdownLineEnding(code)) {
        return lineEnd(code);
      }
      effects.enter(yamlValue);
      return lineData(code);
    }

    function lineData(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit(yamlValue);
        return lineEnd(code);
      }

      if (!markdownSpace(code)) {
        // if not whitespace, clear flag
        wasWS = false;
      }

      effects.consume(code);
      return lineData;
    }

    function closedFence(code) {
      // check if valid yaml
      const token = effects.exit(TYPE_YAML);
      let yamlString = self.sliceSerialize(token).trim();
      // remove fences
      yamlString = yamlString.substring(4, yamlString.length - 3).trim();
      if (!validYaml(yamlString, errorHandler)) {
        return nok(code);
      }

      // if we are at the end, don't check for empty line after
      if (code === codes.eof) {
        return ok(code);
      }

      return effects.check({
        tokenize: tokenizeEmptyLine,
        partial: true,
      }, ok, nok)(code);
    }

    function lineEnd(code) {
      // Require a closing fence.
      if (code === codes.eof) {
        return nok(code);
      }

      // if all whitespace since linestart, check if empty line is ok.
      if (wasWS) {
        const position = self.now();
        const line = position.line - startLine;
        if (line === 1) {
          // console.log('empty line detected at beginning of yaml block.');
          return nok(code);
        } else if (startLine !== 1) {
          // console.log('empty line detected in midmatter.');
          return nok(code);
        }
      }

      // Can only be an eol.
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);

      // attempt to detect the closing fence `---`. if not, start next line
      return effects.attempt(fenceConstruct, closedFence, lineStart);
    }
  }

  function tokenizeFence(effects, ok, nok) {
    let numDashes = 0;

    return start;

    function start(code) {
      if (code === codes.dash) {
        effects.enter(yamlFence);
        effects.enter(yamlSequence);
        return insideSequence(code);
      }

      return nok(code);
    }

    function insideSequence(code) {
      if (numDashes === 3) {
        effects.exit(yamlSequence);

        if (markdownSpace(code)) {
          effects.enter(types.whitespace);
          return insideWhitespace(code);
        }

        return fenceEnd(code);
      }

      if (code === codes.dash) {
        effects.consume(code);
        numDashes += 1;
        return insideSequence;
      }

      return nok(code);
    }

    // white space after fence
    function insideWhitespace(code) {
      if (markdownSpace(code)) {
        effects.consume(code);
        return insideWhitespace;
      }

      effects.exit(types.whitespace);
      return fenceEnd(code);
    }

    // after fence (plus potential ws) we expect a LF
    function fenceEnd(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        effects.exit(yamlFence);
        return ok(code);
      }
      return nok(code);
    }
  }

  function tokenizeEmptyLine(effects, ok, nok) {
    let wasWS = false;

    return start;

    /**
     * after the closed fence, we either need EOF or an empty line.
     */
    function start(code) {
      // always eol
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);
      return emptyLines;
    }

    function emptyLines(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        return ok(code);
      }
      // check for whitespace
      if (markdownSpace(code)) {
        if (!wasWS) {
          effects.enter(types.whitespace);
          wasWS = true;
        }
        effects.consume(code);
        return emptyLines;
      }
      if (wasWS) {
        effects.exit(types.whitespace);
      }
      return nok(code);
    }
  }
}

export default function create(options = {}) {
  return {
    flow: {
      [codes.dash]: [parse(options)],
    },
  };
}
