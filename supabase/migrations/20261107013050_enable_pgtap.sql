-- pgTAP: framework de testes do banco (supabase/tests/, rodado por
-- `supabase test db`). Habilitado também em produção de propósito — é só o
-- framework de teste, não expõe dados, e assim o mesmo schema vale local e
-- remoto.
create extension if not exists pgtap with schema extensions;
