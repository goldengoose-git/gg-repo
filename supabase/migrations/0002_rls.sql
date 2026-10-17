-- =============================================================
-- GG CJ Repository — Row Level Security
-- Traduce in policy DB i controlli ruolo che prima vivevano SOLO
-- nel frontend (isReadOnlyUser / isMapEditorUser / blockIfReadOnly).
--
-- Modello permessi (dalla logica SSJS/JS originale):
--   user      -> sola lettura ovunque
--   mapeditor -> legge tutto; può modificare flow/notes dei journey;
--                NON può modificare asset/config dei template
--   admin     -> può tutto
-- =============================================================

-- Helper: ruolo dell'utente corrente (SECURITY DEFINER per leggere profiles
-- senza ricadere nelle policy di profiles stesse).
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid() and active),
    'user'::public.app_role
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.current_app_role() = 'admin';
$$;

create or replace function public.is_mapeditor_or_admin()
returns boolean language sql stable as $$
  select public.current_app_role() in ('mapeditor','admin');
$$;

-- -------------------------------------------------------------
-- Abilita RLS
-- -------------------------------------------------------------
alter table public.journeys           enable row level security;
alter table public.templates          enable row level security;
alter table public.expired_assets_log enable row level security;
alter table public.profiles           enable row level security;

-- -------------------------------------------------------------
-- JOURNEYS
-- Lettura: ogni utente autenticato.
-- Update : mapeditor o admin (editano flow + notes dalla Map View).
-- Insert/Delete: solo admin.
-- -------------------------------------------------------------
drop policy if exists journeys_select on public.journeys;
create policy journeys_select on public.journeys
  for select to authenticated using (true);

drop policy if exists journeys_update on public.journeys;
create policy journeys_update on public.journeys
  for update to authenticated
  using (public.is_mapeditor_or_admin())
  with check (public.is_mapeditor_or_admin());

drop policy if exists journeys_insert on public.journeys;
create policy journeys_insert on public.journeys
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists journeys_delete on public.journeys;
create policy journeys_delete on public.journeys
  for delete to authenticated
  using (public.is_admin());

-- -------------------------------------------------------------
-- TEMPLATES
-- Lettura: ogni utente autenticato.
-- Update/Insert/Delete: solo admin (asset editing e MMS/SMS config
-- erano riservati ad Admin — mapeditor bloccato da blockIfReadOnly).
-- -------------------------------------------------------------
drop policy if exists templates_select on public.templates;
create policy templates_select on public.templates
  for select to authenticated using (true);

drop policy if exists templates_write_admin on public.templates;
create policy templates_write_admin on public.templates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------------
-- EXPIRED ASSETS LOG — lettura a tutti, scrittura solo admin
-- (di norma ci scrive solo la service key via API/cron).
-- -------------------------------------------------------------
drop policy if exists expired_select on public.expired_assets_log;
create policy expired_select on public.expired_assets_log
  for select to authenticated using (true);

drop policy if exists expired_write_admin on public.expired_assets_log;
create policy expired_write_admin on public.expired_assets_log
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- -------------------------------------------------------------
-- PROFILES
-- Ognuno legge il proprio profilo; admin legge tutti.
-- Il ruolo lo cambia solo un admin (o la service key).
-- -------------------------------------------------------------
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- NB: l'INSERT su profiles avviene via trigger handle_new_user()
-- (SECURITY DEFINER), quindi non serve una policy di insert per i client.

-- =============================================================
-- NOTA SULLE SCRITTURE SERVER-SIDE
-- Le API routes Next.js usano la SERVICE ROLE KEY, che bypassa
-- la RLS by design. Lì applichiamo noi il controllo ruolo (vedi
-- src/lib/auth.ts -> requireRole). La RLS resta come seconda
-- linea di difesa per qualunque accesso col token utente (anon).
-- =============================================================
