create table public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 50),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 1000000000),
  is_variable boolean not null default false,
  due_day smallint not null check (due_day between 1 and 31),
  payment_method text not null check (
    payment_method in ('credit_card', 'pix', 'debit', 'cash', 'boleto')
  ),
  start_month date not null default date_trunc('month', now())::date
    check (start_month = date_trunc('month', start_month)::date),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete restrict
);

create trigger set_updated_at
  before update on public.recurring_bills
  for each row execute function private.set_updated_at();

alter table public.recurring_bills enable row level security;

create policy recurring_bills_select on public.recurring_bills
  for select to authenticated
  using (private.is_household_member(household_id));

create policy recurring_bills_insert on public.recurring_bills
  for insert to authenticated
  with check (private.is_household_member(household_id));

create policy recurring_bills_update on public.recurring_bills
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

revoke all on public.recurring_bills from anon, authenticated;
grant select, insert, update on public.recurring_bills to authenticated;
