/**
 * Factory for creating test Flashcard objects
 *
 * Provides default values for all required fields with ability to override
 * specific properties via partial object.
 */

import type { FlashcardDTO } from "@/types";

export function createFlashcard(overrides?: Partial<FlashcardDTO>): FlashcardDTO {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    deck_id: crypto.randomUUID(),
    front: "Test Question",
    back: "Test Answer",
    source: "manual",
    // Default FSRS parameters for new flashcards
    stability: 0.0,
    difficulty: 0.0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 0, // 0 = "new" state
    last_review: null,
    next_review: now,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}
