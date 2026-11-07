import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from './App'
import { AuthProvider } from './features/auth/AuthProvider'

const { getSession, onAuthStateChange } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

vi.mock('./lib/supabase/client', () => ({
  supabase: { auth: { getSession, onAuthStateChange } },
}))

describe('App', () => {
  it('redirects an unauthenticated visitor to the login page', async () => {
    getSession.mockResolvedValue({ data: { session: null } })
    onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    })

    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
  })
})
