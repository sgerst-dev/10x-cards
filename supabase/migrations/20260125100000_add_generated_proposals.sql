-- =====================================================
-- Migration: Add generated proposals cache to generation_sessions
-- Purpose: Store AI-generated flashcard proposals to return same results for identical requests
-- Date: 2026-01-25
-- =====================================================

-- Add column to store generated flashcard proposals as JSONB
alter table public.generation_sessions
add column generated_proposals jsonb;

-- Add comment explaining the column purpose
comment on column public.generation_sessions.generated_proposals is 
'Cached AI-generated flashcard proposals (array of {front, back, source}) to return identical results for the same source_text_hash';

-- Create index for efficient lookups by user_id and source_text_hash
create index idx_generation_sessions_user_hash 
on public.generation_sessions (user_id, source_text_hash);

-- Add generation_id column to generation_errors for better error tracking
alter table public.generation_errors
add column generation_id uuid references public.generation_sessions(id) on delete set null;

-- Add comment explaining the column purpose
comment on column public.generation_errors.generation_id is 
'Reference to the generation session that failed, if one was created before the error occurred';
