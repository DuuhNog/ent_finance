import { Button, Input, Modal, Select } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { parseMoney } from '../../lib/money'
import type { GoalKind } from '../../lib/supabase/types'
import { useCategories } from '../categories/useCategories'
import { useCreateGoal } from './useGoals'

const GOAL_KIND_OPTIONS: { value: GoalKind; label: string }[] = [
  { value: 'credit_card_limit', label: 'Limite no cartão de crédito' },
  { value: 'category_limit', label: 'Limite para uma categoria' },
  { value: 'monthly_savings', label: 'Guardar dinheiro todo mês' },
]

export function GoalFormModal({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<GoalKind>('credit_card_limit')
  const [categoryId, setCategoryId] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const categoriesQuery = useCategories('expense')
  const createGoal = useCreateGoal()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const amountCents = parseMoney(amountInput)
    const nextErrors: Record<string, string> = {}

    if (amountCents === null) {
      nextErrors.amount = 'Informe um valor maior que zero.'
    }
    if (kind === 'category_limit' && categoryId === '') {
      nextErrors.category = 'Escolha uma categoria.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || amountCents === null) {
      return
    }

    try {
      await createGoal.mutateAsync({
        kind,
        amountCents,
        categoryId: kind === 'category_limit' ? categoryId : null,
      })
      onClose()
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        setFormError('Você já tem uma meta desse tipo. Edite a existente.')
      } else {
        setFormError('Não foi possível salvar a meta. Tente de novo.')
      }
    }
  }

  return (
    <Modal open onClose={onClose} title="Nova meta" size="md">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Select
          label="Tipo de meta"
          aria-label="Tipo de meta"
          options={GOAL_KIND_OPTIONS}
          value={kind}
          onChange={(value) => {
            setKind(value as GoalKind)
          }}
          fullWidth
        />

        {kind === 'category_limit' ? (
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
        ) : null}

        <Input
          label={
            kind === 'monthly_savings'
              ? 'Quanto guardar por mês (R$)'
              : 'Gastar no máximo por mês (R$)'
          }
          aria-label="Valor (R$)"
          inputMode="decimal"
          placeholder="0,00"
          value={amountInput}
          onChange={setAmountInput}
          error={errors.amount}
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
          loading={createGoal.isPending}
        >
          Salvar
        </Button>
      </form>
    </Modal>
  )
}
