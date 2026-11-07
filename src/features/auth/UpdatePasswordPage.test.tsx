import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import { UpdatePasswordPage } from './UpdatePasswordPage'

const { updateUser } = vi.hoisted(() => ({ updateUser: vi.fn() }))

vi.mock('../../lib/supabase/client', () => ({
  supabase: { auth: { updateUser } },
}))

const fakeSession = { user: { id: 'user-1' } } as AuthContextValue['session']

function renderWithAuth(auth: AuthContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/redefinir-senha']}>
        <Routes>
          <Route path="/redefinir-senha" element={<UpdatePasswordPage />} />
          <Route path="/" element={<p>Página inicial</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('UpdatePasswordPage', () => {
  beforeEach(() => {
    updateUser.mockReset()
  })

  it('shows a loading state while the session is still resolving', () => {
    renderWithAuth({ session: null, isLoading: true })

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('shows an invalid-link message when there is no recovery session', () => {
    renderWithAuth({ session: null, isLoading: false })

    expect(screen.getByText('Link inválido')).toBeInTheDocument()
  })

  it('validates that the two passwords match', async () => {
    const user = userEvent.setup()
    renderWithAuth({ session: fakeSession, isLoading: false })

    await user.type(screen.getByLabelText('Nova senha'), 'segredo123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'outrasenha')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(
      await screen.findByText('As senhas não são iguais.'),
    ).toBeInTheDocument()
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('updates the password and navigates home on success', async () => {
    updateUser.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    renderWithAuth({ session: fakeSession, isLoading: false })

    await user.type(screen.getByLabelText('Nova senha'), 'segredo123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(updateUser).toHaveBeenCalledWith({ password: 'segredo123' })
    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
  })

  it('shows an error message when the update fails', async () => {
    updateUser.mockResolvedValue({ data: {}, error: { message: 'expired' } })
    const user = userEvent.setup()
    renderWithAuth({ session: fakeSession, isLoading: false })

    await user.type(screen.getByLabelText('Nova senha'), 'segredo123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Salvar nova senha' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível trocar a senha.',
    )
  })
})
