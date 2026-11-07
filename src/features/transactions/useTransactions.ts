import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../lib/supabase/client'
import type { PaymentMethod } from '../../lib/supabase/types'
import { useHouseholdId } from '../household/useHouseholdId'
import { invalidateFinanceQueries } from './invalidateFinanceQueries'

export interface NewTransactionInput {
  categoryId: string
  kind: 'expense' | 'income'
  amountCents: number
  occurredOn: string
  paymentMethod: PaymentMethod | null
  description: string | null
}

export function useTransactions(competenceMonth: string) {
  const householdId = useHouseholdId()

  return useQuery({
    queryKey: ['transactions', householdId, competenceMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('household_id', householdId as string)
        .eq('competence_month', competenceMonth)
        .is('deleted_at', null)
        .order('occurred_on', { ascending: false })

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}

export function useDeletedTransactions() {
  const householdId = useHouseholdId()

  return useQuery({
    queryKey: ['deleted-transactions', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('household_id', householdId as string)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}

export function useCreateTransaction() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NewTransactionInput) => {
      const { error } = await supabase.from('transactions').insert({
        household_id: householdId as string,
        category_id: input.categoryId,
        kind: input.kind,
        amount_cents: input.amountCents,
        occurred_on: input.occurredOn,
        payment_method: input.paymentMethod,
        description: input.description,
      })

      if (error) throw error
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient, householdId)
    },
  })
}

export function useCreateInstallmentPurchase() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      categoryId: string
      totalAmountCents: number
      installments: number
      firstOccurredOn: string
      description: string | null
    }) => {
      const { error } = await supabase.rpc('create_installment_purchase', {
        p_household_id: householdId as string,
        p_category_id: input.categoryId,
        p_total_amount_cents: input.totalAmountCents,
        p_installments: input.installments,
        p_first_occurred_on: input.firstOccurredOn,
        p_description: input.description ?? undefined,
      })

      if (error) throw error
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient, householdId)
    },
  })
}

export function useResumeInstallmentPurchase() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      categoryId: string
      installmentAmountCents: number
      startInstallment: number
      totalInstallments: number
      firstOccurredOn: string
      description: string | null
    }) => {
      const { error } = await supabase.rpc('resume_installment_purchase', {
        p_household_id: householdId as string,
        p_category_id: input.categoryId,
        p_installment_amount_cents: input.installmentAmountCents,
        p_start_installment: input.startInstallment,
        p_total_installments: input.totalInstallments,
        p_first_occurred_on: input.firstOccurredOn,
        p_description: input.description ?? undefined,
      })

      if (error) throw error
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient, householdId)
    },
  })
}

export function useSoftDeleteTransaction() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient, householdId)
    },
  })
}

export function useRestoreTransaction() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: null })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      invalidateFinanceQueries(queryClient, householdId)
    },
  })
}
