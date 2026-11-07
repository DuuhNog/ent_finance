create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  table_name text not null,
  row_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users (id) on delete restrict,
  changed_at timestamptz not null default now()
);

create index audit_log_household_idx on public.audit_log (household_id, changed_at desc);

alter table public.audit_log enable row level security;

-- Só leitura, só da própria casa. Ninguém insere, altera ou apaga pelo
-- cliente — só o trigger `security definer` abaixo escreve aqui.
create policy audit_log_select on public.audit_log
  for select to authenticated
  using (private.is_household_member(household_id));

revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;

-- Grava uma linha em audit_log para toda mudança nas tabelas de dados.
-- `households` não tem coluna `household_id` (a própria linha é a casa), daí
-- o caso especial abaixo.
create or replace function private.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_row_id uuid;
begin
  if tg_op = 'DELETE' then
    v_row_id := old.id;
  else
    v_row_id := new.id;
  end if;

  if tg_table_name = 'households' then
    v_household_id := v_row_id;
  elsif tg_op = 'DELETE' then
    v_household_id := old.household_id;
  else
    v_household_id := new.household_id;
  end if;

  insert into public.audit_log (household_id, table_name, row_id, action, old_data, new_data, changed_by)
  values (
    v_household_id,
    tg_table_name,
    v_row_id,
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger write_audit_log
  after insert or update or delete on public.households
  for each row execute function private.write_audit_log();

create trigger write_audit_log
  after insert or update or delete on public.household_members
  for each row execute function private.write_audit_log();

create trigger write_audit_log
  after insert or update or delete on public.profiles
  for each row execute function private.write_audit_log();

create trigger write_audit_log
  after insert or update or delete on public.categories
  for each row execute function private.write_audit_log();

create trigger write_audit_log
  after insert or update or delete on public.recurring_bills
  for each row execute function private.write_audit_log();

create trigger write_audit_log
  after insert or update or delete on public.transactions
  for each row execute function private.write_audit_log();

create trigger write_audit_log
  after insert or update or delete on public.goals
  for each row execute function private.write_audit_log();
