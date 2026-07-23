-- Run this file once in the Supabase SQL editor for project jevfttsaxbsaivbdckym.
create table if not exists public.bolt_shifts (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null default 'principal' check (profile_id in ('principal', 'elyesse')),
  date date not null,
  start_time time not null,
  end_time time not null,
  initial_balance numeric(12, 2) not null default 0,
  final_balance numeric(12, 2) not null default 0,
  cash_rides numeric(12, 2)[] not null default '{}',
  rides jsonb not null default '[]'::jsonb,
  cash_earnings numeric(12, 2) not null default 0,
  gross_earnings numeric(12, 2) not null default 0,
  expenses numeric(12, 2) not null default 0,
  net_earnings numeric(12, 2) not null default 0,
  notes text not null default '',
  created_at bigint not null default floor(extract(epoch from clock_timestamp()) * 1000)::bigint
);

-- Keeps existing installations compatible when the table already exists.
alter table public.bolt_shifts
  add column if not exists cash_earnings numeric(12, 2) not null default 0,
  add column if not exists cash_rides numeric(12, 2)[] not null default '{}',
  add column if not exists rides jsonb not null default '[]'::jsonb,
  add column if not exists profile_id text not null default 'principal';

create index if not exists bolt_shifts_profile_date_idx
  on public.bolt_shifts (profile_id, date desc);

alter table public.bolt_shifts enable row level security;

grant select, insert, update, delete on table public.bolt_shifts to anon, authenticated;

drop policy if exists "bolt_shifts_select" on public.bolt_shifts;
create policy "bolt_shifts_select"
on public.bolt_shifts for select
to anon, authenticated
using (true);

drop policy if exists "bolt_shifts_insert" on public.bolt_shifts;
create policy "bolt_shifts_insert"
on public.bolt_shifts for insert
to anon, authenticated
with check (true);

drop policy if exists "bolt_shifts_update" on public.bolt_shifts;
create policy "bolt_shifts_update"
on public.bolt_shifts for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "bolt_shifts_delete" on public.bolt_shifts;
create policy "bolt_shifts_delete"
on public.bolt_shifts for delete
to anon, authenticated
using (true);
