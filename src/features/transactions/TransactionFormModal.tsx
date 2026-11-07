import { Button, DatePickerInput, Input, Modal, Select } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { parseMoney } from '../../lib/money'
import { dateToIsoDate } from '../../lib/isoDate'
import { PAYMENT_METHODS } from '../../lib/supabase/types'
import type { PaymentMethod } from '../../lib/supabase/types'
import { useCategories } from '../categories/useCategories'
import {
  useCreateInstallmentPurchase,
  useCreateTransaction,
} from './useTransactions'
import { useCreditCardHint } from './useCreditCardHint'

const INSTALLMENT_OPTIONS = Array.from({ length: 24 }, (_, index) => ({
  value: index + 1,
  label: index === 0 ? 'À vista' : `${String(index + 1)}x`,
}))

export function TransactionFormModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<'expense' | 'income'>('expense')
  const [amountInput, setAmountInput] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [occurredOn, setOccurredOn] = useState<Date | null>(new Date())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [installments, setInstallments] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const categoriesQuery = useCategories(kind)
  const createTransaction = useCreateTransaction()
  const createInstallmentPurchase = useCreateInstallmentPurchase()
  const creditCardHint = useCreditCardHint()

  const isSubmitting =
    createTransaction.isPending || createInstallmentPurchase.isPending

  // A categoria e a forma de pagamento escolhidas podem não fazer mais
  // sentido ao trocar entre gasto e entrada — reseta tudo junto na troca.
  function handleKindChange(nextKind: 'expense' | 'income') {
    setKind(nextKind)
    setCategoryId('')
    setPaymentMethod('')
    setInstallments(1)
  }

  function handlePaymentMethodChange(value: PaymentMethod | '') {
    setPaymentMethod(value)
    if (value !== 'credit_card') {
      setInstallments(1)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const amountCents = parseMoney(amountInput)
    const nextErrors: Record<string, string> = {}

    if (amountCents === null) {
      nextErrors.amount = 'Digite um valor maior que zero, por exemplo 25,90.'
    }
    if (categoryId === '') {
      nextErrors.category = 'Escolha uma categoria.'
    }
    if (occurredOn === null) {
      nextErrors.date = 'Escolha a data.'
    }
    if (kind === 'expense' && paymentMethod === '') {
      nextErrors.paymentMethod = 'Escolha a forma de pagamento.'
    }

    setErrors(nextErrors)
    if (
      Object.keys(nextErrors).length > 0 ||
      amountCents === null ||
      occurredOn === null
    ) {
      return
    }

    try {
      if (
        kind === 'expense' &&
        paymentMethod === 'credit_card' &&
        installments > 1
      ) {
        await createInstallmentPurchase.mutateAsync({
          categoryId,
          totalAmountCents: amountCents,
          installments,
          firstOccurredOn: dateToIsoDate(occurredOn),
          description: description.trim() === '' ? null : description.trim(),
        })
      } else {
        await createTransaction.mutateAsync({
          categoryId,
          kind,
          amountCents,
          occurredOn: dateToIsoDate(occurredOn),
          paymentMethod:
            kind === 'expense' ? (paymentMethod as PaymentMethod) : null,
          description: description.trim() === '' ? null : description.trim(),
        })
      }
      // Só marca o aviso do cartão como visto depois que o lançamento foi
      // salvo de verdade — se a primeira tentativa falhar, o usuário ainda
      // não viu o aviso surtir efeito e deve continuar vendo-o.
      if (!creditCardHint.hasSeen && paymentMethod === 'credit_card') {
        creditCardHint.markSeen()
      }
      onClose()
    } catch {
      setFormError('Não foi possível salvar o lançamento. Tente de novo.')
    }
  }

  return (
    <Modal open onClose={onClose} title="Novo lançamento" size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div role="radiogroup" aria-label="Tipo" className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              checked={kind === 'expense'}
              onChange={() => {
                handleKindChange('expense')
              }}
            />
            Gasto
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="kind"
              checked={kind === 'income'}
              onChange={() => {
                handleKindChange('income')
              }}
            />
            Entrada
          </label>
        </div>

        <Input
          label="Valor (R$)"
          aria-label="Valor (R$)"
          inputMode="decimal"
          placeholder="0,00"
          value={amountInput}
          onChange={(value) => {
            setAmountInput(value)
          }}
          error={errors.amount}
          fullWidth
          autoFocus
        />

        <Input
          label="Descrição"
          aria-label="Descrição"
          placeholder="Ex.: mercado do mês, almoço, Uber"
          maxLength={80}
          value={description}
          onChange={(value) => {
            setDescription(value)
          }}
          fullWidth
        />

        <Select
          label="Categoria"
          aria-label="Categoria"
          placeholder={
            categoriesQuery.isPending
              ? 'Carregando...'
              : 'Escolha uma categoria'
          }
          options={(categoriesQuery.data ?? []).map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          value={categoryId === '' ? null : categoryId}
          onChange={(value) => {
            setCategoryId(typeof value === 'string' ? value : '')
          }}
          error={errors.category}
          fullWidth
        />

        <DatePickerInput
          label="Data"
          value={occurredOn}
          onChange={setOccurredOn}
          error={errors.date}
          fullWidth
        />

        {kind === 'expense' ? (
          <>
            <Select
              label="Como pagou"
              aria-label="Como pagou"
              placeholder="Escolha a forma de pagamento"
              options={PAYMENT_METHODS.map((method) => ({
                value: method.value,
                label: method.label,
              }))}
              value={paymentMethod === '' ? null : paymentMethod}
              onChange={(value) => {
                handlePaymentMethodChange(
                  typeof value === 'string' ? (value as PaymentMethod) : '',
                )
              }}
              error={errors.paymentMethod}
              fullWidth
            />

            {paymentMethod === 'credit_card' && !creditCardHint.hasSeen ? (
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                O cartão conta no mês da compra. Quando a fatura chegar, não
                lance o pagamento dela — isso contaria o gasto duas vezes.
              </p>
            ) : null}

            {paymentMethod === 'credit_card' ? (
              <Select
                label="Parcelas"
                aria-label="Parcelas"
                options={INSTALLMENT_OPTIONS}
                value={installments}
                onChange={(value) => {
                  setInstallments(typeof value === 'number' ? value : 1)
                }}
                fullWidth
              />
            ) : null}
          </>
        ) : null}

        {formError ? (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
        >
          Salvar
        </Button>
      </form>
    </Modal>
  )
}
