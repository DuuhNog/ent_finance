/** Utilidades puras para trabalhar com meses de competência (`YYYY-MM-01`). */

export function currentCompetenceMonth(): string {
  const now = new Date()
  return `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export function shiftCompetenceMonth(
  competenceMonth: string,
  delta: number,
): string {
  const [year, month] = competenceMonth.split('-').map(Number) as [
    number,
    number,
  ]
  const totalMonths = month - 1 + delta
  const targetYear = year + Math.floor(totalMonths / 12)
  const targetMonth = ((totalMonths % 12) + 12) % 12

  return `${String(targetYear).padStart(4, '0')}-${String(targetMonth + 1).padStart(2, '0')}-01`
}

/** Os últimos `count` meses de competência, em ordem crescente, terminando em `competenceMonth`. */
export function lastCompetenceMonths(
  competenceMonth: string,
  count: number,
): string[] {
  return Array.from({ length: count }, (_, index) =>
    shiftCompetenceMonth(competenceMonth, index - (count - 1)),
  )
}

const MONTH_ABBREVIATIONS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

export function formatCompetenceMonthShort(competenceMonth: string): string {
  const month = Number(competenceMonth.split('-')[1])
  return MONTH_ABBREVIATIONS[month - 1] as string
}

/** Data de vencimento (ISO `YYYY-MM-DD`) de uma conta recorrente nesta
 * competência: o dia de vencimento, ou o último dia do mês se ele não
 * existir (ex.: dia 31 em fevereiro). */
export function dueDateForCompetenceMonth(
  competenceMonth: string,
  dueDay: number,
): string {
  const [year, month] = competenceMonth.split('-').map(Number) as [
    number,
    number,
  ]
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const day = Math.min(dueDay, lastDay)
  return `${competenceMonth.slice(0, 8)}${String(day).padStart(2, '0')}`
}

export function formatCompetenceMonthLong(competenceMonth: string): string {
  const [year, month] = competenceMonth.split('-').map(Number) as [
    number,
    number,
  ]
  const date = new Date(Date.UTC(year, month - 1, 1))
  const label = date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
