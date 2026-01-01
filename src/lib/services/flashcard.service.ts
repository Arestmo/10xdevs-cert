/**
 * Flashcard Service
 *
 * Handles flashcard retrieval with pagination, filtering, and sorting.
 * Ensures users can only access their own flashcards.
 *
 * @module FlashcardService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { FlashcardsListResponseDTO, GetFlashcardsQueryDTO } from "@/types";

/**
 * Custom error for deck not found or not owned by user
 */
export class DeckNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeckNotFoundError";
  }
}

/**
 * Service for managing flashcard operations.
 *
 * Responsibilities:
 * - Retrieve flashcards with pagination and filtering
 * - Support multiple sort fields and directions
 * - Enforce user ownership via deck relationship
 */
export class FlashcardService {
  /**
   * Creates a new FlashcardService instance
   *
   * @param supabase - Authenticated Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves a paginated list of user's flashcards with optional deck filtering.
   *
   * Flow:
   * 1. If deck_id provided, verify deck exists and belongs to user
   * 2. Build base query with inner join to decks table for user filtering
   * 3. Apply deck_id filter if provided
   * 4. Apply sorting (sort field + order)
   * 5. Apply pagination (range)
   * 6. Execute query with count
   * 7. Build and return FlashcardsListResponseDTO
   *
   * Security:
   * - CRITICAL: Always join with decks table and filter by user_id
   * - Prevents users from accessing flashcards from other users' decks
   * - Validates deck ownership before filtering
   *
   * @param userId - UUID of the authenticated user
   * @param filters - Query filters (deck_id, limit, offset, sort, order)
   * @returns Paginated list of flashcards
   * @throws {DeckNotFoundError} If deck_id provided but deck not found or not owned
   * @throws {Error} If database operation fails
   */
  async listFlashcards(userId: string, filters: GetFlashcardsQueryDTO): Promise<FlashcardsListResponseDTO> {
    // Step 1: If deck_id provided, verify deck exists and belongs to user
    if (filters.deck_id) {
      const { data: deck, error: deckError } = await this.supabase
        .from("decks")
        .select("id")
        .eq("id", filters.deck_id)
        .eq("user_id", userId)
        .single();

      // Guard clause: deck not found or not owned
      if (deckError || !deck) {
        throw new DeckNotFoundError("Deck not found");
      }
    }

    // Step 2: Build base query with inner join to decks table for user filtering
    // The inner join ensures we only get flashcards from user's decks
    let query = this.supabase
      .from("flashcards")
      .select("*, decks!inner(user_id)", { count: "exact" })
      .eq("decks.user_id", userId);

    // Step 3: Apply deck_id filter if provided
    if (filters.deck_id) {
      query = query.eq("deck_id", filters.deck_id);
    }

    // Step 4: Apply sorting
    query = query.order(filters.sort, { ascending: filters.order === "asc" });

    // Step 5: Apply pagination
    query = query.range(filters.offset, filters.offset + filters.limit - 1);

    // Step 6: Execute query
    const { data: flashcards, error, count } = await query;

    // Guard clause: database error
    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    const total = count ?? 0;

    // Remove the decks field from response (used only for filtering)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanedFlashcards = (flashcards ?? []).map(({ decks, ...flashcard }) => flashcard);

    // Step 7: Calculate has_more and return response
    const has_more = filters.offset + filters.limit < total;

    return {
      data: cleanedFlashcards,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        has_more,
      },
    };
  }
}
