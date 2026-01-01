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
import type {
  FlashcardsListResponseDTO,
  GetFlashcardsQueryDTO,
  CreateFlashcardRequestDTO,
  FlashcardDTO,
  EventType,
} from "@/types";

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

  /**
   * Creates a new flashcard in the system.
   *
   * Supports two creation modes:
   * - Manual creation: User creates flashcard from scratch
   * - AI-generated acceptance: User accepts (with optional edits) an AI draft
   *
   * Flow:
   * 1. Validate deck ownership
   * 2. Insert flashcard with default FSRS parameters
   * 3. If source is "ai", log generation event (ACCEPTED or EDITED)
   * 4. Return created flashcard
   *
   * Security:
   * - CRITICAL: Always verify deck belongs to authenticated user
   * - Prevents creating flashcards in other users' decks
   *
   * @param userId - UUID of the authenticated user
   * @param data - Flashcard creation data
   * @returns Created flashcard with default FSRS parameters
   * @throws {DeckNotFoundError} If deck not found or not owned by user
   * @throws {Error} If database operation fails
   */
  async createFlashcard(userId: string, data: CreateFlashcardRequestDTO): Promise<FlashcardDTO> {
    // Step 1: Validate deck ownership
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select("id")
      .eq("id", data.deck_id)
      .eq("user_id", userId)
      .single();

    // Guard clause: deck not found or not owned
    if (deckError || !deck) {
      throw new DeckNotFoundError("Deck not found or access denied");
    }

    // Step 2: Insert flashcard with default FSRS parameters
    const { data: flashcard, error: flashcardError } = await this.supabase
      .from("flashcards")
      .insert({
        deck_id: data.deck_id,
        front: data.front,
        back: data.back,
        source: data.source,
        // Default FSRS parameters for new flashcards
        stability: 0.0,
        difficulty: 0.0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: 0, // 0 = "new" state
        last_review: null,
        next_review: new Date().toISOString(), // Immediately available for study
      })
      .select()
      .single();

    // Guard clause: flashcard insertion failed
    if (flashcardError || !flashcard) {
      throw new Error(`Failed to create flashcard: ${flashcardError?.message ?? "Unknown error"}`);
    }

    // Step 3: Log generation event if AI-sourced
    if (data.source === "ai" && data.generation_id) {
      // Use non-blocking approach - log error but don't fail the request
      await this.logGenerationEvent(userId, flashcard.id, data.generation_id, data.was_edited ? "EDITED" : "ACCEPTED");
    }

    // Step 4: Return created flashcard
    return flashcard;
  }

  /**
   * Retrieves a single flashcard by ID with ownership verification.
   *
   * Flow:
   * 1. Query flashcard by ID with INNER JOIN to decks table
   * 2. Filter by user_id to ensure ownership
   * 3. Return flashcard if found, null otherwise
   *
   * Security:
   * - CRITICAL: Always join with decks table and filter by user_id
   * - Prevents users from accessing flashcards from other users' decks
   * - Returns null for both non-existent flashcards and unauthorized access
   *   to prevent information disclosure
   *
   * @param flashcardId - UUID of the flashcard
   * @param userId - UUID of the authenticated user
   * @returns Flashcard if found and owned by user, null otherwise
   * @throws {Error} If database operation fails
   */
  async getFlashcardByIdForUser(flashcardId: string, userId: string): Promise<FlashcardDTO | null> {
    // Query with INNER JOIN to verify ownership through deck
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*, decks!inner(user_id)")
      .eq("id", flashcardId)
      .eq("decks.user_id", userId)
      .single();

    // Guard clause: flashcard not found or not owned
    if (error || !data) {
      return null;
    }

    // Remove the decks field from response (used only for filtering)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { decks, ...flashcard } = data;

    return flashcard;
  }

  /**
   * Logs a generation event for AI-generated flashcards.
   *
   * This method tracks AI usage analytics by recording when users:
   * - Accept AI-generated flashcards without edits (ACCEPTED)
   * - Accept AI-generated flashcards with edits (EDITED)
   *
   * Note: This is a fire-and-forget operation. Errors are logged but don't
   * fail the parent operation to ensure flashcard creation always succeeds.
   *
   * @param userId - UUID of the user
   * @param flashcardId - UUID of the created flashcard
   * @param generationId - UUID of the AI generation session
   * @param eventType - Type of event (ACCEPTED or EDITED)
   * @returns Promise that resolves when event is logged
   */
  private async logGenerationEvent(
    userId: string,
    flashcardId: string,
    generationId: string,
    eventType: EventType
  ): Promise<void> {
    const { error } = await this.supabase.from("generation_events").insert({
      user_id: userId,
      flashcard_id: flashcardId,
      generation_id: generationId,
      event_type: eventType,
    });

    if (error) {
      // Log error but don't throw - generation event logging is non-critical
      // eslint-disable-next-line no-console
      console.error("Failed to log generation event:", error);
    }
  }
}
