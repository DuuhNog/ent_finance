import { describe, expect, it } from 'vitest'

import { dateToIsoDate, daysBetweenIsoDates, isoDateToDate } from './isoDate'

describe('dateToIsoDate / isoDateToDate', () => {
  it('round-trips a local date without shifting days', () => {
    const date = new Date(2024, 2, 5) // 5 de março de 2024, meia-noite local
    expect(dateToIsoDate(date)).toBe('2024-03-05')
    expect(isoDateToDate('2024-03-05').getFullYear()).toBe(2024)
    expect(isoDateToDate('2024-03-05').getMonth()).toBe(2)
    expect(isoDateToDate('2024-03-05').getDate()).toBe(5)
  })

  it('pads single-digit months and days', () => {
    expect(dateToIsoDate(new Date(2024, 0, 1))).toBe('2024-01-01')
  })
})

describe('daysBetweenIsoDates', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetweenIsoDates('2024-03-10', '2024-03-10')).toBe(0)
  })

  it('returns a positive number when "to" is in the future', () => {
    expect(daysBetweenIsoDates('2024-03-10', '2024-03-15')).toBe(5)
  })

  it('returns a negative number when "to" is in the past', () => {
    expect(daysBetweenIsoDates('2024-03-10', '2024-03-05')).toBe(-5)
  })

  it('crosses month boundaries correctly', () => {
    expect(daysBetweenIsoDates('2024-02-28', '2024-03-01')).toBe(2) // 2024 é bissexto
  })
})
