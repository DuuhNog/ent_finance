import { Button, Checkbox, Input, Modal, Select } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { parseMoney } from '../../lib/money'
import { PAYMENT_METHODS } from '../../lib/supabase/types'
import type { PaymentMethod } from '../../lib/supabase/types'
import { useCategories } from '../categories/useCategories'
import { useCreateRecurringBill } from './useRecurringBills'

export function RecurringBillFormModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [isVariable, setIsVariable] = useState(false)
  const [dueDay, setDueDay] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const categoriesQuery = useCategories('expense')
  const createRecurringBill = useCreateRecurringBill()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const amountCents = parseMoney(amountInput)
    const dueDayNumber = Number(dueDay)
    const nextErrors: Record<string, string> = {}

    if (name.trim() === '') {
      nextErrors.name = 'Dê um nome para a conta.'
    }
    if (categoryId === '') {
      nextErrors.category = 'Escolha uma categoria.'
    }
    if (amountCents === null) {
      nextErrors.amount = 'Informe o valor da conta.'
    }
    if (
      dueDay === '' ||
      !Number.isInteger(dueDayNumber) ||
      dueDayNumber < 1 ||
      dueDayNumber > 31
    ) {
      nextErrors.dueDay = 'Informe um dia entre 1 e 31.'
    }
    if (paymentMethod === '') {
      nextErrors.paymentMethod = 'Escolha a forma de pagamento.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || amountCents === null) {
      return
    }

    try {
      await createRecurringBill.mutateAsync({
        name: name.trim(),
        categoryId,
        amountCents,
        isVariable,
        dueDay: dueDayNumber,
        paymentMethod: paymentMethod as PaymentMethod,
      })
      onClose()
    } catch {
      setFormError('Não foi possível salvar a conta. Tente de novo.')
    }
  }

  return (
    <Modal open onClose={onClose} title="Nova conta do mês" size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Nome"
          aria-label="Nome"
          placeholder="Ex.: Internet, Aluguel, Luz"
          maxLength={50}
          value={name}
          onChange={setName}
          error={errors.name}
          fullWidth
          autoFocus
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

        <Input
          label="Valor (R$)"
          aria-label="Valor (R$)"
          inputMode="decimal"
          placeholder="0,00"
          value={amountInput}
          onChange={setAmountInput}
          error={errors.amount}
          fullWidth
        />

        <Checkbox
          label="O valor muda todo mês, como luz e gás"
          checked={isVariable}
          onChange={(event) => {
            setIsVariable(event.target.checked)
          }}
        />

        <Input
          label="Vence todo dia"
          aria-label="Vence todo dia"
          type="number"
          min={1}
          max={31}
          value={dueDay}
          onChange={setDueDay}
          error={errors.dueDay}
          fullWidth
        />

        <Select
          label="Como paga"
          aria-label="Como paga"
          placeholder="Escolha a forma de pagamento"
          options={PAYMENT_METHODS}
          value={paymentMethod === '' ? null : paymentMethod}
          onChange={(value) => {
            setPaymentMethod(
              typeof value === 'string' ? (value as PaymentMethod) : '',
            )
          }}
          error={errors.paymentMethod}
          fullWidth
        />

        {formError ? (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={createRecurringBill.isPending}
        >
          Salvar
        </Button>
      </form>
    </Modal>
  )
}
