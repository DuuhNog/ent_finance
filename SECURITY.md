# Política de segurança

Este é um projeto pessoal de controle financeiro, mas o código é público e
trata dados sensíveis (financeiros) de pessoas reais. Levamos relatos de
segurança a sério.

## Como reportar uma vulnerabilidade

**Não abra uma issue pública.** Em vez disso, envie um e-mail para
**eduardo@entechnology.com.br** descrevendo:

- O tipo de vulnerabilidade (ex.: bypass de RLS, exposição de chave secreta,
  XSS, CSRF, injeção de SQL).
- Passos para reproduzir.
- Impacto potencial.

Você receberá uma confirmação em até 5 dias úteis. Pedimos que aguarde a
correção antes de divulgar publicamente o problema (_responsible disclosure_).

## Escopo

- Código neste repositório (frontend, migrations, RPCs, políticas de RLS).
- Workflow de backup em `ops/backup-workflow/` (sem expor segredos do
  repositório privado de backup).

Fora de escopo: engenharia social, ataques de força bruta contra a conta do
Supabase, e infraestrutura da Vercel/Supabase em si (reporte diretamente a
eles).

## Boas práticas já adotadas

- Nenhuma chave secreta (`service_role`) no frontend.
- RLS ativado em todas as tabelas, com testes pgTAP cobrindo isolamento entre
  casas.
- Pre-commit e CI com [gitleaks](https://github.com/gitleaks/gitleaks) para
  barrar segredos antes de chegarem ao histórico do git.
- Backups criptografados com [age](https://github.com/FiloSottile/age) em
  repositório privado separado.
