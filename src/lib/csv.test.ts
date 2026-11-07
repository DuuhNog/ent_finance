import { describe, expect, it } from 'vitest'

import { toCsv } from './csv'

interface Row {
  name: string
  note: string
}

const columns = [
  { header: 'Nome', value: (row: Row) => row.name },
  { header: 'Nota', value: (row: Row) => row.note },
]

describe('toCsv', () => {
  it('produces a header row and one row per item', () => {
    const csv = toCsv<Row>([{ name: 'Mercado', note: 'ok' }], columns)
    expect(csv).toBe('Nome,Nota\r\nMercado,ok')
  })

  it('quotes fields containing a comma', () => {
    const csv = toCsv<Row>([{ name: 'Mercado, Extra', note: 'ok' }], columns)
    expect(csv).toBe('Nome,Nota\r\n"Mercado, Extra",ok')
  })

  it('quotes and escapes fields containing double quotes', () => {
    const csv = toCsv<Row>([{ name: 'Diz "oi"', note: 'ok' }], columns)
    expect(csv).toBe('Nome,Nota\r\n"Diz ""oi""",ok')
  })

  it('quotes fields containing a newline', () => {
    const csv = toCsv<Row>([{ name: 'linha1\nlinha2', note: 'ok' }], columns)
    expect(csv).toBe('Nome,Nota\r\n"linha1\nlinha2",ok')
  })

  it('returns only the header for an empty list', () => {
    expect(toCsv<Row>([], columns)).toBe('Nome,Nota')
  })
})
