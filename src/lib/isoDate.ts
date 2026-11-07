/** Conversões entre `Date` local (usado pelos date pickers) e strings ISO
 * `YYYY-MM-DD` (usadas em todo o resto do app). Nunca usar `toISOString()`
 * aqui — ele converte para UTC e pode mudar o dia dependendo do fuso. */

export function dateToIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isoDateToDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  return new Date(year, month - 1, day)
}

export function todayIsoDate(): string {
  return dateToIsoDate(new Date())
}

/** Diferença em dias entre duas datas ISO (`to` − `from`), sem depender de
 * fuso horário (usa UTC internamente só para a subtração). */
export function daysBetweenIsoDates(from: string, to: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  const [toYear, toMonth, toDay] = to.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay)
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay)

  return Math.round((toUtc - fromUtc) / msPerDay)
}
