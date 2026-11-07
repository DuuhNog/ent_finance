import { describe, expect, it } from 'vitest'

import { loginSchema } from './loginSchema'

describe('loginSchema', () => {
  it('accepts a valid e-mail and non-empty password', () => {
    const result = loginSchema.safeParse({
      email: 'alguem@example.com',
      password: 'segredo123',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid e-mail', () => {
    const result = loginSchema.safeParse({
      email: 'nao-é-email',
      password: 'segredo123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an empty password', () => {
    const result = loginSchema.safeParse({
      email: 'alguem@example.com',
      password: '',
    })

    expect(result.success).toBe(false)
  })
})
