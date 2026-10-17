-- =============================================================
-- GG CJ Repository — Schema Supabase (Postgres)
-- Migrazione 0001: tabelle, tipi, indici
-- Mapping dalle Data Extension SFMC:
--   Email_Repository_3_DE          -> public.templates
--   Journey_Master_3_DE            -> public.journeys
--   Expired_Assets_Log_DE          -> public.expired_assets_log
--   Email_Repository_Login         -> public.profiles (+ auth.users di Supabase)
--   Email_Repository_Login_Attempts-> (rimpiazzata da Supabase Auth, non migrata)
-- =============================================================

-- Estensioni utili
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- RUOLI applicativi
-- -------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('user', 'mapeditor', 'admin');
exception when duplicate_object then null;
end $$;

-- -------------------------------------------------------------
-- JOURNEYS  (ex Journey_Master_3_DE)
-- -------------------------------------------------------------
create table if not exists public.journeys (
  id             text primary key,                 -- slug stabile (ex "welcome")
  name           text not null,                    -- nome visibile = chiave DE originale
  description    text default '',
  miro_board     text default '',
  miro_board_link text default '',
  hero_img       text default '',
  tags           text[] default '{}',
  default_flow_json jsonb default '[]'::jsonb,     -- ex defaultFlowJson
  flow_view_json jsonb default '[]'::jsonb,         -- ex flowViewJson (stato editor)
  flow_rules_text text default '',
  map_json       jsonb default '[]'::jsonb,
  notes          text default '',
  ppt_link       text default '',
  status         text default 'Active',
  active         text default 'Yes',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- -------------------------------------------------------------
-- TEMPLATES  (ex Email_Repository_3_DE)
-- La chiave logica nella DE era (Name, deliveryCode). Qui usiamo
-- un uuid come PK e manteniamo un unique su (name, delivery_code).
-- -------------------------------------------------------------
create table if not exists public.templates (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,                    -- ex Name
  delivery_code  text default '',
  status         text default 'Active',
  subject_line   text default '',
  body_copy_ita  text default '',
  body_copy_eng  text default '',
  assets_json    jsonb default '[]'::jsonb,        -- [{name,url}]
  mms            text default 'No',
  cdp            text default 'No',
  journey_name   text default '',                  -- FK logica verso journeys.name
  market         text default '',
  languages      text default '',
  hero_image     text default '',
  preview_jpg    text default '',
  banner         text default 'None',
  cdp_fallback   text default 'No',
  stopped        text default 'No',
  wallet         text default 'No',
  preheader      text default '',
  last_update    text default '',                  -- la DE la teneva come stringa MM/DD/YYYY
  copy_de_key    text default '',
  assets_de_key  text default '',
  -- schema canonico {version:1, items:[...]}
  mms_sms_config_json jsonb default '{"version":1,"items":[]}'::jsonb,
  -- copy MMS/SMS per lingua (ex colonne piatte della DE)
  mms_copy_en    text default '',
  mms_copy_zh    text default '',
  mms_copy_kr    text default '',
  sms_copy_en    text default '',
  sms_copy_zh    text default '',
  sms_copy_kr    text default '',
  mms_link       text default '',
  sms_link       text default '',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists templates_name_deliverycode_uidx
  on public.templates (name, delivery_code);

create index if not exists templates_journey_name_idx
  on public.templates (journey_name);

-- Ricerca testo (nome, codice, journey)
create index if not exists templates_search_idx
  on public.templates using gin (
    to_tsvector('simple',
      coalesce(name,'') || ' ' ||
      coalesce(delivery_code,'') || ' ' ||
      coalesce(journey_name,''))
  );

-- -------------------------------------------------------------
-- EXPIRED ASSETS LOG  (ex Expired_Assets_Log_DE)
-- Nella SPA era ricalcolato lato server a ogni load. Qui lo
-- teniamo come tabella opzionale di audit; la logica "expired"
-- la ricava la UI dalla data last_update, come già faceva.
-- -------------------------------------------------------------
create table if not exists public.expired_assets_log (
  delivery_code     text primary key,
  template_key      text default '',
  journey_name      text default '',
  days_since_update integer default 0,
  logged_at         timestamptz not null default now(),
  logged_by         text default 'page-load'
);

-- -------------------------------------------------------------
-- PROFILES  (ex Email_Repository_Login, senza password)
-- La password NON vive qui: la gestisce Supabase Auth (auth.users).
-- profiles.id referenzia auth.users.id 1:1. Il ruolo determina i
-- permessi via RLS (policy più sotto).
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  role        public.app_role not null default 'user',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- -------------------------------------------------------------
-- updated_at automatico
-- -------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_journeys on public.journeys;
create trigger trg_touch_journeys before update on public.journeys
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_templates on public.templates;
create trigger trg_touch_templates before update on public.templates
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_touch_profiles on public.profiles;
create trigger trg_touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

-- -------------------------------------------------------------
-- Alla registrazione di un utente auth, crea il profilo.
-- Ruolo di default: 'user'. Un admin lo promuove manualmente.
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)),
    'user',
    true
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
