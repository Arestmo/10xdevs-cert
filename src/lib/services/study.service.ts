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
import type {
  StudyCardsResponseDTO,
  StudyCardDTO,
  StudySummaryResponseDTO,
  DeckSummaryDTO,
  ReviewResponseDTO,
  NextIntervalsDTO,
  FlashcardDTO,
  UpdateFlashcardFSRSCommand,
} from "@/types";
import { FSRS, Rating, type Card, State, type Grade } from "ts-fsrs";

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

/**
 * Retrieves study summary for dashboard overview.
 *
 * Aggregates data across all user's decks to provide:
 * - Total count of due flashcards
 * - Next scheduled review date
 * - Per-deck breakdown of due counts
 *
 * Flow:
 * 1. Query decks with JOIN to flashcards to get due counts
 * 2. Group results by deck and filter decks with due_count > 0
 * 3. Query for earliest next_review date in the future
 * 4. Calculate total_due by summing deck counts
 * 5. Format and return StudySummaryResponseDTO
 *
 * Security:
 * - All queries filter by user_id to ensure data isolation
 * - RLS policies provide additional protection
 *
 * @param supabase - Authenticated Supabase client
 * @param userId - UUID of authenticated user
 * @returns Study summary with due counts and next review date
 * @throws {Error} If database queries fail
 */
