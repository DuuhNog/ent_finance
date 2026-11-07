import { Button } from '@single-ui/react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router'

import { useLogout } from '../features/auth/useLogout'
import { useHousehold } from '../features/household/useHousehold'
import { useProfile } from '../features/household/useProfile'
import { MonthProvider } from '../features/month/MonthProvider'
import { TransactionFormModal } from '../features/transactions/TransactionFormModal'

const NAV_ITEMS = [
  { to: '/', label: 'Resumo' },
  { to: '/lancamentos', label: 'Lançamentos' },
  { to: '/contas', label: 'Contas do mês' },
  { to: '/metas', label: 'Metas' },
  { to: '/ajustes', label: 'Ajustes' },
  { to: '/lixeira', label: 'Lixeira' },
]

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  return [
    'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200',
  ].join(' ')
}

export function AppLayout() {
  const profileQuery = useProfile()
  const householdQuery = useHousehold(profileQuery.data?.household_id)
  const logout = useLogout()
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false)

  return (
    <MonthProvider>
      <div className="min-h-svh bg-slate-50 pb-24">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
            <h1 className="truncate text-lg font-semibold text-slate-900">
              {householdQuery.data?.name ?? 'Aonde vai o meu dinheiro'}
            </h1>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void logout()
              }}
            >
              Sair
            </Button>
          </div>
          <nav
            aria-label="Seções"
            className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 pb-3"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={navLinkClassName}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-4">
          {profileQuery.isPending || householdQuery.isPending ? (
            <p className="text-slate-600">Carregando...</p>
          ) : profileQuery.isError || householdQuery.isError ? (
            <p className="text-red-600">
              Não foi possível carregar os dados da casa. Tente novamente mais
              tarde.
            </p>
          ) : (
            <Outlet />
          )}
        </main>

        <Button
          variant="primary"
          className="fixed right-4 bottom-4 shadow-lg"
          onClick={() => {
            setIsTransactionFormOpen(true)
          }}
        >
          + Lançar
        </Button>

        {isTransactionFormOpen ? (
          <TransactionFormModal
            onClose={() => {
              setIsTransactionFormOpen(false)
            }}
          />
        ) : null}
      </div>
    </MonthProvider>
  )
}
