import { Button } from '@single-ui/react'
import { useMemo, useState } from 'react'

import { useCategories } from '../categories/useCategories'
import { useSelectedMonth } from '../month/useSelectedMonth'
import { useMonthSummary } from '../summary/useMonthSummary'
import { GoalCard } from './GoalCard'
import { GoalFormModal } from './GoalFormModal'
import { useGoals } from './useGoals'

export function GoalsPage() {
  const { competenceMonth } = useSelectedMonth()
  const goalsQuery = useGoals()
  const summaryQuery = useMonthSummary(competenceMonth)
  const categoriesQuery = useCategories()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const categoriesById = useMemo(
    () =>
      new Map(
        (categoriesQuery.data ?? []).map((category) => [category.id, category]),
      ),
    [categoriesQuery.data],
  )

  function currentCentsFor(
    goalKind: string,
    categoryId: string | null,
  ): number {
    if (!summaryQuery.data) return 0
    if (goalKind === 'credit_card_limit')
      return summaryQuery.data.creditCardTotalCents
    if (goalKind === 'monthly_savings') return summaryQuery.data.savedCents
    return summaryQuery.data.expensesByCategory[categoryId ?? ''] ?? 0
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Suas metas</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsFormOpen(true)
          }}
        >
          Nova meta
        </Button>
      </div>

      {goalsQuery.isPending ? (
        <p className="text-slate-600">Carregando...</p>
      ) : null}
      {goalsQuery.isError ? (
        <p className="text-red-600">Não foi possível carregar as metas.</p>
      ) : null}
      {goalsQuery.data?.length === 0 ? (
        <p className="text-slate-500">
          Uma boa primeira meta: um limite mensal para o cartão de crédito.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {(goalsQuery.data ?? []).map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            category={categoriesById.get(goal.category_id ?? '')}
            currentCents={currentCentsFor(goal.kind, goal.category_id)}
          />
        ))}
      </div>

      {isFormOpen ? (
        <GoalFormModal
          onClose={() => {
            setIsFormOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
