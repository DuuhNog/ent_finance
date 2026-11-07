-- Schema `private`: nunca exposto pela API (não está em `api.schemas` no
-- config.toml). Guarda funções auxiliares e a função de criação de casa que
-- só podem ser chamadas pelo SQL Editor do painel, nunca pelo cliente.
create schema if not exists private;

-- `authenticated` precisa de USAGE no schema (não só EXECUTE na função) para
-- o PL/pgSQL conseguir resolver `private.is_household_member(...)` dentro das
-- RPCs `security invoker` (o cache de plano do PL/pgSQL é compilado na
-- primeira execução, sob o role que chamou, diferente de uma política de RLS
-- — essa já vem com o nome resolvido desde a criação). Nenhuma tabela do
-- schema private é exposta pela API (não está em `api.schemas`), então isso
-- não abre acesso a dados.
grant usage on schema private to authenticated;

-- Trigger genérico de `updated_at`, usado por todas as tabelas de dados.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- `private.is_household_member` é criada na migration seguinte, depois que
-- `public.household_members` existe (ela depende dessa tabela).
