import { Button, Input, Select } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import type { Category, CategoryKind } from '../../lib/supabase/types'
import {
  useArchiveCategory,
  useCategories,
  useCreateCategory,
  useRenameCategory,
} from './useCategories'

function CategoryRow({ category }: { category: Category }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const rename = useRenameCategory()
  const archive = useArchiveCategory()

  return (
    <li className="flex items-center gap-2 border-b border-slate-100 py-2 last:border-0">
      {isEditing ? (
        <>
          <Input
            aria-label="Nome da categoria"
            value={name}
            onChange={setName}
            fullWidth
          />
          <Button
            variant="primary"
            size="sm"
            loading={rename.isPending}
            onClick={() => {
              if (name.trim() === '') return
              rename.mutate(
                { id: category.id, name: name.trim() },
                {
                  onSuccess: () => {
                    setIsEditing(false)
                  },
                },
              )
            }}
          >
            Salvar
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-slate-900">
            {category.name}
            {category.is_savings ? (
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                guardar
              </span>
            ) : null}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsEditing(true)
            }}
          >
            Renomear
          </Button>
          <Button
            variant="secondary"
            size="sm"
            loading={archive.isPending}
            onClick={() => {
              archive.mutate(category.id)
            }}
          >
            Arquivar
          </Button>
        </>
      )}
    </li>
  )
}

function NewCategoryForm() {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [error, setError] = useState<string | null>(null)
  const createCategory = useCreateCategory()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (name.trim() === '') {
      setError('Dê um nome para a categoria.')
      return
    }
    setError(null)
    createCategory.mutate(
      { name: name.trim(), kind },
      {
        onSuccess: () => {
          setName('')
        },
      },
    )
  }

  return (
    <form className="flex items-end gap-2" onSubmit={handleSubmit}>
      <Input
        label="Nova categoria"
        aria-label="Nova categoria"
        value={name}
        onChange={setName}
        error={error ?? undefined}
      />
      <Select
        label="Tipo"
        aria-label="Tipo"
        options={[
          { value: 'expense', label: 'Gasto' },
          { value: 'income', label: 'Entrada' },
        ]}
        value={kind}
        onChange={(value) => {
          setKind(value as CategoryKind)
        }}
      />
      <Button
        type="submit"
        variant="primary"
        loading={createCategory.isPending}
      >
        Criar
      </Button>
    </form>
  )
}

export function CategoriesPage() {
  const categoriesQuery = useCategories()

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Categorias</h2>

      <NewCategoryForm />

      {categoriesQuery.isPending ? (
        <p className="text-slate-600">Carregando...</p>
      ) : null}
      {categoriesQuery.isError ? (
        <p className="text-red-600">Não foi possível carregar as categorias.</p>
      ) : null}

      <ul>
        {(categoriesQuery.data ?? []).map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </ul>
    </div>
  )
}
