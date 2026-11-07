import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../lib/supabase/client'
import type { GoalKind } from '../../lib/supabase/types'
import { useHouseholdId } from '../household/useHouseholdId'

export function useGoals() {
  const householdId = useHouseholdId()

  return useQuery({
    queryKey: ['goals', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('household_id', householdId as string)
        .is('archived_at', null)

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}

export interface NewGoalInput {
  kind: GoalKind
  amountCents: number
  categoryId: string | null
}

export function useCreateGoal() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: NewGoalInput) => {
      const { error } = await supabase.from('goals').insert({
        household_id: householdId as string,
        kind: input.kind,
        amount_cents: input.amountCents,
        category_id: input.categoryId,
      })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
    },
  })
}

export function useUpdateGoalAmount() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      amountCents,
    }: {
      id: string
      amountCents: number
    }) => {
      const { error } = await supabase
        .from('goals')
        .update({ amount_cents: amountCents })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
    },
  })
}

export function useArchiveGoal() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['goals', householdId] })
    },
  })
}
