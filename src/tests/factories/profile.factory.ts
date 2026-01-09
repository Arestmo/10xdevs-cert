/**
 * Factory for creating test Profile objects
 *
 * Provides default values for all required fields with ability to override
 * specific properties via partial object.
 */

import type { Profile } from "@/types";

export function createProfile(overrides?: Partial<Profile>): Profile {
  return {
    user_id: crypto.randomUUID(),
    email: "test@example.com",
    full_name: null,
    avatar_url: null,
    monthly_ai_flashcards_count: 0,
    ai_limit_reset_date: new Date().toISOString().split("T")[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
