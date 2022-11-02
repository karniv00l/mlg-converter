/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');
const assert = require('assert').strict;
const { Parser, Formatter } = require('../dist');

const formatter = (file) => new Formatter(new Parser(file).parse());

const assertEquals = (actual, expected) => (
  assert.deepStrictEqual(
    JSON.parse(formatter(actual).toJSON()),
    JSON.parse(expected.toString()),
  )
);

const testFiles = [
  'data/short',
  'data/blank',
  'data/markers',
  'data/rusefi',
  'data/broken',
];

const toArrayBuffer = (b) => {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};

testFiles.forEach((file) => (
  assertEquals(
    toArrayBuffer(fs.readFileSync(path.join(__dirname, `${file}.mlg`))),
    fs.readFileSync(path.join(__dirname, `${file}.json`)),
  )
));
