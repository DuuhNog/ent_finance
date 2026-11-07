# Prompt para criar o projeto “Aonde vai o meu dinheiro”

> Como usar: crie uma pasta vazia para o projeto, coloque dentro dela este arquivo, o `SUPABASE.md` e o `financas.html` (protótipo de referência), abra o Claude Code nessa pasta e diga: **“Leia o PROMPT.md e execute a Fase 0.”** Depois de revisar cada fase, peça a próxima.

---

## Contexto

Você vai criar um app web de controle financeiro pessoal para um casal (eu e minha esposa). Hoje eu controlo tudo numa planilha do Google Sheets e quero substituir por este app. Já existe um protótipo funcional em `financas.html` nesta pasta: use-o como referência de **funcionalidades, regras de negócio e UX**, mas não copie a arquitetura (ele é um HTML único).

O repositório será **público no GitHub**. Os dados são **privados e financeiros**. Segurança e não perder dados são as prioridades número um, acima de velocidade de entrega.

## Regras de trabalho (valem para todas as fases)

1. Trabalhe em **fases**. Ao fim de cada fase: rode lint, typecheck e todos os testes; mostre um resumo do que foi feito e do que falta; **pare e espere minha aprovação** antes da próxima fase.
2. **Nunca** execute comandos contra o banco remoto (`supabase db push`, `supabase db reset --linked`, `supabase link`, qualquer `psql` com a URL de produção) sem eu pedir explicitamente naquela mensagem. Todo desenvolvimento é feito no Supabase **local** (`supabase start`, Docker).
3. **Nunca** crie, leia, imprima ou commite arquivos `.env` com valores reais. Use apenas `.env.example` com placeholders.
4. **Nunca** use a chave secreta (`sb_secret_...` ou a antiga `service_role`) no código do frontend nem em variável com prefixo `VITE_`.
5. Se algo deste documento estiver ambíguo ou parecer errado, **pergunte** em vez de assumir.
6. Código, nomes de tabelas e identificadores em **inglês**. Interface, mensagens ao usuário e documentação em **português do Brasil**.

## Stack

