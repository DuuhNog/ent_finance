import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TransactionFormModal } from './TransactionFormModal'

const {
  useCategories,
  mutateAsync,
  installmentMutateAsync,
  resumeMutateAsync,
} = vi.hoisted(() => ({
  useCategories: vi.fn(),
  mutateAsync: vi.fn(),
  installmentMutateAsync: vi.fn(),
  resumeMutateAsync: vi.fn(),
}))

vi.mock('../categories/useCategories', () => ({ useCategories }))
vi.mock('./useTransactions', () => ({
  useCreateTransaction: () => ({ mutateAsync, isPending: false }),
  useCreateInstallmentPurchase: () => ({
    mutateAsync: installmentMutateAsync,
    isPending: false,
  }),
  useResumeInstallmentPurchase: () => ({
    mutateAsync: resumeMutateAsync,
    isPending: false,
  }),
}))

const categories = [
  { id: 'cat-1', name: 'Mercado', kind: 'expense' },
  { id: 'cat-2', name: 'Salário', kind: 'income' },
]

describe('TransactionFormModal', () => {
  beforeEachSetup()

  it('shows validation errors for amount, category and payment method on an empty submit', async () => {
    const user = userEvent.setup()
    render(<TransactionFormModal onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(
      await screen.findByText(
        'Digite um valor maior que zero, por exemplo 25,90.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Escolha uma categoria.')).toBeInTheDocument()
    expect(
      screen.getByText('Escolha a forma de pagamento.'),
    ).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('does not require a payment method for an income', async () => {
    const user = userEvent.setup()
    render(<TransactionFormModal onClose={vi.fn()} />)

    await user.click(screen.getByText('Entrada'))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(
        screen.getByText('Digite um valor maior que zero, por exemplo 25,90.'),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByText('Escolha a forma de pagamento.'),
    ).not.toBeInTheDocument()
  })

  it('submits a valid expense and closes the modal', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    mutateAsync.mockResolvedValue(undefined)
    render(<TransactionFormModal onClose={onClose} />)

    await user.type(screen.getByLabelText('Valor (R$)'), '25,90')

    await user.click(screen.getByText('Escolha uma categoria'))
    await user.click(await screen.findByText('Mercado'))

    await user.click(screen.getByText('Escolha a forma de pagamento'))
    await user.click(await screen.findByText('Pix'))

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-1',
          kind: 'expense',
          amountCents: 2590,
          paymentMethod: 'pix',
        }),
      )
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows the first-time credit card hint and calls the installment RPC for 3x', async () => {
    const user = userEvent.setup()
    installmentMutateAsync.mockResolvedValue(undefined)
    render(<TransactionFormModal onClose={vi.fn()} />)

    await user.type(screen.getByLabelText('Valor (R$)'), '300,00')
    await user.click(screen.getByText('Escolha uma categoria'))
    await user.click(await screen.findByText('Mercado'))
    await user.click(screen.getByText('Escolha a forma de pagamento'))
    await user.click(await screen.findByText('Cartão de crédito'))

    expect(
      screen.getByText(/o cartão conta no mês da compra/i),
    ).toBeInTheDocument()

    await user.click(screen.getByText('À vista'))
    await user.click(await screen.findByText('3x'))

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(installmentMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-1',
          totalAmountCents: 30000,
          installments: 3,
        }),
      )
    })
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('resumes an in-progress installment plan with a fixed per-installment amount', async () => {
    const user = userEvent.setup()
    resumeMutateAsync.mockResolvedValue(undefined)
    render(<TransactionFormModal onClose={vi.fn()} />)

    await user.type(screen.getByLabelText('Valor (R$)'), '43,99')
    await user.click(screen.getByText('Escolha uma categoria'))
    await user.click(await screen.findByText('Mercado'))
    await user.click(screen.getByText('Escolha a forma de pagamento'))
    await user.click(await screen.findByText('Cartão de crédito'))

    await user.click(
      screen.getByText('Compra parcelada que já começou antes de usar o app'),
    )

    await user.click(screen.getByText('2x', { selector: 'span' }))
    await user.click(await screen.findByText('10x'))

    await user.click(screen.getByText('2', { selector: 'span' }))
    await user.click(await screen.findByText('5'))

    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(resumeMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat-1',
          installmentAmountCents: 4399,
          startInstallment: 5,
          totalInstallments: 10,
        }),
      )
    })
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(installmentMutateAsync).not.toHaveBeenCalled()
  })

  function beforeEachSetup() {
    beforeEach(() => {
      useCategories.mockImplementation((kind?: 'expense' | 'income') => ({
        data: kind
          ? categories.filter((category) => category.kind === kind)
          : categories,
        isPending: false,
      }))
      mutateAsync.mockReset()
      installmentMutateAsync.mockReset()
      resumeMutateAsync.mockReset()
    })
  }
})
