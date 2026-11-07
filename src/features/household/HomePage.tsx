import { Button, Card } from '@single-ui/react'

import { useLogout } from '../auth/useLogout'
import { ProfileCard } from './ProfileCard'
import { useHousehold } from './useHousehold'
import { useProfile } from './useProfile'

export function HomePage() {
  const profileQuery = useProfile()
  const householdQuery = useHousehold(profileQuery.data?.household_id)
  const logout = useLogout()

  if (profileQuery.isPending || householdQuery.isPending) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-600">Carregando...</p>
      </main>
    )
  }

  if (profileQuery.isError || householdQuery.isError) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-50 p-6">
        <p className="text-red-600">
          Não foi possível carregar os dados da casa. Tente novamente mais
          tarde.
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-svh bg-slate-50 p-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Card title={householdQuery.data.name} bordered>
          <p className="text-slate-600">
            Projeto em construção. As funcionalidades chegam nas próximas fases.
          </p>
        </Card>
        <Card title="Seu perfil" bordered>
          <ProfileCard key={profileQuery.data.id} profile={profileQuery.data} />
        </Card>
        <Button
          variant="secondary"
          onClick={() => {
            void logout()
          }}
        >
          Sair
        </Button>
      </div>
    </main>
  )
}
