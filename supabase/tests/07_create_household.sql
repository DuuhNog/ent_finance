begin;
select plan(4);

select tests.create_user('20000000-0000-0000-0000-000000000001', 'voce@example.com');
select tests.create_user('20000000-0000-0000-0000-000000000002', 'esposa@example.com');

select lives_ok(
  $$ select private.create_household('Nossa casa', array['voce@example.com', 'esposa@example.com']) $$,
  'create_household com e-mails existentes é aceito'
);

select is(
  (select count(*)::int from household_members hm
     join households h on h.id = hm.household_id
     where h.name = 'Nossa casa'),
  2,
  'os dois membros foram adicionados à casa'
);

select is(
  (select count(*)::int from categories c
     join households h on h.id = c.household_id
     where h.name = 'Nossa casa'),
  17,
  'as 17 categorias padrão (14 de gasto + 3 de entrada) foram criadas'
);

select throws_ok(
  $$ select private.create_household('Casa inexistente', array['nao-existe@example.com']) $$,
  null,
  'usuário não encontrado para o e-mail: nao-existe@example.com',
  'e-mail sem usuário correspondente é rejeitado'
);

select * from finish();
rollback;
