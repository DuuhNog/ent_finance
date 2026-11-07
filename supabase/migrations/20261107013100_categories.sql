create table public.categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('expense', 'income')),
  is_savings boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete restrict
);

-- Evita duas categorias ativas com o mesmo nome e tipo na mesma casa.
create unique index categories_unique_active_name
  on public.categories (household_id, kind, lower(name))
  where archived_at is null;

create trigger set_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();

alter table public.categories enable row level security;

create policy categories_select on public.categories
  for select to authenticated
  using (private.is_household_member(household_id));

create policy categories_insert on public.categories
  for insert to authenticated
  with check (private.is_household_member(household_id));

create policy categories_update on public.categories
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

revoke all on public.categories from anon, authenticated;
grant select, insert, update on public.categories to authenticated;
