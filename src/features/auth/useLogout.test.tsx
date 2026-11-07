import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useLogout } from './useLogout'

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }))

vi.mock('../../lib/supabase/client', () => ({
  supabase: { auth: { signOut } },
}))

describe('useLogout', () => {
  it('signs out and clears the query cache', async () => {
    signOut.mockResolvedValue({ error: null })
    const queryClient = new QueryClient()
    const clearSpy = vi.spyOn(queryClient, 'clear')

    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper })

    await result.current()

    expect(signOut).toHaveBeenCalled()
    expect(clearSpy).toHaveBeenCalled()
  })
})
