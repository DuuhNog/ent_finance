import { useContext } from 'react'

import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  }

  return context
}
