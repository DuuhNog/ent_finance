---
name: migrations-e-rls
description: Use ao criar ou alterar uma migration, mexer em RLS/políticas, escrever um teste pgTAP, gerar tipos, ou antes de rodar supabase db push.
---

## Objetivo

Como este projeto não mantém banco local de desenvolvimento (só o projeto
remoto + Docker efêmero para teste), toda migration precisa estar correta
e testada **antes** de ir para o remoto — não há rede de segurança depois.

## Regras de negócio

- Migrations são sempre **aditivas**: nenhum `drop table`, `drop column`,
  `truncate` ou `delete` sem pedido explícito do usuário e backup recente
  confirmado.
- RLS ativado em todas as tabelas do schema `public`. Papel `anon` sem
  nenhum privilégio. Padrão de política para tabela de dados: `select`,
  `insert`, `update` para `authenticated` usando
  `private.is_household_member(household_id)`; **nunca** política de
  `delete` (soft delete via `update`).
- `households`/`household_members`: sem nenhuma escrita pelo cliente.
  Membros só são adicionados via `private.create_household`, rodada no SQL
  Editor do painel.
- `audit_log`: preenchido só pelo trigger `security definer`
  `private.write_audit_log`, nunca escrito pelo cliente.
- Foreign keys de dados financeiros: `on delete restrict`, nunca `cascade`.

## Arquivos envolvidos

- `supabase/migrations/*.sql` — ordem importa (prefixo de timestamp). Uma
  função que depende de uma tabela só pode ser criada **depois** dela (já
  aconteceu aqui: `private.is_household_member` tentou ser criada antes de
  `household_members` existir — veja Armadilhas).
- `supabase/tests/*.sql` — testes pgTAP, um arquivo por preocupação
  (isolamento entre casas, delete negado, checks de valor, etc.).
- `supabase/seed.sql` — só funções auxiliares de teste (schema `tests`,
  `tests.authenticate_as`/`tests.create_user`); nunca vai para o remoto
  (`db push` só inclui com `--include-seed`, que nunca usamos).
- `vite.config.ts`/CI (`test-db` job) — `supabase test db` roda os testes
  pgTAP contra Postgres efêmero via Docker.

## Passo a passo

1. Escreva a migration nova com `npx supabase migration new <nome>`.
2. Escreva o teste pgTAP correspondente em `supabase/tests/`.
3. Rode `npx supabase start` (sobe Docker local, efêmero, só para validar),
   confira que a migration aplica sem erro, rode `npm run test:db`.
4. `npx supabase stop` depois — não deixe rodando como banco de
   desenvolvimento.
5. Só depois disso peça para o usuário rodar (ou peça permissão explícita
   para rodar você mesmo, na mensagem atual) `supabase db push --remote`.
   Nunca rode isso por conta própria sem pedido explícito naquela mensagem.
6. Depois do push, gere os tipos:
   `supabase gen types typescript --remote=<ref> > src/lib/supabase/database.types.ts`.

## Testes obrigatórios (mínimo, do PROMPT.md)

- Usuário membro da casa 1 lê/escreve dados da casa 1; usuário de outra
  casa não vê nem altera nada da casa 1.
- Papel `anon` não lê nada.
- `delete` negado para `authenticated`.
- Não dá para mudar `household_id` de um lançamento para uma casa da qual
  não se é membro.
- Índice único impede pagar a mesma conta duas vezes no mês.
- Checks de valor rejeitam zero, negativo e acima do limite.
- `create_installment_purchase` cria N linhas cuja soma é o total; falha
  inteira se um parâmetro for inválido.
- Toda alteração gera linha em `audit_log`.

## Armadilhas conhecidas

- **Ordem de criação:** uma função/policy que referencia uma tabela precisa
  vir depois dela na ordem dos arquivos.
- **`GENERATED ALWAYS AS` exige expressão `IMMUTABLE`:**
  `date_trunc('month', data)` não é immutable o suficiente para Postgres
  aceitar numa coluna gerada — use aritmética pura
  (`data - (dia - 1)`) em vez disso.
- **`authenticated` precisa de `GRANT USAGE` no schema, não só `EXECUTE` na
  função:** uma RPC `security invoker` que chama
  `private.is_household_member(...)` falha com "permission denied for
  schema private" na primeira execução de cada sessão, mesmo com
  `EXECUTE` concedido na função — porque o PL/pgSQL compila o plano da
  primeira execução sob o role que chamou, e isso exige `USAGE` no schema
  (diferente de uma política de RLS, que já vem com o nome resolvido desde
  a criação). Teve que ser corrigido com `grant usage on schema private to
authenticated;`.
- **`SET ROLE`/`RESET ROLE` são proibidos dentro de função `SECURITY
DEFINER`** — por isso os helpers de teste
  (`tests.authenticate_as`/`tests.authenticate_as_anon` em `seed.sql`) são
  funções normais (sem `security definer`), e usam `RESET ROLE` (sempre
  permitido, volta pro role da sessão) antes de trocar de novo.
- **`supabase test db` não sobe o Postgres local sozinho** — ele só conecta
  no stack que já estiver rodando (`supabase start`). Chamar `supabase test
db` direto, sem `supabase start` antes, falha com erro de conexão
  recusada. Por isso `npm run test:db` já é `supabase start && (supabase
test db; ...; supabase stop; exit $code)` — não simplifique isso de volta
  para só `supabase test db`, nem no CI.
- **`supabase stop` guarda um "backup" do estado atual do banco para o
  próximo `start` ser mais rápido, e esse `start` seguinte pode não aplicar
  uma migration nova em cima do backup** (aconteceu de verdade: escrevi uma
  migration nova corrigindo um problema de segurança, `supabase start`
  restaurou do backup sem sequer listar "Applying migration ..." para o
  arquivo novo, e os testes pgTAP falharam porque a correção não estava no
  banco — não porque a correção estivesse errada). Dois efeitos do mesmo
  mecanismo de backup:
  1. Depois de criar/editar uma migration, rode `supabase db reset` (não só
     confie em `supabase start`) antes de rodar os testes — só `db reset`
     garante que todas as migrations foram reaplicadas.
  2. Dados de teste manual (ex.: uma casa de demonstração criada à mão para
     tirar print) ficam "grudados" e aparecem nos testes pgTAP seguintes se
     o nome colidir com uma fixture do teste (já aconteceu: uma casa "Nossa
     casa" criada manualmente inflou a contagem de membros/categorias do
     teste `07_create_household.sql`). `supabase db reset` resolve os dois
     casos.
- **`\i arquivo.sql` dentro de outro script não "gruda" um `SET` anterior
  do jeito esperado** (visto na prática ao testar restauração de backup) —
  concatene os arquivos antes de rodar com `psql -f`, não use `\i` para
  isso.
- Parâmetro de RPC como `smallint` pode impedir a função de ser chamada com
  literais numéricos simples — veja a skill `parcelamento-cartao`.

## Checklist de pronto

- [ ] `npm run test:db` passa.
- [ ] Migration só aditiva (sem `drop`/`truncate`/`delete` de verdade).
- [ ] RLS ativado e testado (select/insert/update para membro, bloqueado
      para não-membro e para `anon`).
- [ ] Tipos TS regerados depois do push.
