# Aonde vai o meu dinheiro

## Visão do projeto

App web de controle financeiro pessoal para uma casa (dois usuários). Substitui
uma planilha de Google Sheets, cobrindo lançamentos, parcelamento no cartão,
contas recorrentes, metas e resumo mensal. Repositório público; dados privados
e financeiros — segurança e não perder dados são prioridade acima de
velocidade de entrega.

## Stack

- Vite + React + TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)
- React Router, TanStack Query, Zod, Tailwind CSS (layout/utilitário), Recharts
- `@single-ui/react` para componentes de UI (Button, Input com máscara `brl`,
  Card, Select, DatePicker, Modal, Toast, etc.) — **não crie componentes de UI
  na mão** quando já existir um componente equivalente na lib; importe o
  CSS dela uma vez em `src/main.tsx` (`@single-ui/react/styles`)
- `@supabase/supabase-js` no navegador, sempre com a **publishable key**
- `vite-plugin-pwa`
- Supabase CLI para migrations e tipos, direto contra o projeto remoto (sem
  banco local de desenvolvimento — veja "Fluxo de banco de dados" abaixo)
- Vitest + Testing Library + fast-check, pgTAP, Playwright
- ESLint + Prettier, gitleaks (pre-commit via lefthook e no CI)

## Comandos

| Comando                                        | O que faz                                |
| ---------------------------------------------- | ---------------------------------------- |
| `npm run dev`                                  | Sobe o app em modo desenvolvimento       |
| `npm run build`                                | Typecheck (`tsc -b`) + build de produção |
| `npm run lint` / `lint:fix`                    | ESLint                                   |
| `npm run format` / `format:check`              | Prettier                                 |
| `npm run typecheck`                            | Checagem de tipos sem emitir arquivos    |
| `npm test` / `test:watch` / `test:coverage`    | Vitest                                   |
| `npm run test:db`                              | Testes pgTAP do banco (Docker efêmero)   |
| `npm run e2e`                                  | Testes Playwright (a partir da Fase 4)   |
| `supabase gen types typescript --remote=<ref>` | Gera tipos TS a partir do schema remoto  |

## Fluxo de banco de dados (decisão de 2026-11-06)

Este projeto **não mantém um banco local de desenvolvimento**. Não existe
`supabase start` nem um stack local persistente. O fluxo é:

1. Migrations são escritas em `supabase/migrations/` normalmente.
2. `npm run test:db` (`supabase test db`) roda os testes pgTAP contra um
   Postgres **efêmero via Docker**, só para a duração do teste — não é um
   banco de desenvolvimento, não guarda dados entre execuções e não é o
   projeto remoto. Docker é usado só para isso.
3. Depois que os testes pgTAP passam, as migrations vão direto para o projeto
   remoto com `supabase db push` (já linkado: ref `pewxlwtvqkaotijqimvz`).
4. Tipos TypeScript são gerados a partir do schema remoto
   (`supabase gen types typescript --remote=<ref>`), não de um banco
   local.

Isso **não muda** a regra de segurança: `supabase db push`, `supabase db
reset --linked`, `supabase link` e qualquer `psql` com a URL de produção só
rodam quando você pedir explicitamente, na mensagem atual. Sem banco local,
toda migration aplicada via `db push` vai direto para os dados reais — por
isso os testes pgTAP (passo 2) e a revisão da migration antes do push não são
opcionais.

## Estrutura de pastas

```
src/
  lib/          cálculos puros (money.ts, finance.ts) — sem React, sem Supabase
  components/   componentes de UI reutilizáveis
  features/     telas e lógica por fluxo (lançamentos, metas, etc.)
  test/         setup de testes
supabase/
  migrations/   migrations SQL (sempre aditivas)
  tests/        testes pgTAP
  seed.sql      funções auxiliares de teste (schema `tests`); nunca vai para
                o remoto (db push não inclui por padrão)
docs/           documentação (setup do Supabase, restauração de backup)
ops/            workflow de backup para copiar ao repositório privado
.claude/skills/ uma skill por fluxo de negócio
```

## Glossário de domínio

