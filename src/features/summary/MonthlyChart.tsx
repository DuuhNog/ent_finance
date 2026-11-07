import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'

import { CREDIT_CARD_COLOR, OTHER_PAYMENT_COLOR } from '../../lib/chartColors'
import { formatCompetenceMonthShort } from '../../lib/competenceMonth'
import { formatMoney } from '../../lib/money'
import type { MonthTotal } from './useLastSixMonths'

const SERIES_LABELS: Record<string, string> = {
  cartao: 'No cartão',
  outros: 'Outras formas',
}

export function MonthlyChart({ months }: { months: MonthTotal[] }) {
  const data = months.map((month) => ({
    month: formatCompetenceMonthShort(month.competenceMonth),
    cartao: month.creditCardCents,
    outros: month.totalCents - month.creditCardCents,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={{ stroke: '#c3c2b7' }}
          tick={{ fill: '#898781', fontSize: 12 }}
        />
        <Tooltip
          formatter={(value, name) => [
            formatMoney(typeof value === 'number' ? value : 0),
            SERIES_LABELS[String(name)],
          ]}
        />
        <Legend formatter={(value: string) => SERIES_LABELS[value]} />
        <Bar
          dataKey="outros"
          stackId="total"
          fill={OTHER_PAYMENT_COLOR}
          name="outros"
        />
        <Bar
          dataKey="cartao"
          stackId="total"
          fill={CREDIT_CARD_COLOR}
          name="cartao"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
