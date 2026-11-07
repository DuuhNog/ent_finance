import { Button, Card, Input } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'

import { supabase } from '../../lib/supabase/client'
import { newPasswordSchema } from './loginSchema'
import { useAuth } from './useAuth'

export function UpdatePasswordPage() {
  const { session, isLoading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const result = newPasswordSchema.safeParse({ password, confirmPassword })

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors
      setFieldErrors({
        password: errors.password?.[0],
        confirmPassword: errors.confirmPassword?.[0],
      })
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    const { error } = await supabase.auth.updateUser({
      password: result.data.password,
    })

    setIsSubmitting(false)

    if (error) {
      setFormError('Não foi possível trocar a senha. Tente pedir um novo link.')
      return
    }

    void navigate('/', { replace: true })
  }

  if (isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-600">Carregando...</p>
      </main>
    )
  }

  if (session === null) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
        <Card title="Link inválido" bordered className="w-full max-w-sm">
          <p className="text-sm text-slate-700">
            Esse link de recuperação é inválido ou já expirou. Peça um novo na
            tela de login.
          </p>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
      <Card title="Definir nova senha" bordered className="w-full max-w-sm">
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <Input
            label="Nova senha"
            aria-label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            fullWidth
            autoFocus
          />
          <Input
            label="Confirmar nova senha"
            aria-label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            error={fieldErrors.confirmPassword}
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
            Salvar nova senha
          </Button>
        </form>
      </Card>
    </main>
  )
}
