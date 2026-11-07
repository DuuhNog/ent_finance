import { Button } from '@single-ui/react'
import { useMemo, useState } from 'react'

import { estimateVariableBillAmount } from '../../lib/finance'
import { formatMoney } from '../../lib/money'
import { useCategories } from '../categories/useCategories'
import { MonthSwitcher } from '../month/MonthSwitcher'
import { useSelectedMonth } from '../month/useSelectedMonth'
import { RecurringBillFormModal } from './RecurringBillFormModal'
import { RecurringBillRow } from './RecurringBillRow'
import {
  useRecurringBillHistory,
  useRecurringBillPayments,
  useRecurringBills,
} from './useRecurringBills'

export function RecurringBillsPage() {
  const { competenceMonth } = useSelectedMonth()
  const billsQuery = useRecurringBills()
  const paymentsQuery = useRecurringBillPayments(competenceMonth)
  const historyQuery = useRecurringBillHistory()
  const categoriesQuery = useCategories()
  const [isFormOpen, setIsFormOpen] = useState(false)

  const categoriesById = useMemo(
    () =>
      new Map(
        (categoriesQuery.data ?? []).map((category) => [category.id, category]),
      ),
    [categoriesQuery.data],
  )
  const paymentsByBillId = useMemo(
    () =>
      new Map(
        (paymentsQuery.data ?? [])
          .filter((payment) => payment.recurring_bill_id !== null)
          .map((payment) => [payment.recurring_bill_id as string, payment]),
      ),
    [paymentsQuery.data],
  )
  const historyByBillId = useMemo(() => {
    const map = new Map<
      string,
      { competenceMonth: string; amountCents: number }[]
    >()
    for (const payment of historyQuery.data ?? []) {
      if (payment.recurring_bill_id === null) continue
      const list = map.get(payment.recurring_bill_id) ?? []
      list.push({
        competenceMonth: payment.competence_month as string,
        amountCents: payment.amount_cents,
      })
      map.set(payment.recurring_bill_id, list)
    }
    return map
  }, [historyQuery.data])

  // Uma conta não existe antes do mês em que foi cadastrada — sem isso,
  // navegar para um mês anterior ao cadastro mostra a conta como "atrasada".
  const bills = (billsQuery.data ?? []).filter(
    (bill) => bill.start_month <= competenceMonth,
  )
  const paidCount = bills.filter((bill) => paymentsByBillId.has(bill.id)).length
  const paidTotalCents = bills.reduce(
    (sum, bill) => sum + (paymentsByBillId.get(bill.id)?.amount_cents ?? 0),
    0,
  )
  const pendingTotalCents = bills.reduce((sum, bill) => {
    if (paymentsByBillId.has(bill.id)) return sum
    const history = historyByBillId.get(bill.id) ?? []
    const estimatedAmountCents = bill.is_variable
      ? estimateVariableBillAmount(history, competenceMonth, bill.amount_cents)
      : bill.amount_cents
    return sum + estimatedAmountCents
  }, 0)

  return (
    <div className="flex flex-col gap-4">
      <MonthSwitcher />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {paidCount} de {bills.length} pagas. Pago:{' '}
          {formatMoney(paidTotalCents)}. Falta pagar:{' '}
          {formatMoney(pendingTotalCents)}.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsFormOpen(true)
          }}
        >
          Nova conta
        </Button>
      </div>

      {billsQuery.isPending ? (
        <p className="text-slate-600">Carregando...</p>
      ) : null}
      {billsQuery.isError ? (
        <p className="text-red-600">Não foi possível carregar as contas.</p>
      ) : null}
      {bills.length === 0 && billsQuery.isSuccess ? (
        <p className="text-slate-500">Nenhuma conta cadastrada ainda.</p>
      ) : null}

      <ul>
        {bills.map((bill) => (
          <RecurringBillRow
            // Inclui o mês na key: o valor sugerido/digitado é estado local
            // (useState) que não re-sincroniza sozinho ao trocar de mês via
            // MonthSwitcher — remontar o componente garante o valor certo.
            key={`${bill.id}-${competenceMonth}`}
            bill={bill}
            category={categoriesById.get(bill.category_id)}
            competenceMonth={competenceMonth}
            payment={paymentsByBillId.get(bill.id)}
            history={historyByBillId.get(bill.id) ?? []}
          />
        ))}
      </ul>

      <p className="text-xs text-slate-500">
        Ao marcar uma conta como paga, ela vira um lançamento do mês
        automaticamente. Contas pagas no cartão contam no limite do cartão.
      </p>

      {isFormOpen ? (
        <RecurringBillFormModal
          onClose={() => {
            setIsFormOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}
