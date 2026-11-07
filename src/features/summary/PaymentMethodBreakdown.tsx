import { PAYMENT_METHOD_COLORS } from '../../lib/chartColors'
import { formatMoney } from '../../lib/money'
import { PAYMENT_METHODS } from '../../lib/supabase/types'
import type { PaymentMethod } from '../../lib/supabase/types'

export function PaymentMethodBreakdown({
  expensesByPaymentMethod,
}: {
  expensesByPaymentMethod: Partial<Record<PaymentMethod, number>>
}) {
  const entries = PAYMENT_METHODS.filter(
    (method) => (expensesByPaymentMethod[method.value] ?? 0) > 0,
  )
  const total = entries.reduce(
    (sum, method) => sum + (expensesByPaymentMethod[method.value] ?? 0),
    0,
  )

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">Nenhum gasto lançado neste mês.</p>
    )
  }

  return (
    <div>
      <div className="flex h-3 gap-0.5">
        {entries.map((method) => {
          const value = expensesByPaymentMethod[method.value] ?? 0
          return (
            <span
              key={method.value}
              className="h-full rounded-sm first:rounded-l-full last:rounded-r-full"
              style={{
                flex: value,
                backgroundColor: PAYMENT_METHOD_COLORS[method.value],
              }}
            />
          )
        })}
      </div>
      <ul className="mt-3 flex flex-col gap-1">
        {entries.map((method) => {
          const value = expensesByPaymentMethod[method.value] ?? 0
          return (
            <li key={method.value} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PAYMENT_METHOD_COLORS[method.value] }}
              />
              <span className="flex-1 text-slate-700">{method.label}</span>
              <span className="font-medium text-slate-900">
                {formatMoney(value)}
              </span>
              <span className="w-10 text-right text-slate-500">
                {Math.round((value / total) * 100)}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
