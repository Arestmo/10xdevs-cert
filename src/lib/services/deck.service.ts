/**
 * Deck Service
 *
 * Handles deck retrieval with metadata (flashcard counts).
 * Implements pagination, sorting, and filtering for deck lists.
 *
 * @module DeckService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { DeckWithMetadataDTO, DecksListResponseDTO } from "@/types";

/**
 * Parameters for listing decks with pagination and sorting
 */
interface ListDecksParams {
  limit: number;
  offset: number;
  sort: "created_at" | "name" | "updated_at";
  order: "asc" | "desc";
}

/**
 * Service for managing deck operations.
 *
 * Responsibilities:
 * - Retrieve decks with computed metadata (flashcard counts)
 * - Support pagination and sorting
 * - Calculate due flashcards based on FSRS next_review dates
 */
export class DeckService {
  /**
   * Creates a new DeckService instance
   *
   * @param supabase - Authenticated Supabase client instance
   */
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves a paginated list of user's decks with metadata.
   *
   * Flow:
   * 1. Fetch decks with aggregated flashcard counts using JOIN
   * 2. Apply sorting and pagination
   * 3. Fetch total count of user's decks
   * 4. Calculate has_more flag
   * 5. Return DecksListResponseDTO
   *
   * @param userId - UUID of the authenticated user
   * @param params - Pagination and sorting parameters
   * @returns Paginated list of decks with metadata
   */
  async listDecks(userId: string, params: ListDecksParams): Promise<DecksListResponseDTO> {
    // Step 1 & 2: Fetch decks with sorting and pagination
    // Note: Supabase doesn't support complex aggregations in select(),
    // so we'll fetch decks first, then get counts separately
    const { data: decks, error: decksError } = await this.supabase
      .from("decks")
      .select("id, name, created_at, updated_at")
      .eq("user_id", userId)
      .order(params.sort, { ascending: params.order === "asc" })
      .range(params.offset, params.offset + params.limit - 1);

    if (decksError) {
      throw new Error(`Failed to fetch decks: ${decksError.message}`);
    }

    // Step 3: Fetch total count
    const { count, error: countError } = await this.supabase
      .from("decks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      throw new Error(`Failed to count decks: ${countError.message}`);
    }

    const total = count ?? 0;

    // Fetch metadata for each deck
    const decksWithMetadata: DeckWithMetadataDTO[] = await Promise.all(
      (decks ?? []).map(async (deck) => {
        // Count total flashcards
        const { count: totalFlashcards } = await this.supabase
          .from("flashcards")
          .select("*", { count: "exact", head: true })
          .eq("deck_id", deck.id);

        // Count due flashcards (next_review <= NOW())
        const now = new Date().toISOString();
        const { count: dueFlashcards } = await this.supabase
          .from("flashcards")
          .select("*", { count: "exact", head: true })
          .eq("deck_id", deck.id)
          .lte("next_review", now);

        return {
          id: deck.id,
          name: deck.name,
          created_at: deck.created_at,
          updated_at: deck.updated_at,
          total_flashcards: totalFlashcards ?? 0,
          due_flashcards: dueFlashcards ?? 0,
        };
      })
    );

    // Step 4: Calculate has_more
    const has_more = params.offset + params.limit < total;

    // Step 5: Return response
    return {
      data: decksWithMetadata,
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        has_more,
      },
    };
  }
}
