"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
class Parser {
    constructor(buffer) {
        this.FORMAT_LENGTH = 6;
        this.LOGGER_FIELD_LENGTH = 55;
        this.FIELD_NAME_LENGTH = 34;
        this.FIELD_UNITS_LENGTH = 10;
        this.MARKER_MESSAGE_LENGTH = 50;
        this.buffer = buffer;
        this.bufferLength = buffer.length;
        this.dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);
        this.offset = 0;
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
    parseRaw() {
        this.parseHeader();
        this.parseDataBlocks();
        return this.result;
    }
    parse() {
        this.parseRaw();
        return {
            fileFormat: this.result.fileFormat,
            formatVersion: this.result.formatVersion,
            timestamp: this.result.timestamp,
            info: this.result.infoData,
            fields: this.result.loggerFields.map((field) => ({
                name: field.name,
                units: field.units,
                displayStyle: Parser.chooseDisplayStyle(field.displayStyle),
                scale: field.scale,
                transform: field.transform,
                digits: field.digits,
            })),
            records: this.result.dataBlocks.map((block) => {
                const temp = Object.assign({}, block);
                delete temp.blockType;
                delete temp.crc;
                return Object.assign({ type: Parser.chooseBlockType(block.blockType) }, temp);
            }),
        };
    }
    static chooseNumberType(fieldType) {
        const types = {
            0: ['uint', 8],
            1: ['int', 8],
            2: ['uint', 16],
            3: ['int', 16],
            4: ['uint', 32],
            5: ['int', 32],
            6: ['bigInt', 64],
            7: ['float', 32],
            10: ['uint', 8],
            11: ['uint', 16],
            12: ['uint', 32],
        };
        return types[fieldType];
    }
    static chooseDisplayStyle(style) {
        const styles = {
            0: 'Float',
            1: 'Hex',
            2: 'bits',
            3: 'Date',
            4: 'On/Off',
            5: 'Yes/No',
            6: 'High/Low',
            7: 'Active/Inactive',
        };
        return styles[style];
    }
    static chooseBlockType(type) {
        const types = {
            0: 'field',
            1: 'marker',
        };
        return types[type];
    }
    static clearString(val, stripQuotation = false) {
        let result = val.replace(/\x00/gu, '');
        if (stripQuotation === true) {
            result = result.replace(/"/g, '');
        }
        return result.trim();
    }
    static parseDate(timestamp) {
        return new Date(timestamp * 1000);
    }
    number(type, size) {
        const functionName = `get${type.charAt(0).toUpperCase()}${type.slice(1)}${size}`;
        const result = this.dataView[functionName](this.offset);
        this.offset += size / 8;
        return result;
    }
    string(length) {
        const result = new TextDecoder('utf8').decode(this.buffer.subarray(this.offset, this.offset + length));
        this.offset += length;
        return result;
    }
    jump(to) {
        this.offset = to;
    }
    validateFormat() {
        if (this.result.fileFormat !== 'MLVLG' || this.result.formatVersion !== 1) {
            throw new Error(`Format (${this.result.fileFormat}) with version (${this.result.formatVersion}) not supported.`);
        }
    }
    parseHeader() {
        this.result.fileFormat = Parser.clearString(this.string(this.FORMAT_LENGTH), true);
        this.result.formatVersion = this.number('int', 16);
        this.validateFormat();
        this.result.timestamp = Parser.parseDate(this.number('int', 32));
        this.result.infoDataStart = this.number('int', 16);
        this.result.dataBeginIndex = this.number('int', 32);
        this.result.recordLength = this.number('int', 16);
        this.result.numLoggerFields = this.number('int', 16);
        this.result.loggerFields = [];
        const loggerFieldsLength = this.offset
            + (this.result.numLoggerFields * this.LOGGER_FIELD_LENGTH);
        while (this.offset < loggerFieldsLength) {
            this.result.loggerFields.push({
                type: this.number('int', 8),
                name: Parser.clearString(this.string(this.FIELD_NAME_LENGTH)),
                units: Parser.clearString(this.string(this.FIELD_UNITS_LENGTH)),
                displayStyle: this.number('int', 8),
                scale: this.number('float', 32),
                transform: this.number('float', 32),
                digits: this.number('int', 8),
            });
        }
        this.result.bitFieldNames = this.string(this.result.infoDataStart - loggerFieldsLength - 1);
        this.jump(this.result.infoDataStart);
        this.result.infoData = Parser.clearString(this.string(this.result.dataBeginIndex - 1 - this.result.infoDataStart), true);
    }
    parseDataBlocks() {
        this.jump(this.result.dataBeginIndex);
        this.result.dataBlocks = [];
        while (this.offset < this.bufferLength) {
            const data = {};
            const blockType = this.number('int', 8);
            const header = {
                blockType,
                counter: this.number('int', 8),
                timestamp: this.number('uint', 16),
            };
            switch (blockType) {
                case 0:
                    this.result.loggerFields.forEach((field) => {
                        data[field.name] = this.number(...Parser.chooseNumberType(field.type));
                    });
                    this.result.dataBlocks.push(Object.assign(Object.assign(Object.assign({}, header), data), { crc: this.number('uint', 8) }));
                    break;
                case 1:
                    data.message = Parser.clearString(this.string(this.MARKER_MESSAGE_LENGTH));
                    this.result.dataBlocks.push(Object.assign(Object.assign({}, header), data));
                    break;
                default:
                    throw new Error('Unsupported Block Type');
            }
        }
    }
}
exports.Parser = Parser;
