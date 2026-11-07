/**
 * Único módulo responsável por converter dinheiro entre texto (formato
 * brasileiro) e centavos (inteiro) — e vice-versa. Nunca usar float para
 * dinheiro: toda a lógica aqui trabalha com strings e inteiros.
 */

export const MIN_AMOUNT_CENTS = 1
export const MAX_AMOUNT_CENTS = 1_000_000_000 // R$ 10.000.000,00

const THOUSANDS_GROUPED = /^\d{1,3}(\.\d{3})+$/
const DIGITS_ONLY = /^\d+$/

function isValidIntegerPart(integerPart: string): boolean {
  return (
    integerPart.length > 0 &&
    (DIGITS_ONLY.test(integerPart) || THOUSANDS_GROUPED.test(integerPart))
  )
}

function toCentsOrNull(
  integerDigits: string,
  decimalDigits: string,
): number | null {
  const reais = Number.parseInt(integerDigits, 10)
  const decimalCents =
    decimalDigits.length === 1
      ? Number.parseInt(decimalDigits, 10) * 10
      : Number.parseInt(decimalDigits, 10)
  const cents = reais * 100 + decimalCents

  if (!Number.isSafeInteger(cents)) return null
  if (cents < MIN_AMOUNT_CENTS || cents > MAX_AMOUNT_CENTS) return null

  return cents
}

/**
 * Converte um valor digitado pelo usuário (em formato brasileiro) para
 * centavos. Retorna `null` quando o texto não representa um valor monetário
 * válido (vazio, negativo, com letras, mais de 2 casas decimais, zero, ou
 * acima do limite permitido).
 */
export function parseMoney(input: string): number | null {
  const withoutCurrency = input.trim().replace(/^R\$\s*/i, '')

  if (withoutCurrency.length === 0) return null
  if (!/^[0-9.,]+$/.test(withoutCurrency)) return null

  const commaParts = withoutCurrency.split(',')
  if (commaParts.length > 2) return null

  if (commaParts.length === 2) {
    const [integerPart, decimalPart] = commaParts as [string, string]

    if (!isValidIntegerPart(integerPart)) return null
    if (decimalPart.length < 1 || decimalPart.length > 2) return null
    if (!DIGITS_ONLY.test(decimalPart)) return null

    return toCentsOrNull(integerPart.replace(/\./g, ''), decimalPart)
  }

  const withoutComma = commaParts[0] as string
  const dotParts = withoutComma.split('.')

  if (dotParts.length === 1) {
    return toCentsOrNull(withoutComma, '0')
  }

  const fractionPart = dotParts[dotParts.length - 1] as string

  if (
    dotParts.length === 2 &&
    (fractionPart.length === 1 || fractionPart.length === 2)
  ) {
    const integerPart = dotParts[0] as string
    return toCentsOrNull(integerPart, fractionPart)
  }

  if (!THOUSANDS_GROUPED.test(withoutComma)) return null

  return toCentsOrNull(withoutComma.replace(/\./g, ''), '0')
}

/**
 * Formata centavos como texto editável em formato brasileiro, sem o símbolo
 * da moeda (ex.: 104166 -> "1.041,66"). Útil para preencher um campo de
 * input; o resultado sempre pode ser parseado de volta por `parseMoney`.
 */
export function formatMoneyInput(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/**
 * Formata centavos como moeda brasileira para exibição (ex.: 104166 ->
 * "R$ 1.041,66").
 */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

/**
 * Máscara de centavos para o campo "Valor (R$)": a cada tecla, recebe o
 * valor bruto do input (o que `onChange` devolveu) e reformata como se os 2
 * últimos dígitos digitados fossem sempre os centavos (ex.: digitar
 * "123456" mostra "1.234,56"; apagar remove da direita pra esquerda).
 * Ignora qualquer caractere que não seja dígito, então funciona tanto para
 * o texto já formatado (vírgula/pontos) quanto para colar um valor com
 * "R$". Entrada vazia (campo limpo) retorna string vazia. O resultado
 * sempre pode ser parseado de volta por `parseMoney`.
 */
export function formatMoneyMaskInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 15)
  if (digits.length === 0) return ''
  return formatMoneyInput(Number.parseInt(digits, 10))
}
