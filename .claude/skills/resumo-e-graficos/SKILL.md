---
name: resumo-e-graficos
description: Use ao mexer na tela de Resumo — cálculos do mês (saldo, por categoria, por forma de pagamento, contas pendentes), ou no gráfico dos últimos 6 meses.
---

## Objetivo

A tela de Resumo (`/`) mostra entradas, gastos, guardado, saldo, contas
pendentes com saldo previsto, gastos por categoria e por forma de
pagamento, e um gráfico dos últimos 6 meses. Esta skill cobre os cálculos
e a composição dos dados vindos de várias tabelas.

## Regras de negócio

- Regra 8: entradas, gastos (sem guardar), guardado, saldo = entradas −
  gastos − guardado, total no cartão, gastos por categoria, gastos por
  forma de pagamento, contas pendentes com valor estimado, saldo previsto
  após as pendentes, gráfico dos últimos 6 meses (total e parte no cartão).
- Regra 7: lançamentos na categoria marcada `is_savings` contam como
  "guardado", nunca como "gasto".

## Arquivos envolvidos

- `src/lib/finance.ts` — `buildMonthSummary`, a função pura que faz a soma
  (entradas/gastos/guardado/saldo/por categoria/por forma de pagamento);
  recebe os lançamentos já carregados e a lista de contas pendentes já
  calculada, não busca nada sozinha.
- `src/features/summary/useMonthSummary.ts` — compõe `buildMonthSummary`
  com dados de `useTransactions`, `useCategories`, `useRecurringBills`,
  `useRecurringBillPayments`, `useRecurringBillHistory`. É aqui que entram
  `getBillStatus`/`estimateVariableBillAmount` para decidir quais contas
  são "pendentes" e com qual valor estimado.
- `src/features/summary/useLastSixMonths.ts` — busca transações dos
  últimos 6 meses direto (não usa `buildMonthSummary`, porque só precisa de
  total e parte-no-cartão por mês, não do resumo inteiro).
- `src/features/summary/SummaryPage.tsx`, `CategoryBreakdown.tsx`,
  `PaymentMethodBreakdown.tsx`, `MonthlyChart.tsx` — UI.
- `src/lib/chartColors.ts` — paleta validada pela skill `dataviz` (cores
  fixas por forma de pagamento; categoria usa uma cor só, já que a lista é
  ordenada por valor, não comparada por cor).

## Passo a passo

1. Antes de desenhar qualquer gráfico novo, carregue a skill `dataviz` e
   rode `scripts/validate_palette.js` para qualquer paleta nova — não
   invente cores de cabeça.
2. Mudança num cálculo do resumo: sempre em `buildMonthSummary`
   (`finance.ts`), nunca somando direto no componente React.
3. "Contas pendentes" é calculado comparando `getBillStatus` de cada conta
   recorrente contra os pagamentos já feitos naquela competência — não é
   "todas as contas menos as pagas", porque contas de meses futuros ainda
   não "existem" como pendência (olhe o filtro em `useMonthSummary.ts`).

## Testes obrigatórios

- `finance.test.ts`: casos manuais de `buildMonthSummary` — guardar não
  conta como gasto, entrada não entra em forma de pagamento, saldo e
  previsão corretos, conta paga não aparece como pendente.

## Armadilhas conhecidas

- O gráfico de 6 meses usa a mesma paleta (cor do cartão) em todo lugar que
  mostra "cartão" (resumo, metas) — não crie uma cor nova para o mesmo
  conceito em outro lugar.
- `expensesByCategory`/`expensesByPaymentMethod` só incluem gastos
  (`kind === 'expense'`) que **não** são `is_savings` — uma entrada nunca
  aparece aí, nem um valor guardado.
- Bundle do Recharts é pesado (~110 KB gzip) — `SummaryPage` é carregada
  via `React.lazy` em `App.tsx` de propósito; não transforme isso num
  import estático de novo sem necessidade.

## Checklist de pronto

- [ ] `npm test` passa, com `buildMonthSummary` continuando 100% coberto.
- [ ] Gráfico novo passou pela skill `dataviz` (paleta validada, legenda,
      rótulos diretos quando fizer sentido).
- [ ] Nenhuma soma feita direto em JSX — sempre via função pura testável.
