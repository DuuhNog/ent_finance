import { useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../lib/supabase/client'

export function useLogout() {
  const queryClient = useQueryClient()

  return async function logout() {
    await supabase.auth.signOut()
    // Nunca deixar dados da casa anterior disponíveis para o próximo login.
    queryClient.clear()
  }
}
