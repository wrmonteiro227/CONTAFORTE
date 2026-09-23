-- Sexta-Feira: banco de memoria e aprendizado
-- Cole este arquivo no SQL Editor do Supabase e execute uma vez.
-- Nunca use a chave service_role no navegador. Use apenas a chave anon/public.

create extension if not exists pgcrypto;

create table if not exists public.ai_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'fact' check (kind in ('fact', 'preference', 'context', 'knowledge')),
  content text not null check (char_length(content) between 1 and 2000),
  source text not null default 'user',
  confidence numeric(4,3) not null default 1.000 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phrase text not null check (char_length(phrase) between 1 and 1000),
  understood_as text not null,
  corrected_to text not null,
  confidence numeric(4,3) not null default 0.700 check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(question) between 1 and 1000),
  source text,
  title text,
  url text,
  summary text,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'senhor',
  personality text not null default 'objetiva' check (personality in ('objetiva', 'tecnica', 'acolhedora', 'investigadora')),
  local_only boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ai_tasks_updated_at on public.ai_tasks;
create trigger ai_tasks_updated_at before update on public.ai_tasks
for each row execute function public.set_updated_at();

drop trigger if exists ai_memories_updated_at on public.ai_memories;
create trigger ai_memories_updated_at before update on public.ai_memories
for each row execute function public.set_updated_at();

drop trigger if exists ai_settings_updated_at on public.ai_settings;
create trigger ai_settings_updated_at before update on public.ai_settings
for each row execute function public.set_updated_at();

alter table public.ai_tasks enable row level security;
alter table public.ai_memories enable row level security;
alter table public.ai_corrections enable row level security;
alter table public.ai_searches enable row level security;
alter table public.ai_settings enable row level security;

drop policy if exists ai_tasks_owner on public.ai_tasks;
create policy ai_tasks_owner on public.ai_tasks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists ai_memories_owner on public.ai_memories;
create policy ai_memories_owner on public.ai_memories for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists ai_corrections_owner on public.ai_corrections;
create policy ai_corrections_owner on public.ai_corrections for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists ai_searches_owner on public.ai_searches;
create policy ai_searches_owner on public.ai_searches for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists ai_settings_owner on public.ai_settings;
create policy ai_settings_owner on public.ai_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
