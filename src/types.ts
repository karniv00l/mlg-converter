type NumberType = 'int' | 'uint' | 'bigInt' | 'float';

enum LoggerFieldType {
  U08,
  S08,
  U16,
  S16,
  U32,
  S32,
  S64,
  F32,
  U08_BITFIELD,
  U16_BITFIELD,
  U32_BITFIELD,
}

type BlockType = 'field' | 'marker';

type LoggerFieldDisplayStyle = 'Float' | 'Hex' | 'bits' | 'Date' | 'On/Off' | 'Yes/No' | 'High/Low' | 'Active/Inactive';

interface LoggerField {
  type: LoggerFieldType,
  name: string,
  units: string,
  displayStyle: number,
}

interface LoggerFieldScalar extends LoggerField {
 scale: number,
 transform: number,
 digits: number,
}

// type LoggerBitFieldStyle = 'Float' | 'Hex' | 'bits' | 'On/Off' | 'Yes/No' | 'High/Low' | 'Active/Inactive';
// interface LoggerFieldBit extends LoggerField {
//  LoggerbitFieldStyle: number,
//  bitFieldNamesIndex: number,
//  bits: number,
// }

interface DataBlock {
  blockType: number,
  counter: number,
  timestamp: number,
  message?: string, // marker block only
  crc?: number, // not present in marker block
}

interface RawResult {
  fileFormat: string,
  formatVersion: number,
  timestamp: Date,
  infoDataStart: number,
  dataBeginIndex: number,
  recordLength: number,
  numLoggerFields: number,
  loggerFields: LoggerFieldScalar[], // | LoggerFieldBit[],
  bitFieldNames: string,
  infoData: string,
  dataBlocks: DataBlock[],
}

interface Field {
  name: string,
  units: string,
  displayStyle: LoggerFieldDisplayStyle,
  scale: number,
  transform: number,
  digits: number,
}

interface Record {
  [name: string]: string | number,
}

interface Result {
  fileFormat: string,
  formatVersion: number,
  timestamp: Date,
  info: string,
  fields: Field[]
  records: Record[],
}

export type {
  NumberType,
  LoggerFieldType,
  BlockType,
  LoggerFieldDisplayStyle,
  LoggerFieldScalar,
  DataBlock,
  RawResult,
  Field,
  Record,
  Result,
};
