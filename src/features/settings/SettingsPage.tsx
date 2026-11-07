import { Card } from '@single-ui/react'

import { BackupSection } from '../backup/BackupSection'
import { CategoriesPage } from '../categories/CategoriesPage'
import { ProfileCard } from '../household/ProfileCard'
import { useProfile } from '../household/useProfile'

export function SettingsPage() {
  const profileQuery = useProfile()

  return (
    <div className="flex flex-col gap-4">
      <Card title="Seu perfil" bordered>
        {profileQuery.data ? (
          <ProfileCard key={profileQuery.data.id} profile={profileQuery.data} />
        ) : null}
      </Card>

      <Card title="Backup" bordered>
        <BackupSection />
      </Card>

      <CategoriesPage />
    </div>
  )
}
