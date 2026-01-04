/**
 * Profile Service
 *
 * Handles user profile retrieval and AI generation limit management.
 * Implements lazy reset logic for monthly AI flashcard generation limits.
 *
 * @module ProfileService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { Profile, ProfileResponseDTO } from "@/types";

/**
 * Monthly limit for AI-generated flashcards per user
 */
const MONTHLY_LIMIT = 200;

/**
 * Custom error thrown when a user profile is not found in the database.
 *
 * This should be rare since profiles are auto-created on signup,
 * but may occur during development or in edge cases.
 */
export class ProfileNotFoundError extends Error {
  constructor() {
    super("User profile not found");
    this.name = "ProfileNotFoundError";
  }
}

/**
 * Service for managing user profiles and AI generation limits.
 *
 * Responsibilities:
 * - Retrieve user profile data
 * - Perform lazy reset of monthly AI limits
 * - Calculate remaining AI generation quota
 */
export class ProfileService {
  /**
   * Creates a new ProfileService instance
   *
   * @param supabase - Authenticated Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves a user's profile with computed remaining AI limit.
   *
   * Flow:
   * 1. Fetch profile from database by user_id
   * 2. Guard clause: throw ProfileNotFoundError if profile doesn't exist
   * 3. Perform lazy reset if ai_limit_reset_date is before start of current month
   * 4. Calculate remaining_ai_limit = 200 - monthly_ai_flashcards_count
   * 5. Return ProfileResponseDTO with all fields
   *
   * @param userId - UUID of the authenticated user
   * @returns Profile data with computed remaining_ai_limit field
   * @throws {ProfileNotFoundError} When profile doesn't exist in database
   */
  async getProfile(userId: string): Promise<ProfileResponseDTO> {
    // Step 1: Fetch profile from database
    const { data: profile, error } = await this.supabase.from("profiles").select("*").eq("user_id", userId).single();

    // Step 2: Guard clause - profile not found
    if (error || !profile) {
      throw new ProfileNotFoundError();
    }

    // Step 3: Perform lazy reset if needed
    const updatedProfile = await this.performLazyReset(profile);

    // Step 4: Calculate remaining AI limit
    const remaining_ai_limit = MONTHLY_LIMIT - updatedProfile.monthly_ai_flashcards_count;

    // Step 5: Return ProfileResponseDTO
    return {
      ...updatedProfile,
      remaining_ai_limit,
    };
  }

  /**
   * Performs lazy reset of monthly AI generation counter if needed.
   *
   * Compares the profile's ai_limit_reset_date with the start of the current month.
   * If the reset date is before the current month, resets the counter to 0 and
   * updates the reset date to the start of the current month.
   *
   * This approach avoids scheduled cron jobs and ensures reset happens seamlessly
   * when the user accesses their profile.
   *
   * @param profile - Current profile data
   * @returns Updated profile (either from database or original if no reset needed)
   */
  private async performLazyReset(profile: Profile): Promise<Profile> {
    const now = new Date();
    const resetDate = new Date(profile.ai_limit_reset_date);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Check if reset is needed (reset date is before start of current month)
    if (resetDate < startOfMonth) {
      // Reset counter to 0 and update reset date
      const { data: updatedProfile, error } = await this.supabase
        .from("profiles")
        .update({
          monthly_ai_flashcards_count: 0,
          ai_limit_reset_date: startOfMonth.toISOString().split("T")[0], // Format as YYYY-MM-DD
        })
        .eq("user_id", profile.user_id)
        .select()
        .single();

      // If update fails, return original profile to avoid breaking the flow
      if (error || !updatedProfile) {
        return profile;
      }

      return updatedProfile;
    }

    // No reset needed, return original profile
    return profile;
  }
}
