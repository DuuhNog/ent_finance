import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { AuthContext } from '../auth/AuthContext'
import type { AuthContextValue } from '../auth/AuthContext'
import { useProfile, useUpdateDisplayName } from './useProfile'

const { single, eq, update, updateEq, from } = vi.hoisted(() => {
  const single = vi.fn()
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const updateEq = vi.fn()
  const update = vi.fn(() => ({ eq: updateEq }))
  const from = vi.fn(() => ({ select, update }))
  return { single, eq, select, update, updateEq, from }
})

vi.mock('../../lib/supabase/client', () => ({
  supabase: { from },
}))

const fakeSession = { user: { id: 'user-1' } } as AuthContextValue['session']

function createWrapper(auth: AuthContextValue) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={auth}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthContext.Provider>
    )
  }
}

describe('useProfile', () => {
  it('fetches the profile of the logged-in user', async () => {
    single.mockResolvedValue({
      data: {
        id: 'user-1',
        household_id: 'household-1',
        display_name: 'Eduardo',
      },
      error: null,
    })

    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper({ session: fakeSession, isLoading: false }),
    })

    await waitFor(() => {
      expect(result.current.data?.display_name).toBe('Eduardo')
    })

    expect(from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
  })

  it('does not query without a logged-in user', () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper({ session: null, isLoading: false }),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useUpdateDisplayName', () => {
  it('updates the display name by id', async () => {
    updateEq.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useUpdateDisplayName(), {
      wrapper: createWrapper({ session: fakeSession, isLoading: false }),
    })

    result.current.mutate({ id: 'user-1', displayName: 'Novo nome' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(update).toHaveBeenCalledWith({ display_name: 'Novo nome' })
    expect(updateEq).toHaveBeenCalledWith('id', 'user-1')
  })
})
