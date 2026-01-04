-- ============================================================================
-- Migration: Add indexes for study session queries
-- ============================================================================
-- Description: Optimizes GET /api/study/cards performance
-- Author: Study Session Feature Implementation
-- Date: 2026-01-01
--
-- This migration creates:
-- - Index on next_review for efficient filtering and sorting
-- - Composite index for deck-specific study queries
--
-- Affected tables: flashcards
-- Dependencies: flashcards table must exist
-- Special considerations:
--   - These indexes are critical for study session performance
--   - next_review filtering (WHERE next_review <= NOW()) is the most common query
--   - deck_id filtering with next_review sorting is also common
-- ============================================================================


-- ============================================================================
-- SECTION 1: INDEXES FOR STUDY SESSION QUERIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Index: idx_flashcards_next_review
-- ----------------------------------------------------------------------------
-- Purpose: Optimizes study session queries filtering by next_review <= NOW()
--
-- This index enables efficient:
-- - Filtering cards due for review (WHERE next_review <= NOW())
-- - Sorting by review priority (ORDER BY next_review ASC)
--
-- Query pattern: SELECT * FROM flashcards WHERE next_review <= NOW() ORDER BY next_review
-- Expected use: Every study session initialization
-- ----------------------------------------------------------------------------
create index if not exists idx_flashcards_next_review
on flashcards(next_review);

comment on index idx_flashcards_next_review is
'Optimizes study session queries filtering by next_review <= NOW()';


-- ----------------------------------------------------------------------------
-- Index: idx_flashcards_deck_next_review
-- ----------------------------------------------------------------------------
-- Purpose: Optimizes deck-specific study queries
--
-- This composite index enables efficient:
-- - Filtering by specific deck AND cards due for review
-- - Sorting by review priority within a deck
--
-- Query pattern:
--   SELECT * FROM flashcards
--   WHERE deck_id = ? AND next_review <= NOW()
--   ORDER BY next_review
--
-- Expected use: Study sessions filtered to a specific deck
-- Performance: Composite index is more efficient than two separate lookups
-- ----------------------------------------------------------------------------
create index if not exists idx_flashcards_deck_next_review
on flashcards(deck_id, next_review);

comment on index idx_flashcards_deck_next_review is
'Optimizes deck-specific study queries with both deck_id filter and next_review sorting';
