create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete restrict,
  category_id uuid not null references public.categories (id) on delete restrict,
  kind text not null check (kind in ('expense', 'income')),
  amount_cents bigint not null check (amount_cents > 0 and amount_cents <= 1000000000),
  occurred_on date not null,
  -- Primeiro dia do mês de `occurred_on`. Aritmética pura de data (em vez de
  -- `date_trunc`) porque colunas geradas exigem uma expressão IMMUTABLE, e
  -- `date_trunc(text, date)` não é considerada immutable pelo Postgres.
  competence_month date generated always as (
    occurred_on - (extract(day from occurred_on)::int - 1)
  ) stored,
  payment_method text check (
    payment_method is null
    or payment_method in ('credit_card', 'pix', 'debit', 'cash', 'boleto')
  ),
  description text check (char_length(description) <= 80),
  recurring_bill_id uuid references public.recurring_bills (id) on delete restrict,
  installment_group_id uuid,
  installment_number smallint,
  installment_total smallint,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete restrict,

  -- Cartão conta no mês da compra: a fatura nunca é lançada. Entrada não
  -- tem forma de pagamento; gasto sempre tem.
  constraint payment_method_matches_kind check (
    (kind = 'expense' and payment_method is not null)
    or (kind = 'income' and payment_method is null)
  ),

  -- Os três campos de parcela são todos nulos ou todos preenchidos.
  constraint installment_fields_all_or_nothing check (
    (installment_group_id is null and installment_number is null and installment_total is null)
    or (installment_group_id is not null and installment_number is not null and installment_total is not null)
  ),
  constraint installment_total_range check (
    installment_total is null or installment_total between 2 and 24
  ),
  constraint installment_number_range check (
    installment_number is null or installment_number between 1 and installment_total
  ),
  -- Parcelamento só existe no cartão de crédito.
  constraint installments_only_on_credit_card check (
    installment_group_id is null or payment_method = 'credit_card'
  )
);

-- Uma conta recorrente só pode ser paga uma vez por competência.
create unique index transactions_recurring_bill_once_per_month
  on public.transactions (recurring_bill_id, competence_month)
  where deleted_at is null and recurring_bill_id is not null;

create index transactions_household_competence_idx
  on public.transactions (household_id, competence_month)
  where deleted_at is null;

create index transactions_installment_group_idx
  on public.transactions (installment_group_id)
  where installment_group_id is not null;

create trigger set_updated_at
  before update on public.transactions
  for each row execute function private.set_updated_at();

alter table public.transactions enable row level security;

create policy transactions_select on public.transactions
  for select to authenticated
  using (private.is_household_member(household_id));

create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (private.is_household_member(household_id));

create policy transactions_update on public.transactions
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (private.is_household_member(household_id));

revoke all on public.transactions from anon, authenticated;
grant select, insert, update on public.transactions to authenticated;
