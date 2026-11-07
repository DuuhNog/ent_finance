-- Cria uma compra parcelada no cartão como N lançamentos, numa única
-- transação: ou todas as parcelas são criadas, ou nenhuma é (qualquer
-- `raise exception` desfaz tudo, porque a função inteira é uma transação).
-- `security invoker`: roda como o usuário autenticado, então os inserts
-- ainda passam pelas políticas de RLS de `transactions`.
create or replace function public.create_installment_purchase(
  p_household_id uuid,
  p_category_id uuid,
  p_total_amount_cents bigint,
  p_installments integer,
  p_first_occurred_on date,
  p_description text default null
)
returns setof public.transactions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_installment_group_id uuid;
  v_base bigint;
  v_remainder bigint;
  v_month_start date;
  v_last_day_of_month date;
  v_day int;
  v_occurred_on date;
  v_i integer;
begin
  if not private.is_household_member(p_household_id) then
    raise exception 'usuário não é membro desta casa';
  end if;

  if p_total_amount_cents is null or p_total_amount_cents <= 0
    or p_total_amount_cents > 1000000000 then
    raise exception 'valor total inválido: %', p_total_amount_cents;
  end if;

  if p_installments is null or p_installments < 2 or p_installments > 24 then
    raise exception 'número de parcelas inválido: %', p_installments;
  end if;

  if p_first_occurred_on is null then
    raise exception 'data da compra é obrigatória';
  end if;

  v_installment_group_id := gen_random_uuid();
  v_base := p_total_amount_cents / p_installments;
  v_remainder := p_total_amount_cents - (v_base * p_installments);
  v_day := extract(day from p_first_occurred_on)::int;

  for v_i in 1..p_installments loop
    v_month_start := (
      date_trunc('month', p_first_occurred_on) + ((v_i - 1) || ' months')::interval
    )::date;
    v_last_day_of_month := (v_month_start + interval '1 month' - interval '1 day')::date;
    v_occurred_on := least(v_month_start + (v_day - 1), v_last_day_of_month);

    insert into public.transactions (
      household_id, category_id, kind, amount_cents, occurred_on,
      payment_method, description, installment_group_id, installment_number,
      installment_total, created_by
    ) values (
      p_household_id, p_category_id, 'expense',
      case when v_i = 1 then v_base + v_remainder else v_base end,
      v_occurred_on, 'credit_card', p_description,
      v_installment_group_id, v_i, p_installments, (select auth.uid())
    );
  end loop;

  return query
    select * from public.transactions
    where installment_group_id = v_installment_group_id
    order by installment_number;
end;
$$;

revoke all on function public.create_installment_purchase(
  uuid, uuid, bigint, integer, date, text
) from public;
grant execute on function public.create_installment_purchase(
  uuid, uuid, bigint, integer, date, text
) to authenticated;
