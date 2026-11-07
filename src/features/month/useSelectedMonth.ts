import { useContext } from 'react'

import { MonthContext } from './MonthContext'
import type { MonthContextValue } from './MonthContext'

export function useSelectedMonth(): MonthContextValue {
  const context = useContext(MonthContext)

  if (context === null) {
    throw new Error('useSelectedMonth precisa estar dentro de <MonthProvider>')
  }

  return context
}