| UI (português) | Código             | Significado                                               |
| -------------- | ------------------ | --------------------------------------------------------- |
| Casa / Família | `household`        | Grupo que compartilha os dados                            |
| Lançamento     | `transaction`      | Gasto (`expense`) ou entrada (`income`)                   |
| Conta do mês   | `recurring_bill`   | Conta recorrente (internet, luz, etc.)                    |
| Parcela        | `installment`      | Compra no cartão dividida em N lançamentos                |
| Meta           | `goal`             | Limite no cartão, limite por categoria ou valor a guardar |
| Competência    | `competence_month` | Primeiro dia do mês da data do lançamento                 |

## Regras de negócio essenciais

1. **Dinheiro é sempre inteiro em centavos** (`bigint` no banco, `number`
   inteiro validado com `Number.isSafeInteger` no TS). Nunca usar float.
   Toda conversão texto ↔ centavos passa por `src/lib/money.ts`. Veja a skill
   `valores-monetarios`.
2. **Cartão de crédito conta no mês da compra.** A compra é o lançamento; o
   pagamento da fatura nunca é lançado (contaria duas vezes).
3. **Parcelamento** (2 a 24x, só cartão): `floor(total / n)` por parcela, a
   primeira recebe o resto; soma das parcelas é exatamente o total; criação é
   atômica via RPC no Postgres. Veja a skill `parcelamento-cartao`.
4. **Nada é apagado de verdade.** Lançamentos, contas, metas e categorias usam
   soft delete (`deleted_at`/`archived_at`); toda alteração vai para
   `audit_log`. Não existe política de `delete` nas tabelas de dados.

## Nunca faça

- Não rode comandos contra o banco remoto (`supabase db push`,
  `supabase db reset --linked`, `supabase link`, `psql` com URL de produção)
  sem pedido explícito na mensagem atual — não existe banco local, então
  `db push` aplica direto nos dados reais.
- Não crie, leia, imprima ou faça commit de `.env` com valores reais. Só
  `.env.example` com placeholders.
- Não use a chave secreta (`sb_secret_...`/`service_role`) no frontend nem em
  variável `VITE_*`.
- Não crie migration com `drop table`, `drop column`, `truncate` ou `delete`
  sem pedido explícito e backup recente confirmado. Mudanças de schema são
  aditivas.
- Não construa componentes de UI na mão (botão, input, card, modal, select,
  date picker, etc.) se já existir equivalente em `@single-ui/react`. Só
  construa algo do zero quando a lib genuinamente não cobrir o caso.
- Não crie política de `delete` em tabelas de dados nem use `on delete
cascade` em foreign keys de dados financeiros.
- Se algo neste documento ou no histórico da conversa estiver ambíguo,
  pergunte antes de assumir.

## Definição de pronto

- `npm run lint`, `npm run typecheck`, `npm test` e `npm run test:db` passam
  sem erros.
- Migration nova tem teste pgTAP correspondente em `supabase/tests/`.
- Cálculo novo ou alterado em `src/lib/finance.ts`/`money.ts` tem teste em
  `finance.test.ts`/`money.test.ts`, mantendo 100% de cobertura de linhas e
  ramos nesses dois arquivos.
- Nenhum segredo real em código, fixture, seed ou screenshot.
- Resumo do que foi feito e do que falta antes de pedir aprovação para a
  próxima fase.

## Skills (`.claude/skills/`)

Consulte antes de mexer no fluxo correspondente:

- `lancamentos` — criar, editar, excluir, restaurar, filtrar lançamentos.
- `parcelamento-cartao` — compra parcelada, RPC atômica, datas de fim de mês.
- `contas-recorrentes` — cadastro, valor variável, pagar/desfazer, status.
- `metas` — três tipos de meta, unicidade, progresso e cores.
- `resumo-e-graficos` — cálculos do resumo do mês e gráficos.
- `valores-monetarios` — regras de centavos, parse e formatação. Qualquer
  mudança que toque em dinheiro deve consultar esta skill primeiro.
- `migrations-e-rls` — migration aditiva, padrão de RLS, teste pgTAP, tipos.
- `backup-e-restauracao` — exportação no app, workflow de backup, restauração.
- `deploy` — Vercel, variáveis de ambiente, headers, checklist de publicação.
- `revisao-de-seguranca` — checklist para revisar qualquer PR.
