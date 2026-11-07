import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AuthContext } from '../features/auth/AuthContext'
import type { AuthContextValue } from '../features/auth/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute'

function renderWithAuth(auth: AuthContextValue, initialPath: string) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<p>Tela de login</p>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Página protegida</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

const fakeSession = { user: { id: 'user-1' } } as AuthContextValue['session']

describe('ProtectedRoute', () => {
  it('redirects to /login when there is no session', () => {
    renderWithAuth({ session: null, isLoading: false }, '/')

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })

  it('renders the protected content when there is a session', () => {
    renderWithAuth({ session: fakeSession, isLoading: false }, '/')

    expect(screen.getByText('Página protegida')).toBeInTheDocument()
  })

  it('shows a loading state instead of redirecting while the session loads', () => {
    renderWithAuth({ session: null, isLoading: true }, '/')

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })
})

describe('PublicOnlyRoute', () => {
  it('redirects an already-authenticated user away from /login', () => {
    renderWithAuth({ session: fakeSession, isLoading: false }, '/login')

    expect(screen.getByText('Página protegida')).toBeInTheDocument()
  })

  it('renders the login page when there is no session', () => {
    renderWithAuth({ session: null, isLoading: false }, '/login')

    expect(screen.getByText('Tela de login')).toBeInTheDocument()
  })
})
