# Configurando o Supabase

Este guia leva você do zero até o banco pronto, com login para você e sua esposa, e backup automático. O Supabase muda o painel de vez em quando: se algum menu estiver com nome um pouco diferente, procure pelo termo parecido.

Tempo estimado: 40 minutos.

## O que você vai precisar

- Uma conta no GitHub (com verificação em duas etapas ativada).
- Um gerenciador de senhas (Bitwarden, 1Password ou o do navegador) para guardar a senha do banco e a chave do backup.
- Node.js instalado e o projeto já criado pelo Claude Code até a Fase 2.

## 1. Criar a conta

1. Acesse [supabase.com](https://supabase.com) e clique em **Start your project**.
2. Escolha **Continue with GitHub**. Assim a segurança da sua conta Supabase fica ligada à do GitHub, que já tem verificação em duas etapas.
3. Depois de entrar, abra o menu da sua conta (canto superior direito), vá em **Account → Security** e ative a **autenticação em duas etapas (MFA)** também no Supabase.

## 2. Criar a organização e o projeto

1. Crie uma organização. Pode ser com o seu nome, no plano **Free**.
2. Clique em **New project** e preencha:
   - **Name:** `aonde-vai-meu-dinheiro`
   - **Database password:** clique em **Generate a password**, copie e **salve no gerenciador de senhas agora**. Você vai precisar dela para o backup e para ligar o projeto local. Se perder, dá para trocar, mas o backup para de funcionar até você atualizar.
   - **Region:** **South America (São Paulo)**, que é a mais próxima de você.
3. Deixe as outras opções no padrão e clique em **Create new project**. Leva uns 2 minutos.

## 3. Pegar a URL e a chave pública

1. No projeto, vá em **Project Settings → API Keys**.
2. Copie a **Publishable key** (começa com `sb_publishable_`).
3. Em **Project Settings → Data API** (ou na página inicial do projeto), copie a **Project URL** (`https://xxxx.supabase.co`). O trecho `xxxx` é o **project ref**, guarde também.
4. Na pasta do projeto, copie `.env.example` para `.env.local` e preencha:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

**Sobre as chaves:**

- A _publishable key_ pode ficar no navegador. Ela sozinha não dá acesso a nada; quem protege os dados são as regras de segurança (RLS) que o projeto cria no banco.
- A _secret key_ (`sb_secret_...`) e a antiga _service_role_ **ignoram todas as regras de segurança**. Este projeto não precisa delas. Nunca copie essas chaves para o código, para o `.env.local` nem para a Vercel.
- O Supabase está aposentando as chaves antigas (`anon` e `service_role`) até o fim de 2026. Use sempre as novas.

## 4. Fechar o cadastro e criar os dois usuários

Como o app vai estar na internet e o código é público, ninguém além de vocês dois pode conseguir criar conta.

1. Vá em **Authentication → Sign In / Providers**.
2. Desative **Allow new users to sign up**. Salve.
3. Ainda em **Email**, confirme que o provedor de e-mail está ativo.
4. Vá em **Authentication → Users → Add user → Create new user**.
5. Crie o seu usuário com e-mail e uma senha forte (gerada pelo gerenciador de senhas). Marque **Auto Confirm User**.
6. Repita para sua esposa. Depois passe a senha para ela de forma segura e peça para trocar no primeiro acesso (o app terá a opção de trocar senha).

## 5. Configurar os endereços do app

1. Vá em **Authentication → URL Configuration**.
2. **Site URL:** por enquanto `http://localhost:5173`. Depois do deploy, troque pelo endereço da Vercel (ex.: `https://aonde-vai-meu-dinheiro.vercel.app`).
3. Em **Redirect URLs**, adicione os dois: `http://localhost:5173/**` e o endereço da Vercel com `/**` no final.

## 6. Mandar as tabelas para o Supabase

Até aqui o projeto rodou só no banco local. Agora você sobe a estrutura para o banco de verdade. Faça isso você mesmo no terminal (o Claude Code está proibido de mexer no banco remoto sem você pedir).

```bash
npx supabase login
npx supabase link --project-ref xxxx
npx supabase db push
```

O `link` pede a senha do banco (passo 2). O `db push` mostra a lista de migrations que vão ser aplicadas e pede confirmação. Leia antes de confirmar.

Para conferir: no painel, **Table Editor** deve mostrar as tabelas, e cada uma deve ter o selo de **RLS enabled**. Se alguma aparecer como **RLS disabled** ou **Unrestricted**, pare e não use o app até corrigir.

## 7. Criar a casa de vocês

1. No painel, abra **SQL Editor → New query**.
2. Rode, trocando pelos e-mails reais:

```sql
select private.create_household(
  'Nossa casa',
  array['voce@email.com', 'esposa@email.com']
);
```

3. O resultado é o id da casa. A partir de agora, os dois entram no app e veem os mesmos dados.

Se um dia precisarem de mais alguém (ou de remover alguém), isso também é feito por SQL no painel. O app não deixa ninguém se adicionar sozinho a uma casa.

## 8. Teste de segurança rápido

Antes de lançar dados reais, faça este teste com o app rodando:

1. Entre com o seu usuário e crie um lançamento.
2. Entre com o usuário da sua esposa: ela deve ver o lançamento.
3. No painel, crie temporariamente um terceiro usuário de teste (passo 4), **sem** colocá-lo na casa. Entre com ele: o app deve aparecer vazio, sem nenhum dado.
4. Apague esse usuário de teste em **Authentication → Users**.

## 9. Backup automático diário

O plano gratuito do Supabase **não faz backup**. Se um dado for apagado ou o projeto tiver problema, não há como voltar. Por isso o projeto tem um backup próprio, que roda todo dia no GitHub e guarda o banco criptografado.

### 9.1 Criar a chave do backup

Instale o [age](https://github.com/FiloSottile/age) e rode:

```bash
age-keygen -o chave-backup.txt
```

O arquivo tem duas partes:

- A linha `# public key: age1...` é a **chave pública**. Ela vai para o GitHub.
- A linha `AGE-SECRET-KEY-...` é a **chave privada**. Guarde no gerenciador de senhas e apague o arquivo do computador. **Sem ela, os backups não podem ser abertos.**

### 9.2 Pegar o endereço do banco

1. No painel do projeto, clique em **Connect** (barra superior).
2. Escolha a aba de connection string e copie a do **Session pooler** (funciona nos servidores do GitHub, que não usam IPv6).
3. Troque `[YOUR-PASSWORD]` pela senha do banco.

### 9.3 Criar o repositório privado de backup

1. No GitHub, crie um repositório **privado** chamado `financas-backup`. Nunca use o repositório público do app para isso.
2. Copie para ele o workflow que o Claude Code gerou em `ops/backup-workflow/`.
3. Em **Settings → Secrets and variables → Actions**, crie dois secrets:
   - `SUPABASE_DB_URL`: a connection string do passo 9.2.
   - `AGE_PUBLIC_KEY`: a chave pública `age1...`.
4. Vá na aba **Actions**, abra o workflow e clique em **Run workflow** para testar. Ao terminar, deve aparecer um arquivo `.age` nos artifacts da execução.

Bônus: como o backup acessa o banco todo dia, ele também evita que o Supabase pause o projeto gratuito por falta de uso (isso acontece depois de uma semana sem atividade).

### 9.4 Testar a restauração

Backup que nunca foi testado não é backup. Siga o `docs/restore.md` para restaurar o último backup no Supabase local e confira se os lançamentos estão lá. Repita a cada 3 meses.

## 10. Na Vercel

Ao importar o repositório na Vercel, em **Environment Variables** cadastre apenas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Depois do primeiro deploy, volte ao passo 5 e coloque o endereço da Vercel no Site URL e nos Redirect URLs.

## Checklist final

- [ ] MFA ativado no GitHub e no Supabase
- [ ] Senha do banco e chave privada do backup no gerenciador de senhas
- [ ] Cadastro público desativado
- [ ] Todas as tabelas com RLS enabled
- [ ] Teste do terceiro usuário feito (não vê nada)
- [ ] Backup diário rodando no repositório privado
- [ ] Uma restauração testada
- [ ] Nenhuma `secret key` ou `service_role` no código, no `.env.local` ou na Vercel
