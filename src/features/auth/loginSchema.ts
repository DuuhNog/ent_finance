import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Digite um e-mail válido.'),
  password: z.string().min(1, 'Digite a senha.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export const emailOnlySchema = z.object({
  email: z.email('Digite um e-mail válido.'),
})

export type EmailOnlyFormValues = z.infer<typeof emailOnlySchema>

export const newPasswordSchema = z
  .object({
    password: z.string().min(6, 'A senha precisa ter pelo menos 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirme a senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não são iguais.',
    path: ['confirmPassword'],
  })

export type NewPasswordFormValues = z.infer<typeof newPasswordSchema>
