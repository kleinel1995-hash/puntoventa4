
-- Ejecuta TODO este archivo en Supabase > SQL Editor.
-- Cada módulo usa su propia tabla; no se utiliza public.pos_app_data.
-- Nota: estas políticas abiertas son solo para pruebas. Para producción,
-- activa Supabase Auth y restringe cada fila al usuario/negocio correspondiente.

create table if not exists public.pos_productos (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_inventario (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_compras (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_ventas (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_cotizaciones (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_clientes (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_gastos (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_proveedores (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_confignegocio (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_configimpuesto (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_configimpresora (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_configpagos (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_usuarios (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_cierres (id text primary key, value jsonb not null, updated_at timestamptz not null default now());
create table if not exists public.pos_usuarioactual (id text primary key, value jsonb not null, updated_at timestamptz not null default now());

-- Permisos de prueba para la clave pública anon.
do $$
declare t text;
begin
  foreach t in array array[
    'pos_productos','pos_inventario','pos_compras','pos_ventas','pos_cotizaciones',
    'pos_clientes','pos_gastos','pos_proveedores','pos_confignegocio','pos_configimpuesto',
    'pos_configimpresora','pos_configpagos','pos_usuarios','pos_cierres','pos_usuarioactual'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    execute format('drop policy if exists "POS prueba acceso total" on public.%I', t);
    execute format('create policy "POS prueba acceso total" on public.%I for all to anon, authenticated using (true) with check (true)', t);
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
