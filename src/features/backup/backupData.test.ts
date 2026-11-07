import { describe, expect, it } from 'vitest'

import type { Category, Profile, Transaction } from '../../lib/supabase/types'
import { buildTransactionsCsv } from './backupData'

const category: Category = {
  id: 'cat-1',
  household_id: 'household-1',
  name: 'Mercado',
  kind: 'expense',
  is_savings: false,
  archived_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  created_by: 'user-1',
}

const profile: Profile = {
  id: 'user-1',
  household_id: 'household-1',
  display_name: 'Eduardo',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx-1',
    household_id: 'household-1',
    category_id: 'cat-1',
    kind: 'expense',
    amount_cents: 2590,
    occurred_on: '2024-03-10',
    competence_month: '2024-03-01',
    payment_method: 'pix',
    description: 'Compras',
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

describe('buildTransactionsCsv', () => {
  const categoriesById = new Map([[category.id, category]])
  const profilesById = new Map([[profile.id, profile]])

  it('builds a header and one row per transaction', () => {
    const csv = buildTransactionsCsv(
      [makeTransaction({})],
      categoriesById,
      profilesById,
    )
    const [header, row] = csv.split('\r\n')

    expect(header).toBe(
      'Data,Tipo,Categoria,Descrição,Valor (R$),Forma de pagamento,Parcela,Conta do mês,Lançado por,Excluído em',
    )
    expect(row).toBe(
      '2024-03-10,Gasto,Mercado,Compras,"25,90",Pix,,não,Eduardo,',
    )
  })

  it('shows the installment fraction when present', () => {
    const csv = buildTransactionsCsv(
      [makeTransaction({ installment_number: 1, installment_total: 3 })],
      categoriesById,
      profilesById,
    )
    expect(csv).toContain('1/3')
  })

  it('marks recurring-bill payments and deleted transactions', () => {
    const csv = buildTransactionsCsv(
      [
        makeTransaction({
          recurring_bill_id: 'bill-1',
          deleted_at: '2024-03-15T00:00:00Z',
        }),
      ],
      categoriesById,
      profilesById,
    )
    expect(csv).toContain('sim')
    expect(csv).toContain('2024-03-15T00:00:00Z')
  })
})
