import { describe, expect, it } from 'vitest'

import {
  dueDateForCompetenceMonth,
  formatCompetenceMonthLong,
  formatCompetenceMonthShort,
  lastCompetenceMonths,
  shiftCompetenceMonth,
} from './competenceMonth'

describe('shiftCompetenceMonth', () => {
  it('moves forward within the same year', () => {
    expect(shiftCompetenceMonth('2024-03-01', 1)).toBe('2024-04-01')
  })

  it('moves backward within the same year', () => {
    expect(shiftCompetenceMonth('2024-03-01', -1)).toBe('2024-02-01')
  })

  it('crosses the turn of the year forward', () => {
    expect(shiftCompetenceMonth('2024-12-01', 1)).toBe('2025-01-01')
  })

  it('crosses the turn of the year backward', () => {
    expect(shiftCompetenceMonth('2024-01-01', -1)).toBe('2023-12-01')
  })

  it('handles large deltas', () => {
    expect(shiftCompetenceMonth('2024-01-01', 13)).toBe('2025-02-01')
    expect(shiftCompetenceMonth('2024-01-01', -13)).toBe('2022-12-01')
  })
})

describe('lastCompetenceMonths', () => {
  it('returns the last N months ending at the given month, ascending', () => {
    expect(lastCompetenceMonths('2024-03-01', 6)).toEqual([
      '2023-10-01',
      '2023-11-01',
      '2023-12-01',
      '2024-01-01',
      '2024-02-01',
      '2024-03-01',
    ])
  })
})

describe('dueDateForCompetenceMonth', () => {
  it('uses the due day when it exists in the month', () => {
    expect(dueDateForCompetenceMonth('2024-03-01', 15)).toBe('2024-03-15')
  })

  it('clamps to the last day of a shorter month', () => {
    expect(dueDateForCompetenceMonth('2024-02-01', 31)).toBe('2024-02-29') // bissexto
    expect(dueDateForCompetenceMonth('2023-02-01', 31)).toBe('2023-02-28')
  })
})

describe('formatCompetenceMonthShort', () => {
  it('abbreviates the month in pt-BR', () => {
    expect(formatCompetenceMonthShort('2024-03-01')).toBe('mar')
    expect(formatCompetenceMonthShort('2024-12-01')).toBe('dez')
  })
})

describe('formatCompetenceMonthLong', () => {
  it('formats month and year, capitalized', () => {
    expect(formatCompetenceMonthLong('2024-03-01')).toBe('Março de 2024')
  })
})
