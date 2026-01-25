-- =====================================================
-- Migration: Enable Row Level Security
-- Purpose: Re-enable RLS on flashcards, generation_errors, and generation_sessions
-- Date: 2026-01-25
-- 
-- This migration restores RLS that was disabled in 20260117150000_disable_policies.sql
-- All existing policies will now be enforced again.
-- =====================================================

-- Enable RLS on generation_sessions
alter table public.generation_sessions enable row level security;

-- Enable RLS on generation_errors
alter table public.generation_errors enable row level security;

-- Enable RLS on flashcards
alter table public.flashcards enable row level security;

-- =====================================================
-- Verification: Check RLS status
-- =====================================================
-- Run this query to verify RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('generation_sessions', 'generation_errors', 'flashcards');
