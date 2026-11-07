import { Button, Input } from '@single-ui/react'
import { useState } from 'react'

import {
  goalProgressBarColorClass,
  goalProgressTextColorClass,
} from '../../lib/chartColors'
import { getGoalProgress } from '../../lib/finance'
import { formatMoney, formatMoneyInput, parseMoney } from '../../lib/money'
import type { Category, Goal } from '../../lib/supabase/types'
import { useArchiveGoal, useUpdateGoalAmount } from './useGoals'

function goalTitle(goal: Goal, category: Category | undefined): string {
  if (goal.kind === 'credit_card_limit') return 'Limite no cartão de crédito'
  if (goal.kind === 'monthly_savings') return 'Guardar todo mês'
  return `Limite para ${category?.name ?? 'categoria'}`
}

export function GoalCard({
  goal,
  category,
  currentCents,
}: {
  goal: Goal
  category: Category | undefined
  currentCents: number
}) {
  const inverse = goal.kind === 'monthly_savings'
  const progress = getGoalProgress(currentCents, goal.amount_cents, inverse)
  const [isEditing, setIsEditing] = useState(false)
  const [amountInput, setAmountInput] = useState(
    formatMoneyInput(goal.amount_cents),
  )
  const [amountError, setAmountError] = useState<string | null>(null)
  const updateAmount = useUpdateGoalAmount()
  const archiveGoal = useArchiveGoal()

  function handleSave() {
    const amountCents = parseMoney(amountInput)
    if (amountCents === null) {
      setAmountError('Informe um valor maior que zero.')
      return
    }
    updateAmount.mutate(
      { id: goal.id, amountCents },
      {
        onSuccess: () => {
          setIsEditing(false)
        },
      },
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">
          {goalTitle(goal, category)}
        </h3>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsEditing((value) => !value)
            }}
          >
            Editar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={archiveGoal.isPending}
            onClick={() => {
              archiveGoal.mutate(goal.id)
            }}
          >
            Remover
          </Button>
        </div>
      </div>

      <p className="mt-1 text-sm text-slate-600">
        {formatMoney(currentCents)} de {formatMoney(goal.amount_cents)}
        {goal.kind === 'monthly_savings' ? ' neste mês' : ' por mês'}
      </p>

      <div
        role="img"
        aria-label={`${String(Math.round(progress.percentage * 100))}% da meta`}
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full ${goalProgressBarColorClass(progress.level)}`}
          style={{
            width: `${String(Math.min(100, progress.percentage * 100))}%`,
          }}
        />
      </div>

      <p
        className={`mt-2 text-sm font-medium ${goalProgressTextColorClass(progress.level)}`}
      >
        {inverse
          ? currentCents >= goal.amount_cents
            ? 'Meta do mês cumprida.'
            : `Faltam ${formatMoney(goal.amount_cents - currentCents)} para a meta do mês.`
          : currentCents > goal.amount_cents
            ? `Passou ${formatMoney(currentCents - goal.amount_cents)} do limite.`
            : `Ainda cabem ${formatMoney(goal.amount_cents - currentCents)} até o limite.`}
      </p>

      {isEditing ? (
        <div className="mt-3 flex items-end gap-2">
          <Input
            label="Novo valor (R$)"
            aria-label="Novo valor (R$)"
            inputMode="decimal"
            value={amountInput}
            onChange={setAmountInput}
            error={amountError ?? undefined}
          />
          <Button
            variant="primary"
            size="sm"
            loading={updateAmount.isPending}
            onClick={handleSave}
          >
            Salvar
          </Button>
        </div>
      ) : null}
    </div>
  )
}
