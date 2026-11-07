import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  formatMoney,
  formatMoneyInput,
  MAX_AMOUNT_CENTS,
  parseMoney,
} from './money'

describe('parseMoney', () => {
  it.each([
    ['25,90', 2590],
    ['1.041,66', 104166],
    ['R$ 1.041,66', 104166],
    ['r$ 1.041,66', 104166],
    ['0,29', 29],
    ['0,1', 10],
    ['1041', 104100],
    ['25.90', 2590],
    ['1.000', 100000],
    ['1.234.567', 123456700],
    ['10.000.000,00', MAX_AMOUNT_CENTS],
  ])('parseMoney(%s) === %i', (input, expected) => {
    expect(parseMoney(input)).toBe(expected)
  })

  it.each([
    [''],
    ['   '],
    ['-5'],
    ['abc'],
    ['1,234'],
    ['10.000.000,01'],
    ['0'],
    ['0,00'],
    ['1,2,3'],
    [',90'],
    ['1.2,34'],
    ['25,'],
    ['25,.5'],
    ['25,5.'],
    ['25.'],
    ['25.9000'],
    ['1234.567'],
    ['12.345.6'],
    ['99999999999999999999,00'],
  ])('parseMoney(%s) === null', (input) => {
    expect(parseMoney(input)).toBeNull()
  })

  it('property: parseMoney(formatMoneyInput(c)) === c for every valid c', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MAX_AMOUNT_CENTS }),
        (cents) => parseMoney(formatMoneyInput(cents)) === cents,
      ),
    )
  })
})

describe('formatMoney', () => {
  it('formats cents as BRL currency', () => {
    expect(formatMoney(104166)).toBe('R$ 1.041,66')
  })
})

describe('formatMoneyInput', () => {
  it('formats cents as editable pt-BR text, no currency symbol', () => {
    expect(formatMoneyInput(104166)).toBe('1.041,66')
  })
})
