import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from './LoginPage'

const { signInWithPassword, signInWithOtp, resetPasswordForEmail } = vi.hoisted(
  () => ({
    signInWithPassword: vi.fn(),
    signInWithOtp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  }),
)

vi.mock('../../lib/supabase/client', () => ({
  supabase: {
    auth: { signInWithPassword, signInWithOtp, resetPasswordForEmail },
  },
}))

describe('LoginPage', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
    signInWithOtp.mockReset()
    resetPasswordForEmail.mockReset()
  })

  it('shows validation errors instead of calling the API for an empty form', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(
      await screen.findByText('Digite um e-mail válido.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Digite a senha.')).toBeInTheDocument()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('calls signInWithPassword with the typed credentials', async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText('E-mail'), 'alguem@example.com')
    await user.type(screen.getByLabelText('Senha'), 'segredo123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'alguem@example.com',
      password: 'segredo123',
    })
  })

  it('shows a generic error message when the API rejects the credentials', async () => {
    signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    })
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.type(screen.getByLabelText('E-mail'), 'alguem@example.com')
    await user.type(screen.getByLabelText('Senha'), 'errada')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha incorretos.',
    )
  })

  it('sends a magic link without allowing sign-up and can go back to password login', async () => {
    signInWithOtp.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByText('Entrar com link mágico'))
    await user.type(screen.getByLabelText('E-mail'), 'alguem@example.com')
    await user.click(
      screen.getByRole('button', { name: 'Enviar link de acesso' }),
    )

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'alguem@example.com',
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: false,
      },
    })
    expect(
      await screen.findByText(/enviamos um link de acesso/i),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('sends a password recovery e-mail', async () => {
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null })
    const user = userEvent.setup()
    render(<LoginPage />)

    await user.click(screen.getByText('Esqueci minha senha'))
    await user.type(screen.getByLabelText('E-mail'), 'alguem@example.com')
    await user.click(
      screen.getByRole('button', { name: 'Enviar e-mail de recuperação' }),
    )

    expect(resetPasswordForEmail).toHaveBeenCalledWith('alguem@example.com', {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    expect(
      await screen.findByText(/enviamos um e-mail com/i),
    ).toBeInTheDocument()
  })
})
