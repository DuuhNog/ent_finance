---
name: parcelamento-cartao
description: Use ao mexer em compra parcelada no cartão de crédito, na RPC create_installment_purchase, na divisão de centavos entre parcelas, ou nas datas de vencimento das parcelas (fim de mês).
---

## Objetivo

Uma compra parcelada no cartão vira N lançamentos (um por mês), criados
numa única operação atômica. Esta skill cobre a regra de divisão de
centavos, o cálculo das datas e a RPC que faz tudo isso no Postgres.

## Regras de negócio

- Regra 5: parcelamento só existe para `payment_method = 'credit_card'`, de
  2 a 24 vezes. Total dividido em centavos: cada parcela recebe
  `floor(total / n)`, a **primeira** recebe o resto. A soma das parcelas é
  **exatamente** igual ao total (nunca arredonda "pra cima" perdendo ou
  ganhando centavo). As parcelas caem no mesmo dia nos meses seguintes; se o
  dia não existir (31 em fevereiro), usa o último dia do mês. Todas
  compartilham `installment_group_id`, têm `installment_number`/
  `installment_total`. Criar as parcelas é atômico — uma função RPC, numa
  única transação; se um parâmetro for inválido, **nada** é criado.

## Arquivos envolvidos

- `src/lib/finance.ts` — `splitInstallments` (divisão de centavos) e
  `getInstallmentDates` (datas com fim de mês), cálculos puros com 100% de
  cobertura obrigatória.
- `supabase/migrations/20261107013112_rpc_create_installment_purchase.sql`
  — a RPC `create_installment_purchase`, que repete a mesma lógica de
  `finance.ts` em SQL (não há como compartilhar código entre TS e
  PL/pgSQL — qualquer mudança na regra precisa ser replicada nos dois
  lugares e teste nos dois lugares: `finance.test.ts` e
  `supabase/tests/05_installment_purchase.sql`).
- `src/features/transactions/useTransactions.ts` —
  `useCreateInstallmentPurchase`, chama a RPC via `supabase.rpc(...)`.
- `src/features/transactions/TransactionFormModal.tsx` — o select de
  parcelas só aparece quando `kind === 'expense'` e
  `paymentMethod === 'credit_card'`; 1x cai no fluxo normal
  (`useCreateTransaction`), só 2x+ usa a RPC. Mostra também o aviso de
  cartão (regra 4) na primeira vez que o usuário escolhe cartão
  (`useCreditCardHint`, guardado em `localStorage`).

## Passo a passo

1. Qualquer mudança na regra de divisão ou nas datas: altere
   `src/lib/finance.ts` primeiro, rode os testes de propriedade
   (`fast-check`) em `finance.test.ts` até passar, **depois** replique a
   mesma lógica na migration da RPC.
2. Depois de mudar a RPC, rode `npm run test:db` — o teste
   `05_installment_purchase.sql` confere que a soma bate e que parâmetro
   inválido não cria nada.
3. A RPC usa `p_installments integer` (não `smallint`) de propósito — veja
   Armadilhas.

## Testes obrigatórios

- `finance.test.ts`: tabela de casos manuais (31/01 em ano bissexto e não
  bissexto, virada de ano) + propriedade `fast-check` (soma = total, nenhuma
  parcela zero quando total ≥ n, diferença entre maior e menor ≤ resto).
- `supabase/tests/05_installment_purchase.sql`: RPC cria N linhas cuja soma
  é o total; `installments` fora de 2–24 falha e não cria nenhuma linha.
- `TransactionFormModal.test.tsx`: fluxo de 3x chama
  `createInstallmentPurchase` com os parâmetros certos, não chama
  `createTransaction`.

## Armadilhas conhecidas

- **`smallint` nos parâmetros da RPC quebra a chamada.** Descobrimos isso
  na prática: `select create_installment_purchase(..., 3, ...)` falha com
  "function does not exist" porque literais numéricos em SQL são
  `integer` por padrão, e `integer → smallint` não é um cast implícito
  aceito na resolução de overload de função (só em contexto de
  atribuição/coluna). Os parâmetros da RPC são `integer`; só as _colunas_
  `installment_number`/`installment_total` são `smallint` (lá o cast
  implícito de atribuição funciona normal).
- `date_trunc('month', data)` não é `IMMUTABLE` o suficiente para uma
  coluna gerada (`competence_month`) — por isso `transactions.sql` calcula
  o primeiro dia do mês com aritmética pura (`occurred_on - (dia - 1)`), não
  com `date_trunc`. Não "simplifique" isso de volta para `date_trunc` numa
  coluna gerada — quebra a migration.
- Datas de parcela usam `Date.UTC`/aritmética de dia, nunca `new Date()`
  local — veja a skill `lancamentos` sobre fuso horário.

## Checklist de pronto

- [ ] `npm test` e `npm run test:db` passam.
- [ ] Mudança na regra de divisão/data está replicada em `finance.ts` **e**
      na migration da RPC, com teste nos dois lugares.
- [ ] `splitInstallments`/`getInstallmentDates` continuam com 100% de
      cobertura.
