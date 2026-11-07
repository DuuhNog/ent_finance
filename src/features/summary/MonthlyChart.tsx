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
        <CartesianGrid vertical={false} stroke="#2c2c2a" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={{ stroke: '#383835' }}
          tick={{ fill: '#898781', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#292524',
            borderColor: '#44403c',
            borderRadius: 6,
          }}
          labelStyle={{ color: '#f0efec' }}
          itemStyle={{ color: '#f0efec' }}
          formatter={(value, name) => [
            formatMoney(typeof value === 'number' ? value : 0),
            SERIES_LABELS[String(name)],
          ]}
        />
        <Legend
          formatter={(value: string) => SERIES_LABELS[value]}
          wrapperStyle={{ color: '#c3c2b7' }}
        />
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
