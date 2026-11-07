/**
 * Cálculos puros do domínio financeiro — sem React, sem Supabase. Datas de
 * competência e de vencimento são sempre strings ISO `YYYY-MM-DD` (nunca
 * `Date` local, para não sofrer com fuso horário).
 */

export type PaymentMethod = 'credit_card' | 'pix' | 'debit' | 'cash' | 'boleto'

const MIN_INSTALLMENTS = 2
const MAX_INSTALLMENTS = 24

function daysInMonth(year: number, month: number): number {
  // Dia 0 do próximo mês é o último dia do mês atual.
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function parseIsoDate(isoDate: string): {
  year: number
  month: number
  day: number
} {
  const [year, month, day] = isoDate.split('-').map(Number) as [
    number,
    number,
    number,
  ]
  return { year, month, day }
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`
}

function addMonthsClamped(isoDate: string, monthsToAdd: number): string {
  const { year, month, day } = parseIsoDate(isoDate)
  const totalMonths = month - 1 + monthsToAdd
  const targetYear = year + Math.floor(totalMonths / 12)
  const targetMonth = (totalMonths % 12) + 1
  const lastDayOfTargetMonth = daysInMonth(targetYear, targetMonth)
  const targetDay = Math.min(day, lastDayOfTargetMonth)

  return toIsoDate(targetYear, targetMonth, targetDay)
}

function monthsBetween(
  fromCompetenceMonth: string,
  toCompetenceMonth: string,
): number {
  const from = parseIsoDate(fromCompetenceMonth)
  const to = parseIsoDate(toCompetenceMonth)

  return (to.year - from.year) * 12 + (to.month - from.month)
}

function daysBetween(fromIsoDate: string, toIsoDate_: string): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const from = parseIsoDate(fromIsoDate)
  const to = parseIsoDate(toIsoDate_)
  const fromUtc = Date.UTC(from.year, from.month - 1, from.day)
  const toUtc = Date.UTC(to.year, to.month - 1, to.day)

  return Math.round((toUtc - fromUtc) / msPerDay)
}

/**
 * Divide o total de uma compra parcelada em `installments` parcelas, cada
 * uma em centavos. A primeira parcela recebe o resto da divisão, de forma
 * que a soma das parcelas seja sempre exatamente igual ao total.
 */
export function splitInstallments(
  totalCents: number,
  installments: number,
): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
    throw new RangeError('totalCents deve ser um inteiro positivo')
  }
  if (
    !Number.isInteger(installments) ||
    installments < MIN_INSTALLMENTS ||
    installments > MAX_INSTALLMENTS
  ) {
    throw new RangeError(
      `installments deve ser um inteiro entre ${String(MIN_INSTALLMENTS)} e ${String(MAX_INSTALLMENTS)}`,
    )
  }

  const base = Math.floor(totalCents / installments)
  const remainder = totalCents - base * installments

  return Array.from({ length: installments }, (_, index) =>
    index === 0 ? base + remainder : base,
  )
}

/**
 * Calcula a data de cada parcela a partir da data da primeira compra. As
 * parcelas caem no mesmo dia nos meses seguintes; se o dia não existir no mês
 * de destino (ex.: 31 em fevereiro), usa o último dia desse mês.
 */
export function getInstallmentDates(
  firstOccurredOn: string,
  installments: number,
): string[] {
  if (
    !Number.isInteger(installments) ||
    installments < MIN_INSTALLMENTS ||
    installments > MAX_INSTALLMENTS
  ) {
    throw new RangeError(
      `installments deve ser um inteiro entre ${String(MIN_INSTALLMENTS)} e ${String(MAX_INSTALLMENTS)}`,
    )
  }

  return Array.from({ length: installments }, (_, index) =>
    addMonthsClamped(firstOccurredOn, index),
  )
}

export interface BillPayment {
  /** Primeiro dia do mês de competência em que a conta foi paga. */
  competenceMonth: string
  amountCents: number
}

/**
 * Estimativa de valor para uma conta variável: o último valor pago nos 6
 * meses anteriores ao mês de referência; se não houver nenhum, o valor
 * cadastrado.
 */
export function estimateVariableBillAmount(
  payments: BillPayment[],
  referenceMonth: string,
  registeredAmountCents: number,
): number {
  const candidates = payments.filter((payment) => {
    const diff = monthsBetween(payment.competenceMonth, referenceMonth)
    return diff >= 1 && diff <= 6
  })

  if (candidates.length === 0) return registeredAmountCents

  const mostRecent = candidates.reduce((latest, candidate) =>
    candidate.competenceMonth > latest.competenceMonth ? candidate : latest,
  )

  return mostRecent.amountCents
}

export type BillStatus = 'paid' | 'overdue' | 'due_soon' | 'upcoming'

const DUE_SOON_THRESHOLD_DAYS = 5

export interface BillStatusInput {
  /** Data de vencimento da conta nesta competência (ISO `YYYY-MM-DD`). */
  dueDate: string
  /** Data em que a conta foi paga nesta competência, ou `null`. */
  paidOn: string | null
  /** Data de hoje, injetada para permitir testes determinísticos. */
  today: string
}

/**
 * Status de uma conta recorrente numa competência: paga, atrasada (passou o
 * vencimento e não foi paga — inclui meses passados), vence em até 5 dias, ou
 * a vencer.
 */
export function getBillStatus({
  dueDate,
  paidOn,
  today,
}: BillStatusInput): BillStatus {
  if (paidOn !== null) return 'paid'
  if (today > dueDate) return 'overdue'

  const daysUntilDue = daysBetween(today, dueDate)

  return daysUntilDue <= DUE_SOON_THRESHOLD_DAYS ? 'due_soon' : 'upcoming'
}

export interface TransactionForSummary {
  kind: 'expense' | 'income'
  amountCents: number
  paymentMethod: PaymentMethod | null
  categoryId: string
  isSavingsCategory: boolean
}

export interface PendingBillForSummary {
  recurringBillId: string
  estimatedAmountCents: number
}

export interface MonthSummaryInput {
  transactions: TransactionForSummary[]
  /** Contas da competência cujo status não é `paid` (veja `getBillStatus`). */
  pendingBills: PendingBillForSummary[]
}

export interface MonthSummary {
  incomeCents: number
  /** Gastos do mês, sem contar o que foi guardado. */
  expenseCents: number
  savedCents: number
  /** entradas - gastos - guardado. */
  balanceCents: number
  creditCardTotalCents: number
  expensesByCategory: Record<string, number>
  expensesByPaymentMethod: Partial<Record<PaymentMethod, number>>
  pendingBillsTotalCents: number
  /** saldo - total estimado das contas pendentes. */
  projectedBalanceCents: number
}

/**
 * Resumo financeiro de um mês a partir dos lançamentos já filtrados para a
 * competência e das contas recorrentes ainda não pagas nessa competência.
 */
export function buildMonthSummary(input: MonthSummaryInput): MonthSummary {
  let incomeCents = 0
  let expenseCents = 0
  let savedCents = 0
  let creditCardTotalCents = 0
  const expensesByCategory: Record<string, number> = {}
  const expensesByPaymentMethod: Partial<Record<PaymentMethod, number>> = {}

  for (const transaction of input.transactions) {
    if (transaction.kind === 'income') {
      incomeCents += transaction.amountCents
      continue
    }

    if (transaction.isSavingsCategory) {
      savedCents += transaction.amountCents
      continue
    }

    expenseCents += transaction.amountCents
    expensesByCategory[transaction.categoryId] =
      (expensesByCategory[transaction.categoryId] ?? 0) +
      transaction.amountCents

    if (transaction.paymentMethod !== null) {
      expensesByPaymentMethod[transaction.paymentMethod] =
        (expensesByPaymentMethod[transaction.paymentMethod] ?? 0) +
        transaction.amountCents

      if (transaction.paymentMethod === 'credit_card') {
        creditCardTotalCents += transaction.amountCents
      }
    }
  }

  const balanceCents = incomeCents - expenseCents - savedCents
  const pendingBillsTotalCents = input.pendingBills.reduce(
    (sum, bill) => sum + bill.estimatedAmountCents,
    0,
  )

  return {
    incomeCents,
    expenseCents,
    savedCents,
    balanceCents,
    creditCardTotalCents,
    expensesByCategory,
    expensesByPaymentMethod,
    pendingBillsTotalCents,
    projectedBalanceCents: balanceCents - pendingBillsTotalCents,
  }
}

export type GoalProgressLevel = 'good' | 'warning' | 'critical'

export interface GoalProgress {
  /** 1 = 100% da meta. */
  percentage: number
  level: GoalProgressLevel
}

/**
 * Progresso de uma meta. Para limite (cartão/categoria), mais é pior: até
 * 80% é `good`, até 100% é `warning`, acima é `critical`. Para guardar
 * (`inverse`), mais é melhor: 100% ou mais é `good`, 50% a 100% é `warning`,
 * abaixo de 50% é `critical`.
 */
export function getGoalProgress(
  currentCents: number,
  targetCents: number,
  inverse: boolean,
): GoalProgress {
  const percentage = targetCents > 0 ? currentCents / targetCents : 0

  if (inverse) {
    const level: GoalProgressLevel =
      percentage >= 1 ? 'good' : percentage >= 0.5 ? 'warning' : 'critical'
    return { percentage, level }
  }

  const level: GoalProgressLevel =
    percentage <= 0.8 ? 'good' : percentage <= 1 ? 'warning' : 'critical'
  return { percentage, level }
}
