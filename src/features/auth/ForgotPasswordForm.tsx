import { Button, Input } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { supabase } from '../../lib/supabase/client'
import { emailOnlySchema } from './loginSchema'

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const result = emailOnlySchema.safeParse({ email })

    if (!result.success) {
      setEmailError(result.error.flatten().fieldErrors.email?.[0])
      return
    }

    setEmailError(undefined)
    setIsSubmitting(true)

    const { error } = await supabase.auth.resetPasswordForEmail(
      result.data.email,
      {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      },
    )

    setIsSubmitting(false)

    if (error) {
      setFormError('Não foi possível enviar o e-mail. Tente de novo.')
      return
    }

    setIsSent(true)
  }

  if (isSent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-stone-300">
          Se <strong>{email}</strong> tiver uma conta, enviamos um e-mail com um
          link para definir uma nova senha.
        </p>
        <Button variant="secondary" fullWidth onClick={onBack}>
          Voltar
        </Button>
      </div>
    )
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
        error={emailError}
        fullWidth
        autoFocus
      />
      {formError ? (
        <p role="alert" className="text-sm text-red-400">
          {formError}
        </p>
      ) : null}
      <Button type="submit" variant="primary" fullWidth loading={isSubmitting}>
        Enviar e-mail de recuperação
      </Button>
      <Button type="button" variant="secondary" fullWidth onClick={onBack}>
        Entrar com senha
      </Button>
    </form>
  )
}
