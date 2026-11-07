/**
 * Importa um backup exportado pelo app (Configurações → Backup) num banco
 * LOCAL, só para conferência — nunca contra o banco remoto. Como o export
 * é feito pelo navegador (sujeito a RLS), ele não inclui `auth.users`;
 * por isso desligamos a checagem de FK/triggers durante a importação
 * (`session_replication_role = replica`), igual a uma restauração real
 * faria antes de recriar os usuários.
 *
 * Uso: npm run import-backup -- caminho/para/backup.json
 */
import { readFileSync } from 'node:fs'

import { Client } from 'pg'

interface HouseholdBackup {
  exportedAt: string
  household: Record<string, unknown>
  profiles: Record<string, unknown>[]
  categories: Record<string, unknown>[]
  recurringBills: Record<string, unknown>[]
  transactions: Record<string, unknown>[]
  goals: Record<string, unknown>[]
}

const DEFAULT_LOCAL_DB_URL =
  'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

function assertLocalDatabase(url: string): void {
  if (!url.includes('127.0.0.1') && !url.includes('localhost')) {
    throw new Error(
      `Este script só importa em um banco local (127.0.0.1/localhost). URL recebida: ${url}`,
    )
  }
}

async function upsert(
  client: Client,
  table: string,
  rows: Record<string, unknown>[],
): Promise<void> {
  for (const row of rows) {
    const columns = Object.keys(row)
    const values = columns.map((column) => row[column])
    const placeholders = columns
      .map((_, index) => `$${String(index + 1)}`)
      .join(', ')
    const updateSet = columns
      .filter((column) => column !== 'id')
      .map((column) => `${column} = excluded.${column}`)
      .join(', ')

    await client.query(
      `insert into public.${table} (${columns.join(', ')}) values (${placeholders})
       on conflict (id) do update set ${updateSet}`,
      values,
    )
  }
}

async function main(): Promise<void> {
  const filePath = process.argv[2]
  if (filePath === undefined) {
    console.error('Uso: npm run import-backup -- caminho/para/backup.json')
    process.exitCode = 1
    return
  }

  const databaseUrl = process.env.SUPABASE_DB_URL ?? DEFAULT_LOCAL_DB_URL
  assertLocalDatabase(databaseUrl)

  const backup = JSON.parse(readFileSync(filePath, 'utf8')) as HouseholdBackup

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  try {
    await client.query('BEGIN')
    await client.query('SET session_replication_role = replica')

    await upsert(client, 'households', [backup.household])
    await upsert(client, 'profiles', backup.profiles)
    await upsert(client, 'categories', backup.categories)
    await upsert(client, 'recurring_bills', backup.recurringBills)
    await upsert(client, 'transactions', backup.transactions)
    await upsert(client, 'goals', backup.goals)

    await client.query('COMMIT')

    console.log(
      `Importado (exportado em ${backup.exportedAt}): ` +
        `${String(backup.profiles.length)} perfis, ` +
        `${String(backup.categories.length)} categorias, ` +
        `${String(backup.recurringBills.length)} contas recorrentes, ` +
        `${String(backup.transactions.length)} lançamentos, ` +
        `${String(backup.goals.length)} metas.`,
    )
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

await main()
