alter table if exists public.conferences
  add column if not exists core_rank text,
  add column if not exists deadline timestamptz,
  add column if not exists deadline_note text,
  add column if not exists deadline_extension_probability numeric;

create index if not exists conferences_core_rank_idx on public.conferences (core_rank);
create index if not exists conferences_latest_deadline_idx on public.conferences (deadline);
