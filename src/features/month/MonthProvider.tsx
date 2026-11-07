import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import {
  currentCompetenceMonth,
  shiftCompetenceMonth,
} from '../../lib/competenceMonth'
import { MonthContext } from './MonthContext'

export function MonthProvider({ children }: { children: ReactNode }) {
  const [competenceMonth, setCompetenceMonth] = useState(currentCompetenceMonth)

  const value = useMemo(
    () => ({
      competenceMonth,
      goToPreviousMonth: () => {
        setCompetenceMonth((month) => shiftCompetenceMonth(month, -1))
      },
      goToNextMonth: () => {
        setCompetenceMonth((month) => shiftCompetenceMonth(month, 1))
      },
      goToCurrentMonth: () => {
        setCompetenceMonth(currentCompetenceMonth())
      },
    }),
    [competenceMonth],
  )

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>
}
