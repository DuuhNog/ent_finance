---
name: deploy
description: Use ao mexer em configuração de deploy (Vercel), variáveis de ambiente, headers de segurança, PWA/manifest/ícones, ou antes de publicar uma versão nova.
---

## Objetivo

O app é hospedado na Vercel como uma SPA (Vite + React Router). Esta skill
cobre variáveis de ambiente, headers de segurança, PWA e o checklist antes
de publicar.

## Regras de negócio

- Nunca a chave secreta (`sb_secret_...`/`service_role`) no frontend nem em
  variável `VITE_*` — só a publishable key.
- Headers de segurança obrigatórios (`vercel.json`): Content-Security-Policy
  restrita ao próprio domínio e a `https://*.supabase.co`, `X-Frame-Options:
DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` mínima.

## Arquivos envolvidos

- `vercel.json` — headers de segurança e `rewrites` (toda rota cai em
  `index.html`, porque o roteamento é client-side).
- `vite.config.ts` — `VitePWA(...)`: manifest, ícones, `workbox.globPatterns`
  restrito ao app shell (nunca cacheia chamada ao Supabase).
- `public/icons/` — ícones do PWA (`icon-192.png`, `icon-512.png`,
  `icon-maskable-512.png` com margem de segurança, `apple-touch-icon.png`).
- `public/favicon.svg` — favicon do navegador.
- `.env.example` — só `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY`
  com placeholders.
- `docs/deploy.md` — passo a passo completo e o checklist antes de publicar.

## Passo a passo

1. Variável de ambiente nova: adicione em `.env.example` (placeholder, nunca
   valor real) e em `docs/deploy.md`.
2. Domínio externo novo (fonte, CDN, etc.): atualize a
   Content-Security-Policy em `vercel.json` — ela não libera nada por
   padrão, então esquecer isso quebra silenciosamente em produção (funciona
   em dev, porque o Vite dev server não aplica esses headers).
3. Trocar o ícone do app: gere PNGs nos mesmos tamanhos e atualize
   `manifest.icons` em `vite.config.ts` se os nomes mudarem.
4. Antes de publicar: rode o checklist de `docs/deploy.md` (lint, typecheck,
   testes, build local, variáveis de ambiente na Vercel, Site
   URL/Redirect URLs do Supabase atualizados).

## Testes obrigatórios

- `npm run build` local sem erro antes de qualquer deploy.
- Depois de mudar a CSP, confira no navegador (aba Console) que nada está
  sendo bloqueado — a CSP só aparece em produção/preview (`vercel.json` não
  afeta `npm run dev`).

## Armadilhas conhecidas

- `style-src` da CSP inclui `'unsafe-inline'` de propósito — o app usa
  bastante `style={{ ... }}` inline (cores de barra de progresso, gráficos);
  removê-lo quebra essas telas. Se um dia migrar tudo para classes/variáveis
  CSS, aí sim dá pra apertar isso.
- Sem o `rewrites` de `vercel.json`, recarregar a página em qualquer rota
  que não seja `/` (ex.: `/metas`) dá 404 — o roteamento é todo client-side.
- Bundle principal passa de 500 KB (aviso do Vite) — `SummaryPage` e as
  outras páginas internas já são `React.lazy` em `App.tsx`; não volte isso a
  import estático sem necessidade.

## Checklist de pronto

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
      passam localmente.
- [ ] Variáveis de ambiente configuradas na Vercel (Production e Preview).
- [ ] Site URL/Redirect URLs do Supabase atualizados com o domínio atual.
- [ ] Nenhum dado real em screenshot, seed ou commit.
