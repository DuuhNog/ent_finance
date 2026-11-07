/** Conversão simples e pura de linhas para CSV (RFC 4180): aspas duplas em
 * qualquer campo com vírgula, aspas ou quebra de linha. */

export interface CsvColumn<T> {
  header: string
  value: (row: T) => string
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns
    .map((column) => escapeCsvField(column.header))
    .join(',')
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvField(column.value(row))).join(','),
  )
  return [header, ...lines].join('\r\n')
}
