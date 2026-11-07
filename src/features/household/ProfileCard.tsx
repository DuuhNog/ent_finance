import { Button, Input } from '@single-ui/react'
import { useState } from 'react'
import type { FormEvent } from 'react'

import type { Database } from '../../lib/supabase/database.types'
import { useUpdateDisplayName } from './useProfile'

type Profile = Database['public']['Tables']['profiles']['Row']

// O pai passa `key={profile.id}` para remontar este formulário (e reiniciar
// o estado local a partir de `profile.display_name`) caso o perfil mude.
export function ProfileCard({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [error, setError] = useState<string | null>(null)
  const updateDisplayName = useUpdateDisplayName()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const trimmed = displayName.trim()

    if (trimmed.length === 0) {
      setError('O nome não pode ficar vazio.')
      return
    }

    updateDisplayName.mutate(
      { id: profile.id, displayName: trimmed },
      {
        onError: () => {
          setError('Não foi possível salvar. Tente de novo.')
        },
      },
    )
  }

  return (
    <form className="flex items-end gap-3" onSubmit={handleSubmit}>
      <Input
        label="Seu nome de exibição"
        aria-label="Seu nome de exibição"
        value={displayName}
        onChange={(value) => {
          setDisplayName(value)
        }}
        error={error ?? undefined}
      />
      <Button
        type="submit"
        variant="secondary"
        loading={updateDisplayName.isPending}
      >
        Salvar
      </Button>
    </form>
  )
}
