-- Enable row-level security on every table in the public schema.
-- The app connects as the table owner or a BYPASSRLS role, so its queries are
-- unaffected. With no policies defined, this denies all access through
-- Supabase's public Data API (the anon and authenticated roles).
-- New tables added in later migrations must also run ENABLE ROW LEVEL SECURITY.
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;
