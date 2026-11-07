import { formatMoneyInput } from '../../lib/money'
import { supabase } from '../../lib/supabase/client'
import { PAYMENT_METHODS } from '../../lib/supabase/types'
import type {
  Category,
  Goal,
  Household,
  Profile,
  RecurringBill,
  Transaction,
} from '../../lib/supabase/types'
import { toCsv } from '../../lib/csv'

export interface HouseholdBackup {
  exportedAt: string
  household: Household
  profiles: Profile[]
  categories: Category[]
  recurringBills: RecurringBill[]
  transactions: Transaction[]
  goals: Goal[]
}

/** Busca TUDO da casa, inclusive arquivado/excluído (soft delete) — um
 * backup precisa poder restaurar o estado completo, não só o visível. */
export async function fetchHouseholdBackup(
  householdId: string,
): Promise<HouseholdBackup> {
  const [household, profiles, categories, recurringBills, transactions, goals] =
    await Promise.all([
      supabase.from('households').select('*').eq('id', householdId).single(),
      supabase.from('profiles').select('*').eq('household_id', householdId),
      supabase.from('categories').select('*').eq('household_id', householdId),
      supabase
        .from('recurring_bills')
        .select('*')
        .eq('household_id', householdId),
      supabase.from('transactions').select('*').eq('household_id', householdId),
      supabase.from('goals').select('*').eq('household_id', householdId),
    ])

  for (const result of [
    household,
    profiles,
    categories,
    recurringBills,
    transactions,
    goals,
  ]) {
    if (result.error) throw result.error
  }

  return {
    exportedAt: new Date().toISOString(),
    household: household.data as Household,
    profiles: profiles.data as Profile[],
    categories: categories.data as Category[],
    recurringBills: recurringBills.data as RecurringBill[],
    transactions: transactions.data as Transaction[],
    goals: goals.data as Goal[],
  }
}

function paymentMethodLabel(value: string | null): string {
  if (value === null) return ''
  return (
    PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value
  )
}

export function buildTransactionsCsv(
  transactions: Transaction[],
  categoriesById: Map<string, Category>,
  profilesById: Map<string, Profile>,
): string {
  return toCsv(transactions, [
    { header: 'Data', value: (t) => t.occurred_on },
    {
      header: 'Tipo',
      value: (t) => (t.kind === 'income' ? 'Entrada' : 'Gasto'),
    },
    {
      header: 'Categoria',
      value: (t) => categoriesById.get(t.category_id)?.name ?? '',
    },
    { header: 'Descrição', value: (t) => t.description ?? '' },
    { header: 'Valor (R$)', value: (t) => formatMoneyInput(t.amount_cents) },
    {
      header: 'Forma de pagamento',
      value: (t) => paymentMethodLabel(t.payment_method),
    },
    {
      header: 'Parcela',
      value: (t) =>
        t.installment_number !== null
          ? `${String(t.installment_number)}/${String(t.installment_total)}`
          : '',
    },
    {
      header: 'Conta do mês',
      value: (t) => (t.recurring_bill_id !== null ? 'sim' : 'não'),
    },
    {
      header: 'Lançado por',
      value: (t) => profilesById.get(t.created_by)?.display_name ?? '',
    },
    { header: 'Excluído em', value: (t) => t.deleted_at ?? '' },
  ])
}
