/**
 * Factory for creating test Deck objects
 *
 * Provides default values for all required fields with ability to override
 * specific properties via partial object.
 */

import type { DeckDTO } from "@/types";

export function createDeck(overrides?: Partial<DeckDTO>): DeckDTO {
  return {
    id: crypto.randomUUID(),
    user_id: crypto.randomUUID(),
    name: "Test Deck",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
