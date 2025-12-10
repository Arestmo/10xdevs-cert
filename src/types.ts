/**
 * Type Definitions for Flashcards AI Application
 *
 * This file contains all DTO (Data Transfer Object) and Command Model types
 * used across the API. All types are derived from the database models defined
 * in src/db/database.types.ts to ensure type safety and consistency.
 *
 * ## Naming Conventions
 *
 * - **Base entities**: `Profile`, `Deck`, `Flashcard`, `GenerationEvent` - direct database row types
 * - **DTOs**: `XxxDTO` - Data Transfer Objects for API responses (simple aliases or with computed fields)
 * - **Request DTOs**: `XxxRequestDTO` - Input validation types for API requests
 * - **Response DTOs**: `XxxResponseDTO` - API response types with additional metadata
 * - **Commands**: `XxxCommand` - Internal command models for service layer operations
 *
 * ## Type vs Interface Convention
 *
 * - Use `type` for: simple aliases (`type DeckDTO = Deck`) and utility type compositions (`Pick`, `Partial`, `Omit`)
 * - Use `interface` for: new structures with additional/computed fields that extend base types
 *
 * ## Field Naming
 *
 * All fields use snake_case to match database column names and JSON API conventions.
 */

import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

// ============================================================================
// Base Entity Types (derived from database tables)
// ============================================================================

/**
 * Profile entity - represents a user profile with AI generation limits
 */
export type Profile = Tables<"profiles">;

/**
 * Deck entity - represents a flashcard deck/collection
 */
export type Deck = Tables<"decks">;

/**
 * Flashcard entity - represents an individual flashcard with FSRS parameters
 */
export type Flashcard = Tables<"flashcards">;

/**
 * Generation Event entity - represents an AI generation session event
 */
export type GenerationEvent = Tables<"generation_events">;

// ============================================================================
// Enum Types
// ============================================================================

/**
 * Source type for flashcards: AI-generated or manually created
 */
export type SourceType = Enums<"source_type">;

/**
 * Event type for generation tracking
 */
export type EventType = Enums<"event_type">;

// ============================================================================
// Common/Shared DTOs
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Standard error response format
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================================
// Profile DTOs
// ============================================================================

/**
 * Basic profile response - matches database Row type
 */
export type ProfileDTO = Profile;

/**
 * Profile response with computed remaining AI limit
 * Extends base Profile with calculated remaining_ai_limit field
 */
export interface ProfileResponseDTO extends Profile {
  remaining_ai_limit: number;
}

// ============================================================================
// Deck DTOs
// ============================================================================

/**
 * Basic deck response - matches database Row type
 */
export type DeckDTO = Deck;

/**
 * Deck with computed metadata (flashcard counts)
 * Omits user_id for security, adds computed fields
 */
export interface DeckWithMetadataDTO extends Omit<Deck, "user_id"> {
  total_flashcards: number;
  due_flashcards: number;
}

/**
 * Request to create a new deck
 * Only requires the deck name, other fields auto-generated
 */
export type CreateDeckRequestDTO = Pick<TablesInsert<"decks">, "name">;

/**
 * Request to update an existing deck
 * Only name can be updated
 */
export type UpdateDeckRequestDTO = Pick<TablesUpdate<"decks">, "name"> & {
  name: string; // Make name required for update
};

/**
 * Paginated list of decks with metadata
 */
