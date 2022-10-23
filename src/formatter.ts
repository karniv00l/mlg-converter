import { Result } from './types';

export class Formatter {
  CSV_SEPARATOR: string;
  MSL_SEPARATOR: string;
  LINE_SEPARATOR: string;
  RECORD_TYPE_FIELD: string;
  RECORD_TYPE_MARKER: string;
  FIELD_DISPLAY_STYLE_FLOAT: string;
  input: Result;
  rows: string[];

  constructor(input: Result) {
    this.CSV_SEPARATOR = ';';
    this.MSL_SEPARATOR = '\t';
    this.LINE_SEPARATOR = '\n';
    this.RECORD_TYPE_FIELD = 'field';
    this.RECORD_TYPE_MARKER = 'marker';
    this.FIELD_DISPLAY_STYLE_FLOAT = 'Float';

    this.input = input;
    this.rows = [];
  }

  public raw(): Result {
    return this.input;
  }

  public toJSON(): string {
    return JSON.stringify(this.input);
  }

  public toCSV(): string {
    this.pushHeader(this.CSV_SEPARATOR, true);
    this.pushRecords(this.CSV_SEPARATOR, true);

    return this.joinRows();
  }

  public toMSL(): string {
    this.input.info.split('\n')
      .forEach((line) => this.rows.push(Formatter.escape(line)));

    this.pushHeader(this.MSL_SEPARATOR, false);
    this.pushRecords(this.MSL_SEPARATOR, false);

    return this.joinRows();
  }

  public static formats() {
    return [
      'csv',
      'msl',
      'json',
    ];
  }

  private joinRows() {
    return this.rows.join(this.LINE_SEPARATOR);
  }

  private pushRow(list: (string | number)[], separator: string) {
    this.rows.push(list.join(separator));
  }

  private pushHeader(separator: string, escape = false) {
    this.pushRow(
      this.input.fields.map((field) => (
        escape ? Formatter.escape(field.name) : field.name
      )),
      separator,
    );
    this.pushRow(
      this.input.fields.map((field) => (
        escape ? Formatter.escape(field.units) : field.units
      )),
      separator,
    );
  }

  private pushRecords(separator: string, stripMarkers = false) {
    this.input.records.forEach((record) => {
      const formatted: string[] = [];

      if (stripMarkers && record.type === this.RECORD_TYPE_MARKER) {
        return;
      }

      if (record.type === this.RECORD_TYPE_MARKER) {
        this.pushRow([record.message as string], separator);

        return;
      }

      this.input.fields.forEach((field) => {
        const rawValue = record[field.name];
        const value = ((rawValue as number) + field.transform) * field.scale;
        const withStyle = field.displayStyle === this.FIELD_DISPLAY_STYLE_FLOAT
          ? value.toFixed(field.digits) : `${value}`;

        formatted.push(withStyle);
      });

      this.pushRow(formatted, separator);
    });
  }

  private static escape(value: number | string) {
    return `"${value}"`;
  }
}
