import type { GoalProgressLevel } from './finance'
import type { PaymentMethod } from './supabase/types'

/**
 * Paleta categórica validada (skill dataviz): ordem fixa, nunca cicla.
 * `node scripts/validate_palette.js` confirmou ΔE seguro para os 5 tons
 * usados abaixo em formas de pagamento.
 */
export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  pix: '#2a78d6', // slot 1 azul
  credit_card: '#eb6834', // slot 2 laranja
  debit: '#1baf7a', // slot 3 água
  boleto: '#eda100', // slot 4 amarelo
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
export const RANKED_BAR_COLOR = '#2a78d6'

/**
 * Classes Tailwind para a barra/texto de progresso de uma meta
 * (`getGoalProgress` em `finance.ts`). Usado tanto em `GoalCard` quanto em
 * `SummaryPage` — mantenha uma única fonte para não divergir entre as duas
 * telas.
 */
export function goalProgressBarColorClass(level: GoalProgressLevel): string {
  if (level === 'good') return 'bg-emerald-600'
  if (level === 'warning') return 'bg-amber-500'
  return 'bg-rose-600'
}

export function goalProgressTextColorClass(level: GoalProgressLevel): string {
  if (level === 'good') return 'text-emerald-700'
  if (level === 'warning') return 'text-amber-700'
  return 'text-rose-700'
}
