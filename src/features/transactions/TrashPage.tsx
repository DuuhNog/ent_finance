import { Button } from '@single-ui/react'
import { useMemo, useState } from 'react'

import { isoDateToDate } from '../../lib/isoDate'
import { formatMoney } from '../../lib/money'
import type { Category, Transaction } from '../../lib/supabase/types'
import { useCategories } from '../categories/useCategories'
import {
  useDeletedTransactions,
  useRestoreTransaction,
} from './useTransactions'

function TrashRow({
  transaction,
  category,
}: {
  transaction: Transaction
  category: Category | undefined
}) {
  const restore = useRestoreTransaction()
  const [error, setError] = useState<string | null>(null)

  return (
    <li className="flex items-center gap-3 border-b border-stone-800 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-stone-50">
          {transaction.description ?? category?.name ?? 'Lançamento'}
        </p>
        <p className="text-xs text-stone-400">
          {category?.name ?? 'Sem categoria'} ·{' '}
          {isoDateToDate(transaction.occurred_on).toLocaleDateString('pt-BR')}
        </p>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
      <span className="shrink-0 font-semibold text-stone-50">
        {formatMoney(transaction.amount_cents)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        loading={restore.isPending}
        onClick={() => {
          setError(null)
          restore.mutate(transaction.id, {
            onError: () => {
              setError('Não foi possível restaurar. Tente de novo.')
            },
          })
        }}
      >
        Restaurar
      </Button>
    </li>
  )
}

export function TrashPage() {
  const deletedQuery = useDeletedTransactions()
  const categoriesQuery = useCategories()

  const categoriesById = useMemo(
    () =>
      new Map(
        (categoriesQuery.data ?? []).map((category) => [category.id, category]),
      ),
    [categoriesQuery.data],
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-stone-50">Lixeira</h2>
      <p className="text-sm text-stone-400">
        Lançamentos excluídos ficam aqui até você restaurar — nada é apagado de
        verdade.
      </p>

      {deletedQuery.isPending ? (
        <p className="text-stone-400">Carregando...</p>
      ) : null}
      {deletedQuery.isError ? (
        <p className="text-red-400">Não foi possível carregar a lixeira.</p>
      ) : null}
      {deletedQuery.data?.length === 0 ? (
        <p className="text-stone-400">Nenhum lançamento excluído.</p>
      ) : null}

      <ul>
        {(deletedQuery.data ?? []).map((transaction) => (
          <TrashRow
            key={transaction.id}
            transaction={transaction}
            category={categoriesById.get(transaction.category_id)}
          />
        ))}
      </ul>
    </div>
  )
}
