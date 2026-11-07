-- Varredura final: `anon` não deve ter nenhum privilégio no schema public,
-- nem agora nem em objetos futuros criados sem grants explícitos. Isso
-- importa mesmo já revogando por tabela, porque o projeto do Supabase
-- concede privilégios padrão de conveniência a `anon`/`authenticated` por
-- padrão (`auto_expose_new_tables`).
revoke all on schema public from anon;
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- Exclusão é sempre soft delete via update: nenhuma tabela de dados tem
-- política de delete, e o privilégio é revogado explicitamente aqui também.
revoke delete on
  public.households,
  public.household_members,
  public.profiles,
  public.categories,
  public.recurring_bills,
  public.transactions,
  public.goals,
  public.audit_log
from authenticated;

alter default privileges in schema public revoke delete on tables from authenticated;
