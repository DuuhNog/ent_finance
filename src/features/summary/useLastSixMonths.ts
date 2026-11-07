import { useQuery } from '@tanstack/react-query'

import { lastCompetenceMonths } from '../../lib/competenceMonth'
import { supabase } from '../../lib/supabase/client'
import { useHouseholdId } from '../household/useHouseholdId'

export interface MonthTotal {
  competenceMonth: string
  totalCents: number
  creditCardCents: number
}

/** Total gasto (sem guardar) e parte no cartão, mês a mês, para o gráfico
 * dos últimos 6 meses (incluindo o mês selecionado). */
export function useLastSixMonths(competenceMonth: string) {
  const householdId = useHouseholdId()
  const months = lastCompetenceMonths(competenceMonth, 6)

  return useQuery({
    queryKey: ['last-six-months', householdId, competenceMonth],
    queryFn: async () => {
      const [categoriesResult, transactionsResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id, is_savings')
          .eq('household_id', householdId as string),
        supabase
          .from('transactions')
          .select(
            'competence_month, amount_cents, kind, payment_method, category_id',
          )
          .eq('household_id', householdId as string)
          .gte('competence_month', months[0])
          .lte('competence_month', months[months.length - 1] as string)
          .is('deleted_at', null),
      ])

      if (categoriesResult.error) throw categoriesResult.error
      if (transactionsResult.error) throw transactionsResult.error

      const savingsCategoryIds = new Set(
        categoriesResult.data
          .filter((category) => category.is_savings)
          .map((category) => category.id),
      )

      const totals = new Map<string, MonthTotal>(
        months.map((month) => [
          month,
          { competenceMonth: month, totalCents: 0, creditCardCents: 0 },
        ]),
      )

      for (const transaction of transactionsResult.data) {
        if (transaction.kind !== 'expense') continue
        if (savingsCategoryIds.has(transaction.category_id)) continue

        const monthTotal = totals.get(transaction.competence_month as string)
        if (!monthTotal) continue

        monthTotal.totalCents += transaction.amount_cents
        if (transaction.payment_method === 'credit_card') {
          monthTotal.creditCardCents += transaction.amount_cents
        }
      }

      return months.map((month) => totals.get(month) as MonthTotal)
    },
    enabled: householdId !== undefined,
  })
}
