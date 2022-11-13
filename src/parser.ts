import {
  BlockType,
  LoggerFieldDisplayStyle,
  LoggerFieldType,
  NumberType,
  RawResult,
  Result,
  OnProgress,
  LoggerFieldScalar,
  LoggerBitFieldStyle,
} from './types';

export class FormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FormatError';
  }
}

export enum Versions {
  v1 = 1,
  v2 = 2,
}

export class Parser {
  FORMAT_LENGTH = 6;
  FIELD_NAME_LENGTH = 34;
  FIELD_UNITS_LENGTH = 10;
  FIELD_CATEGORY_LENGTH = 34;
  FIELD_UNUSED_LENGTH = 3;
  MARKER_MESSAGE_LENGTH = 50;

  supportedVersions = [Versions.v1, Versions.v2];

  buffer: ArrayBuffer;
  bufferLength: number;
  loggerFieldLength: number;
  dataView: DataView;
  offset: number;
  progress: number;
  result: RawResult;
  onProgress?: OnProgress;

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer;
    this.bufferLength = buffer.byteLength;
    this.loggerFieldLength = 0;
    this.dataView = new DataView(buffer, undefined, this.bufferLength);
    this.offset = 0;
    this.progress = 0;
    this.result = {
      fileFormat: '',
      formatVersion: 0,
      timestamp: new Date(),
      infoDataStart: 0,
      dataBeginIndex: 0,
      recordLength: 0,
      numLoggerFields: 0,
      loggerFields: [],
      bitFieldNames: '',
      infoData: '',
      dataBlocks: [],
    };
  }

  public parse(onProgress?: OnProgress): Result {
    if (onProgress) {
      this.onProgress = onProgress;
    }
    this.parseRaw();
    this.reportProgress();

    return {
      fileFormat: this.result.fileFormat,
      formatVersion: this.result.formatVersion,
      timestamp: this.result.timestamp,
      info: this.result.infoData,
      bitFieldNames: this.result.bitFieldNames,
      fields: this.result.loggerFields.map((field) => {
        if (field.type >= 10) {
          return {
            name: field.name,
            units: field.units,
            displayStyle: field.displayStyle,
            category: '',
          };
        }

        return {
          name: field.name,
          units: field.units,
          displayStyle: field.displayStyle,
          scale: (field as LoggerFieldScalar).scale,
          transform: (field as LoggerFieldScalar).transform,
          digits: (field as LoggerFieldScalar).digits,
          category: (field as LoggerFieldScalar).category,
        };
      }),
      records: this.result.dataBlocks,
    };
  }

  public parseRaw(): RawResult {
    this.parseHeader();
    this.parseDataBlocks();

    return this.result;
  }

  private static chooseNumberType(fieldType: LoggerFieldType): [NumberType, number] {
    const types: { [type: number]: [NumberType, number] } = {
      // Logger Field – scalar
      0: ['uint', 8], // U08
      1: ['int', 8], // S08
      2: ['uint', 16], // U16
      3: ['int', 16], // S16
      4: ['uint', 32], // U32
      5: ['int', 32], // S32
      6: ['bigInt', 64], // S64
      7: ['float', 32], // F32

      // Logger Field - Bit
      10: ['uint', 8], // U08_BITFIELD
      11: ['uint', 16], // U16_BITFIELD
      12: ['uint', 32], // U32_BITFIELD
    };

    // NOTE: this should not happen (see: data/broken.mlg)
    if (!types[fieldType]) {
      return ['uint', 8];
    }

    return types[fieldType];
  }

  private static chooseDisplayStyle(style: number) {
    const styles: { [style: number]: LoggerFieldDisplayStyle } = {
      0: 'Float',
      1: 'Hex',
      2: 'bits',
      3: 'Date',
      4: 'On/Off',
      5: 'Yes/No',
      6: 'High/Low',
      7: 'Active/Inactive',
      8: 'True/False',
    };

    return styles[style];
  }

  private static chooseBitFieldStyle(style: number) {
    const styles: { [style: number]: LoggerBitFieldStyle } = {
      0: 'Float',
      1: 'Hex',
      2: 'bits',
      4: 'On/Off',
      5: 'Yes/No',
      6: 'High/Low',
      7: 'Active/Inactive',
      8: 'True/False',
    };

    return styles[style];
  }

  private static chooseBlockType(type: number) {
    const types: { [type: number]: BlockType } = {
      0: 'field',
      1: 'marker',
    };

    return types[type];
  }

  private static clearString(val: string, stripQuotation = false) {
    // eslint-disable-next-line no-control-regex
    let result = val.replace(/\x00/gu, '');

    if (stripQuotation === true) {
      result = result.replace(/"/g, '');
    }

    return result.trim();
  }

  private static parseDate(timestamp: number) {
    return new Date(timestamp * 1000);
  }

  private number(type: NumberType, size: number) {
    const functionName = `get${type.charAt(0).toUpperCase()}${type.slice(1)}${size}`;

    try {
      // dynamically call DataView function like: this.dataView.getInt8(8);
      const result = (this.dataView as any)[functionName](this.offset);
      this.advance(size / 8);

      return result;
    } catch (error) {
      // out of range
      return 0;
    }
  }

  private string(length: number) {
    const result = new TextDecoder('utf8').decode(
      this.buffer.slice(this.offset, this.offset + length),
    );
    this.advance(length);

    return result;
  }

  private advance(length: number) {
    this.offset += length;
  }

  private jump(to: number) {
    this.offset = to;
  }

  private reportProgress() {
    if (!this.onProgress) {
      return;
    }

    const percent = ~~(this.offset / this.bufferLength * 100);
    if (this.progress !== percent) {
      this.progress = percent;
      this.onProgress(percent);
    }
  }

  private validateFormat() {
    if (this.result.fileFormat !== 'MLVLG') {
      throw new FormatError(
        `Format (${this.result.fileFormat}) not supported.`,
      );
    }

    if (!this.supportedVersions.includes(this.result.formatVersion)) {
      throw new FormatError(
        `Version (${this.result.formatVersion}) not supported.`,
      );
    }
  }

  private isV2() {
    return this.result.formatVersion === Versions.v2;
  }

  private parseHeader() {
    this.result.fileFormat = Parser.clearString(
      this.string(this.FORMAT_LENGTH),
      true,
    );
    this.result.formatVersion = this.number('int', 16);
    this.validateFormat();
    this.loggerFieldLength = this.isV2() ? 89 : 55;
    this.result.timestamp = Parser.parseDate(this.number('int', 32));
    this.result.infoDataStart = this.isV2() ? this.number('int', 32) : this.number('int', 16);
    this.result.dataBeginIndex = this.number('int', 32);
    this.result.recordLength = this.number('int', 16);
    this.result.numLoggerFields = this.number('int', 16);
    this.result.loggerFields = [];

    const loggerFieldsLength = this.offset
      + (this.result.numLoggerFields * this.loggerFieldLength);

    while (this.offset < loggerFieldsLength) {
      const base = {
        type: this.number('int', 8),
        name: Parser.clearString(this.string(this.FIELD_NAME_LENGTH)),
        units: Parser.clearString(this.string(this.FIELD_UNITS_LENGTH)),
        displayStyle: Parser.chooseDisplayStyle(this.number('int', 8)),
      };

      if (base.type < 10) {
        this.result.loggerFields.push({
          ...base,
          scale: this.number('float', 32),
          transform: this.number('float', 32),
          digits: this.number('int', 8),
          category: this.isV2() ? Parser.clearString(this.string(this.FIELD_CATEGORY_LENGTH)) : '',
        });
      } else {
        this.result.loggerFields.push({
          ...base,
          bitFieldStyle: Parser.chooseBitFieldStyle(this.number('int', 8)),
          bitFieldNamesIndex: this.number('int', 32),
          bits: this.number('int', 8),
          unused: this.string(this.FIELD_UNUSED_LENGTH),
          category: this.isV2() ? Parser.clearString(this.string(this.FIELD_CATEGORY_LENGTH)) : '',
        });
      }
    }

    this.result.bitFieldNames = this.string(
      this.result.infoDataStart - loggerFieldsLength,
    );

    this.jump(this.result.infoDataStart);

    this.result.infoData = Parser.clearString(
      this.string(this.result.dataBeginIndex - 1 - this.result.infoDataStart),
      true,
    );
  }

  private parseDataBlocks() {
    this.jump(this.result.dataBeginIndex);

    this.result.dataBlocks = [];
    while (this.offset < this.bufferLength) {
      const data: { [fieldName: string]: number | string } = {};
      const blockType = this.number('int', 8);
      // skip counter parsing
      // counter: this.number('uint', 8),
      this.advance(1);
      const header = {
        type: Parser.chooseBlockType(blockType),
        timestamp: this.number('uint', 16),
      };

      this.reportProgress();

      switch (blockType) {
        case 0:
          this.result.loggerFields.forEach((field) => {
            data[field.name] = this.number(
              ...Parser.chooseNumberType(field.type),
            );
          });

          // skip crc parsing
          // crc: this.number('uint', 8),
          this.advance(1);

          this.result.dataBlocks.push({
            ...header,
            ...data,
          });
          break;

        case 1:
          data.message = Parser.clearString(this.string(this.MARKER_MESSAGE_LENGTH));
          this.result.dataBlocks.push({
            ...header,
          });
          break;

        default:
          throw new Error(`Unsupported Block Type (${blockType})`);
      }
    }
  }
}
