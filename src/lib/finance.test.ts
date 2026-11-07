import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  buildMonthSummary,
  estimateVariableBillAmount,
  getBillStatus,
  getGoalProgress,
  getInstallmentDates,
  getResumedInstallmentDates,
  splitInstallments,
} from './finance'

describe('splitInstallments', () => {
  it('divides the total so the first installment absorbs the remainder', () => {
    expect(splitInstallments(1000, 3)).toEqual([334, 333, 333])
  })

  it('divides evenly when the total is a multiple of installments', () => {
    expect(splitInstallments(900, 3)).toEqual([300, 300, 300])
  })

  it('throws for a non-positive total', () => {
    expect(() => splitInstallments(0, 2)).toThrow(RangeError)
    expect(() => splitInstallments(-100, 2)).toThrow(RangeError)
  })

  it('throws for a non-safe-integer total', () => {
    expect(() => splitInstallments(1.5, 2)).toThrow(RangeError)
  })

  it('throws for installments outside 2..24', () => {
    expect(() => splitInstallments(1000, 1)).toThrow(RangeError)
    expect(() => splitInstallments(1000, 25)).toThrow(RangeError)
    expect(() => splitInstallments(1000, 2.5)).toThrow(RangeError)
  })

  it('property: sum equals total, no zero installment when total >= n, spread <= remainder', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1_000_000_000 }),
        fc.integer({ min: 2, max: 24 }),
        (total, n) => {
          const parts = splitInstallments(total, n)
          const sum = parts.reduce((acc, part) => acc + part, 0)
          const remainder = total % n

          expect(sum).toBe(total)
          expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(
            remainder,
          )
          if (total >= n) {
            expect(parts.every((part) => part > 0)).toBe(true)
          }
        },
      ),
    )
  })
})

describe('getInstallmentDates', () => {
  it('keeps the last day of february on a non-leap year', () => {
    expect(getInstallmentDates('2023-01-31', 3)).toEqual([
      '2023-01-31',
      '2023-02-28',
      '2023-03-31',
    ])
  })

  it('keeps the last day of february on a leap year', () => {
    expect(getInstallmentDates('2024-01-31', 3)).toEqual([
      '2024-01-31',
      '2024-02-29',
      '2024-03-31',
    ])
  })

  it('crosses the turn of the year', () => {
    expect(getInstallmentDates('2023-11-15', 4)).toEqual([
      '2023-11-15',
      '2023-12-15',
      '2024-01-15',
      '2024-02-15',
    ])
  })

  it('throws for installments outside 2..24', () => {
    expect(() => getInstallmentDates('2024-01-31', 1)).toThrow(RangeError)
    expect(() => getInstallmentDates('2024-01-31', 25)).toThrow(RangeError)
  })
})

describe('getResumedInstallmentDates', () => {
  it('returns one date per remaining installment, starting at the given date', () => {
    expect(getResumedInstallmentDates('2026-11-06', 5, 10)).toEqual([
      '2026-11-06',
      '2026-12-06',
      '2027-01-06',
      '2027-02-06',
      '2027-03-06',
      '2027-04-06',
    ])
  })

  it('returns a single date when resuming at the last installment', () => {
    expect(getResumedInstallmentDates('2026-11-04', 4, 4)).toEqual([
      '2026-11-04',
    ])
  })

  it('keeps the last day of february on a non-leap year', () => {
    expect(getResumedInstallmentDates('2023-01-31', 2, 3)).toEqual([
      '2023-01-31',
      '2023-02-28',
    ])
  })

  it('throws when totalInstallments is outside 2..24', () => {
    expect(() => getResumedInstallmentDates('2024-01-31', 2, 1)).toThrow(
      RangeError,
    )
    expect(() => getResumedInstallmentDates('2024-01-31', 2, 25)).toThrow(
      RangeError,
    )
  })

  it('throws when startInstallment is below 2 or above totalInstallments', () => {
    expect(() => getResumedInstallmentDates('2024-01-31', 1, 10)).toThrow(
      RangeError,
    )
    expect(() => getResumedInstallmentDates('2024-01-31', 11, 10)).toThrow(
      RangeError,
    )
    expect(() => getResumedInstallmentDates('2024-01-31', 2.5, 10)).toThrow(
      RangeError,
    )
  })

  it('property: date count always equals totalInstallments - startInstallment + 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 24 }),
        fc.integer({ min: 2, max: 24 }),
        (a, b) => {
          const total = Math.max(a, b)
          const start = Math.min(a, b)
          const dates = getResumedInstallmentDates('2026-05-15', start, total)
          expect(dates).toHaveLength(total - start + 1)
          expect(dates[0]).toBe('2026-05-15')
        },
      ),
    )
  })
})

