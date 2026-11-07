begin;
select plan(7);

insert into households (id, name) values ('10000000-0000-0000-0000-000000000001', 'Casa 1');
select tests.create_user('20000000-0000-0000-0000-000000000001', 'a@example.com');
insert into household_members (household_id, user_id) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
insert into categories (id, household_id, name, kind) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Cartão', 'expense');

select tests.authenticate_as('20000000-0000-0000-0000-000000000001');

-- Retomando na parcela 5 de 10: cria as parcelas 5..10 (6 linhas).
select lives_ok(
  $$ select resume_installment_purchase(
       '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
       4399, 5, 10, '2026-11-04', 'Havan Palhoca Centro'
     ) $$,
  'retomar parcelamento em andamento é aceito'
);

select is(
  (select count(*)::int from transactions
     where household_id = '10000000-0000-0000-0000-000000000001'),
  6,
  'cria exatamente as parcelas restantes (10 - 5 + 1 = 6)'
);

select is(
  (select array_agg(installment_number order by installment_number) from transactions
     where household_id = '10000000-0000-0000-0000-000000000001'),
  array[5, 6, 7, 8, 9, 10]::smallint[],
  'installment_number vai de 5 a 10'
);

select is(
  (select distinct amount_cents::int from transactions
     where household_id = '10000000-0000-0000-0000-000000000001'),
  4399,
  'todas as parcelas restantes têm o mesmo valor'
);

-- Resumir na parcela 1 não faz sentido (é o fluxo normal de parcelamento).
select throws_ok(
  $$ select resume_installment_purchase(
       '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
       4399, 1, 10, '2026-11-04', null
     ) $$,
  'P0001',
  null,
  'retomar na parcela 1 é rejeitado'
);

-- Parcela inicial maior que o total também é rejeitada.
select throws_ok(
  $$ select resume_installment_purchase(
       '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
       4399, 11, 10, '2026-11-04', null
     ) $$,
  'P0001',
  null,
  'parcela inicial maior que o total é rejeitada'
);

select is(
  (select count(*)::int from transactions
     where household_id = '10000000-0000-0000-0000-000000000001'),
  6,
  'as tentativas inválidas não criaram nenhuma linha a mais'
);

select * from finish();
rollback;
