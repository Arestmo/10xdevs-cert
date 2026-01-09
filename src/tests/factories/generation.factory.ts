/**
 * Factory for creating test Generation-related objects
 *
 * Provides factory functions for:
 * - FlashcardDraftDTO (AI-generated drafts)
 * - GenerationEvent
 */

import type { FlashcardDraftDTO } from "@/types";

export function createFlashcardDraft(overrides?: Partial<FlashcardDraftDTO>): FlashcardDraftDTO {
  return {
    index: 0,
    front: "What is TypeScript?",
    back: "A typed superset of JavaScript that compiles to plain JavaScript",
    ...overrides,
  };
}

export function createFlashcardDrafts(count: number): FlashcardDraftDTO[] {
  return Array.from({ length: count }, (_, i) =>
    createFlashcardDraft({
      index: i,
      front: `Question ${i + 1}`,
      back: `Answer ${i + 1}`,
    })
  );
}