describe('estimateVariableBillAmount', () => {
  it('uses the most recent payment within the last 6 months', () => {
    const result = estimateVariableBillAmount(
      [
        { competenceMonth: '2024-01-01', amountCents: 10000 },
        { competenceMonth: '2024-03-01', amountCents: 12000 },
      ],
      '2024-07-01',
      9000,
    )

    expect(result).toBe(12000)
  })

  it('keeps the most recent payment even when a later one is older', () => {
    const result = estimateVariableBillAmount(
      [
        { competenceMonth: '2024-01-01', amountCents: 10000 },
        { competenceMonth: '2024-03-01', amountCents: 12000 },
        { competenceMonth: '2024-02-01', amountCents: 11000 },
      ],
      '2024-07-01',
      9000,
    )

    expect(result).toBe(12000)
  })

  it('falls back to the registered amount when there is no payment in the window', () => {
    expect(estimateVariableBillAmount([], '2024-07-01', 9000)).toBe(9000)
  })

  it('ignores payments older than 6 months', () => {
    const result = estimateVariableBillAmount(
      [{ competenceMonth: '2023-12-01', amountCents: 12000 }],
      '2024-07-01',
      9000,
    )

    expect(result).toBe(9000)
  })

  it('ignores payments from the reference month or the future', () => {
    const result = estimateVariableBillAmount(
      [
        { competenceMonth: '2024-07-01', amountCents: 15000 },
        { competenceMonth: '2024-08-01', amountCents: 16000 },
      ],
      '2024-07-01',
      9000,
    )

    expect(result).toBe(9000)
  })
})

describe('getBillStatus', () => {
  it('is paid when paidOn is set, regardless of the due date', () => {
    expect(
      getBillStatus({
        dueDate: '2024-03-01',
        paidOn: '2024-03-01',
        today: '2024-03-20',
      }),
    ).toBe('paid')
  })

  it('is overdue when today is after the due date and unpaid', () => {
    expect(
      getBillStatus({
        dueDate: '2024-03-10',
        paidOn: null,
        today: '2024-03-11',
      }),
    ).toBe('overdue')
  })

  it('treats an unpaid past month as overdue', () => {
    expect(
      getBillStatus({
        dueDate: '2024-02-10',
        paidOn: null,
        today: '2024-03-20',
      }),
    ).toBe('overdue')
  })

  it('is due today when the due date is today', () => {
    expect(
      getBillStatus({
        dueDate: '2024-03-10',
        paidOn: null,
        today: '2024-03-10',
      }),
    ).toBe('due_soon')
  })

  it('is due soon within the 5-day boundary', () => {
    expect(
      getBillStatus({
        dueDate: '2024-03-15',
        paidOn: null,
        today: '2024-03-10',
      }),
    ).toBe('due_soon')
  })

  it('is upcoming just past the 5-day boundary', () => {
    expect(
      getBillStatus({
        dueDate: '2024-03-16',
        paidOn: null,
        today: '2024-03-10',
      }),
    ).toBe('upcoming')
  })
})

