# Aonde vai o meu dinheiro

App web de controle financeiro pessoal, feito para uma casa (dois usuários)
compartilharem lançamentos, contas recorrentes, parcelamentos no cartão e
metas. Substitui uma planilha de Google Sheets.

> ⚠️ Repositório público. Os dados de cada casa são privados — veja
> [SECURITY.md](./SECURITY.md) para reportar problemas de segurança.

## Status

Em desenvolvimento, por fases. Fase atual: **Fase 0 — base do projeto**
(estrutura, ferramentas de qualidade, CI). Ainda não há funcionalidades de
produto implementadas.

## Stack

Vite, React, TypeScript, React Router, TanStack Query, Zod, Tailwind CSS,
Recharts, Supabase (Postgres, Auth), Vitest, Testing Library, fast-check,
pgTAP, Playwright. Hospedagem na Vercel.

## Como rodar localmente

Pré-requisitos: Node.js, Docker (para o Supabase local).

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do seu Supabase local
npm run dev
```

### Scripts disponíveis

| Comando                 | O que faz                      |
| ----------------------- | ------------------------------ |
| `npm run dev`           | Ambiente de desenvolvimento    |
| `npm run build`         | Build de produção              |
| `npm run lint`          | ESLint                         |
| `npm run format`        | Prettier                       |
| `npm run typecheck`     | Checagem de tipos              |
| `npm test`              | Testes unitários (Vitest)      |
| `npm run test:coverage` | Testes unitários com cobertura |

Mais detalhes de arquitetura e regras de negócio estão em
[CLAUDE.md](./CLAUDE.md). Setup do Supabase em
[docs/supabase-setup.md](./docs/supabase-setup.md).

## Licença

[MIT](./LICENSE).
