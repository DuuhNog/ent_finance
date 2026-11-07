import type { GoalProgressLevel } from './finance'
import type { PaymentMethod } from './supabase/types'

/**
 * Paleta categórica validada (skill dataviz): ordem fixa, nunca cicla.
 * Estes são os tons da coluna "Dark" de `references/palette.md` (tema é
 * sempre escuro neste app) — `node scripts/validate_palette.js
 * "#3987e5,#d95926,#199e70,#c98500,#008300" --mode dark --surface "#1c1917"`
 * confirmou ΔE seguro para os 5 tons usados abaixo em formas de pagamento.
 */
export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  pix: '#3987e5', // slot 1 azul
  credit_card: '#d95926', // slot 2 laranja
  debit: '#199e70', // slot 3 água
  boleto: '#c98500', // slot 4 amarelo
  cash: '#008300', // slot 6 verde
}

/** Mesma identidade de cor do cartão/demais formas usada no gráfico de 6 meses. */
export const CREDIT_CARD_COLOR = PAYMENT_METHOD_COLORS.credit_card
export const OTHER_PAYMENT_COLOR = PAYMENT_METHOD_COLORS.pix

/** Paleta de status fixa (nunca reaproveitada para séries categóricas). */
export const STATUS_COLORS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const

/** Cor única para listas ordenadas (ex.: gastos por categoria) — a
 * identidade está no rótulo, não na cor, então uma série só evita gastar
 * a paleta categórica à toa. */
export const RANKED_BAR_COLOR = '#3987e5'

/**
 * Classes Tailwind para a barra/texto de progresso de uma meta
 * (`getGoalProgress` em `finance.ts`). Usado tanto em `GoalCard` quanto em
 * `SummaryPage` — mantenha uma única fonte para não divergir entre as duas
 * telas.
 */
export function goalProgressBarColorClass(level: GoalProgressLevel): string {
  if (level === 'good') return 'bg-emerald-500'
  if (level === 'warning') return 'bg-amber-500'
  return 'bg-rose-500'
}

export function goalProgressTextColorClass(level: GoalProgressLevel): string {
  if (level === 'good') return 'text-emerald-400'
  if (level === 'warning') return 'text-amber-400'
  return 'text-rose-400'
}
