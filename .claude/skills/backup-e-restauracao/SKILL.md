---
name: backup-e-restauracao
description: Use ao mexer na exportação de backup do app, no script de importação, no workflow de backup diário, ou no procedimento de restauração.
---

## Objetivo

Como o plano gratuito do Supabase não tem backup automático, o projeto tem
três camadas: exportação manual pelo app, workflow diário automático (num
repositório privado separado) e um script para conferir um backup
localmente.

## Regras de negócio

- Exportação no app: um botão em Configurações baixa um JSON completo da
  casa (inclusive arquivado/excluído — um backup precisa poder restaurar o
  estado completo) e um CSV só dos lançamentos.
- Backup diário automático **num repositório PRIVADO separado**, nunca
  neste repositório público: `pg_dump` pelo Session Pooler, comprimido,
  criptografado com `age`, guardado como artifact do GitHub Actions com
  retenção de 90 dias.
- Nenhuma migration pode ter `drop table`/`drop column`/`truncate`/`delete`
  sem pedido explícito e backup recente confirmado.

## Arquivos envolvidos

- `src/features/backup/backupData.ts` — `fetchHouseholdBackup` (busca tudo
  da casa, sem filtrar soft-deleted/arquivado) e `buildTransactionsCsv`.
- `src/lib/csv.ts` — conversão genérica para CSV (RFC 4180), pura e testada.
- `src/lib/downloadFile.ts` — dispara o download no navegador.
- `src/features/backup/BackupSection.tsx` — botão em
  `src/features/settings/SettingsPage.tsx`.
- `scripts/import-backup.ts` — importa o JSON exportado num banco **local**
  (nunca remoto — tem uma checagem que recusa rodar contra qualquer URL que
  não contenha `127.0.0.1`/`localhost`), só para conferência.
- `ops/backup-workflow/` — o workflow do GitHub Actions e o README para
  copiar ao repositório privado.
- `docs/restore.md` — o procedimento de restauração (teste trimestral local
  - cenário de desastre num projeto novo) e o checklist.

## Passo a passo

1. Mudança no que é exportado: `fetchHouseholdBackup` busca uma tabela por
   vez via `Promise.all`; adicionar uma tabela nova ao export é adicionar
   uma busca ali e no tipo `HouseholdBackup`.
2. O export roda com a sessão RLS do usuário (publishable key) — ele só
   consegue exportar a própria casa, nunca `auth.users` (não dá pra ler
   isso pelo cliente, e por isso o restore precisa recriar os usuários à
   parte, veja `docs/restore.md`).
3. Mudança no `scripts/import-backup.ts`: ele desliga checagem de FK/trigger
   (`session_replication_role = replica`) durante a importação, porque
   `profiles`/`transactions.created_by` referenciam `auth.users`, que não
   existe no banco local de conferência. Teste rodando contra um
   `supabase start` efêmero de verdade antes de confiar na mudança.

## Testes obrigatórios

- `src/lib/csv.test.ts` — escaping de vírgula, aspas, quebra de linha.
- `src/features/backup/backupData.test.ts` — `buildTransactionsCsv` com
  casos manuais (parcela, conta do mês, excluído).
- Antes de mudar `scripts/import-backup.ts` ou o workflow de backup, teste
  manualmente contra um `supabase start` efêmero (não tem teste automatizado
  pra isso ainda) — veja em Armadilhas o `session_replication_role`.

## Armadilhas conhecidas

- **Restaurar um dump completo não funciona direto contra um banco que já
  rodou as migrations** (`supabase db reset` cria as tabelas; o dump tenta
  criar de novo e falha com "relation already exists"). Para testar
  restauração, apague `public`/`private` primeiro
  (`drop schema public cascade; create schema public;`) e só depois
  restaure.
- **O dump não inclui `auth.users`** (schemas exportados são só `public` e
  `private`) — restaurar direto falha nas FKs de `created_by`/`profiles.id`
  a menos que `session_replication_role = replica` esteja ativo durante a
  carga. Depois da restauração de verdade (projeto novo), os usuários
  precisam ser recriados e os `id`s antigos remapeados (ver
  `docs/restore.md`, passo 5) — o Supabase sempre gera um `id` novo, nunca
  reusa o antigo mesmo com o mesmo e-mail.
- Nunca commitar um arquivo de backup de verdade neste repositório —
  `.gitignore` já bloqueia `*.sql.gz`/`*.dump`/`*.age`, mas confira antes de
  um `git add -A` se não sobrou nada assim.

## Checklist de pronto

- [ ] `npm test` passa (CSV e backupData cobertos).
- [ ] Testado manualmente contra `supabase start` efêmero se mexeu em
      `import-backup.ts` ou no formato do export.
- [ ] `docs/restore.md` atualizado se o formato do backup mudou.
- [ ] Nada sensível commitado.
