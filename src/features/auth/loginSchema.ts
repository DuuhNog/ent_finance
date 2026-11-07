import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Digite um e-mail válido.'),
  password: z.string().min(1, 'Digite a senha.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
