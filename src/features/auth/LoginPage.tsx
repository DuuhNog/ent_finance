import { Button, Card, Input } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { supabase } from '../../lib/supabase/client'
import { loginSchema } from './loginSchema'

export function LoginPage() {
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
    <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
      <Card title="Entrar" bordered className="w-full max-w-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <Input
            label="E-mail"
            aria-label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(value) => {
              setEmail(value)
            }}
            error={fieldErrors.email}
            fullWidth
          />
          <Input
            label="Senha"
            aria-label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(value) => {
              setPassword(value)
            }}
            error={fieldErrors.password}
            fullWidth
          />
          {formError ? (
            <p role="alert" className="text-sm text-red-600">
              {formError}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isSubmitting}
          >
            Entrar
          </Button>
        </form>
      </Card>
    </main>
  )
}
