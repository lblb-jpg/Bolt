-- Run this file once in the Supabase SQL editor for project jevfttsaxbsaivbdckym.
create table if not exists public.bolt_shifts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  initial_balance numeric(12, 2) not null default 0,
  final_balance numeric(12, 2) not null default 0,
  gross_earnings numeric(12, 2) not null default 0,
  expenses numeric(12, 2) not null default 0,
  net_earnings numeric(12, 2) not null default 0,
  notes text not null default '',
  created_at bigint not null default floor(extract(epoch from clock_timestamp()) * 1000)::bigint
);

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
