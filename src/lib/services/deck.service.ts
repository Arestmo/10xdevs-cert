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
import type {
  DeckWithMetadataDTO,
  DecksListResponseDTO,
  CreateDeckRequestDTO,
  DeckDTO,
  UpdateDeckRequestDTO,
} from "@/types";

/**
 * Custom error for duplicate deck names
 */
export class DuplicateDeckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateDeckError";
  }
}

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

  /**
   * Creates a new deck for the specified user.
   *
   * Flow:
   * 1. Insert deck with user_id and name
   * 2. Database generates id, created_at, updated_at
   * 3. Database validates UNIQUE(user_id, name) constraint
   * 4. Return created deck
   *
   * @param userId - UUID of the authenticated user
   * @param data - Deck creation data (name only)
   * @returns Created deck with all fields
   * @throws {DuplicateDeckError} If deck with same name already exists
   * @throws {Error} If database operation fails
   */
  async createDeck(userId: string, data: CreateDeckRequestDTO): Promise<DeckDTO> {
    const { data: deck, error } = await this.supabase
      .from("decks")
      .insert({
        user_id: userId,
        name: data.name,
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate name)
      if (error.code === "23505") {
        throw new DuplicateDeckError("A deck with this name already exists");
      }
      throw new Error(`Failed to create deck: ${error.message}`);
    }

    if (!deck) {
      throw new Error("Deck creation succeeded but no data returned");
    }

    return deck;
  }

  /**
   * Retrieves a specific deck by ID with metadata.
   *
   * Flow:
   * 1. Fetch deck from database filtering by id AND user_id (ownership validation)
   * 2. Throw DeckNotFoundError if deck not found or not owned
   * 3. Execute parallel queries to count total and due flashcards
   * 4. Return DeckWithMetadataDTO
   *
   * @param userId - UUID of the authenticated user
   * @param deckId - UUID of the deck to retrieve
   * @returns Deck with computed metadata (flashcard counts)
   * @throws {DeckNotFoundError} If deck not found or not owned by user
   * @throws {Error} If database operation fails
   */
  async getDeckById(userId: string, deckId: string): Promise<DeckWithMetadataDTO> {
    // Step 1: Fetch deck with ownership validation
    const { data: deck, error: deckError } = await this.supabase
      .from("decks")
      .select("id, name, created_at, updated_at")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single();

    // Guard clause: deck not found or not owned
    if (deckError || !deck) {
      throw new DeckNotFoundError("Deck not found");
    }

    // Step 2: Fetch flashcard counts in parallel
    const now = new Date().toISOString();

    const [totalResult, dueResult] = await Promise.all([
      this.supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("deck_id", deckId),
      this.supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("deck_id", deckId)
        .lte("next_review", now),
    ]);

    // Step 3: Construct and return response
    return {
      id: deck.id,
      name: deck.name,
      created_at: deck.created_at,
      updated_at: deck.updated_at,
      total_flashcards: totalResult.count ?? 0,
      due_flashcards: dueResult.count ?? 0,
    };
  }

  /**
   * Updates a deck's name.
   *
   * Flow:
   * 1. Execute UPDATE with ownership validation (filter by id AND user_id)
   * 2. Database validates UNIQUE(user_id, name) constraint
   * 3. Database auto-updates updated_at timestamp
   * 4. Throw DeckNotFoundError if no rows affected
   * 5. Throw DuplicateDeckError if unique constraint violated
   * 6. Return updated DeckDTO
   *
   * @param userId - UUID of the authenticated user
   * @param deckId - UUID of the deck to update
   * @param data - Update data (name only)
   * @returns Updated deck with all fields
   * @throws {DeckNotFoundError} If deck not found or not owned by user
   * @throws {DuplicateDeckError} If deck with same name already exists
   * @throws {Error} If database operation fails
   */
  async updateDeck(userId: string, deckId: string, data: UpdateDeckRequestDTO): Promise<DeckDTO> {
    const { data: deck, error } = await this.supabase
      .from("decks")
      .update({ name: data.name })
      .eq("id", deckId)
      .eq("user_id", userId) // CRITICAL: ownership validation
      .select()
      .single();

    // Guard clause: database error
    if (error) {
      // Check for unique constraint violation (duplicate name)
      if (error.code === "23505") {
        throw new DuplicateDeckError("A deck with this name already exists");
      }
      throw new Error(`Failed to update deck: ${error.message}`);
    }

    // Guard clause: deck not found or not owned
    if (!deck) {
      throw new DeckNotFoundError("Deck not found");
    }

    // Happy path
    return deck;
  }
}
