-- Ejecutar en Supabase > SQL Editor.
create table if not exists public.pos_app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.pos_app_data enable row level security;

-- Políticas abiertas SOLO para pruebas. En producción usa Auth + políticas por usuario/negocio.
drop policy if exists "POS public read" on public.pos_app_data;
create policy "POS public read" on public.pos_app_data
for select to anon, authenticated using (true);
drop policy if exists "POS public insert" on public.pos_app_data;
create policy "POS public insert" on public.pos_app_data
for insert to anon, authenticated with check (true);
drop policy if exists "POS public update" on public.pos_app_data;
create policy "POS public update" on public.pos_app_data
for update to anon, authenticated using (true) with check (true);

-- Activa la tabla para eventos Realtime (INSERT/UPDATE/DELETE).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'pos_app_data'
  ) then
    alter publication supabase_realtime add table public.pos_app_data;
  end if;
end $$;
