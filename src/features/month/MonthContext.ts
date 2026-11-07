import { createContext } from 'react'

export interface MonthContextValue {
  /** Primeiro dia do mês selecionado, ISO `YYYY-MM-DD`. */
  competenceMonth: string
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
}

export const MonthContext = createContext<MonthContextValue | null>(null)
