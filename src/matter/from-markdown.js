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
import jsYaml from 'js-yaml';
import { TYPE_YAML } from './types.js';

function open(token) {
  this.enter({ type: TYPE_YAML, value: '', payload: {} }, token);
  this.buffer();
}

function createClose(options) {
  function close(token) {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    // todo: avoid double parsing
    node.payload = jsYaml.load(data);
    if (options.yamlDump) {
      node.value = jsYaml.dump(node.payload);
    } else {
      delete node.value;
    }
    this.exit(token);
  }

  return close;
}

function value(token) {
  this.config.enter.data.call(this, token);
  this.config.exit.data.call(this, token);
}

// eslint-disable-next-line no-unused-vars
export default function fromMarkdown(options = {}) {
  return {
    enter: {
      [TYPE_YAML]: open,
    },
    exit: {
      [TYPE_YAML]: createClose(options),
      yamlValue: value,
    },
  };
}
