/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { Parser, Formatter } = require('../index');

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
];

testFiles.forEach((file) => (
  assertEquals(
    fs.readFileSync(path.join(__dirname, `${file}.mlg`)),
    fs.readFileSync(path.join(__dirname, `${file}.json`)),
  )
));
