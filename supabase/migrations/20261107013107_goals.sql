create table public.goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  kind text not null check (kind in ('credit_card_limit', 'category_limit', 'monthly_savings')),
  category_id uuid references public.categories (id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 1000000000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete restrict,

  constraint category_id_only_for_category_limit check (
    (kind = 'category_limit' and category_id is not null)
    or (kind <> 'category_limit' and category_id is null)
  )
);

-- No máximo uma meta ativa de limite de cartão por casa.
create unique index goals_unique_active_credit_card_limit
  on public.goals (household_id)
  where kind = 'credit_card_limit' and archived_at is null;

-- No máximo uma meta ativa de guardar dinheiro por casa.
create unique index goals_unique_active_monthly_savings
  on public.goals (household_id)
  where kind = 'monthly_savings' and archived_at is null;

-- No máximo uma meta ativa por categoria.
create unique index goals_unique_active_category_limit
  on public.goals (household_id, category_id)
  where kind = 'category_limit' and archived_at is null;

create trigger set_updated_at
  before update on public.goals
  for each row execute function private.set_updated_at();

alter table public.goals enable row level security;

create policy goals_select on public.goals
  for select to authenticated
  using (private.is_household_member(household_id));

create policy goals_insert on public.goals
  for insert to authenticated
  with check (private.is_household_member(household_id));

create policy goals_update on public.goals
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

revoke all on public.goals from anon, authenticated;
grant select, insert, update on public.goals to authenticated;
