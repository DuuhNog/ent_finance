import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HomePage } from './HomePage'

const { useProfile, useHousehold, useLogout } = vi.hoisted(() => ({
  useProfile: vi.fn(),
  useHousehold: vi.fn(),
  useLogout: vi.fn(() => vi.fn()),
}))

vi.mock('./useProfile', () => ({ useProfile }))
vi.mock('./useHousehold', () => ({ useHousehold }))
vi.mock('../auth/useLogout', () => ({ useLogout }))
vi.mock('./ProfileCard', () => ({
  ProfileCard: () => <div>Formulário de perfil</div>,
}))

const profile = {
  id: 'user-1',
  household_id: 'household-1',
  display_name: 'Eduardo',
}
const household = { id: 'household-1', name: 'Nossa casa' }

describe('HomePage', () => {
  it('shows a loading state while profile or household are pending', () => {
    useProfile.mockReturnValue({ isPending: true, isError: false })
    useHousehold.mockReturnValue({ isPending: true, isError: false })

    render(<HomePage />)

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('shows an error message when loading fails', () => {
    useProfile.mockReturnValue({ isPending: false, isError: true })
    useHousehold.mockReturnValue({ isPending: false, isError: false })

    render(<HomePage />)

    expect(
      screen.getByText(/não foi possível carregar os dados da casa/i),
    ).toBeInTheDocument()
  })

  it('renders the household name and the profile form once loaded', () => {
    useProfile.mockReturnValue({
      isPending: false,
      isError: false,
      data: profile,
    })
    useHousehold.mockReturnValue({
      isPending: false,
      isError: false,
      data: household,
    })

    render(<HomePage />)

    expect(screen.getByText('Nossa casa')).toBeInTheDocument()
    expect(screen.getByText('Formulário de perfil')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })
})
