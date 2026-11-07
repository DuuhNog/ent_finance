import type { Session } from '@supabase/supabase-js'
import { createContext } from 'react'

export interface AuthContextValue {
  session: Session | null
  /** `true` enquanto a sessão inicial ainda não foi carregada. */
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