- Vite + React + TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`)
- React Router
- TanStack Query para dados do servidor
- Zod para validação de formulários e de dados vindos do banco
- Tailwind CSS
- Recharts para gráficos
- `@supabase/supabase-js` (cliente no navegador com **publishable key**)
- `vite-plugin-pwa` (app instalável no celular)
- Supabase CLI para banco local, migrations e geração de tipos (`supabase gen types typescript --local`)
- Testes: Vitest + Testing Library, `fast-check` (testes de propriedade), pgTAP (`supabase test db`), Playwright (e2e contra o Supabase local)
- ESLint + Prettier
- Hospedagem: Vercel. Banco e login: Supabase (Postgres)

## Glossário de domínio

| Português (UI) | Código | Significado |
|---|---|---|
| Casa / Família | `household` | Grupo que compartilha os dados (eu + esposa). Todos os membros veem e editam tudo da casa. |
| Lançamento | `transaction` | Um gasto (`expense`) ou uma entrada (`income`). |
| Conta do mês / recorrente | `recurring_bill` | Conta que se repete todo mês (internet, luz). Pode ter valor fixo ou variável. |
| Parcela | `installment` | Compra no cartão dividida em N lançamentos, um por mês. |
| Meta | `goal` | Limite no cartão, limite por categoria ou valor a guardar por mês. |
| Competência | `competence_month` | Mês ao qual o lançamento pertence (primeiro dia do mês da data do lançamento). |

## Regras de negócio (fonte da verdade)

1. **Dinheiro é sempre inteiro em centavos.** No banco: `bigint`. No TypeScript: `number` inteiro, validado com `Number.isSafeInteger`. Proibido usar `float`, `numeric` com casas decimais, `parseFloat(x) * 100` ou qualquer conta com reais decimais. Toda conversão texto ↔ centavos passa por um único módulo (`src/lib/money.ts`).
2. **Entrada de valor do usuário** aceita formatos brasileiros: `25,90`, `1.041,66`, `R$ 1.041,66`, `1041,66`, `1041`, `0,5` (= 50 centavos). Também aceita ponto decimal quando não houver vírgula e o ponto não for separador de milhar (`25.90`). Rejeita: vazio, negativo, letras, mais de 2 casas decimais, valores acima de R$ 10.000.000,00. O parse é feito com manipulação de string, nunca com float.
3. **Formatação:** sempre `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` a partir dos centavos.
4. **Cartão de crédito conta no mês da compra.** Cada compra no cartão é um lançamento com `payment_method = 'credit_card'` na data da compra. O pagamento da fatura **não** é lançado (contaria duas vezes). Isso deve estar explicado na UI na primeira vez que o usuário escolhe “Cartão de crédito”.
5. **Parcelamento:** só para cartão de crédito, de 2 a 24 vezes. Divide o total em centavos: cada parcela recebe `floor(total / n)` e a **primeira** recebe o resto. A soma das parcelas é **exatamente** igual ao total. As parcelas caem no mesmo dia nos meses seguintes; se o dia não existir (31 em fevereiro), usa o último dia do mês. Todas compartilham `installment_group_id` e têm `installment_number` / `installment_total`. Criar as parcelas é uma operação **atômica** (uma função RPC no Postgres, numa única transação).
6. **Contas recorrentes:** têm nome, categoria, valor, se é variável, dia de vencimento (1 a 31), forma de pagamento e mês de início. Marcar como paga cria um lançamento ligado (`recurring_bill_id`) com a data no dia de vencimento daquele mês. **Uma conta só pode ser paga uma vez por competência** (índice único). Para contas variáveis, o valor sugerido é o último valor pago nos 6 meses anteriores; se não houver, o valor cadastrado. Status no mês atual: paga, atrasada (passou do dia), vence em até 5 dias. Meses passados não pagos aparecem como atrasados.
7. **Guardar dinheiro:** existe uma categoria especial marcada como `is_savings`. Lançamentos nela não contam como gasto no resumo, aparecem como “Guardou”.
8. **Resumo do mês:** entradas, gastos (sem guardar), guardado, saldo = entradas − gastos − guardado, total no cartão, gastos por categoria, gastos por forma de pagamento, contas pendentes com valor estimado, saldo previsto após as pendentes, e gráfico dos últimos 6 meses (total e parte no cartão).
9. **Metas:** `credit_card_limit` (no máximo uma ativa), `category_limit` (uma por categoria), `monthly_savings` (no máximo uma). Barra de progresso: até 80% verde, 80–100% amarelo, acima vermelho. Para guardar, a lógica é inversa (mais é melhor).
10. **Nada é apagado de verdade pelo app.** Lançamentos, contas, metas e categorias usam *soft delete* (`deleted_at` ou `archived_at`). A UI tem uma tela “Lixeira” para restaurar lançamentos excluídos. Toda alteração fica registrada em `audit_log`.
11. **Formas de pagamento:** `credit_card`, `pix`, `debit`, `cash`, `boleto`. Entradas (`income`) não têm forma de pagamento.
12. **Categorias padrão** criadas para cada casa: Mercado, Alimentação fora, Moradia, Contas da casa, Transporte, Saúde, Educação, Pensão, Terreno, Lazer, Assinaturas, Compras, Outros, Guardar (reserva, `is_savings`); entradas: Salário, Renda extra, Outras entradas. O usuário pode criar, renomear e arquivar.
13. **Quem lançou:** cada lançamento guarda `created_by`. A lista mostra o nome de quem lançou (para eu e minha esposa sabermos quem fez o quê).

## Modelo de dados e segurança do banco

Escreva as migrations em `supabase/migrations/`. Requisitos obrigatórios:

- Tabelas: `households`, `household_members`, `profiles` (nome de exibição), `categories`, `recurring_bills`, `transactions`, `goals`, `audit_log`.
- Toda tabela de dados tem `household_id uuid not null references households`, `created_at`, `updated_at` (trigger), e `created_by uuid default auth.uid()` quando fizer sentido.
- `transactions`: `amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 1000000000)`, `kind text check in ('expense','income')`, `occurred_on date not null`, `competence_month date generated always as (date_trunc('month', occurred_on)::date) stored`, `payment_method` com check que exige valor para `expense` e `null` para `income`, colunas de parcela com check de consistência (`installment_number between 1 and installment_total`, os três campos todos nulos ou todos preenchidos), `deleted_at timestamptz`.
- Índice único parcial: `(recurring_bill_id, competence_month) where deleted_at is null and recurring_bill_id is not null`.
- Foreign keys com `on delete restrict` (nunca `cascade` em dados financeiros).
- **RLS ativado em todas as tabelas** do schema `public`. Revogue tudo do papel `anon`.
- Função auxiliar no schema `private` (não exposto pela API):

```sql
create schema if not exists private;

create or replace function private.is_household_member(h uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = h and m.user_id = (select auth.uid())
  );
