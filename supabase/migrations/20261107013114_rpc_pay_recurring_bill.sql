-- Marca uma conta recorrente como paga numa competência: cria o lançamento
-- ligado (`recurring_bill_id`) com a data no dia de vencimento daquele mês.
-- O índice único em `transactions` garante que não dá para pagar a mesma
-- conta duas vezes na mesma competência (a segunda chamada falha).
-- `security invoker`: a leitura da conta e o insert do lançamento passam
-- pelas políticas de RLS normais.
create or replace function public.pay_recurring_bill(
  bill_id uuid,
  month date,
  amount_cents bigint
)
returns public.transactions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_bill public.recurring_bills;
  v_competence_month date;
  v_month_start date;
  v_last_day_of_month date;
  v_occurred_on date;
  v_transaction public.transactions;
begin
  if amount_cents is null or amount_cents <= 0 or amount_cents > 1000000000 then
    raise exception 'valor inválido: %', amount_cents;
  end if;

  if month is null then
    raise exception 'competência é obrigatória';
  end if;

  select * into v_bill
  from public.recurring_bills
  where id = bill_id and archived_at is null;

  if not found then
    raise exception 'conta recorrente não encontrada: %', bill_id;
  end if;

  v_competence_month := date_trunc('month', month)::date;
  v_month_start := v_competence_month;
  v_last_day_of_month := (v_month_start + interval '1 month' - interval '1 day')::date;
  v_occurred_on := least(v_month_start + (v_bill.due_day - 1), v_last_day_of_month);

  insert into public.transactions (
    household_id, category_id, kind, amount_cents, occurred_on,
    payment_method, description, recurring_bill_id, created_by
  ) values (
    v_bill.household_id, v_bill.category_id, 'expense', amount_cents,
    v_occurred_on, v_bill.payment_method, v_bill.name, v_bill.id, (select auth.uid())
  )
  returning * into v_transaction;

  return v_transaction;
end;
$$;

revoke all on function public.pay_recurring_bill(uuid, date, bigint) from public;
grant execute on function public.pay_recurring_bill(uuid, date, bigint) to authenticated;
