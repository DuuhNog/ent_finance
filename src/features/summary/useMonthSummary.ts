import { useMemo } from 'react'

import { dueDateForCompetenceMonth } from '../../lib/competenceMonth'
import {
  buildMonthSummary,
  estimateVariableBillAmount,
  getBillStatus,
} from '../../lib/finance'
import { todayIsoDate } from '../../lib/isoDate'
import type { PaymentMethod } from '../../lib/supabase/types'
import { useCategories } from '../categories/useCategories'
import {
  useRecurringBillHistory,
  useRecurringBillPayments,
  useRecurringBills,
} from '../recurringBills/useRecurringBills'
import { useTransactions } from '../transactions/useTransactions'

/**
 * Resumo do mês selecionado: entradas, gastos, guardado, saldo, total no
 * cartão, por categoria, por forma de pagamento, e contas pendentes com
 * valor estimado + saldo previsto.
 */
export function useMonthSummary(competenceMonth: string) {
  const transactionsQuery = useTransactions(competenceMonth)
  const categoriesQuery = useCategories()
  const billsQuery = useRecurringBills()
  const paymentsQuery = useRecurringBillPayments(competenceMonth)
  const historyQuery = useRecurringBillHistory()

  const isPending =
    transactionsQuery.isPending ||
    categoriesQuery.isPending ||
    billsQuery.isPending ||
    paymentsQuery.isPending ||
    historyQuery.isPending
  const isError =
    transactionsQuery.isError ||
    categoriesQuery.isError ||
    billsQuery.isError ||
    paymentsQuery.isError ||
    historyQuery.isError

  const summary = useMemo(() => {
    if (
      !transactionsQuery.data ||
      !categoriesQuery.data ||
      !billsQuery.data ||
      !paymentsQuery.data ||
      !historyQuery.data
    ) {
      return undefined
    }

    const categoriesById = new Map(
      categoriesQuery.data.map((category) => [category.id, category]),
    )
    const paidBillIds = new Set(
      paymentsQuery.data
        .map((payment) => payment.recurring_bill_id)
        .filter((id): id is string => id !== null),
    )
    const today = todayIsoDate()

    const pendingBills = billsQuery.data
      .filter((bill) => !paidBillIds.has(bill.id))
      .filter((bill) => {
        const status = getBillStatus({
          dueDate: dueDateForCompetenceMonth(competenceMonth, bill.due_day),
          paidOn: null,
          today,
        })
        return (
          status === 'overdue' || status === 'due_soon' || status === 'upcoming'
        )
      })
      .map((bill) => {
        const payments = historyQuery.data
          .filter((payment) => payment.recurring_bill_id === bill.id)
          .map((payment) => ({
            competenceMonth: payment.competence_month as string,
            amountCents: payment.amount_cents,
          }))
        const estimatedAmountCents = bill.is_variable
          ? estimateVariableBillAmount(
              payments,
              competenceMonth,
              bill.amount_cents,
            )
          : bill.amount_cents

        return { recurringBillId: bill.id, estimatedAmountCents }
      })

    return buildMonthSummary({
      transactions: transactionsQuery.data.map((transaction) => {
        const category = categoriesById.get(transaction.category_id)
        return {
          kind: transaction.kind as 'expense' | 'income',
          amountCents: transaction.amount_cents,
          paymentMethod: transaction.payment_method as PaymentMethod | null,
          categoryId: transaction.category_id,
          isSavingsCategory: category?.is_savings ?? false,
        }
      }),
      pendingBills,
    })
  }, [
    transactionsQuery.data,
    categoriesQuery.data,
    billsQuery.data,
    paymentsQuery.data,
    historyQuery.data,
    competenceMonth,
  ])

  return { data: summary, isPending, isError }
}
