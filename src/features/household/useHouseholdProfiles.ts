import { useQuery } from '@tanstack/react-query'

import { supabase } from '../../lib/supabase/client'
import { useHouseholdId } from './useHouseholdId'

/** Perfis de todos os membros da casa, para mostrar "quem lançou". */
export function useHouseholdProfiles() {
  const householdId = useHouseholdId()

  return useQuery({
    queryKey: ['household-profiles', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', householdId as string)

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}
