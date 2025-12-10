import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import type {
  CreateGenerationRequestDTO,
  GenerationResponseDTO,
  FlashcardDraftDTO,
  Profile
} from '@/types';
import { openRouterService } from './openrouter.service';

type SupabaseClientType = SupabaseClient<Database>;

const MONTHLY_LIMIT = 200;

/**
 * Service for managing AI flashcard generation
 *
 * Responsibilities:
 * - Verify deck ownership via RLS
 * - Check and enforce monthly AI generation limits
 * - Perform lazy reset of monthly limits
 * - Coordinate with OpenRouter service for AI generation
 * - Track AI usage count
 * - Log generation events for analytics
 */
export class GenerationService {
  constructor(private supabase: SupabaseClientType) {}

  /**
   * Generates flashcard drafts from source text
   *
   * Flow:
   * 1. Verify deck ownership (RLS)
   * 2. Check AI limit + lazy reset if needed
   * 3. Call OpenRouter API
   * 4. Increment AI usage count
   * 5. Log generation events
   * 6. Return response with drafts and remaining limit
   *
   * @param userId - Authenticated user ID
   * @param request - Generation request (source_text, deck_id)
   * @returns Generation response with drafts and limit info
   * @throws DeckNotFoundError if deck doesn't exist or user doesn't own it
   * @throws AILimitExceededError if monthly limit reached
   * @throws Error if OpenRouter API fails
   */
  async generateFlashcards(
    userId: string,
    request: CreateGenerationRequestDTO
  ): Promise<GenerationResponseDTO> {
    // Step 1: Verify deck ownership
    await this.verifyDeckOwnership(userId, request.deck_id);

    // Step 2: Check and update AI limit (includes lazy reset)
    const profile = await this.checkAndUpdateLimit(userId);

    // Step 3: Generate flashcards via AI
    const drafts = await openRouterService.generateFlashcards({
      sourceText: request.source_text,
      maxCards: 20
    });

    const generatedCount = drafts.length;

    // Step 4: Increment usage count
    await this.incrementAIUsage(userId, generatedCount);

    // Step 5: Log generation events
    const generation_id = crypto.randomUUID();
    await this.logGenerationEvents(userId, generation_id, drafts);

    // Step 6: Calculate remaining limit and return response
    const remaining = MONTHLY_LIMIT - (profile.monthly_ai_flashcards_count + generatedCount);

    return {
      generation_id,
      drafts,
      generated_count: generatedCount,
      remaining_ai_limit: remaining
    };
  }

  /**
   * Verifies that the deck exists and belongs to the user
   *
   * Uses RLS to automatically filter by user_id - if deck doesn't belong
   * to user or doesn't exist, the query returns null.
   *
   * @param userId - User ID (not used directly, RLS handles filtering)
   * @param deckId - Deck UUID to verify
   * @throws DeckNotFoundError if deck not found or access denied
   */
  private async verifyDeckOwnership(userId: string, deckId: string): Promise<void> {
    const { data: deck, error } = await this.supabase
      .from('decks')
      .select('id')
      .eq('id', deckId)
      .single();

    // Guard clause: deck not found or not owned by user (RLS filtered it out)
    if (error || !deck) {
      throw new DeckNotFoundError();
    }
  }

  /**
   * Checks AI limit and performs lazy reset if needed
   *
   * Lazy reset logic:
   * - If ai_limit_reset_date < start of current month
   * - Reset monthly_ai_flashcards_count to 0
   * - Update ai_limit_reset_date to start of current month
   *
   * @param userId - User ID to check limit for
   * @returns User profile with current (possibly reset) count
   * @throws Error if profile not found
   * @throws AILimitExceededError if limit reached
   */
  private async checkAndUpdateLimit(userId: string): Promise<Profile> {
    // Fetch user profile
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Guard clause: profile not found
    if (error || !profile) {
      throw new Error('Profile not found');
    }

    // Calculate dates for lazy reset
    const now = new Date();
    const resetDate = new Date(profile.ai_limit_reset_date);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let currentCount = profile.monthly_ai_flashcards_count;

    // Perform lazy reset if needed
    if (resetDate < startOfMonth) {
      await this.supabase
        .from('profiles')
        .update({
          monthly_ai_flashcards_count: 0,
          ai_limit_reset_date: startOfMonth.toISOString().split('T')[0]
        })
        .eq('user_id', userId);

      currentCount = 0;
      profile.monthly_ai_flashcards_count = 0;
    }

    // Guard clause: limit exceeded
    if (currentCount >= MONTHLY_LIMIT) {
      throw new AILimitExceededError(currentCount, MONTHLY_LIMIT, startOfMonth);
    }

    return profile;
  }

  /**
   * Atomically increments the AI usage count
   *
   * Uses database RPC function for atomic increment to prevent race conditions.
   * Falls back to direct update if RPC is not available.
   *
   * @param userId - User ID to increment count for
   * @param count - Number of flashcards generated
   * @throws Error if increment fails
   */
  private async incrementAIUsage(userId: string, count: number): Promise<void> {
    const { error } = await this.supabase.rpc('increment_ai_usage', {
      p_user_id: userId,
      p_count: count
    });

    // Guard clause: increment failed
    if (error) {
      throw new Error('Failed to increment AI usage count');
    }
  }

  /**
   * Logs generation events for analytics
   *
   * Creates one GENERATED event per flashcard draft.
   * Uses bulk insert for efficiency.
   *
   * Note: This is a non-critical operation - if it fails, we log the error
   * but don't throw to avoid blocking the generation flow.
   *
   * @param userId - User ID
   * @param generationId - Unique generation session ID
   * @param drafts - Array of generated flashcard drafts
   */
  private async logGenerationEvents(
    userId: string,
    generationId: string,
    drafts: FlashcardDraftDTO[]
  ): Promise<void> {
    const events = drafts.map(() => ({
      user_id: userId,
      flashcard_id: null,
      generation_id: generationId,
      event_type: 'GENERATED' as const
    }));

    const { error } = await this.supabase
      .from('generation_events')
      .insert(events);

    // Non-critical error - log but don't throw
    if (error) {
      console.error('Failed to log generation events:', error);
    }
  }
}

/**
 * Custom error: Deck not found or access denied
 *
 * Thrown when:
 * - Deck doesn't exist
 * - Deck exists but doesn't belong to the user (RLS filtered it)
 */
export class DeckNotFoundError extends Error {
  constructor() {
    super('Deck not found or access denied');
    this.name = 'DeckNotFoundError';
  }
}

/**
 * Custom error: Monthly AI generation limit exceeded
 *
 * Thrown when user has reached the monthly limit of 200 flashcards.
 * Includes context about current count, limit, and reset date.
 */
export class AILimitExceededError extends Error {
  constructor(
    public currentCount: number,
    public limit: number,
    public resetDate: Date
  ) {
    super('Monthly AI generation limit exceeded');
    this.name = 'AILimitExceededError';
  }
}
