import type { Transaction } from '../../lib/supabase/types'

export interface TransactionDayGroup {
  occurredOn: string
  items: Transaction[]
}

/** Agrupa lançamentos por dia, do mais recente para o mais antigo. */
export function groupTransactionsByDay(
  transactions: Transaction[],
): TransactionDayGroup[] {
  const byDay = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    const items = byDay.get(transaction.occurred_on) ?? []
    items.push(transaction)
    byDay.set(transaction.occurred_on, items)
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([occurredOn, items]) => ({ occurredOn, items }))
}