export interface DecksListResponseDTO {
  data: DeckWithMetadataDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Complete flashcard response - matches database Row type
 */
export type FlashcardDTO = Flashcard;

/**
 * Request to create a new flashcard (manual or AI-generated)
 * Includes fields for AI generation tracking
 */
export interface CreateFlashcardRequestDTO {
  deck_id: string;
  front: string;
  back: string;
  source: SourceType;
  generation_id?: string | null;
  was_edited?: boolean;
}

/**
 * Request to update flashcard content
 * At least one field must be provided
 */
export type UpdateFlashcardRequestDTO = Partial<Pick<TablesUpdate<"flashcards">, "front" | "back">>;

/**
 * Paginated list of flashcards
 */
export interface FlashcardsListResponseDTO {
  data: FlashcardDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// AI Generation DTOs
// ============================================================================

/**
 * AI-generated flashcard draft (not yet saved to database)
 */
export interface FlashcardDraftDTO {
  index: number;
  front: string;
  back: string;
}

/**
 * Request to generate flashcard drafts from source text
 */
export interface CreateGenerationRequestDTO {
  source_text: string;
  deck_id: string;
}

/**
 * Response from AI generation with drafts and limit info
 */
export interface GenerationResponseDTO {
  generation_id: string;
  drafts: FlashcardDraftDTO[];
  generated_count: number;
  remaining_ai_limit: number;
}

/**
 * Request to reject an AI-generated draft
 */
export interface RejectDraftRequestDTO {
  draft_index: number;
}

/**
 * Response when logging a generation event (REJECTED, ACCEPTED, etc.)
 */
export interface GenerationEventResponseDTO {
  id: string;
  generation_id: string;
  event_type: EventType;
  created_at: string;
}

// ============================================================================
// Study Session DTOs
// ============================================================================

/**
 * Flashcard with deck name for study session
 * Omits timestamps, adds deck_name for display
 */
export interface StudyCardDTO extends Omit<Flashcard, "created_at" | "updated_at"> {
  deck_name: string;
}

/**
 * List of flashcards due for review
 *
 * Note: This response intentionally does NOT use PaginationDTO because study sessions
 * return all due cards up to a limit (default 50, max 200) without offset-based pagination.
 * The `total_due` and `returned_count` fields provide the necessary metadata for the UI
 * to show progress (e.g., "Reviewing 50 of 120 due cards").
 */
export interface StudyCardsResponseDTO {
  data: StudyCardDTO[];
  total_due: number;
  returned_count: number;
}

/**
 * Deck summary for study dashboard
 */
export interface DeckSummaryDTO {
  id: string;
  name: string;
  due_count: number;
}

/**
 * Study summary for dashboard overview
 */
export interface StudySummaryResponseDTO {
  total_due: number;
  next_review_date: string | null;
  decks: DeckSummaryDTO[];
}

/**
 * Request to submit a review rating for a flashcard
 * Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
export interface SubmitReviewRequestDTO {
  flashcard_id: string;
  rating: 1 | 2 | 3 | 4;
}

/**
 * Preview of next review intervals for each rating option
 * Format: "10m", "1d", "14d", "30d"
 */
export interface NextIntervalsDTO {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

/**
 * Response after submitting a flashcard review
 * Returns updated flashcard and preview of next intervals
 */
export interface ReviewResponseDTO {
  flashcard: FlashcardDTO;
  next_intervals: NextIntervalsDTO;
}

// ============================================================================
// Account Management DTOs
// ============================================================================

/**
 * Request to delete user account (GDPR compliance)
 * Requires exact confirmation string for safety
 */
export interface DeleteAccountRequestDTO {
  confirmation: string;
}

/**
 * Response after successful account deletion
 */
export interface DeleteAccountResponseDTO {
  message: string;
}

// ============================================================================
// Command Models for FSRS Algorithm
// ============================================================================

/**
 * FSRS parameters for a flashcard
 * Used internally for spaced repetition calculations
 */
export interface FSRSParameters {
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: number;
  last_review: string | null;
  next_review: string;
}

/**
 * Command to update flashcard after review
 * Contains new FSRS parameters calculated by algorithm
 */
export type UpdateFlashcardFSRSCommand = Pick<
  TablesUpdate<"flashcards">,
  | "stability"
  | "difficulty"
  | "elapsed_days"
  | "scheduled_days"
  | "reps"
  | "lapses"
  | "state"
  | "last_review"
  | "next_review"
>;

/**
 * Command to create a generation event
 * Used for tracking AI generation analytics
 */
export type CreateGenerationEventCommand = TablesInsert<"generation_events">;

/**
 * Command to increment AI usage count
 * Used when AI generates flashcards
 */
export interface IncrementAIUsageCommand {
  user_id: string;
  count: number;
}
