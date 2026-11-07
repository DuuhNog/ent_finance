-- Só para desenvolvimento/teste local. Nunca aplicado ao banco remoto por
-- padrão: `supabase db push` só inclui este arquivo com a flag
-- `--include-seed`, que este projeto nunca usa.
create schema if not exists tests;
grant usage on schema tests to authenticated, anon;

-- Cria um usuário mínimo em auth.users para os testes pgTAP referenciarem
-- (sem passar pelo GoTrue — não dá para fazer login de verdade com ele).
-- Recebe o id explicitamente (em vez de gerar um) para os testes poderem
-- usar o mesmo id em várias instruções sem precisar capturar retorno.
create or replace function tests.create_user(p_id uuid, p_email text)
returns void
language sql
as $$
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data
  )
  values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated',
    'authenticated', p_email, 'not-a-real-password-hash',
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb
  );
$$;

-- Faz a transação atual "virar" um request autenticado como `p_user_id`,
-- para exercitar RLS e `auth.uid()` sem precisar de uma conexão HTTP de
-- verdade. Efeito dura só até o fim da transação (`set local`).
--
-- Sem `security definer` de propósito: `set role`/`reset role` são proibidos
-- dentro de função `security definer`. `reset role` antes de trocar funciona
-- de qualquer role porque sempre é permitido voltar ao role da sessão
-- (`postgres`, que conectou o `pg_prove`), de onde dá para virar
-- `authenticated`/`anon` de novo.
create or replace function tests.authenticate_as(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end;
$$;

create or replace function tests.authenticate_as_anon()
returns void
language plpgsql
as $$
begin
  reset role;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
end;
$$;

grant execute on function tests.create_user(uuid, text) to authenticated, anon;
grant execute on function tests.authenticate_as(uuid) to authenticated, anon;
grant execute on function tests.authenticate_as_anon() to authenticated, anon;
