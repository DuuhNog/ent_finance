# Deploy na Vercel

## 1. Criar o projeto na Vercel

1. Importe o repositório do GitHub na Vercel ([vercel.com/new](https://vercel.com/new)).
2. Framework preset: **Vite**. Build command: `npm run build`. Output
   directory: `dist` (a Vercel detecta isso sozinha pelo preset).
3. Antes do primeiro deploy, configure as variáveis de ambiente (próxima
   seção) — sem elas o build quebra (`src/lib/supabase/client.ts` lança
   erro se faltar alguma).

## 2. Variáveis de ambiente

Em **Project Settings → Environment Variables**, adicione para
**Production**, **Preview** e **Development**:

| Nome                            | Valor                                                |
| ------------------------------- | ---------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase (`https://xxxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | A _publishable key_ (`sb_publishable_...`)           |

Nunca adicione a _secret key_ (`sb_secret_...`) nem a antiga `service_role`
aqui — o frontend não precisa delas, e colocá-las numa variável `VITE_*`
exporia a chave no bundle enviado ao navegador.

## 3. Domínios de autenticação no Supabase

Depois que a Vercel gerar a URL de produção (ex.:
`https://aonde-vai-meu-dinheiro.vercel.app`), volte ao painel do Supabase em
**Authentication → URL Configuration** e adicione essa URL em **Site URL** e
em **Redirect URLs** (com `/**` no final). Sem isso, o login quebra em
produção mesmo com as variáveis de ambiente certas.

## 4. Headers de segurança (`vercel.json`)

Já versionado na raiz do projeto. Define:

- **Content-Security-Policy**: só permite scripts/estilos/conexões do
  próprio domínio e do Supabase (`https://*.supabase.co`). Se um dia for
  preciso carregar algo de outro domínio (uma fonte, um CDN), a CSP precisa
  ser atualizada aqui — ela não libera nada por padrão.
- **X-Frame-Options: DENY** — ninguém pode colocar o app num `<iframe>`.
- **Referrer-Policy: strict-origin-when-cross-origin**.
- **Permissions-Policy** mínima — desliga câmera, microfone, geolocalização
  etc., que o app não usa.
- `rewrites` manda toda rota para `index.html`, porque o roteamento é feito
  no cliente (React Router) — sem isso, recarregar a página em `/metas`,
  por exemplo, daria 404.

## 5. PWA

`vite-plugin-pwa` gera o manifest e o service worker no build
(`dist/sw.js`, `dist/manifest.webmanifest`). O service worker só
pré-cacheia os arquivos do app (JS/CSS/HTML/ícones) — nenhuma chamada ao
Supabase é cacheada, então os dados financeiros nunca aparecem
desatualizados sem o usuário perceber (sem internet, as telas mostram erro
de carregamento normalmente, como já acontece hoje).

Ícones em `public/icons/`. Para trocar o ícone do app, gere novos PNGs nos
mesmos tamanhos (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png` com
~10% de margem de segurança nas bordas, `apple-touch-icon.png` 180×180) e
atualize `manifest.icons` em `vite.config.ts` se os nomes mudarem.

## 6. Checklist antes de publicar

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:db`
      passam.
- [ ] `npm run build` roda sem erros localmente.
- [ ] Variáveis de ambiente configuradas na Vercel (produção **e** preview).
- [ ] Migrations aplicadas no Supabase remoto (`supabase db push --remote`,
      só quando pedido explicitamente).
- [ ] Site URL e Redirect URLs do Supabase atualizados com o domínio da
      Vercel.
- [ ] Testou login com um usuário de verdade na URL de preview antes de
      promover para produção.
- [ ] Nenhum dado real em screenshots, seeds ou commits.
