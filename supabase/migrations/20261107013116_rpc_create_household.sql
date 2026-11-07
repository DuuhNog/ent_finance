-- Só pode ser chamada pelo SQL Editor do painel (schema `private`, sem
-- grant para `anon`/`authenticated`). Cria a casa, adiciona os membros
-- pelos e-mails (falha se algum não existir em auth.users), cria um perfil
-- e as categorias padrão.
create or replace function private.create_household(
  p_name text,
  p_member_emails text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_email text;
  v_user_id uuid;
  v_first_user_id uuid;
  v_display_name text;
begin
  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception 'nome da casa é obrigatório';
  end if;

  if p_member_emails is null or array_length(p_member_emails, 1) is null then
    raise exception 'informe ao menos um e-mail de membro';
  end if;

  insert into public.households (name) values (trim(p_name))
  returning id into v_household_id;

  foreach v_email in array p_member_emails loop
    select id into v_user_id from auth.users where email = v_email;

    if v_user_id is null then
      raise exception 'usuário não encontrado para o e-mail: %', v_email;
    end if;

    if v_first_user_id is null then
      v_first_user_id := v_user_id;
    end if;

    insert into public.household_members (household_id, user_id)
    values (v_household_id, v_user_id)
    on conflict (household_id, user_id) do nothing;

    v_display_name := initcap(split_part(v_email, '@', 1));

    insert into public.profiles (id, household_id, display_name)
    values (v_user_id, v_household_id, v_display_name)
    on conflict (id) do nothing;
  end loop;

  insert into public.categories (household_id, name, kind, is_savings, created_by)
  select v_household_id, c.name, 'expense', (c.name = 'Guardar (reserva)'), v_first_user_id
  from unnest(array[
    'Mercado', 'Alimentação fora', 'Moradia', 'Contas da casa', 'Transporte',
    'Saúde', 'Educação', 'Pensão', 'Terreno', 'Lazer', 'Assinaturas',
    'Compras', 'Outros', 'Guardar (reserva)'
  ]) as c(name);

  insert into public.categories (household_id, name, kind, is_savings, created_by)
  select v_household_id, c.name, 'income', false, v_first_user_id
  from unnest(array['Salário', 'Renda extra', 'Outras entradas']) as c(name);

  return v_household_id;
end;
$$;

revoke all on function private.create_household(text, text[]) from public;
