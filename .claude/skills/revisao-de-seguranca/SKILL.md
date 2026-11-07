---
name: revisao-de-seguranca
description: Use para revisar qualquer PR/mudança antes de considerá-la pronta — checklist de chaves, RLS, inputs, dependências e CSP. Também use antes de um supabase db push.
---

## Objetivo

Checklist de segurança para qualquer mudança neste repositório **público**
com dados financeiros reais. Não é sobre uma feature específica — é sobre
revisar qualquer uma delas antes de aprovar.

## Checklist

### Segredos

- [ ] Nenhum `.env` com valor real foi lido, impresso ou commitado. Só
      `.env.example` (placeholders) e `.env.test` (placeholders falsos,
      usados só pelos testes) têm permissão de ir para o git.
- [ ] Nenhuma chave `sb_secret_...`/`service_role` aparece em código do
      frontend, variável `VITE_*`, log ou mensagem de commit.
- [ ] `gitleaks` passou (`npx lefthook run pre-commit` localmente, ou o job
      `gitleaks` do CI) — ele roda automaticamente no pre-commit e no CI,
      mas vale rodar manualmente (`gitleaks detect --source . --no-git`) se
      algo parecer suspeito.

### Banco de dados / RLS

- [ ] Toda tabela nova em `public` tem RLS ativado e política para
      `authenticated` usando `private.is_household_member(household_id)`
      (veja a skill `migrations-e-rls`).
- [ ] Nenhuma política de `delete` em tabela de dados; privilégio de
      `DELETE` revogado de `authenticated`.
- [ ] `anon` continua sem nenhum privilégio (o teste
      `01_household_isolation.sql` cobre isso — rode `npm run test:db`).
- [ ] Nenhuma foreign key de dado financeiro usa `on delete cascade`.
- [ ] Nenhuma migration tem `drop table`/`drop column`/`truncate`/`delete`
      sem pedido explícito e backup confirmado.
- [ ] `supabase db push --remote` só foi (ou será) rodado porque o usuário
      pediu explicitamente, na mensagem atual — nunca por iniciativa própria.

### Entrada de dados

- [ ] Todo valor monetário passa por `src/lib/money.ts`
      (`parseMoney`/`Number.isSafeInteger`), nunca `float`.
- [ ] Toda validação de formulário tem equivalente no banco (check
      constraint, índice único) — o cliente pode ser contornado, o banco
      não.
- [ ] Nenhum HTML não confiável é injetado via `dangerouslySetInnerHTML`
      ou equivalente.

### Dependências e CI

- [ ] `npm audit` revisado para dependências novas (vulnerabilidade só em
      ferramenta de dev, sem caminho até o bundle de produção, é aceitável;
      documentar a decisão se for ignorar algo).
- [ ] Nenhum script de instalação (`postinstall` etc.) de pacote novo foi
      aprovado sem checar o que ele faz (`npm install-scripts ls`).
- [ ] CI (`lint`, `typecheck`, `test`, `test-db`, `gitleaks`) está verde.

### Deploy

- [ ] `vercel.json` ainda tem CSP restrita ao próprio domínio +
      `https://*.supabase.co`, `X-Frame-Options: DENY`,
      `Referrer-Policy: strict-origin-when-cross-origin`,
      `Permissions-Policy` mínima (veja a skill `deploy`).

### Backup

- [ ] Mudança que altera o formato dos dados (nova coluna, nova tabela) foi
      refletida em `src/features/backup/backupData.ts` e em
      `docs/restore.md` se relevante.

## Armadilhas conhecidas

- Uma vulnerabilidade de dependência "moderada" em ferramenta de build
  (ex.: ESLint/minimatch) não é o mesmo risco que uma no bundle do
  navegador — avalie o caminho de exploração antes de bloquear por isso.
- `npm install-scripts approve <pacote>` é permanente para aquele pacote —
  só aprove pacotes conhecidos (ex.: `esbuild`, `lefthook`, `core-js`) ou
  depois de checar o que o script faz.
- Gitleaks pode sinalizar falso positivo em texto de documentação que
  parece uma chave (ex.: um exemplo de connection string) — confirme que é
  mesmo falso antes de adicionar a um allowlist.

## Quando usar

- Antes de aprovar qualquer PR.
- Antes de rodar `supabase db push --remote`.
- Antes de qualquer deploy para produção.
- Depois de adicionar uma dependência nova.
