---
name: valores-monetarios
description: Consulte SEMPRE que a mudança tocar em dinheiro — parse de valor digitado, formatação, centavos, ou qualquer campo "Valor (R$)" em um formulário.
---

## Objetivo

Toda conversão entre texto (formato brasileiro) e centavos passa por
`src/lib/money.ts` — é o único lugar permitido para essa lógica em todo o
projeto. Esta skill existe para você nunca reinventar isso num componente.

## Regras de negócio

- Regra 1: dinheiro é sempre inteiro em centavos. Banco: `bigint`. TS:
  `number` inteiro, validado com `Number.isSafeInteger`. Proibido `float`,
  `parseFloat(x) * 100`, ou qualquer conta com reais decimais.
- Regra 2: entrada aceita `25,90`, `1.041,66`, `R$ 1.041,66`, `1041,66`,
  `1041`, `0,5` (= 50 centavos); aceita ponto decimal só quando não há
  vírgula e o ponto não é separador de milhar (`25.90`). Rejeita: vazio,
  negativo, letras, mais de 2 casas decimais, valores acima de
  R$ 10.000.000,00 (exatamente R$ 10.000.000,00 é aceito).
- Regra 3: formatação sempre via `Intl.NumberFormat('pt-BR', { style:
'currency', currency: 'BRL' })` a partir dos centavos.

## Arquivos envolvidos

- `src/lib/money.ts` — `parseMoney`, `formatMoney`, `formatMoneyInput`,
  `MIN_AMOUNT_CENTS`, `MAX_AMOUNT_CENTS`. **O único módulo** que faz essa
  conversão.
- `src/lib/money.test.ts` — tabela de casos + propriedade `fast-check`
  (`parseMoney(formatMoneyInput(c)) === c`), 100% de cobertura obrigatória.
- Qualquer campo "Valor (R$)" em qualquer formulário (`TransactionFormModal`,
  `RecurringBillFormModal`, `GoalFormModal`, `RecurringBillRow`) segue o
  mesmo padrão: `Input` de texto comum (não a máscara `currency-brl` da
  lib `@single-ui/react` — decidimos não usar, porque nossas regras de
  parse são mais específicas que uma máscara genérica), com `parseMoney` no
  submit e `formatMoneyInput`/`formatMoney` para mostrar valor existente.

## Passo a passo

1. Qualquer regra nova de parse/formatação: só em `money.ts`, com teste
   novo em `money.test.ts` antes de mexer em qualquer formulário.
2. Formulário novo com campo de valor: `useState('')` para o texto digitado
   (nunca formate a cada tecla — isso atrapalha quem está digitando),
   `parseMoney` só no submit, erro de validação com a mensagem padrão
   "Digite um valor maior que zero, por exemplo 25,90." quando inválido.
3. Para pré-preencher um valor existente (editar), use
   `formatMoneyInput(cents)`, não `formatMoney` (que inclui "R$" e isso
   complica reparsear se o usuário só apertar Enter sem mexer).

## Testes obrigatórios

- `money.test.ts` precisa continuar em 100% de linhas e ramos — é um
  requisito do projeto, reforçado por um threshold dedicado no Vitest
  (`vite.config.ts`, `coverage.thresholds['src/lib/{money,finance}.ts']`).
- Qualquer função nova em `money.ts` precisa de tabela de casos aceitos e
  rejeitados, igual ao padrão existente.

## Armadilhas conhecidas

- `parseFloat`/`Number()` em cima de texto com vírgula decimal dá resultado
  errado silenciosamente (`parseFloat('25,90')` é `25`, não `25.9`) — nunca
  use isso para dinheiro.
- Limite máximo é `<=` 1.000.000.000 centavos (R$ 10.000.000,00 inclusive),
  não `<`.
- `0,5` → 50 centavos (meio real), não 5 centavos — um dígito depois da
  vírgula é dezena de centavo, dois dígitos são centavo exato.

## Checklist de pronto

- [ ] `npm run test:coverage` mostra 100% em `money.ts`.
- [ ] Nenhum `parseFloat`/`* 100`/`/ 100` fora de `money.ts` tocando em
      dinheiro.
- [ ] Mensagens de erro de valor seguem o texto padrão já usado no projeto.
