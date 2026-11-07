import { Button } from '@single-ui/react'
import { useState } from 'react'

import { formatMoney } from '../../lib/money'
import type { Category, Profile, Transaction } from '../../lib/supabase/types'
import { useSoftDeleteTransaction } from './useTransactions'

export function TransactionRow({
  transaction,
  category,
  author,
}: {
  transaction: Transaction
  category: Category | undefined
  author: Profile | undefined
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const softDelete = useSoftDeleteTransaction()

  const label = transaction.description ?? category?.name ?? 'Lançamento'
  const isIncome = transaction.kind === 'income'

  return (
    <li className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${isIncome ? 'bg-emerald-600' : 'bg-slate-400'}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{label}</p>
        <p className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <span>{category?.name ?? 'Sem categoria'}</span>
          {transaction.payment_method === 'credit_card' ? (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5">
              Cartão
            </span>
          ) : null}
          {transaction.installment_number !== null ? (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5">
              parcela {transaction.installment_number}/
              {transaction.installment_total}
            </span>
          ) : null}
          {transaction.recurring_bill_id !== null ? (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5">
              conta do mês
            </span>
          ) : null}
          {author ? <span>· lançado por {author.display_name}</span> : null}
        </p>
        {deleteError ? (
          <p className="mt-1 text-xs text-red-600">{deleteError}</p>
        ) : null}
      </div>
      <span
        className={`shrink-0 font-semibold ${isIncome ? 'text-emerald-700' : 'text-slate-900'}`}
      >
        {isIncome ? '+ ' : ''}
        {formatMoney(transaction.amount_cents)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        loading={softDelete.isPending}
        onClick={() => {
          if (!isConfirmingDelete) {
            setIsConfirmingDelete(true)
            return
          }
          setDeleteError(null)
          softDelete.mutate(transaction.id, {
            onError: () => {
              setIsConfirmingDelete(false)
              setDeleteError('Não foi possível excluir. Tente de novo.')
            },
          })
        }}
      >
        {isConfirmingDelete ? 'Confirmar' : 'Excluir'}
      </Button>
    </li>
  )
}
