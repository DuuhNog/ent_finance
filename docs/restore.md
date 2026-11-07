# Restaurar um backup

O backup diário (gerado pelo workflow em `ops/backup-workflow/`, rodando no
repositório privado) é um dump SQL dos schemas `public` e `private`
(a aplicação inteira: tabelas, funções, dados), comprimido e criptografado
com [`age`](https://github.com/FiloSottile/age). Ele **não** inclui os
schemas internos do Supabase (`auth`, `storage`, etc.) — um projeto novo já
vem com eles.

## 1. Baixar e descriptografar

1. No repositório **privado**, vá em **Actions**, abra a execução do dia
   desejado e baixe o artifact `supabase-backup-AAAA-MM-DD` (um `.zip`).
2. Descompacte o `.zip` — dentro tem um arquivo `.sql.gz.age`.
3. Descriptografe com a chave privada gerada no setup do workflow
   (`backup-key.txt`):

   ```bash
   age -d -i backup-key.txt -o backup.sql.gz supabase-backup-AAAA-MM-DD.sql.gz.age
   gunzip backup.sql.gz
   ```

   Você deve terminar com um arquivo `backup.sql` de texto puro (SQL).

## 2. Teste de restauração num Supabase local (faça isso a cada 3 meses)

Isso só confere se o backup é válido — não mexe em produção nem precisa de
rede além do Docker.

```bash
supabase start    # sobe um Postgres local (efêmero) com as migrations atuais
```

O dump recria as tabelas do zero (`create table ...`), então primeiro apague
o schema que `supabase start` já criou via migrations — senão a restauração
falha com "relation already exists":

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
  drop schema public cascade;
  drop schema if exists private cascade;
  create schema public;
"
```

Agora restaure. O dump tem lançamentos referenciando `auth.users` (quem
lançou cada um) que não existem nesse banco local vazio — para a
restauração não falhar nessas referências, desligue a checagem de chave
estrangeira só durante a carga (igual a `scripts/import-backup.ts` faz):

```bash
{ echo "SET session_replication_role = replica;"; cat backup.sql; } > /tmp/restore.sql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f /tmp/restore.sql
```

> Não use `\i backup.sql` dentro de outro script para isso — nos nossos
> testes o `SET` não "grudou" na sessão do jeito esperado. Concatenar os
> arquivos antes, como acima, funciona de forma confiável.

Depois, confira no **Studio local** (`http://127.0.0.1:54323`) se as
tabelas (`households`, `transactions`, etc.) têm os dados esperados. Rode
`supabase stop` quando terminar.

### Checklist do teste trimestral

- [ ] O arquivo do dia mais recente descriptografa sem erro.
- [ ] `psql -f backup.sql` roda até o fim sem erro contra um banco local
      limpo.
- [ ] O número de lançamentos no backup bate (aproximadamente) com o que
      você espera ver no app.
- [ ] Você ainda tem acesso a `backup-key.txt` (chave privada do `age`) —
      sem ela, nenhum backup pode ser descriptografado.
- [ ] Os secrets `SUPABASE_DB_URL` e `AGE_PUBLIC_KEY` no repositório
      privado ainda estão corretos (a senha do banco não mudou).

Marque a data deste teste em algum lugar (calendário, nota) para lembrar do
próximo em 3 meses.

## 3. Restauração de verdade, num projeto novo (cenário de desastre)

Use isto só se o projeto Supabase original foi perdido de verdade.

1. Crie um **novo projeto** no Supabase (mesma região, de preferência).
2. Pegue a **connection string direta** do novo projeto (Project Settings →
   Database → Connection string → **URI**, não o pooler desta vez).
3. Restaure o dump nele, desligando a checagem de chave estrangeira durante
   a carga (os lançamentos referenciam usuários que você ainda vai recriar
   no passo 5):

   ```bash
   { echo "SET session_replication_role = replica;"; cat backup.sql; } > /tmp/restore.sql
   psql "<connection-string-do-projeto-novo>" -f /tmp/restore.sql
   ```

4. No painel do novo projeto, confira que as tabelas apareceram em **Table
   Editor** e que cada uma mostra **RLS enabled** (se alguma aparecer como
   "Unrestricted", pare e não use o app até corrigir — normalmente significa
   que o dump não trouxe as policies por algum motivo; compare com as
   migrations em `supabase/migrations/`).
5. Recrie os dois usuários em **Authentication → Users** (o dump não inclui
   `auth.users` — eles não fazem parte dos schemas `public`/`private`). O
   Supabase sempre gera um `id` novo, mesmo com o mesmo e-mail de antes —
   então depois de criar os dois, atualize as referências antigas pelo SQL
   Editor usando o e-mail para achar o `id` novo:

   ```sql
   update profiles set id = (select id from auth.users where email = 'voce@email.com')
     where id = '<id-antigo-de-voce>';
   update household_members set user_id = (select id from auth.users where email = 'voce@email.com')
     where user_id = '<id-antigo-de-voce>';
   -- repita para o e-mail da sua esposa, e para created_by em categories/
   -- recurring_bills/transactions/goals/audit_log se quiser manter o
   -- histórico de "quem lançou" correto (não é obrigatório para o app
   -- funcionar, já que created_by não tem mais FK quebrada depois do passo
   -- acima recriar as linhas de auth.users).
   ```

   (Para achar os `id`s antigos: eles estavam em `profiles`/
   `household_members` antes de rodar os `update`s acima — rode um
   `select` neles primeiro se não tiver anotado.)

6. Atualize `.env.local` (ou as variáveis de ambiente na Vercel) com a nova
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
7. Rode `supabase link --project-ref <novo-ref>` localmente, para as
   próximas migrations irem para o projeto certo.
8. Confira `supabase migration list --remote`: como o dump já criou as
   tabelas diretamente (sem passar pelo histórico de migrations do CLI), a
   lista pode aparecer vazia ou dessincronizada. Use
   `supabase migration repair` para marcar as migrations já aplicadas como
   tal, comparando com `supabase/migrations/` — assim migrations futuras não
   tentam recriar tabelas que já existem.

## Por que não existe backup automático do próprio Supabase

O plano gratuito do Supabase não inclui backup automático — por isso esse
workflow existe. Se o projeto virar um plano pago no futuro, o Supabase
passa a oferecer backups próprios (PITR), mas vale manter este workflow como
uma segunda cópia independente mesmo assim.
