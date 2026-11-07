import { Button } from '@single-ui/react'

import {
  currentCompetenceMonth,
  formatCompetenceMonthLong,
} from '../../lib/competenceMonth'
import { useSelectedMonth } from './useSelectedMonth'

export function MonthSwitcher() {
  const {
    competenceMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
  } = useSelectedMonth()
  const isCurrentMonth = competenceMonth === currentCompetenceMonth()

  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        size="lg"
        aria-label="Mês anterior"
        onClick={goToPreviousMonth}
        className="text-xl"
      >
        ‹
      </Button>
      <span className="whitespace-nowrap text-center text-2xl font-bold text-slate-100">
        {formatCompetenceMonthLong(competenceMonth)}
      </span>
      <Button
        variant="secondary"
        size="lg"
        aria-label="Próximo mês"
        onClick={goToNextMonth}
        className="text-xl"
      >
        ›
      </Button>
      {!isCurrentMonth ? (
        <Button variant="secondary" size="sm" onClick={goToCurrentMonth}>
          Hoje
        </Button>
      ) : null}
    </div>
  )
}
