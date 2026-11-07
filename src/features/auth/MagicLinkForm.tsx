import { Button, Input } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { supabase } from '../../lib/supabase/client'
import { emailOnlySchema } from './loginSchema'

export function MagicLinkForm({ onBack }: { onBack: () => void }) {
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

    const { error } = await supabase.auth.signInWithOtp({
      email: result.data.email,
      options: {
        emailRedirectTo: window.location.origin,
        // Cadastro público é desativado de propósito (regra de negócio) —
        // sem isso, o Supabase cria um usuário novo pra qualquer e-mail que
        // alguém digitar aqui, ignorando o toggle de "Allow signups" do
        // painel (que só vale pra /signup, não pra /otp).
        shouldCreateUser: false,
      },
    })

    setIsSubmitting(false)

    if (error) {
      setFormError('Não foi possível enviar o link. Tente de novo.')
      return
    }

    setIsSent(true)
  }

  if (isSent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-stone-300">
          Enviamos um link de acesso para <strong>{email}</strong>. Abra o
          e-mail no mesmo navegador para entrar.
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
        Enviar link de acesso
      </Button>
      <Button type="button" variant="secondary" fullWidth onClick={onBack}>
        Entrar com senha
      </Button>
    </form>
  )
}
