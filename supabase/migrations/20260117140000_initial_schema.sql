-- =====================================================
-- Migration: Initial Schema for 10x-cards
-- Purpose: Create tables for flashcard management with AI generation tracking
-- Date: 2026-01-17
-- 
-- Tables Created:
--   - generation_sessions: Track AI generation sessions
--   - generation_errors: Log AI generation errors
--   - flashcards: Store user flashcards with AI generation metadata
-- 
-- Special Considerations:
--   - Row Level Security (RLS) enabled on all tables
--   - Automatic updated_at trigger for flashcards table
--   - Complex CHECK constraints for data integrity
--   - Foreign key relationships with Supabase Auth
-- =====================================================

-- =====================================================
-- Table: generation_sessions
-- Purpose: Track AI generation sessions including metadata about source text and results
-- =====================================================
create table if not exists public.generation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  model varchar(100) not null,
  source_text_hash varchar(64) not null,
  source_text_length integer not null,
  generated_count integer not null check (generated_count >= 0),
  accepted_count integer check (accepted_count >= 0),
  accepted_edited_count integer check (accepted_edited_count >= 0),
  created_at timestamptz not null default now(),
  -- ensure accepted cards don't exceed generated cards
  constraint check_accepted_counts check (
    coalesce(accepted_count, 0) + coalesce(accepted_edited_count, 0) <= generated_count
  )
);

-- enable row level security on generation_sessions
alter table public.generation_sessions enable row level security;

-- rls policy: authenticated users can view their own generation sessions
create policy "authenticated users can select own generation_sessions"
  on public.generation_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own generation sessions
create policy "authenticated users can insert own generation_sessions"
  on public.generation_sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own generation sessions
create policy "authenticated users can update own generation_sessions"
  on public.generation_sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================================================
-- Table: generation_errors
-- Purpose: Log errors that occur during AI generation for debugging and monitoring
-- =====================================================
create table if not exists public.generation_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  model varchar(100) not null,
  source_text_hash varchar(64) not null,
  source_text_length integer not null,
  error_code varchar(100) not null,
  error_message text not null,
  created_at timestamptz not null default now()
);

-- enable row level security on generation_errors
alter table public.generation_errors enable row level security;

-- rls policy: authenticated users can view their own generation errors
create policy "authenticated users can select own generation_errors"
  on public.generation_errors
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own generation errors
create policy "authenticated users can insert own generation_errors"
  on public.generation_errors
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- =====================================================
-- Custom Type: flashcard_source
-- Purpose: Enum to track the origin of flashcards (AI vs user-created)
-- =====================================================
create type flashcard_source as enum ('ai_generated', 'ai_edited', 'user_created');

-- =====================================================
-- Table: flashcards
-- Purpose: Store user flashcards with front/back content and generation metadata
-- =====================================================
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_id uuid references public.generation_sessions(id) on delete restrict,
  front varchar(250) not null,
  back varchar(500) not null,
  source flashcard_source not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- ensure data integrity: user_created cards have no generation_id,
  -- ai_generated and ai_edited cards must have a generation_id
  constraint check_source_generation_id check (
    (source = 'user_created' and generation_id is null) or
    (source in ('ai_generated', 'ai_edited') and generation_id is not null)
  )
);

-- enable row level security on flashcards
alter table public.flashcards enable row level security;

-- rls policy: authenticated users can view their own flashcards
create policy "authenticated users can select own flashcards"
  on public.flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: authenticated users can insert their own flashcards
create policy "authenticated users can insert own flashcards"
  on public.flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can update their own flashcards
create policy "authenticated users can update own flashcards"
  on public.flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: authenticated users can delete their own flashcards
create policy "authenticated users can delete own flashcards"
  on public.flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- =====================================================
-- Index: flashcards pagination
-- Purpose: Support efficient pagination queries sorted by creation date (newest first)
-- =====================================================
create index idx_flashcards_user_created on public.flashcards (user_id, created_at desc);

-- =====================================================
-- Function: update_updated_at_column
-- Purpose: Automatically update the updated_at timestamp when a row is modified
-- =====================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================
-- Trigger: set_updated_at
-- Purpose: Automatically update updated_at timestamp on flashcards table modifications
-- =====================================================
create trigger set_updated_at
  before update on public.flashcards
  for each row
  execute function public.update_updated_at_column();
