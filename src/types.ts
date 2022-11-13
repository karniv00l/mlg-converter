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

type LoggerFieldDisplayStyle = 'Float' | 'Hex' | 'bits' | 'Date' | 'On/Off' | 'Yes/No' | 'High/Low' | 'Active/Inactive' | 'True/False';

interface LoggerField {
  type: LoggerFieldType,
  name: string,
  units: string,
  displayStyle: LoggerFieldDisplayStyle,
}

interface LoggerFieldScalar extends LoggerField {
  scale: number,
  transform: number,
  digits: number,
  category: string,
}

type LoggerBitFieldStyle = 'Float' | 'Hex' | 'bits' | 'On/Off' | 'Yes/No' | 'High/Low' | 'Active/Inactive' | 'True/False';

interface LoggerFieldBit extends LoggerField {
  bitFieldStyle: LoggerBitFieldStyle,
  bitFieldNamesIndex: number,
  bits: number,
  unused: string,
  category: string,
}

interface DataBlock {
  [name: string]: string | number | undefined,
  type: BlockType,
  timestamp: number,
  message?: string, // marker block only
}

interface Record extends DataBlock {
  [name: string]: string | number | undefined,
}

interface RawResult {
  fileFormat: string,
  formatVersion: number,
  timestamp: Date,
  infoDataStart: number,
  dataBeginIndex: number,
  recordLength: number,
  numLoggerFields: number,
  loggerFields: (LoggerFieldScalar | LoggerFieldBit)[],
  bitFieldNames: string,
  infoData: string,
  dataBlocks: DataBlock[],
}

interface Field {
  name: string,
  units: string,
  displayStyle: LoggerFieldDisplayStyle | LoggerBitFieldStyle,
  scale?: number,
  transform?: number,
  digits?: number,
  category: string,
}

interface Result {
  fileFormat: string,
  formatVersion: number,
  timestamp: Date,
  info: string,
  bitFieldNames: string,
  fields: Field[]
  records: Record[],
}

type OnProgress = (percent: number) => void;

export type {
  NumberType,
  LoggerFieldType,
  BlockType,
  LoggerFieldDisplayStyle,
  LoggerFieldScalar,
  LoggerBitFieldStyle,
  LoggerFieldBit,
  DataBlock,
  RawResult,
  Field,
  Record,
  Result,
  OnProgress,
};