export async function getStudySummary(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<StudySummaryResponseDTO> {
  // Step 1: Query decks with due flashcards
  // Using inner join to only get decks that have flashcards with next_review <= NOW()
  const { data: decksWithFlashcards, error: decksError } = await supabase
    .from("decks")
    .select(
      `
      id,
      name,
      flashcards!inner(id)
    `
    )
    .eq("user_id", userId)
    .lte("flashcards.next_review", new Date().toISOString());

  // Guard clause: database error
  if (decksError) {
    throw new Error(`Failed to fetch deck summaries: ${decksError.message}`);
  }

  // Step 2: Transform to DeckSummaryDTO with counts
  // Group flashcards by deck_id and count them
  const deckMap = new Map<string, { id: string; name: string; due_count: number }>();

  decksWithFlashcards?.forEach((deck) => {
    if (!deckMap.has(deck.id)) {
      deckMap.set(deck.id, {
        id: deck.id,
        name: deck.name,
        due_count: 0,
      });
    }
    // Each row represents one flashcard due, so increment count
    const deckData = deckMap.get(deck.id);
    if (deckData) {
      deckData.due_count++;
    }
  });

  // Convert to array and sort alphabetically by name
  const deckSummaries: DeckSummaryDTO[] = Array.from(deckMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  // Step 3: Query for next review date
  // Find earliest next_review that is in the future
  const { data: nextReviewData, error: nextReviewError } = await supabase
    .from("flashcards")
    .select("next_review, decks!inner(user_id)")
    .eq("decks.user_id", userId)
    .gt("next_review", new Date().toISOString())
    .order("next_review", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Guard clause: database error
  if (nextReviewError) {
    throw new Error(`Failed to fetch next review date: ${nextReviewError.message}`);
  }

  // Step 4: Calculate total_due by summing all deck counts
  const total_due = deckSummaries.reduce((sum, deck) => sum + deck.due_count, 0);

  // Step 5: Return StudySummaryResponseDTO (happy path)
  return {
    total_due,
    next_review_date: nextReviewData?.next_review ?? null,
    decks: deckSummaries,
  };
}

/**
 * Custom error for flashcard not found or not owned by user
 */
export class FlashcardNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlashcardNotFoundError";
  }
}

/**
 * Converts database flashcard FSRS parameters to ts-fsrs Card object.
 *
 * @param flashcard - Flashcard from database with FSRS parameters
 * @returns Card object compatible with ts-fsrs library
 */
function createCardFromFlashcard(flashcard: FlashcardDTO): Card {
  return {
    due: new Date(flashcard.next_review),
    stability: flashcard.stability ?? 0,
    difficulty: flashcard.difficulty ?? 0,
    elapsed_days: flashcard.elapsed_days ?? 0,
    scheduled_days: flashcard.scheduled_days ?? 0,
    learning_steps: 0, // Default value, managed by FSRS when empty learning steps
    reps: flashcard.reps ?? 0,
    lapses: flashcard.lapses ?? 0,
    state: (flashcard.state as State) ?? State.New,
    last_review: flashcard.last_review ? new Date(flashcard.last_review) : undefined,
  };
}

/**
 * Converts numeric rating (1-4) to ts-fsrs Grade enum.
 *
 * Grade excludes Rating.Manual (0) and only includes valid review ratings.
 *
 * @param rating - Numeric rating from API request
 * @returns Grade enum value for ts-fsrs (Again, Hard, Good, Easy)
 */
function mapRatingToEnum(rating: 1 | 2 | 3 | 4): Grade {
  const ratingMap: Record<1 | 2 | 3 | 4, Grade> = {
    1: Rating.Again,
    2: Rating.Hard,
    3: Rating.Good,
    4: Rating.Easy,
  };
  return ratingMap[rating];
}

/**
 * Formats millisecond duration to human-readable interval string.
 *
 * Examples: "10m", "2h", "5d", "3mo", "1y"
 *
 * @param ms - Duration in milliseconds
 * @returns Human-readable interval string
 */
function formatInterval(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y`;
  if (months > 0) return `${months}mo`;
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

/**
 * Submits a review rating for a flashcard and updates FSRS parameters.
 *
 * This function implements the core spaced repetition algorithm by:
 * 1. Fetching the current flashcard with ownership validation
 * 2. Calculating new FSRS parameters based on user's rating
 * 3. Updating flashcard with new scheduling parameters
 * 4. Calculating preview intervals for all rating options
 *
 * Flow:
 * 1. Fetch flashcard with INNER JOIN to verify ownership
 * 2. Create FSRS Card object from current parameters
 * 3. Call FSRS algorithm to calculate new state
 * 4. Update database with new parameters
 * 5. Calculate preview intervals for UI
 * 6. Return updated flashcard and intervals
 *
 * Security:
 * - CRITICAL: Always join with decks table and filter by user_id
 * - Prevents users from reviewing other users' flashcards
 * - Returns null if flashcard not found or not owned
 *
 * @param supabase - Authenticated Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param flashcardId - UUID of the flashcard being reviewed
 * @param rating - Review rating (1=Again, 2=Hard, 3=Good, 4=Easy)
 * @returns Review response with updated flashcard and interval previews, or null if not found
 * @throws {FlashcardNotFoundError} If flashcard not found or not owned by user
 * @throws {Error} If database operation or FSRS calculation fails
 */
export async function submitReview(
  supabase: SupabaseClient<Database>,
  userId: string,
  flashcardId: string,
  rating: 1 | 2 | 3 | 4
): Promise<ReviewResponseDTO> {
  // Step 1: Fetch flashcard with ownership check
  // CRITICAL SECURITY: Inner join with decks table to verify ownership
  const { data: flashcard, error: fetchError } = await supabase
    .from("flashcards")
    .select(
      `
      *,
      decks!inner(user_id)
    `
    )
    .eq("id", flashcardId)
    .eq("decks.user_id", userId)
    .single();

  // Guard clause: flashcard not found or not owned
  if (fetchError || !flashcard) {
    throw new FlashcardNotFoundError("Flashcard not found");
  }

  // Step 2: Calculate FSRS parameters
  let newParameters: UpdateFlashcardFSRSCommand;
  let intervals: NextIntervalsDTO;

  try {
    // Initialize FSRS instance
    const fsrs = new FSRS();
    const now = new Date();

    // Convert flashcard to Card object
    const card = createCardFromFlashcard(flashcard);

    // Map rating to FSRS Rating enum
    const fsrsRating = mapRatingToEnum(rating);

    // Calculate new scheduling parameters using repeat() which returns preview for all ratings
    const preview = fsrs.repeat(card, now);

    // Get the specific result for the selected rating
    const { card: newCard } = preview[fsrsRating];

    // Extract update parameters
    newParameters = {
      stability: newCard.stability,
      difficulty: newCard.difficulty,
      elapsed_days: newCard.elapsed_days,
      scheduled_days: newCard.scheduled_days,
      reps: newCard.reps,
      lapses: newCard.lapses,
      state: newCard.state,
      last_review: now.toISOString(),
      next_review: newCard.due.toISOString(),
    };

    // Calculate preview intervals for UI (show what would happen for each rating)
    intervals = {
      again: formatInterval(preview[Rating.Again].card.due.getTime() - now.getTime()),
      hard: formatInterval(preview[Rating.Hard].card.due.getTime() - now.getTime()),
      good: formatInterval(preview[Rating.Good].card.due.getTime() - now.getTime()),
      easy: formatInterval(preview[Rating.Easy].card.due.getTime() - now.getTime()),
    };
  } catch (error) {
    throw new Error(`Failed to calculate FSRS parameters: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  // Step 3: Update flashcard in database
  const { data: updatedFlashcard, error: updateError } = await supabase
    .from("flashcards")
    .update(newParameters)
    .eq("id", flashcardId)
    .select()
    .single();

  // Guard clause: update failed
  if (updateError || !updatedFlashcard) {
    throw new Error(`Failed to update flashcard: ${updateError?.message ?? "Unknown error"}`);
  }

  // Step 4: Return success response (happy path)
  return {
    flashcard: updatedFlashcard,
    next_intervals: intervals,
  };
}
