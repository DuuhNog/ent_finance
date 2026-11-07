-- Retoma um parcelamento no cartão que começou antes de usar o app: cria as
-- parcelas restantes (de `p_start_installment` até `p_total_installments`),
-- todas com o mesmo valor por parcela — diferente de
-- `create_installment_purchase`, que divide um total novo. Mesma garantia de
-- atomicidade: ou todas as parcelas restantes são criadas, ou nenhuma é.
-- `security invoker`: roda como o usuário autenticado, então os inserts
-- ainda passam pelas políticas de RLS de `transactions`.
create or replace function public.resume_installment_purchase(
  p_household_id uuid,
  p_category_id uuid,
  p_installment_amount_cents bigint,
  p_start_installment integer,
  p_total_installments integer,
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
  v_month_start date;
  v_last_day_of_month date;
  v_day int;
  v_occurred_on date;
  v_i integer;
begin
  if not private.is_household_member(p_household_id) then
    raise exception 'usuário não é membro desta casa';
  end if;

  if p_installment_amount_cents is null or p_installment_amount_cents <= 0
    or p_installment_amount_cents > 1000000000 then
    raise exception 'valor da parcela inválido: %', p_installment_amount_cents;
  end if;

  if p_total_installments is null or p_total_installments < 2
    or p_total_installments > 24 then
    raise exception 'número total de parcelas inválido: %', p_total_installments;
  end if;

  if p_start_installment is null or p_start_installment < 2
    or p_start_installment > p_total_installments then
    raise exception 'parcela inicial inválida: %', p_start_installment;
  end if;

  if p_first_occurred_on is null then
    raise exception 'data da parcela é obrigatória';
  end if;

  v_installment_group_id := gen_random_uuid();
  v_day := extract(day from p_first_occurred_on)::int;

  for v_i in p_start_installment..p_total_installments loop
    v_month_start := (
      date_trunc('month', p_first_occurred_on)
        + ((v_i - p_start_installment) || ' months')::interval
    )::date;
    v_last_day_of_month := (v_month_start + interval '1 month' - interval '1 day')::date;
    v_occurred_on := least(v_month_start + (v_day - 1), v_last_day_of_month);

    insert into public.transactions (
      household_id, category_id, kind, amount_cents, occurred_on,
      payment_method, description, installment_group_id, installment_number,
      installment_total, created_by
    ) values (
      p_household_id, p_category_id, 'expense', p_installment_amount_cents,
      v_occurred_on, 'credit_card', p_description,
      v_installment_group_id, v_i, p_total_installments, (select auth.uid())
    );
  end loop;

  return query
    select * from public.transactions
    where installment_group_id = v_installment_group_id
    order by installment_number;
end;
$$;

revoke all on function public.resume_installment_purchase(
  uuid, uuid, bigint, integer, integer, date, text
) from public;
grant execute on function public.resume_installment_purchase(
  uuid, uuid, bigint, integer, integer, date, text
) to authenticated;
