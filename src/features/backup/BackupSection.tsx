import { Button } from '@single-ui/react'
import { useState } from 'react'

import { downloadTextFile } from '../../lib/downloadFile'
import { useHouseholdId } from '../household/useHouseholdId'
import { buildTransactionsCsv, fetchHouseholdBackup } from './backupData'

export function BackupSection() {
  const householdId = useHouseholdId()
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    if (householdId === undefined) return
    setIsExporting(true)
    setError(null)

    try {
      const backup = await fetchHouseholdBackup(householdId)
      const dateStamp = backup.exportedAt.slice(0, 10)

      downloadTextFile(
        `aonde-vai-meu-dinheiro-backup-${dateStamp}.json`,
        JSON.stringify(backup, null, 2),
        'application/json',
      )

      const categoriesById = new Map(
        backup.categories.map((category) => [category.id, category]),
      )
      const profilesById = new Map(
        backup.profiles.map((profile) => [profile.id, profile]),
      )
      downloadTextFile(
        `aonde-vai-meu-dinheiro-lancamentos-${dateStamp}.csv`,
        buildTransactionsCsv(backup.transactions, categoriesById, profilesById),
        'text/csv',
      )
    } catch {
      setError('Não foi possível gerar o backup. Tente de novo.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-stone-400">
        Baixa um arquivo com tudo da casa (lançamentos, contas, metas,
        categorias) em JSON, e um CSV só com os lançamentos. Guarde esse arquivo
        num lugar seguro — ele contém dados financeiros reais.
      </p>
      <Button
        variant="secondary"
        className="mt-3"
        loading={isExporting}
        onClick={() => {
          void handleExport()
        }}
      >
        Baixar backup
      </Button>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
