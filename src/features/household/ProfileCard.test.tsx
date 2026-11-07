import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Database } from '../../lib/supabase/database.types'
import { ProfileCard } from './ProfileCard'

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock('./useProfile', () => ({
  useUpdateDisplayName: () => ({ mutate, isPending: false }),
}))

type Profile = Database['public']['Tables']['profiles']['Row']

const profile: Profile = {
  id: 'user-1',
  household_id: 'household-1',
  display_name: 'Eduardo',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('ProfileCard', () => {
  beforeEach(() => {
    mutate.mockReset()
  })

  it('starts with the current display name', () => {
    render(<ProfileCard profile={profile} />)

    expect(screen.getByLabelText('Seu nome de exibição')).toHaveValue('Eduardo')
  })

  it('shows an error and does not save when the name is emptied', async () => {
    const user = userEvent.setup()
    render(<ProfileCard profile={profile} />)

    await user.clear(screen.getByLabelText('Seu nome de exibição'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText('O nome não pode ficar vazio.'),
    ).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('saves the trimmed new display name', async () => {
    const user = userEvent.setup()
    render(<ProfileCard profile={profile} />)

    const input = screen.getByLabelText('Seu nome de exibição')
    await user.clear(input)
    await user.type(input, '  Eduardo Nogueira  ')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(mutate).toHaveBeenCalledWith(
      { id: 'user-1', displayName: 'Eduardo Nogueira' },
      expect.anything(),
    )
  })
})
