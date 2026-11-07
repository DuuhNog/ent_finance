-- Casa (household): grupo que compartilha os dados. Sem escrita pelo
-- cliente — membros e casas são criados por `private.create_household`,
-- rodado no SQL Editor do painel.
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.households
  for each row execute function private.set_updated_at();

alter table public.households enable row level security;

-- Quem pertence a cada casa. Tabela de junção pura: sem escrita pelo
-- cliente (nem o próprio membro pode se adicionar ou remover).
create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

alter table public.household_members enable row level security;

-- Verifica se o usuário autenticado é membro da casa `h`. `security definer`
-- + `search_path = ''` para rodar com privilégios do dono (contorna a RLS
-- de `household_members` de propósito) e não ser afetado por um
-- `search_path` malicioso; sempre qualifica os nomes com `public.`.
create or replace function private.is_household_member(h uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.household_members m
    where m.household_id = h and m.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_household_member(uuid) from public;
grant execute on function private.is_household_member(uuid) to authenticated;

create policy households_select on public.households
  for select to authenticated
  using (private.is_household_member(id));

revoke all on public.households from anon, authenticated;
grant select on public.households to authenticated;

create policy household_members_select on public.household_members
  for select to authenticated
  using (private.is_household_member(household_id));

revoke all on public.household_members from anon, authenticated;
grant select on public.household_members to authenticated;
