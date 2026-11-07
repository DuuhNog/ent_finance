---
name: contas-recorrentes
description: Use ao mexer em contas recorrentes (contas do mês) — cadastro, valor variável/estimativa, pagar, desfazer pagamento, status de vencimento (paga/atrasada/vence em breve), ou no índice único que impede pagar duas vezes.
---

## Objetivo

Conta recorrente (`recurring_bill`) é uma conta que se repete todo mês
(internet, luz). "Pagar" cria um lançamento ligado; "desfazer" exclui
(soft) esse lançamento. Esta skill cobre cadastro, estimativa de valor
variável e status de vencimento.

## Regras de negócio

- Regra 6: nome, categoria, valor, se é variável, dia de vencimento (1–31),
  forma de pagamento, mês de início. Marcar como paga cria um lançamento
  ligado (`recurring_bill_id`) com data no dia de vencimento daquele mês
  (ou no último dia do mês, se o dia não existir). **Uma conta só pode ser
  paga uma vez por competência** — índice único parcial no banco
  (`(recurring_bill_id, competence_month) where deleted_at is null`), não
  só validação no cliente. Para contas variáveis, o valor sugerido é o
  último valor pago nos 6 meses anteriores; sem histórico, usa o valor
  cadastrado. Status: paga, atrasada (passou do dia), vence em até 5 dias
  (texto "vence hoje" quando faltam 0 dias). Meses passados não pagos
  aparecem como atrasados.

## Arquivos envolvidos

- `src/lib/finance.ts` — `getBillStatus` (status) e
  `estimateVariableBillAmount` (estimativa), cálculos puros.
- `src/lib/competenceMonth.ts` — `dueDateForCompetenceMonth` (data de
  vencimento numa competência, com fim de mês).
- `supabase/migrations/20261107013102_recurring_bills.sql` — schema da
  tabela.
- `supabase/migrations/20261107013104_transactions.sql` — o índice único
  `transactions_recurring_bill_once_per_month` que garante "uma vez por
  mês" no banco, não só no app.
- `supabase/migrations/20261107013114_rpc_pay_recurring_bill.sql` — a RPC
  `pay_recurring_bill`, que cria o lançamento ligado.
- `src/features/recurringBills/useRecurringBills.ts` — hooks
  (`useRecurringBills`, `useRecurringBillPayments` do mês,
  `useRecurringBillHistory` para a estimativa, `usePayRecurringBill`).
  "Desfazer" reusa `useSoftDeleteTransaction` de
  `src/features/transactions/useTransactions.ts` — não existe uma RPC de
  "despagar", é só soft delete do lançamento ligado.
- `src/features/recurringBills/RecurringBillRow.tsx` — status, valor
  sugerido pré-preenchido, botão "Paguei"/"Desfazer".
- `src/features/recurringBills/RecurringBillFormModal.tsx` — cadastro.

## Passo a passo

1. Mudança na regra de status/estimativa: altere `finance.ts` primeiro
   (funções puras, fáceis de testar com data injetada).
2. Mudança no "pagar": a RPC `pay_recurring_bill` é `security invoker` —
   as políticas de RLS de `transactions` ainda se aplicam.
3. Ao pagar/desfazer, confirme que `invalidateFinanceQueries` é chamado
   (via `usePayRecurringBill`/`useSoftDeleteTransaction`) — o resumo do mês
   depende de quais contas estão pendentes.

## Testes obrigatórios

- `finance.test.ts`: status com data fixa injetada (paga, atrasada, vence
  hoje, vence em N dias, mês passado não pago = atrasado); estimativa usa
  o último pago em até 6 meses, senão o cadastrado.
- `supabase/tests/04_recurring_bill_unique_payment.sql`: segunda tentativa
  de pagar a mesma conta na mesma competência falha (`23505`).

## Armadilhas conhecidas

- O índice único é a fonte da verdade — não tente replicar essa checagem só
  no cliente (TanStack Query cacheado pode mostrar "não paga" por um
  instante depois de pagar em outra aba; o banco rejeita de qualquer jeito).
- `daysUntilDue` (dias até o vencimento) é calculado com
  `daysBetweenIsoDates`, nunca subtraindo `dia-do-mês - dia-do-mês` direto
  — isso quebra ao atravessar meses (já foi um bug real aqui: comparar só
  o número do dia, sem considerar o mês, dá resultado errado perto da
  virada do mês).
- Conta variável: a estimativa olha os **últimos 6 meses antes** da
  competência atual, não incluindo o mês atual nem o futuro.

## Checklist de pronto

- [ ] `npm test` e `npm run test:db` passam.
- [ ] Status calculado com `getBillStatus`, nunca reimplementado inline.
- [ ] Toda data usa `src/lib/isoDate.ts`/`competenceMonth.ts`, nunca
      aritmética manual de string de data.
