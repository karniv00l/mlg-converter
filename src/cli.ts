#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import {
  Parser,
  Formatter,
} from '.';

const args = process.argv.slice(2);

const showUsage = () => {
  console.info('Usage:\n');
  console.info('mlgconv --format=msl,csv,json log1.mlg log2.mlg');
  process.exit(1);
};

const parseArgs = () => {
  const formatsArg = args[0];

  if (args.length < 2) {
    showUsage();
  }

  if (!formatsArg.startsWith('--format=')) {
    showUsage();
  }

  const formats = formatsArg
    .replace('--format=', '')
    .split(',')
    .filter((format) => Formatter.formats().includes(format));

  if (formats.length === 0) {
    showUsage();
  }

  args.slice(1).forEach((file) => {
    const b = fs.readFileSync(file);
    const arrayBuffer = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

    formats.forEach((format) => {
      const formatter = new Formatter(new Parser(arrayBuffer).parse());
      const outputFile = file.replace(path.extname(file), `.${format}`);

      fs.writeFileSync(outputFile, (formatter as any)[`to${format.toUpperCase()}`](true));
      console.info('Generated:', outputFile);
    });
  });
};

parseArgs();