describe('buildMonthSummary', () => {
  it('computes income, expenses, savings, balance and breakdowns by hand', () => {
    const summary = buildMonthSummary({
      transactions: [
        {
          kind: 'income',
          amountCents: 500000,
          paymentMethod: null,
          categoryId: 'salary',
          isSavingsCategory: false,
        },
        {
          kind: 'expense',
          amountCents: 20000,
          paymentMethod: 'credit_card',
          categoryId: 'market',
          isSavingsCategory: false,
        },
        {
          kind: 'expense',
          amountCents: 10000,
          paymentMethod: 'pix',
          categoryId: 'leisure',
          isSavingsCategory: false,
        },
        {
          kind: 'expense',
          amountCents: 50000,
          paymentMethod: 'pix',
          categoryId: 'savings',
          isSavingsCategory: true,
        },
      ],
      pendingBills: [
        { recurringBillId: 'internet', estimatedAmountCents: 15000 },
      ],
    })

    expect(summary.incomeCents).toBe(500000)
    expect(summary.expenseCents).toBe(30000)
    expect(summary.savedCents).toBe(50000)
    expect(summary.balanceCents).toBe(500000 - 30000 - 50000)
    expect(summary.creditCardTotalCents).toBe(20000)
    expect(summary.expensesByCategory).toEqual({
      market: 20000,
      leisure: 10000,
    })
    expect(summary.expensesByCategory.savings).toBeUndefined()
    expect(summary.expensesByPaymentMethod).toEqual({
      credit_card: 20000,
      pix: 10000,
    })
    expect(summary.pendingBillsTotalCents).toBe(15000)
    expect(summary.projectedBalanceCents).toBe(summary.balanceCents - 15000)
  })

  it('does not count income under any payment method', () => {
    const summary = buildMonthSummary({
      transactions: [
        {
          kind: 'income',
          amountCents: 100000,
          paymentMethod: null,
          categoryId: 'salary',
          isSavingsCategory: false,
        },
      ],
      pendingBills: [],
    })

    expect(summary.expensesByPaymentMethod).toEqual({})
  })

  it('excludes a paid bill from pending bills (caller filters by status)', () => {
    const paidBillStatus = getBillStatus({
      dueDate: '2024-03-10',
      paidOn: '2024-03-05',
      today: '2024-03-20',
    })
    const pendingBills =
      paidBillStatus === 'paid'
        ? []
        : [{ recurringBillId: 'internet', estimatedAmountCents: 15000 }]

    const summary = buildMonthSummary({ transactions: [], pendingBills })

    expect(summary.pendingBillsTotalCents).toBe(0)
  })

  it('returns zeroed totals for an empty month', () => {
    const summary = buildMonthSummary({ transactions: [], pendingBills: [] })

    expect(summary).toEqual({
      incomeCents: 0,
      expenseCents: 0,
      savedCents: 0,
      balanceCents: 0,
      creditCardTotalCents: 0,
      expensesByCategory: {},
      expensesByPaymentMethod: {},
      pendingBillsTotalCents: 0,
      projectedBalanceCents: 0,
    })
  })
})

describe('getGoalProgress', () => {
  it.each([
    [0, 'good'],
    [79, 'good'],
    [80, 'good'],
    [81, 'warning'],
    [100, 'warning'],
    [101, 'critical'],
    [150, 'critical'],
  ])('limit goal at %i%% is %s', (percent, expectedLevel) => {
    const result = getGoalProgress(percent, 100, false)

    expect(result.level).toBe(expectedLevel)
    expect(result.percentage).toBeCloseTo(percent / 100)
  })

  it.each([
    [0, 'critical'],
    [49, 'critical'],
    [50, 'warning'],
    [99, 'warning'],
    [100, 'good'],
    [150, 'good'],
  ])('savings goal (inverse) at %i%% is %s', (percent, expectedLevel) => {
    const result = getGoalProgress(percent, 100, true)

    expect(result.level).toBe(expectedLevel)
  })

  it('returns 0% when the target is zero', () => {
    expect(getGoalProgress(500, 0, false).percentage).toBe(0)
  })
})
