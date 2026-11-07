import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { useHousehold } from './useHousehold'

const { single, eq, from } = vi.hoisted(() => {
  const single = vi.fn()
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  return { single, eq, select, from }
})

vi.mock('../../lib/supabase/client', () => ({
  supabase: { from },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useHousehold', () => {
  it('fetches the household by id', async () => {
    single.mockResolvedValue({
      data: { id: 'household-1', name: 'Nossa casa' },
      error: null,
    })

    const { result } = renderHook(() => useHousehold('household-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual({
        id: 'household-1',
        name: 'Nossa casa',
      })
    })

    expect(from).toHaveBeenCalledWith('households')
    expect(eq).toHaveBeenCalledWith('id', 'household-1')
  })

  it('does not query when there is no household id yet', () => {
    const { result } = renderHook(() => useHousehold(undefined), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(from).not.toHaveBeenCalled()
  })
})
