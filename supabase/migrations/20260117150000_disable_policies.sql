-- =====================================================
-- Migration: Disable Row Level Security
-- Purpose: Temporarily disable RLS on flashcards, generation_errors, and generation_sessions
-- Date: 2026-01-17
-- 
-- IMPORTANT: This disables RLS but keeps all policies intact.
-- Policies will not be enforced until RLS is re-enabled.
-- To revert, see the statements at the bottom of this file.
-- =====================================================

-- Disable RLS on generation_sessions
alter table public.generation_sessions disable row level security;

-- Disable RLS on generation_errors
alter table public.generation_errors disable row level security;

-- Disable RLS on flashcards
alter table public.flashcards disable row level security;

-- =====================================================
-- TO REVERT: Run the following statements to re-enable RLS
-- =====================================================

/*
alter table public.generation_sessions enable row level security;
alter table public.generation_errors enable row level security;
alter table public.flashcards enable row level security;
*/
