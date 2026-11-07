import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../lib/supabase/client'
import type { CategoryKind } from '../../lib/supabase/types'
import { useHouseholdId } from '../household/useHouseholdId'

export function useCategories(kind?: CategoryKind) {
  const householdId = useHouseholdId()

  return useQuery({
    queryKey: ['categories', householdId, kind],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .eq('household_id', householdId as string)
        .is('archived_at', null)
        .order('name')

      if (kind) {
        query = query.eq('kind', kind)
      }

      const { data, error } = await query

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}

export function useCreateCategory() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      kind,
    }: {
      name: string
      kind: CategoryKind
    }) => {
      const { error } = await supabase
        .from('categories')
        .insert({ household_id: householdId as string, name, kind })

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['categories', householdId],
      })
    },
  })
}

export function useRenameCategory() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['categories', householdId],
      })
    },
  })
}

export function useArchiveCategory() {
  const householdId = useHouseholdId()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['categories', householdId],
      })
    },
  })
}
