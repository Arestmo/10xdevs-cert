-- ============================================================================
-- Migration: Add increment_ai_usage Function
-- ============================================================================
-- Description: Creates a database function to atomically increment the monthly
--              AI flashcard count for a user, preventing race conditions when
--              multiple generation requests occur simultaneously.
-- Author: Generated from generations-endpoint-implementation-plan.md
-- Date: 2025-12-10
--
-- This migration creates:
-- - increment_ai_usage() function for atomic counter increment
-- - Grant execute permission to authenticated users
--
-- Affected tables: profiles
-- Dependencies: profiles table (created in 20251210140000_initial_schema.sql)
-- Special considerations:
--   - Uses SECURITY DEFINER to ensure function runs with creator's privileges
--   - Automatically updates updated_at timestamp
--   - Prevents race conditions when multiple requests increment count
-- ============================================================================


-- ============================================================================
-- SECTION 1: FUNCTION DEFINITION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: increment_ai_usage
-- ----------------------------------------------------------------------------
-- Atomically increments the monthly_ai_flashcards_count for a user
--
-- Purpose:
--   - Safely increment AI usage count when flashcards are generated
--   - Prevent race conditions from concurrent requests
--   - Automatically update updated_at timestamp
--
-- Parameters:
--   - p_user_id (uuid): User ID to increment count for
--   - p_count (integer): Number of flashcards to add to count
--
-- Returns: void
--
-- Security: SECURITY DEFINER allows authenticated users to execute this
--           function even if they don't have direct UPDATE permission on profiles
-- ----------------------------------------------------------------------------
create or replace function increment_ai_usage(
  p_user_id uuid,
  p_count integer
)
returns void
language plpgsql
security definer
as $$
begin
  -- Atomically increment the monthly AI flashcard count
  -- and update the timestamp
  update public.profiles
  set monthly_ai_flashcards_count = monthly_ai_flashcards_count + p_count,
      updated_at = now()
  where user_id = p_user_id;
end;
$$;


-- ============================================================================
-- SECTION 2: PERMISSIONS
-- ============================================================================

-- Grant execute permission to authenticated users
-- This allows users to increment their own AI usage count via the API
grant execute on function increment_ai_usage(uuid, integer) to authenticated;


-- ============================================================================
-- SECTION 3: METADATA
-- ============================================================================

-- Add function documentation
comment on function increment_ai_usage is
  'Atomically increments the monthly AI flashcard count for a user. Prevents race conditions when multiple requests occur simultaneously.';
