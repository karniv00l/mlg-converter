"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Formatter = void 0;
class Formatter {
    constructor(input) {
        this.CSV_SEPARATOR = ';';
        this.MSL_SEPARATOR = '\t';
        this.LINE_SEPARATOR = '\n';
        this.RECORD_TYPE_FIELD = 'field';
        this.RECORD_TYPE_MARKER = 'marker';
        this.FIELD_DISPLAY_STYLE_FLOAT = 'Float';
        this.input = input;
        this.rows = [];
    }
    raw() {
        return this.input;
    }
    toJSON() {
        return JSON.stringify(this.input);
    }
    toCSV() {
        this.pushHeader(this.CSV_SEPARATOR, true);
        this.pushRecords(this.CSV_SEPARATOR, true);
        return this.joinRows();
    }
    toMSL() {
        this.input.info.split('\n')
            .forEach((line) => this.rows.push(Formatter.escape(line)));
        this.pushHeader(this.MSL_SEPARATOR, false);
        this.pushRecords(this.MSL_SEPARATOR, false);
        return this.joinRows();
    }
    joinRows() {
        return this.rows.join(this.LINE_SEPARATOR);
    }
    pushRow(list, separator) {
        this.rows.push(list.join(separator));
    }
    pushHeader(separator, escape = false) {
        this.pushRow(this.input.fields.map((field) => (escape ? Formatter.escape(field.name) : field.name)), separator);
        this.pushRow(this.input.fields.map((field) => (escape ? Formatter.escape(field.units) : field.units)), separator);
    }
    pushRecords(separator, stripMarkers = false) {
        this.input.records.forEach((record) => {
            const formatted = [];
            if (stripMarkers && record.type === this.RECORD_TYPE_MARKER) {
                return;
            }
            if (record.type === this.RECORD_TYPE_MARKER) {
                this.pushRow([record.message], separator);
                return;
            }
            this.input.fields.forEach((field) => {
                const rawValue = record[field.name];
                const value = (rawValue + field.transform) * field.scale;
                const withStyle = field.displayStyle === this.FIELD_DISPLAY_STYLE_FLOAT
                    ? value.toFixed(field.digits) : `${value}`;
                formatted.push(withStyle);
            });
            this.pushRow(formatted, separator);
        });
    }
    static escape(value) {
        return `"${value}"`;
    }
    static formats() {
        return [
            'csv',
            'msl',
            'json',
        ];
    }
}
exports.Formatter = Formatter;
