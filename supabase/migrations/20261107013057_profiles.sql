-- Perfil de exibição de cada usuário, por casa (nome mostrado em "quem
-- lançou"). `id` é o próprio id do usuário em `auth.users`.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  household_id uuid not null references public.households (id) on delete restrict,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

-- Qualquer membro da casa pode ver o nome de exibição dos outros membros.
create policy profiles_select on public.profiles
  for select to authenticated
  using (private.is_household_member(household_id));

-- Só o próprio usuário pode criar/editar o seu perfil (mesmo sendo a mesma
-- casa, ninguém edita o nome de outra pessoa pelo cliente).
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()) and private.is_household_member(household_id));

create policy profiles_update on public.profiles
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (id = (select auth.uid()) and private.is_household_member(household_id));

revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
