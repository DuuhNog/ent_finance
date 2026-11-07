import { useQuery } from '@tanstack/react-query'

import { supabase } from '../../lib/supabase/client'

export function useHousehold(householdId: string | undefined) {
  return useQuery({
    queryKey: ['household', householdId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId as string)
        .single()

      if (error) throw error

      return data
    },
    enabled: householdId !== undefined,
  })
}
