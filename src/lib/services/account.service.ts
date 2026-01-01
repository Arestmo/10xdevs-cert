/**
 * Account Service
 *
 * Handles account deletion operations.
 * Interacts with Supabase Auth Admin API for user deletion.
 *
 * @module AccountService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

/**
 * Custom error for account deletion failures
 */
export class AccountDeletionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccountDeletionError";
  }
}

/**
 * Service for managing account operations.
 *
 * Responsibilities:
 * - Delete user accounts via Supabase Auth Admin API
 * - Handle cascade deletion of all user data
 */
export class AccountService {
  /**
   * Creates a new AccountService instance
   *
   * @param supabase - Authenticated Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Deletes a user account and all associated data.
   *
   * Flow:
   * 1. Call Supabase Auth Admin API to delete user
   * 2. Database cascades deletion to all related tables
   * 3. Throw AccountDeletionError if deletion fails
   *
   * Cascade order (automatic via database constraints):
   * - auth.users (Supabase Auth)
   * - profiles (ON DELETE CASCADE)
   * - decks (ON DELETE CASCADE from profiles)
   * - flashcards (ON DELETE CASCADE from decks)
   * - generation_events (ON DELETE CASCADE from profiles)
   *
   * @param userId - UUID of the user to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {AccountDeletionError} If user deletion fails
   */
  async deleteAccount(userId: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new AccountDeletionError(`Failed to delete user account: ${error.message}`);
    }
  }
}
