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

const type = (v) => ((v !== undefined && v !== null) ? v.constructor : v);

const CODE_DASH = '-'.charCodeAt(0);

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
  const valueType = 'yamlValue';
  const fenceType = 'yamlFence';
  const sequenceType = 'yamlSequence';
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

      effects.enter('yaml');

      // after the fence `---` is detected, we are at the end of the line
      return effects.attempt(fenceConstruct, lineEnd, nok)(code);
    }

    function lineStart(code) {
      // set the whitespace flag to true
      wasWS = true;
      if (code === -5 || code === -4 || code === -3 || code === null) {
        return lineEnd(code);
      }
      effects.enter(valueType);
      return lineData(code);
    }

    function lineData(code) {
      if (code === -5 || code === -4 || code === -3 || code === null) {
        effects.exit(valueType);
        return lineEnd(code);
      }

      if (!(code === -2 || code === -1 || code === 32)) {
        // if not whitespace, clear flag
        wasWS = false;
      }

      effects.consume(code);
      return lineData;
    }

    function closedFence(code) {
      // if we are at the end, don't check for empty line after
      if (code === null) {
        return afterClosedFence(code);
      }

      // remember new line
      effects.enter('lineEnding');
      effects.consume(code);
      effects.exit('lineEnding');

      // this is a bit a hack to avoid create soo many states
      wasWS = false;

      return afterClosedFence;
    }

    function afterClosedFence(code) {
      // check for whitespace
      if (code === -2 || code === -1 || code === 32) {
        if (!wasWS) {
          effects.enter('whitespace');
          wasWS = true;
        }
        effects.consume(code);
        return afterClosedFence;
      } else if (wasWS) {
        effects.exit('whitespace');
        wasWS = false;
      }

      if (code !== -5 && code !== -4 && code !== -3 && code !== null) {
        return nok(code);
      }

      const token = effects.exit('yaml');
      let yamlString = self.sliceSerialize(token).trim();
      // remove fences
      yamlString = yamlString.substring(4, yamlString.length - 3).trim();
      if (!validYaml(yamlString, errorHandler)) {
        return nok(code);
      }

      if (code !== null) {
        // since there is a blank line after the `---`, also mark it.
        effects.enter('lineEndingBlank');
        effects.exit('lineEndingBlank');
      }

      return ok(code);
    }

    function lineEnd(code) {
      // Require a closing fence.
      if (code === null) {
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
      effects.enter('lineEnding');
      effects.consume(code);
      effects.exit('lineEnding');

      // attempt to detect the closing fence `---`. if not, start next line
      return effects.attempt(fenceConstruct, closedFence, lineStart);
    }
  }

  function tokenizeFence(effects, ok, nok) {
    let numDashes = 0;

    return start;

    function start(code) {
      if (code === CODE_DASH) {
        effects.enter(fenceType);
        effects.enter(sequenceType);
        return insideSequence(code);
      }

      return nok(code);
    }

    function insideSequence(code) {
      if (numDashes === 3) {
        effects.exit(sequenceType);

        if (code === -2 || code === -1 || code === 32) {
          effects.enter('whitespace');
          return insideWhitespace(code);
        }

        return fenceEnd(code);
      }

      if (code === CODE_DASH) {
        effects.consume(code);
        numDashes += 1;
        return insideSequence;
      }

      return nok(code);
    }

    // white space after fence
    function insideWhitespace(code) {
      if (code === -2 || code === -1 || code === 32) {
        effects.consume(code);
        return insideWhitespace;
      }

      effects.exit('whitespace');
      return fenceEnd(code);
    }

    // after fence (plus potential ws) we expect a LF
    function fenceEnd(code) {
      if (code === -5 || code === -4 || code === -3 || code === null) {
        effects.exit(fenceType);
        return ok(code);
      }
      return nok(code);
    }
  }
}

export default function create(options = {}) {
  return {
    flow: {
      [CODE_DASH]: [parse(options)],
    },
  };
}