$$;
```

- Padrão de políticas para tabelas de dados (`select`, `insert`, `update` para `authenticated`, usando `private.is_household_member(household_id)` no `using` e no `with check`). **Não crie política de `delete`** nessas tabelas e revogue `delete` do papel `authenticated`: exclusão é sempre soft delete via `update`.
- `household_members`, `households`: o usuário só lê as casas em que é membro. **Nenhuma** escrita pelo cliente. Membros são adicionados por SQL documentado em `docs/supabase-setup.md`.
- `audit_log`: preenchido por trigger `security definer` em `insert`/`update`/`delete` de todas as tabelas de dados, guardando `old_data`, `new_data` (jsonb), `action`, `changed_by`, `changed_at`, `household_id`. Membros só podem ler o log da própria casa. Ninguém pelo cliente insere, altera ou apaga.
- Funções RPC (`security invoker`, validando membro) para operações com várias linhas: `create_installment_purchase(...)` e `pay_recurring_bill(bill_id, month, amount_cents)`.
- Função `private.create_household(name text, member_emails text[]) returns uuid` para eu rodar no SQL Editor do painel: cria a casa, adiciona os usuários pelos e-mails (falha se algum e-mail não existir em `auth.users`), cria as categorias padrão e devolve o id. Ela não pode ser chamada pela API (schema `private`, sem `grant` para `anon`/`authenticated`).
- Login só por e-mail e senha (ou magic link). **Cadastro público desativado** no Supabase; os dois usuários são criados pelo painel.

### Testes do banco (pgTAP, `supabase/tests/`)

No mínimo:
- Usuário A, membro da casa 1, lê e escreve dados da casa 1.
- Usuário C, de outra casa, **não vê nem altera** nada da casa 1 (select retorna vazio, insert/update falham).
- Papel `anon` não lê nada.
- `delete` é negado para `authenticated` em `transactions`.
- Não é possível mudar `household_id` de um lançamento para uma casa da qual não sou membro.
- Índice único impede pagar a mesma conta duas vezes no mesmo mês.
- Checks de valor rejeitam zero, negativo e acima do limite.
- `create_installment_purchase` cria N linhas cuja soma é exatamente o total; falha inteira (nada criado) se um parâmetro for inválido.
- Toda alteração gera linha em `audit_log`.

## Testes automatizados de valores (prioridade)

`src/lib/money.ts` e `src/lib/finance.ts` (cálculos puros, sem React nem Supabase) com cobertura mínima de **100% de linhas e ramos**, configurada no Vitest para falhar abaixo disso. Inclua:

- Tabela de casos de `parseMoney`: `'25,90' → 2590`, `'1.041,66' → 104166`, `'R$ 1.041,66' → 104166`, `'0,29' → 29`, `'0,1' → 10`, `'1041' → 104100`, `'25.90' → 2590`, `'1.000' → 100000`, e rejeições (`''`, `'-5'`, `'abc'`, `'1,234'`, `'10.000.000,01'`).
- Propriedade (fast-check): para todo inteiro `c` entre 1 e 1.000.000.000, `parseMoney(formatMoneyInput(c)) === c`.
- Propriedade: para todo total e todo `n` de 2 a 24, a soma das parcelas é igual ao total, nenhuma parcela é zero (quando total ≥ n), a diferença entre a maior e a menor é no máximo o resto.
- Datas das parcelas: 31/01 em 3x → 31/01, 28/02 (ou 29/02 em ano bissexto), 31/03. Virada de ano: 15/11 em 4x → nov, dez, jan, fev.
- Resumo do mês com casos montados à mão: guardar não conta como gasto; entrada não entra em forma de pagamento; saldo e previsão corretos; conta paga não aparece como pendente.
- Estimativa de conta variável (usa o último pago em até 6 meses, senão o cadastrado).
- Status de vencimento (paga, atrasada, vence hoje, vence em N dias) com data fixa injetada.

Testes de componentes para os formulários (valor inválido mostra erro, parcelas só aparecem com cartão). Playwright: login, lançar gasto, parcelar no cartão, pagar conta variável, excluir e restaurar da lixeira, segundo usuário da mesma casa vê o lançamento.

## Segurança do repositório público

- `.gitignore` com `.env*` (exceto `.env.example`), `supabase/.temp`, dumps (`*.sql.gz`, `*.dump`, `*.age`).
- `.env.example` só com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, com placeholders.
- Pre-commit com **gitleaks** (via `lefthook` ou `husky`) para barrar segredos. O mesmo gitleaks roda no CI.
- `SECURITY.md` explicando como reportar problemas.
- Headers de segurança no `vercel.json`: Content-Security-Policy restrita ao próprio domínio e ao domínio do Supabase, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` mínima.
- Sessão do Supabase com refresh automático; logout limpa o cache do TanStack Query.
- Nenhum dado real em fixtures, seeds ou screenshots. Seeds locais usam dados fictícios.

## Backup e recuperação (não perder dados)

O plano gratuito do Supabase **não tem backup automático**. Implemente:

