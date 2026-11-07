import type { QueryClient } from '@tanstack/react-query'

const FINANCE_QUERY_KEYS = [
  'transactions',
  'deleted-transactions',
  'recurring-bill-payments',
  'recurring-bill-history',
  'month-summary',
  'last-six-months',
]

/** Qualquer mutação em lançamentos pode afetar o resumo, o gráfico e o
 * status de contas recorrentes — invalida tudo que depende de transações. */
export function invalidateFinanceQueries(
  queryClient: QueryClient,
  householdId: string | undefined,
) {
  for (const key of FINANCE_QUERY_KEYS) {
    void queryClient.invalidateQueries({ queryKey: [key, householdId] })
  }
}
