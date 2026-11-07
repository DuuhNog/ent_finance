import { Input, Select } from '@single-ui/react'
import { useMemo, useState } from 'react'

import { isoDateToDate } from '../../lib/isoDate'
import { formatMoney } from '../../lib/money'
import { PAYMENT_METHODS } from '../../lib/supabase/types'
import { useCategories } from '../categories/useCategories'
import { useHouseholdProfiles } from '../household/useHouseholdProfiles'
import { MonthSwitcher } from '../month/MonthSwitcher'
import { useSelectedMonth } from '../month/useSelectedMonth'
import { groupTransactionsByDay } from './groupByDay'
import { TransactionRow } from './TransactionRow'
import { useTransactions } from './useTransactions'

function formatDayHeading(occurredOn: string): string {
  const label = isoDateToDate(occurredOn).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function TransactionsPage() {
  const { competenceMonth } = useSelectedMonth()
  const transactionsQuery = useTransactions(competenceMonth)
  const categoriesQuery = useCategories()
  const profilesQuery = useHouseholdProfiles()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  const categoriesById = useMemo(
    () =>
      new Map(
        (categoriesQuery.data ?? []).map((category) => [category.id, category]),
      ),
    [categoriesQuery.data],
  )
  const profilesById = useMemo(
    () =>
      new Map(
        (profilesQuery.data ?? []).map((profile) => [profile.id, profile]),
      ),
    [profilesQuery.data],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()

    return (transactionsQuery.data ?? []).filter((transaction) => {
      if (term !== '') {
        const text = (
          transaction.description ??
          categoriesById.get(transaction.category_id)?.name ??
          ''
        ).toLowerCase()
        if (!text.includes(term)) return false
      }
      if (categoryFilter !== '' && transaction.category_id !== categoryFilter)
        return false
      if (paymentFilter !== '' && transaction.payment_method !== paymentFilter)
        return false
      return true
    })
  }, [
    transactionsQuery.data,
    search,
    categoryFilter,
    paymentFilter,
    categoriesById,
  ])

  const netCents = filtered.reduce(
    (sum, transaction) =>
      sum +
      (transaction.kind === 'income'
        ? transaction.amount_cents
        : -transaction.amount_cents),
    0,
  )
  const groups = groupTransactionsByDay(filtered)

  return (
    <div className="flex flex-col gap-4">
      <MonthSwitcher />

      <div className="flex flex-col gap-2">
        <Input
          label="Buscar por descrição"
          aria-label="Buscar por descrição"
          value={search}
          onChange={setSearch}
          fullWidth
        />
        <div className="grid grid-cols-2 gap-2">
          <Select
            label="Categoria"
            aria-label="Categoria"
            placeholder="Todas"
            options={(categoriesQuery.data ?? []).map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            value={categoryFilter === '' ? null : categoryFilter}
            onChange={(value) => {
              setCategoryFilter(typeof value === 'string' ? value : '')
            }}
            clearable
            fullWidth
          />
          <Select
            label="Forma de pagamento"
            aria-label="Forma de pagamento"
            placeholder="Todas"
            options={PAYMENT_METHODS}
            value={paymentFilter === '' ? null : paymentFilter}
            onChange={(value) => {
              setPaymentFilter(typeof value === 'string' ? value : '')
            }}
            clearable
            fullWidth
          />
        </div>
      </div>

      <p className="text-sm text-stone-400">
        {filtered.length} lançamento(s) · Saldo dos itens:{' '}
        {formatMoney(netCents)}
      </p>

      {transactionsQuery.isPending ? (
        <p className="text-stone-400">Carregando...</p>
      ) : null}
      {transactionsQuery.isError ? (
        <p className="text-red-400">
          Não foi possível carregar os lançamentos.
        </p>
      ) : null}

      {groups.length === 0 && transactionsQuery.isSuccess ? (
        <p className="text-stone-400">Nenhum lançamento encontrado.</p>
      ) : null}

      {groups.map((group) => (
        <section key={group.occurredOn}>
          <h2 className="mb-1 text-sm font-medium text-stone-400">
            {formatDayHeading(group.occurredOn)}
          </h2>
          <ul>
            {group.items.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                category={categoriesById.get(transaction.category_id)}
                author={profilesById.get(transaction.created_by)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
