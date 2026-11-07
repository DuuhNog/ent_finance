---
name: lancamentos
description: Use ao criar, editar, excluir (soft) ou restaurar lançamentos (gastos/entradas), ao mexer nos filtros da lista de lançamentos, ou em qualquer coisa que mostre "quem lançou".
---

## Objetivo

Lançamento (`transaction`) é um gasto ou uma entrada. Esta skill cobre o
CRUD básico (sem parcelamento, que tem skill própria), a lixeira (soft
delete/restore), os filtros da lista e a exibição de quem lançou.

## Regras de negócio

- Regra 1: dinheiro em centavos, sempre via `src/lib/money.ts` — veja a
  skill `valores-monetarios`.
- Regra 4: cartão de crédito conta no mês da compra (`occurred_on`); o
  pagamento da fatura nunca vira lançamento.
- Regra 10: nada é apagado de verdade. Excluir = `update deleted_at = now()`.
  Restaurar = `update deleted_at = null`. A tabela `transactions` não tem
  política de `delete` nem grant de `DELETE` para `authenticated` — um
  `.delete()` do cliente falha com erro de permissão, de propósito.
- Regra 13: `created_by` é sempre preenchido (`not null`, default
  `auth.uid()`) para mostrar quem lançou.

## Arquivos envolvidos

- `src/features/transactions/useTransactions.ts` — hooks de dados
  (`useTransactions`, `useDeletedTransactions`, `useCreateTransaction`,
  `useSoftDeleteTransaction`, `useRestoreTransaction`).
- `src/features/transactions/invalidateFinanceQueries.ts` — qualquer
  mutação em lançamento invalida resumo, gráfico e status de contas junto;
  sempre reutilize essa função em vez de invalidar só `['transactions']`.
- `src/features/transactions/TransactionFormModal.tsx` — formulário de
  criação (gasto/entrada, valor, descrição, categoria, data, forma de
  pagamento, parcelas).
- `src/features/transactions/TransactionsPage.tsx` — lista com filtros
  (busca, categoria, forma de pagamento) e agrupamento por dia
  (`groupByDay.ts`).
- `src/features/transactions/TransactionRow.tsx` — uma linha da lista,
  com exclusão (confirmação em dois cliques: "Excluir" → "Confirmar").
- `src/features/transactions/TrashPage.tsx` — lixeira (lista com
  `deleted_at` não nulo, botão "Restaurar").
- `src/features/household/useHouseholdProfiles.ts` — mapa de `user_id` →
  nome de exibição, para mostrar "lançado por".
- `supabase/migrations/20261107013104_transactions.sql` — schema, checks e
  RLS da tabela.

## Passo a passo

1. Para um novo campo ou regra de validação, mexa primeiro no formulário
   (`TransactionFormModal.tsx`) e na validação local (mensagens de erro em
   português, iguais ao padrão já usado: "Escolha uma categoria.").
2. Qualquer leitura/escrita passa pelos hooks de `useTransactions.ts` — não
   chame `supabase.from('transactions')` direto de um componente.
3. Depois de qualquer mutação bem-sucedida, confirme que
   `invalidateFinanceQueries` está sendo chamado (senão o resumo e os
   gráficos ficam com dado velho).
4. Datas são sempre strings ISO `YYYY-MM-DD`
   (`src/lib/isoDate.ts`/`src/lib/competenceMonth.ts`) — nunca
   `new Date(isoString).toLocaleDateString()` sem usar `isoDateToDate`
   primeiro (ver Armadilhas).

## Testes obrigatórios

- `src/features/transactions/groupByDay.test.ts` — cobre o agrupamento por
  dia e a ordenação.
- Testes de componente para `TransactionFormModal` (ver
  `TransactionFormModal.test.tsx`): validação de campo vazio, entrada não
  exige forma de pagamento, submissão válida chama a mutação certa.
- Qualquer cálculo novo (ex.: um filtro que soma valores) que não seja
  trivial de testar via componente deve virar uma função pura em
  `src/lib/finance.ts`, com teste lá (mantendo 100% de cobertura nesse
  arquivo).

## Armadilhas conhecidas

- **Fuso horário:** `new Date('2024-03-10')` é interpretado como meia-noite
  UTC pelo JavaScript; formatar com `.toLocaleDateString()` sem fuso
  explícito pode mostrar o dia errado para quem está no Brasil (UTC-3). Use
  sempre `isoDateToDate()` antes de formatar uma data vinda do banco.
- **`@single-ui/react` `Input`/`Select` não associam `label` ao campo**
  (sem `for`/`id`) — sempre passe `aria-label` igual ao `label`, senão
  `getByLabelText` nos testes (e leitores de tela de verdade) não acham o
  campo.
- **Limpeza do Testing Library não é automática** neste projeto
  (`globals: false` no Vitest) — já está em `src/test/setup.ts`, não
  precisa adicionar de novo, mas se um teste "vazar" DOM para o próximo, é
  o primeiro lugar a conferir.
- Excluir uma parcela não excide as outras parcelas do mesmo grupo — cada
  parcela é um lançamento independente. Não existe (ainda) um botão
  "excluir todas as parcelas".

## Checklist de pronto

- [ ] `npm run lint`, `npm run typecheck`, `npm test` passam.
- [ ] Mutação nova chama `invalidateFinanceQueries`.
- [ ] Campo de valor usa `parseMoney`/`formatMoneyInput`, nunca float.
- [ ] Teste de componente cobrindo o caminho feliz e pelo menos um erro de
      validação.
