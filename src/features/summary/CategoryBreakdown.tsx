import { RANKED_BAR_COLOR } from '../../lib/chartColors'
import { formatMoney } from '../../lib/money'
import { useCategories } from '../categories/useCategories'

export function CategoryBreakdown({
  expensesByCategory,
}: {
  expensesByCategory: Record<string, number>
}) {
  const categoriesQuery = useCategories()
  const categoriesById = new Map(
    (categoriesQuery.data ?? []).map((category) => [category.id, category]),
  )

  const entries = Object.entries(expensesByCategory)
    .map(([categoryId, amountCents]) => ({
      categoryId,
      name: categoriesById.get(categoryId)?.name ?? 'Categoria',
      amountCents,
    }))
    .sort((a, b) => b.amountCents - a.amountCents)

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">Nenhum gasto lançado neste mês.</p>
    )
  }

  const total = entries.reduce((sum, entry) => sum + entry.amountCents, 0)
  const max = entries[0]?.amountCents ?? 1

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.categoryId} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-sm text-slate-700">
            {entry.name}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${String((entry.amountCents / max) * 100)}%`,
                backgroundColor: RANKED_BAR_COLOR,
              }}
            />
          </span>
          <span className="w-28 shrink-0 text-right text-sm tabular-nums text-slate-900">
            {formatMoney(entry.amountCents)}{' '}
            <span className="text-slate-500">
              ({Math.round((entry.amountCents / total) * 100)}%)
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
