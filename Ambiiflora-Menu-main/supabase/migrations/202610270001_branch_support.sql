-- Branch-scoped menus, settings, and item availability. Staff authentication remains shared.
create table if not exists public.ambiiflora_branch_cms (
  branch_id text primary key check (branch_id in ('tranquila', 'tranquila-nest')),
  menu jsonb not null default '{"categories":[],"items":[]}'::jsonb,
  published_menu jsonb not null default '{"categories":[],"items":[]}'::jsonb,
  published_at timestamptz,
  draft_initialized boolean not null default false,
  published_initialized boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.ambiiflora_branch_settings (
  branch_id text primary key check (branch_id in ('tranquila', 'tranquila-nest')),
  whatsapp text not null default '2348160784818',
  open text not null default '08:00',
  close text not null default '22:00',
  paused boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.ambiiflora_item_availability (
  branch_id text not null check (branch_id in ('tranquila', 'tranquila-nest')),
  item_id text not null,
  available boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (branch_id, item_id)
);

alter table public.ambiiflora_menu_backups add column if not exists branch_id text;

alter table public.ambiiflora_branch_cms enable row level security;
alter table public.ambiiflora_branch_settings enable row level security;
alter table public.ambiiflora_item_availability enable row level security;

-- Start both branches from the current menu and settings, then let staff edit each independently.
insert into public.ambiiflora_branch_cms (
  branch_id, menu, published_menu, published_at, draft_initialized, published_initialized
)
select branches.branch_id, cms.menu, cms.published_menu, cms.published_at,
       cms.draft_initialized, cms.published_initialized
from public.ambiiflora_cms as cms
cross join (values ('tranquila'), ('tranquila-nest')) as branches(branch_id)
where cms.id = 1
on conflict (branch_id) do nothing;

insert into public.ambiiflora_branch_settings (branch_id, whatsapp, open, close, paused)
select branches.branch_id, settings.whatsapp, settings.open, settings.close, settings.paused
from public.ambiiflora_settings as settings
cross join (values ('tranquila'), ('tranquila-nest')) as branches(branch_id)
where settings.id = 1
on conflict (branch_id) do nothing;