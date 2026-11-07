import { Button, Card, Input } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { supabase } from '../../lib/supabase/client'
import { ForgotPasswordForm } from './ForgotPasswordForm'
import { loginSchema } from './loginSchema'
import { MagicLinkForm } from './MagicLinkForm'

type Mode = 'password' | 'magic-link' | 'forgot-password'

function PasswordLoginForm({
  onForgotPassword,
  onMagicLink,
}: {
  onForgotPassword: () => void
  onMagicLink: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const result = loginSchema.safeParse({ email, password })

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      })
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword(result.data)

    setIsSubmitting(false)

    if (error) {
      setFormError('E-mail ou senha incorretos.')
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <Input
        label="E-mail"
        aria-label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        error={fieldErrors.email}
        fullWidth
      />
      <Input
        label="Senha"
        aria-label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={fieldErrors.password}
        fullWidth
      />
      {formError ? (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      ) : null}
      <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
        Entrar
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-stone-400 underline"
          onClick={onForgotPassword}
        >
          Esqueci minha senha
        </button>
        <button
          type="button"
          className="text-stone-400 underline"
          onClick={onMagicLink}
        >
          Entrar com link mágico
        </button>
      </div>
    </form>
  )
}

const TITLES: Record<Mode, string> = {
  password: 'Entrar',
  'magic-link': 'Link mágico',
  'forgot-password': 'Recuperar senha',
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('password')

  return (
    <main className="flex min-h-svh items-center justify-center bg-stone-900 p-6">
      <Card title={TITLES[mode]} bordered className="w-full max-w-sm">
        {mode === 'password' ? (
          <PasswordLoginForm
            onForgotPassword={() => {
              setMode('forgot-password')
            }}
            onMagicLink={() => {
              setMode('magic-link')
            }}
          />
        ) : null}
        {mode === 'magic-link' ? (
          <MagicLinkForm
            onBack={() => {
              setMode('password')
            }}
          />
        ) : null}
        {mode === 'forgot-password' ? (
          <ForgotPasswordForm
            onBack={() => {
              setMode('password')
            }}
          />
        ) : null}
      </Card>
    </main>
  )
}
