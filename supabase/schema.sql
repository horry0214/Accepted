create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.conferences (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  full_name text not null,
  ccf_rank text not null check (ccf_rank in ('A', 'B', 'C', 'Other')),
  category_name text not null,
  category_description text,
  subcategories text[] default '{}'::text[],
  description text,
  website text,
  annual text,
  core_rank text,
  deadline timestamptz,
  deadline_note text,
  last_deadline timestamptz,
  last_deadline_note text,
  next_deadline timestamptz,
  next_deadline_note text,
  deadline_timezone text,
  deadline_type text not null default 'unknown' check (deadline_type in ('aoe', 'conference_local', 'unknown')),
  deadline_extension_probability numeric,
  conference_date text,
  conference_location text,
  page_limit text,
  acceptance_rate text,
  source_last_modified text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.conferences
  add column if not exists core_rank text,
  add column if not exists deadline timestamptz,
  add column if not exists deadline_note text,
  add column if not exists deadline_extension_probability numeric;

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.conferences (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  title text not null,
  content text not null,
  upvotes integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  parent_comment_id uuid references public.comments (id) on delete cascade,
  content text not null,
  upvotes integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  target_type text not null check (target_type in ('thread', 'comment')),
  target_id uuid not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, target_type, target_id)
);

create index if not exists conferences_slug_idx on public.conferences (slug);
create index if not exists conferences_rank_idx on public.conferences (ccf_rank);
create index if not exists conferences_core_rank_idx on public.conferences (core_rank);
create index if not exists conferences_latest_deadline_idx on public.conferences (deadline);
create index if not exists conferences_deadline_idx on public.conferences (next_deadline);
create index if not exists threads_conference_idx on public.threads (conference_id, created_at desc);
create index if not exists comments_thread_idx on public.comments (thread_id, created_at asc);
create index if not exists votes_target_idx on public.votes (target_type, target_id);

create or replace function public.handle_profile_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    username = excluded.username,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute function public.handle_profile_upsert();

alter table public.profiles enable row level security;
alter table public.conferences enable row level security;
alter table public.threads enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;

create policy "profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy "users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

create policy "conferences are viewable by everyone"
on public.conferences for select
using (true);

create policy "threads are viewable by everyone"
on public.threads for select
using (true);

create policy "authenticated users can create threads"
on public.threads for insert
with check (auth.uid() = user_id);

create policy "authors can update their own threads"
on public.threads for update
using (auth.uid() = user_id);

create policy "authors can delete their own threads"
on public.threads for delete
using (auth.uid() = user_id);

create policy "comments are viewable by everyone"
on public.comments for select
using (true);

create policy "authenticated users can create comments"
on public.comments for insert
with check (auth.uid() = user_id);

create policy "authors can update their own comments"
on public.comments for update
using (auth.uid() = user_id);

create policy "authors can delete their own comments"
on public.comments for delete
using (auth.uid() = user_id);

create policy "users can read their own votes"
on public.votes for select
using (auth.uid() = user_id);

create policy "authenticated users can vote"
on public.votes for insert
with check (auth.uid() = user_id);

create policy "users can remove their own votes"
on public.votes for delete
using (auth.uid() = user_id);
