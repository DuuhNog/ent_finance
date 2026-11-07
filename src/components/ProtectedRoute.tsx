import { Navigate, Outlet } from 'react-router'

import { useAuth } from '../features/auth/useAuth'

export function ProtectedRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-stone-900 p-6">
        <p className="text-stone-400">Carregando...</p>
      </main>
    )
  }

  if (session === null) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export function PublicOnlyRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-stone-900 p-6">
        <p className="text-stone-400">Carregando...</p>
      </main>
    )
  }

  if (session !== null) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
