-- Migration: Add index for generation ownership verification
-- Date: 2026-01-01 16:26:05 UTC
-- Purpose: Optimize queries that check if a generation belongs to a user
-- Affected table: generation_events
-- Performance impact: Reduces ownership check from O(n) to O(log n)
--
-- This index is used by the POST /api/generations/{generationId}/reject endpoint
-- to verify that a generation session belongs to the authenticated user before
-- logging a REJECTED event.

-- add composite index on (generation_id, user_id)
-- this index optimizes the ownership verification query in generation.service.ts
create index if not exists idx_generation_events_generation_user
  on generation_events(generation_id, user_id);

-- add comment explaining index purpose
comment on index idx_generation_events_generation_user is
  'Optimizes ownership verification queries for generation rejection endpoint';
