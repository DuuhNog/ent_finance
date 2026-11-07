-- Achado em auditoria de segurança: as políticas de insert/update de
-- transactions/recurring_bills/goals só validavam
-- `private.is_household_member(household_id)`, mas nunca que `category_id`
-- pertence à MESMA casa — um membro da casa A conseguia gravar um
-- lançamento/conta/meta na própria casa apontando para uma categoria da
-- casa B. Isso não vazava dado (a RLS de `categories` continua bloqueando
-- a leitura da categoria alheia — a referência fica "pendurada"), mas
-- quebra a integridade e dá um oráculo fraco de existência (só dá pra
-- saber que o insert falhou com violação de FK/RLS, não ler o conteúdo).
--
-- O `exists (...)` abaixo também é protegido por RLS: se `category_id`
-- pertencer a uma casa da qual o usuário não é membro, a subconsulta em
-- `categories` já retorna vazio por causa da política de select de
-- `categories` (`is_household_member`) — não precisa de `security definer`.

drop policy transactions_insert on public.transactions;
create policy transactions_insert on public.transactions
  for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.household_id = household_id
    )
  );

drop policy transactions_update on public.transactions;
create policy transactions_update on public.transactions
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (
    private.is_household_member(household_id)
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.household_id = household_id
    )
  );

drop policy recurring_bills_insert on public.recurring_bills;
create policy recurring_bills_insert on public.recurring_bills
  for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.household_id = household_id
    )
  );

drop policy recurring_bills_update on public.recurring_bills;
create policy recurring_bills_update on public.recurring_bills
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (
    private.is_household_member(household_id)
    and exists (
      select 1 from public.categories c
      where c.id = category_id and c.household_id = household_id
    )
  );

-- goals.category_id só é preenchido para kind = 'category_limit' (os
-- outros dois tipos têm category_id null, checado em
-- category_id_only_for_category_limit), então a consistência só precisa
-- ser validada quando category_id não é nulo.
drop policy goals_insert on public.goals;
create policy goals_insert on public.goals
  for insert to authenticated
  with check (
    private.is_household_member(household_id)
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.household_id = household_id
      )
    )
  );

drop policy goals_update on public.goals;
create policy goals_update on public.goals
  for update to authenticated
  using (private.is_household_member(household_id))
  with check (
    private.is_household_member(household_id)
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.household_id = household_id
      )
    )
  );

-- Achado secundário (defesa em profundidade, não explorável hoje): estas
-- duas funções de trigger nunca tiveram o `revoke` que
-- `private.is_household_member`/`private.create_household` já tinham.
-- `anon` não tem USAGE no schema private e funções `returns trigger` não
-- podem ser chamadas diretamente de qualquer forma, então isto não é
-- explorável agora — mas deixa o schema inconsistente com a própria
-- garantia que o projeto afirma ("anon sem nenhum privilégio em lugar
-- nenhum"), então fechamos por completude.
revoke all on function private.set_updated_at() from public;
revoke all on function private.write_audit_log() from public;
