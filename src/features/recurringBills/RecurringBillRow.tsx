import { Button, Input } from '@single-ui/react'
import { useState } from 'react'

import { dueDateForCompetenceMonth } from '../../lib/competenceMonth'
import { estimateVariableBillAmount, getBillStatus } from '../../lib/finance'
import type { BillPayment } from '../../lib/finance'
import { daysBetweenIsoDates, todayIsoDate } from '../../lib/isoDate'
import { formatMoney, formatMoneyInput, parseMoney } from '../../lib/money'
import { PAYMENT_METHODS } from '../../lib/supabase/types'
import type {
  Category,
  RecurringBill,
  Transaction,
} from '../../lib/supabase/types'
import { useSoftDeleteTransaction } from '../transactions/useTransactions'
import { usePayRecurringBill } from './useRecurringBills'

const STATUS_LABELS = {
  paid: { text: 'paga', className: 'bg-emerald-100 text-emerald-800' },
  overdue: { text: 'atrasada', className: 'bg-rose-100 text-rose-800' },
  due_soon: {
    text: 'vence em breve',
    className: 'bg-amber-100 text-amber-800',
  },
} as const

function paymentMethodLabel(value: string): string {
  return (
    PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value
  )
}

export function RecurringBillRow({
  bill,
  category,
  competenceMonth,
  payment,
  history,
}: {
  bill: RecurringBill
  category: Category | undefined
  competenceMonth: string
  payment: Transaction | undefined
  history: BillPayment[]
}) {
  const dueDate = dueDateForCompetenceMonth(competenceMonth, bill.due_day)
  const status = getBillStatus({
    dueDate,
    paidOn: payment?.occurred_on ?? null,
    today: todayIsoDate(),
  })
  const daysUntilDue = daysBetweenIsoDates(todayIsoDate(), dueDate)

  const suggestedAmountCents = bill.is_variable
    ? estimateVariableBillAmount(history, competenceMonth, bill.amount_cents)
    : bill.amount_cents

  const [amountInput, setAmountInput] = useState(
    formatMoneyInput(suggestedAmountCents),
  )
  const [amountError, setAmountError] = useState<string | null>(null)
  const [undoError, setUndoError] = useState<string | null>(null)
  const payBill = usePayRecurringBill()
  const undoPayment = useSoftDeleteTransaction()

  function handlePay() {
    const amountCents = parseMoney(amountInput)
    if (amountCents === null) {
      setAmountError('Informe um valor maior que zero.')
      return
    }
    setAmountError(null)
    payBill.mutate(
      { billId: bill.id, month: competenceMonth, amountCents },
      {
        onError: () => {
          setAmountError('Não foi possível pagar a conta. Tente de novo.')
        },
      },
    )
  }

  return (
    <li className="border-b border-slate-100 py-3 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">
            {bill.name}
            {status !== 'upcoming' ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[status].className}`}
              >
                {status === 'due_soon'
                  ? daysUntilDue === 0
                    ? 'vence hoje'
                    : `vence em ${String(daysUntilDue)} dia(s)`
                  : STATUS_LABELS[status].text}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-slate-500">
            dia {bill.due_day}, {category?.name ?? 'sem categoria'},{' '}
            {paymentMethodLabel(bill.payment_method)}
            {bill.is_variable ? ', valor muda todo mês' : ''}
          </p>
        </div>

        {status === 'paid' && payment ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {formatMoney(payment.amount_cents)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                loading={undoPayment.isPending}
                onClick={() => {
                  setUndoError(null)
                  undoPayment.mutate(payment.id, {
                    onError: () => {
                      setUndoError('Não foi possível desfazer. Tente de novo.')
                    },
                  })
                }}
              >
                Desfazer
              </Button>
            </div>
            {undoError ? (
              <p className="text-xs text-red-600">{undoError}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Input
              aria-label={`Valor de ${bill.name}`}
              inputMode="decimal"
              placeholder={bill.is_variable ? 'valor da conta' : undefined}
              value={amountInput}
              onChange={setAmountInput}
              error={amountError ?? undefined}
              className="w-28"
            />
            <Button
              variant="primary"
              size="sm"
              loading={payBill.isPending}
              onClick={handlePay}
            >
              Paguei
            </Button>
          </div>
        )}
      </div>
    </li>
  )
}
