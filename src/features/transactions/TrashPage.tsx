import { Button } from '@single-ui/react'
import { useMemo } from 'react'

import { isoDateToDate } from '../../lib/isoDate'
import { formatMoney } from '../../lib/money'
import { useCategories } from '../categories/useCategories'
import {
  useDeletedTransactions,
  useRestoreTransaction,
} from './useTransactions'

export function TrashPage() {
  const deletedQuery = useDeletedTransactions()
  const categoriesQuery = useCategories()
  const restore = useRestoreTransaction()

  const categoriesById = useMemo(
    () =>
      new Map(
        (categoriesQuery.data ?? []).map((category) => [category.id, category]),
      ),
    [categoriesQuery.data],
  )

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Lixeira</h2>
      <p className="text-sm text-slate-600">
        Lançamentos excluídos ficam aqui até você restaurar — nada é apagado de
        verdade.
      </p>

      {deletedQuery.isPending ? (
        <p className="text-slate-600">Carregando...</p>
      ) : null}
      {deletedQuery.isError ? (
        <p className="text-red-600">Não foi possível carregar a lixeira.</p>
      ) : null}
      {deletedQuery.data?.length === 0 ? (
        <p className="text-slate-500">Nenhum lançamento excluído.</p>
      ) : null}

      <ul>
        {(deletedQuery.data ?? []).map((transaction) => {
          const category = categoriesById.get(transaction.category_id)
          return (
            <li
              key={transaction.id}
              className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {transaction.description ?? category?.name ?? 'Lançamento'}
                </p>
                <p className="text-xs text-slate-500">
                  {category?.name ?? 'Sem categoria'} ·{' '}
                  {isoDateToDate(transaction.occurred_on).toLocaleDateString(
                    'pt-BR',
                  )}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-slate-900">
                {formatMoney(transaction.amount_cents)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                loading={restore.isPending}
                onClick={() => {
                  restore.mutate(transaction.id)
                }}
              >
                Restaurar
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
