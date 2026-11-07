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
    <div className="mb-4 flex items-center justify-center gap-3">
      <Button
        variant="secondary"
        size="sm"
        aria-label="Mês anterior"
        onClick={goToPreviousMonth}
      >
        ‹
      </Button>
      <span className="min-w-36 text-center font-medium text-slate-900">
        {formatCompetenceMonthLong(competenceMonth)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        aria-label="Próximo mês"
        onClick={goToNextMonth}
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
