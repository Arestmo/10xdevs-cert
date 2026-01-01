/**
 * Study Service
 *
 * Handles study session operations including retrieving due flashcards
 * for spaced repetition learning based on FSRS scheduling algorithm.
 *
 * @module StudyService
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { StudyCardsResponseDTO, StudyCardDTO } from "@/types";

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
 * Retrieves flashcards due for review in a study session.
 *
 * This function implements the core spaced repetition functionality by:
 * 1. Querying flashcards where next_review <= NOW()
 * 2. Sorting by review priority (oldest due first)
 * 3. Joining with decks to include deck names
 * 4. Enforcing user ownership via RLS and explicit filtering
 *
 * Flow:
 * 1. If deck_id provided, verify deck exists and belongs to user
 * 2. Build query for due cards with JOIN to decks table
 * 3. Apply optional deck_id filter
 * 4. Sort by next_review ASC (oldest due first)
 * 5. Limit results
 * 6. Get total count of due cards
 * 7. Transform results to StudyCardDTO format
 * 8. Return response with metadata
 *
 * Security:
 * - CRITICAL: Always join with decks table and filter by user_id
 * - Prevents users from accessing flashcards from other users' decks
 * - Validates deck ownership before filtering
 *
 * @param supabase - Authenticated Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param deckId - Optional UUID to filter cards to a specific deck
 * @param limit - Maximum number of cards to return (1-200, default 50)
 * @returns Study cards response with due cards and metadata
 * @throws {DeckNotFoundError} If deck_id provided but deck not found or not owned
 * @throws {Error} If database operation fails
 */
export async function getStudyCards(
  supabase: SupabaseClient<Database>,
  userId: string,
  deckId?: string,
  limit = 50
): Promise<StudyCardsResponseDTO> {
  // Step 1: Validate deck ownership if deckId provided
  if (deckId) {
    const { data: deck, error: deckError } = await supabase
      .from("decks")
      .select("id")
      .eq("id", deckId)
      .eq("user_id", userId)
      .single();

    // Guard clause: deck not found or not owned
    if (deckError || !deck) {
      throw new DeckNotFoundError("Deck not found");
    }
  }

  // Step 2: Build query for due cards with JOIN to decks table
  // The inner join ensures we only get flashcards from user's decks
  // and allows us to include the deck name in the response
  let query = supabase
    .from("flashcards")
    .select(
      `
      id,
      deck_id,
      decks!inner(name),
      front,
      back,
      source,
      stability,
      difficulty,
      elapsed_days,
      scheduled_days,
      reps,
      lapses,
      state,
      last_review,
      next_review
    `
    )
    .lte("next_review", new Date().toISOString())
    .eq("decks.user_id", userId)
    .order("next_review", { ascending: true })
    .limit(limit);

  // Step 3: Apply deck_id filter if provided
  if (deckId) {
    query = query.eq("deck_id", deckId);
  }

  // Step 4: Execute main query
  const { data: flashcards, error: flashcardsError } = await query;

  // Guard clause: database error
  if (flashcardsError) {
    throw new Error(`Failed to fetch study cards: ${flashcardsError.message}`);
  }

  // Step 5: Get total count of due cards
  // Build count query with same filters (must include decks JOIN for user_id filtering)
  let countQuery = supabase
    .from("flashcards")
    .select("id, decks!inner(user_id)", { count: "exact", head: true })
    .lte("next_review", new Date().toISOString())
    .eq("decks.user_id", userId);

  if (deckId) {
    countQuery = countQuery.eq("deck_id", deckId);
  }

  const { count, error: countError } = await countQuery;

  // Guard clause: count query error
  if (countError) {
    throw new Error(`Failed to count due cards: ${countError.message}`);
  }

  // Step 6: Transform to StudyCardDTO format
  // Extract deck name from nested decks object and flatten structure
  const studyCards: StudyCardDTO[] = (flashcards ?? []).map((card) => ({
    id: card.id,
    deck_id: card.deck_id,
    deck_name: (card.decks as { name: string }).name,
    front: card.front,
    back: card.back,
    source: card.source,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review,
    next_review: card.next_review,
  }));

  // Step 7: Return response with metadata (happy path)
  return {
    data: studyCards,
    total_due: count ?? 0,
    returned_count: studyCards.length,
  };
}
