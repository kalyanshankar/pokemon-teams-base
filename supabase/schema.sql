-- Team Base: database schema
-- Paste this whole file into Supabase > SQL Editor > New query, then click Run.

create table if not exists public.teams (
  id            uuid primary key default gen_random_uuid(),
  owner         uuid not null default auth.uid() references auth.users (id) on delete cascade,

  -- The only required field: the original paste text
  raw_paste     text not null check (length(trim(raw_paste)) > 0),

  -- Everything below is optional
  title         text,
  author        text,
  source_url    text,
  pokepaste_url text,
  replica_code  text,
  format        text default 'Champions',
  notes         text,
  rating        smallint check (rating between 1 and 5),
  tags          text[] not null default '{}',

  -- Filled automatically by the app from the paste
  members       jsonb  not null default '[]',  -- one object per Pokémon (species, item, ability, moves, ...)
  species       text[] not null default '{}',  -- ids, e.g. {incineroar, dragonite}
  items         text[] not null default '{}',
  moves         text[] not null default '{}',
  auto_tags     text[] not null default '{}',  -- e.g. {Trick Room, Tailwind, Intimidate}
  signature     text,                          -- species+item+ability+moves fingerprint for duplicate checks

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists teams_owner_idx     on public.teams (owner);
create index if not exists teams_species_idx   on public.teams using gin (species);
create index if not exists teams_signature_idx on public.teams (signature);

-- Keep updated_at fresh on edits
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists teams_touch on public.teams;
create trigger teams_touch before update on public.teams
for each row execute function public.touch_updated_at();

-- Security: only the signed-in owner can see or change their teams.
alter table public.teams enable row level security;

drop policy if exists "owner can read"   on public.teams;
drop policy if exists "owner can insert" on public.teams;
drop policy if exists "owner can update" on public.teams;
drop policy if exists "owner can delete" on public.teams;

create policy "owner can read"   on public.teams for select to authenticated using (owner = auth.uid());
create policy "owner can insert" on public.teams for insert to authenticated with check (owner = auth.uid());
create policy "owner can update" on public.teams for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy "owner can delete" on public.teams for delete to authenticated using (owner = auth.uid());
