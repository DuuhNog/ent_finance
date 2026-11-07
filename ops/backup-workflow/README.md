# Backup diário do Supabase (repositório privado)

Este workflow faz backup do banco todo dia, criptografa com `age` e guarda
como artifact do GitHub Actions. **Ele precisa rodar num repositório
PRIVADO separado** — nunca neste repositório público, porque o artifact
contém um dump completo do banco (dados financeiros reais).

Como bônus, o acesso diário ao projeto também evita que o Supabase pause o
projeto por inatividade (acontece no plano gratuito depois de um tempo sem
uso).

## Passo a passo

### 1. Criar o repositório privado

Crie um repositório novo no GitHub, marcado como **Private**. Pode ser
vazio — só precisa do workflow.

### 2. Copiar o workflow

Copie a pasta `.github/workflows/backup.yml` daqui para o mesmo caminho no
repositório privado.

### 3. Gerar o par de chaves do `age`

No seu computador (não no GitHub):

```bash
age-keygen -o backup-key.txt
```

Isso imprime a chave pública (`public key: age1...`) e grava a chave
**privada** no arquivo. Guarde `backup-key.txt` num gerenciador de senhas —
é a única forma de descriptografar os backups depois. Se perder esse
arquivo, os backups antigos ficam inacessíveis para sempre.

### 4. Pegar a connection string do Session Pooler

No painel do Supabase: **Project Settings → Database → Connection string →
Session pooler**. Copie a URI completa (já vem com usuário e placeholder de
senha — troque pela senha do banco, a mesma do passo 2 do
`docs/supabase-setup.md`).

### 5. Criar os secrets no repositório privado

Em **Settings → Secrets and variables → Actions**, crie:

| Secret            | Valor                                           |
| ----------------- | ----------------------------------------------- |
| `SUPABASE_DB_URL` | A connection string do Session Pooler (passo 4) |
| `AGE_PUBLIC_KEY`  | A chave pública gerada no passo 3 (`age1...`)   |

### 6. Testar

Na aba **Actions** do repositório privado, rode o workflow manualmente
(`workflow_dispatch`) e confira se ele termina com sucesso e gera um
artifact `supabase-backup-AAAA-MM-DD`.

## Restaurar um backup

Veja [`docs/restore.md`](../../docs/restore.md) no repositório principal
(público) — o procedimento de restauração e o checklist de teste trimestral
estão lá, já que não têm nada sensível.
