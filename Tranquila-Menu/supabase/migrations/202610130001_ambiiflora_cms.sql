-- Ambiiflora menu CMS. Run in the Supabase SQL editor before configuring the app.
create table if not exists public.ambiiflora_cms (
  id integer primary key default 1 check (id = 1),
  menu jsonb not null default '{"categories":[],"items":[]}'::jsonb,
  published_menu jsonb not null default '{"categories":[],"items":[]}'::jsonb,
  published_at timestamptz,
  draft_initialized boolean not null default false,
  published_initialized boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.ambiiflora_cms add column if not exists draft_initialized boolean not null default false;
alter table public.ambiiflora_cms add column if not exists published_initialized boolean not null default false;
create table if not exists public.ambiiflora_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp text not null default '2348160784818',
  open text not null default '08:00',
  close text not null default '22:00',
  paused boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.ambiiflora_staff (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','staff')) default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.ambiiflora_menu_backups (
  id bigint generated always as identity primary key,
  menu jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  reason text not null default 'manual backup',
  created_at timestamptz not null default now()
);
create table if not exists public.ambiiflora_audit_log (
  id bigint generated always as identity primary key,
  staff_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.ambiiflora_cms enable row level security;
alter table public.ambiiflora_settings enable row level security;
alter table public.ambiiflora_staff enable row level security;
alter table public.ambiiflora_menu_backups enable row level security;
alter table public.ambiiflora_audit_log enable row level security;
-- Intentionally no anon/authenticated policies. Server routes use the service-role key only after authorization.
insert into public.ambiiflora_cms (id) values (1) on conflict (id) do nothing;
insert into public.ambiiflora_settings (id) values (1) on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ambiiflora-menu', 'ambiiflora-menu', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;
