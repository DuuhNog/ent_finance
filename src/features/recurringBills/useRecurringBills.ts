import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../lib/supabase/client'
import type { PaymentMethod } from '../../lib/supabase/types'
import { useHouseholdId } from '../household/useHouseholdId'
import { invalidateFinanceQueries } from '../transactions/invalidateFinanceQueries'

export function useRecurringBills() {
  const householdId = useHouseholdId()

  return useQuery({
    queryKey: ['recurring-bills', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_bills')
        .select('*')
        .eq('household_id', householdId as string)
        .is('archived_at', null)
        .order('due_day')

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}

/** Lançamentos ligados a contas recorrentes nesta competência, por `recurring_bill_id`. */
export function useRecurringBillPayments(competenceMonth: string) {
  const householdId = useHouseholdId()

  return useQuery({
    queryKey: ['recurring-bill-payments', householdId, competenceMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('household_id', householdId as string)
        .eq('competence_month', competenceMonth)
        .is('deleted_at', null)
        .not('recurring_bill_id', 'is', null)

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}

/** Todo o histórico de pagamentos de contas recorrentes, para estimar o
 * valor de contas variáveis (últimos 6 meses). */
export function useRecurringBillHistory() {
  const householdId = useHouseholdId()

  return useQuery({
    queryKey: ['recurring-bill-history', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('recurring_bill_id, competence_month, amount_cents')
        .eq('household_id', householdId as string)
        .is('deleted_at', null)
        .not('recurring_bill_id', 'is', null)
        .order('competence_month', { ascending: false })

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}

export function useCreateRecurringBill() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      name: string
      categoryId: string
      amountCents: number
      isVariable: boolean
      dueDay: number
      paymentMethod: PaymentMethod
    }) => {
      const { error } = await supabase.from('recurring_bills').insert({
        household_id: householdId as string,
        name: input.name,
        category_id: input.categoryId,
        amount_cents: input.amountCents,
        is_variable: input.isVariable,
        due_day: input.dueDay,
        payment_method: input.paymentMethod,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['recurring-bills', householdId],
      })
    },
  })
}

export function useArchiveRecurringBill() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recurring_bills')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['recurring-bills', householdId],
      })
    },
  })
}

export function usePayRecurringBill() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      billId: string
      month: string
      amountCents: number
    }) => {
      const { error } = await supabase.rpc('pay_recurring_bill', {
        bill_id: input.billId,
        month: input.month,
        amount_cents: input.amountCents,
      })

      if (error) throw error
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient, householdId)
    },
  })
}
