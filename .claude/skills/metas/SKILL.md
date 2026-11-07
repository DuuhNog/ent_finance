---
name: metas
description: Use ao mexer em metas (limite no cartão, limite por categoria, guardar por mês) — unicidade, cálculo de progresso e cores da barra.
---

## Objetivo

Meta (`goal`) é de três tipos: `credit_card_limit`, `category_limit`,
`monthly_savings`. Esta skill cobre as regras de unicidade e o cálculo de
progresso/cor de cada tipo.

## Regras de negócio

- Regra 9: `credit_card_limit` (no máximo uma ativa por casa),
  `category_limit` (uma por categoria), `monthly_savings` (no máximo uma).
  Barra de progresso dos tipos "limite" (cartão/categoria): até 80% verde,
  80–100% amarelo, **acima** de 100% vermelho (em exatamente 100% ainda é
  amarelo, não vermelho). Para guardar, a lógica é inversa (mais é melhor):
  **100% ou mais é verde, 50% a 100% é amarelo, abaixo de 50% é vermelho**
  — não é um espelho simples do 80/100 dos outros tipos, são limiares
  diferentes de propósito (confirmado no protótipo `financas.html`, que
  usa uma função separada para o tipo "guardar").

## Arquivos envolvidos

- `src/lib/finance.ts` — `getGoalProgress(currentCents, targetCents,
inverse)`, cálculo puro de porcentagem e cor (`good`/`warning`/`critical`).
- `supabase/migrations/20261107013107_goals.sql` — os três índices únicos
  parciais que impõem a unicidade no banco (não só no formulário).
- `src/features/goals/useGoals.ts` — hooks de dados.
- `src/features/goals/GoalFormModal.tsx` — criação; captura erro
  `23505` (violação do índice único) e mostra "Você já tem uma meta desse
  tipo. Edite a existente." em vez de um erro genérico.
- `src/features/goals/GoalCard.tsx` — barra de progresso, edição de valor,
  remoção (soft delete via `archived_at`).
- `src/features/goals/GoalsPage.tsx` — calcula o valor atual de cada meta a
  partir do resumo do mês (`useMonthSummary`): `creditCardTotalCents` para
  cartão, `savedCents` para guardar, `expensesByCategory[categoryId]` para
  categoria.

## Passo a passo

1. Mudança nos limiares de cor: só em `getGoalProgress` (`finance.ts`) —
   não duplique a lógica de cor em `GoalCard.tsx`.
2. Nova validação de unicidade: sempre no banco (índice único), nunca só no
   cliente — um segundo dispositivo/aba pode criar a mesma meta ao mesmo
   tempo.

## Testes obrigatórios

- `finance.test.ts`: `getGoalProgress` com casos de borda explícitos (0%,
  79%, 80%, 81%, 100%, 101% para limite; 0%, 49%, 50%, 99%, 100% para
  guardar/inverso) — os valores de fronteira são exatamente onde esse tipo
  de regra costuma errar.

## Armadilhas conhecidas

- Não confunda os dois conjuntos de limiares (80/100 vs. 50/100) — são
  deliberadamente diferentes, não um bug para "corrigir".
- `category_id` só é preenchido para `category_limit`; o banco garante isso
  via check (`category_id_only_for_category_limit`). Não tente salvar
  `category_id` para os outros tipos.

## Checklist de pronto

- [ ] `npm test` e `npm run test:db` passam.
- [ ] Cor calculada via `getGoalProgress`, nunca se/senão inline no
      componente.
- [ ] Erro de duplicidade (`23505`) tratado com mensagem amigável, não
      propagado cru para a tela.
