import { Card } from '@single-ui/react'

import { getGoalProgress } from '../../lib/finance'
import { formatMoney } from '../../lib/money'
import { useGoals } from '../goals/useGoals'
import { MonthSwitcher } from '../month/MonthSwitcher'
import { useSelectedMonth } from '../month/useSelectedMonth'
import { CategoryBreakdown } from './CategoryBreakdown'
import { MonthlyChart } from './MonthlyChart'
import { PaymentMethodBreakdown } from './PaymentMethodBreakdown'
import { useLastSixMonths } from './useLastSixMonths'
import { useMonthSummary } from './useMonthSummary'

function progressBarColor(level: 'good' | 'warning' | 'critical'): string {
  if (level === 'good') return 'bg-emerald-600'
  if (level === 'warning') return 'bg-amber-500'
  return 'bg-rose-600'
}

export function SummaryPage() {
  const { competenceMonth } = useSelectedMonth()
  const summaryQuery = useMonthSummary(competenceMonth)
  const chartQuery = useLastSixMonths(competenceMonth)
  const goalsQuery = useGoals()

  const creditCardGoal = goalsQuery.data?.find(
    (goal) => goal.kind === 'credit_card_limit',
  )

  return (
    <div className="flex flex-col gap-4">
      <MonthSwitcher />

      {summaryQuery.isPending ? (
        <p className="text-slate-600">Carregando...</p>
      ) : null}
      {summaryQuery.isError ? (
        <p className="text-red-600">
          Não foi possível carregar o resumo do mês.
        </p>
      ) : null}

      {summaryQuery.data ? (
        <>
          <Card bordered>
            <p
              className={
                summaryQuery.data.balanceCents >= 0
                  ? 'text-2xl font-semibold text-emerald-700'
                  : 'text-2xl font-semibold text-rose-700'
              }
            >
              {summaryQuery.data.balanceCents >= 0 ? 'Sobrou ' : 'Faltou '}
              {formatMoney(Math.abs(summaryQuery.data.balanceCents))}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {summaryQuery.data.pendingBillsTotalCents > 0
                ? `Faltam ${formatMoney(summaryQuery.data.pendingBillsTotalCents)} em contas. Saldo previsto: ${formatMoney(summaryQuery.data.projectedBalanceCents)}.`
                : 'Todas as contas do mês estão pagas.'}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatTile
                label="Entrou"
                valueCents={summaryQuery.data.incomeCents}
              />
              <StatTile
                label="Gastou"
                valueCents={summaryQuery.data.expenseCents}
              />
              <StatTile
                label="Guardou"
                valueCents={summaryQuery.data.savedCents}
              />
              <StatTile
                label="Contas a pagar"
                valueCents={summaryQuery.data.pendingBillsTotalCents}
              />
            </div>
          </Card>

          {creditCardGoal ? (
            <Card title="Cartão de crédito" bordered>
              {(() => {
                const progress = getGoalProgress(
                  summaryQuery.data.creditCardTotalCents,
                  creditCardGoal.amount_cents,
                  false,
                )
                return (
                  <>
                    <p className="text-sm text-slate-600">
                      {formatMoney(summaryQuery.data.creditCardTotalCents)} de{' '}
                      {formatMoney(creditCardGoal.amount_cents)}
                    </p>
                    <div
                      role="img"
                      aria-label={`${String(Math.round(progress.percentage * 100))}% do limite`}
                      className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                    >
                      <div
                        className={`h-full ${progressBarColor(progress.level)}`}
                        style={{
                          width: `${String(Math.min(100, progress.percentage * 100))}%`,
                        }}
                      />
                    </div>
                  </>
                )
              })()}
            </Card>
          ) : null}

          <Card title="Onde foi o dinheiro" bordered>
            <CategoryBreakdown
              expensesByCategory={summaryQuery.data.expensesByCategory}
            />
          </Card>

          <Card title="Como você pagou" bordered>
            <PaymentMethodBreakdown
              expensesByPaymentMethod={
                summaryQuery.data.expensesByPaymentMethod
              }
            />
          </Card>
        </>
      ) : null}

      <Card title="Últimos 6 meses" bordered>
        {chartQuery.data ? <MonthlyChart months={chartQuery.data} /> : null}
      </Card>
    </div>
  )
}

function StatTile({
  label,
  valueCents,
}: {
  label: string
  valueCents: number
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{formatMoney(valueCents)}</p>
    </div>
  )
}