1. **Exportar no app:** botão em Configurações que baixa um JSON completo da casa (e CSV de lançamentos). Script `scripts/import-backup.ts` que importa esse JSON num banco local para conferência.
2. **Backup diário automático em repositório PRIVADO separado** (nunca neste repositório público). Gere em `ops/backup-workflow/` o arquivo de workflow do GitHub Actions e um README para eu copiar para o repositório privado. O workflow: roda todo dia, faz `pg_dump` pelo *Session pooler* do Supabase, comprime, **criptografa com `age`** usando uma chave pública, e guarda como artifact com retenção de 90 dias. Segredos: `SUPABASE_DB_URL` e `AGE_PUBLIC_KEY` como GitHub Secrets do repositório privado. Esse acesso diário também evita a pausa do projeto gratuito por inatividade.
3. `docs/restore.md`: passo a passo para baixar, descriptografar e restaurar um backup num Supabase local e depois em um projeto novo. Inclua um checklist de “teste de restauração” para eu fazer a cada 3 meses.
4. Regra para migrations: nenhuma migration pode ter `drop table`, `drop column`, `truncate` ou `delete` sem que eu peça explicitamente e sem um backup recente confirmado. Mudanças de schema são aditivas.

## Documentação para o Claude Code

### `CLAUDE.md` na raiz

Curto e direto (até ~150 linhas). Deve conter: visão do projeto em 3 linhas, stack, comandos (`npm run dev`, `npm test`, `npm run test:db`, `npm run e2e`, `npm run lint`, `npm run typecheck`, `supabase start`, `supabase gen types`), estrutura de pastas, glossário, as regras de negócio 1, 4, 5 e 10 resumidas, a seção “Nunca faça” (as regras de trabalho deste prompt + migrations destrutivas), a definição de pronto (lint, typecheck, testes e testes de banco passando, migration nova tem teste pgTAP, cálculo novo tem teste em `finance.test.ts`), e uma lista apontando para as skills.

### Skills em `.claude/skills/<nome>/SKILL.md`

Uma skill por fluxo. Cada `SKILL.md` tem frontmatter com `name` e `description` (a descrição diz **quando** usar a skill) e as seções:

1. **Objetivo** do fluxo em 2 ou 3 frases.
2. **Regras de negócio** específicas (com referência às regras numeradas acima).
3. **Arquivos envolvidos** (componentes, hooks, funções, migrations, RPCs).
4. **Passo a passo** para implementar ou alterar o fluxo.
5. **Testes obrigatórios** (quais arquivos e quais casos precisam existir ou ser atualizados).
6. **Armadilhas** conhecidas.
7. **Checklist de pronto.**

Skills a criar:

- `lancamentos`: criar, editar, excluir (soft) e restaurar lançamentos; filtros; quem lançou.
- `parcelamento-cartao`: compra parcelada, RPC atômica, divisão de centavos, datas de fim de mês.
- `contas-recorrentes`: cadastro, valor variável, pagar/desfazer, status de vencimento, índice único.
- `metas`: três tipos, regras de unicidade, cálculo de progresso e cores.
- `resumo-e-graficos`: cálculos do resumo, gráficos, últimos 6 meses.
- `valores-monetarios`: regras de centavos, parse e formatação, como testar. Qualquer mudança que toque em dinheiro deve consultar esta skill.
- `migrations-e-rls`: como criar migration aditiva, padrão de RLS, como escrever teste pgTAP, como gerar tipos, proibições.
- `backup-e-restauracao`: exportação no app, workflow de backup, procedimento de restauração.
- `deploy`: Vercel, variáveis de ambiente, headers, checklist antes de publicar.
- `revisao-de-seguranca`: checklist para revisar qualquer PR (chaves, RLS, inputs, dependências, CSP).

## Fases

- **Fase 0, base:** projeto Vite + TS + Tailwind, ESLint, Prettier, Vitest, gitleaks com pre-commit, `.gitignore`, `.env.example`, CI no GitHub Actions (lint, typecheck, testes unitários, gitleaks), `CLAUDE.md` inicial, `README.md`, `SECURITY.md`, `LICENSE` (MIT). Copie `SUPABASE.md` para `docs/supabase-setup.md`.
- **Fase 1, valores:** `money.ts` e `finance.ts` com todos os testes de valores. Nada de UI ainda.
- **Fase 2, banco:** `supabase init`, migrations, seed fictício local, testes pgTAP, tipos gerados, CI rodando `supabase test db`.
- **Fase 3, login e casa:** tela de login, sessão, carregar a casa do usuário, perfil com nome de exibição, logout seguro.
- **Fase 4, funcionalidades:** lançamentos, parcelamento, contas recorrentes, metas, resumo e gráficos, lixeira. Mobile first, seguindo o protótipo `financas.html`.
- **Fase 5, PWA e deploy:** `vite-plugin-pwa`, ícones, `vercel.json` com headers, documentação de deploy.
- **Fase 6, backup:** exportação no app, script de importação, workflow para o repositório privado, `docs/restore.md`.
- **Fase 7, documentação final:** revisar `CLAUDE.md`, criar todas as skills, revisar README com prints usando dados fictícios.

Comece pela **Fase 0**.
