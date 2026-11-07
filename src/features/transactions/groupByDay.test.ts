import { describe, expect, it } from 'vitest'

import type { Transaction } from '../../lib/supabase/types'
import { groupTransactionsByDay } from './groupByDay'

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'id',
    household_id: 'household-1',
    category_id: 'category-1',
    kind: 'expense',
    amount_cents: 1000,
    occurred_on: '2024-03-10',
    competence_month: '2024-03-01',
    payment_method: 'pix',
    description: null,
    recurring_bill_id: null,
    installment_group_id: null,
    installment_number: null,
    installment_total: null,
    deleted_at: null,
    created_at: '2024-03-10T12:00:00Z',
    updated_at: '2024-03-10T12:00:00Z',
    created_by: 'user-1',
    ...overrides,
  }
}

describe('groupTransactionsByDay', () => {
  it('groups by occurred_on and sorts days from most to least recent', () => {
    const groups = groupTransactionsByDay([
      makeTransaction({ id: 'a', occurred_on: '2024-03-05' }),
      makeTransaction({ id: 'b', occurred_on: '2024-03-10' }),
      makeTransaction({ id: 'c', occurred_on: '2024-03-10' }),
    ])

    expect(groups.map((group) => group.occurredOn)).toEqual([
      '2024-03-10',
      '2024-03-05',
    ])
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['b', 'c'])
  })

  it('returns an empty array for no transactions', () => {
    expect(groupTransactionsByDay([])).toEqual([])
  })
})
