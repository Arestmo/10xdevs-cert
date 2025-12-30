import type { APIRoute } from "astro";
import { z } from "zod";
import { DeckService, DeckNotFoundError } from "@/lib/services/deck.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

// Disable static prerendering (SSR only)
export const prerender = false;

// Zod schema for UUID validation
const deckIdSchema = z.string().uuid("Invalid deck ID format");

/**
 * GET /api/decks/{deckId}
 *
 * Retrieves a specific deck by ID with metadata (flashcard counts).
 * Requires authentication and ownership validation.
 *
 * @param deckId - UUID path parameter
 * @returns DeckWithMetadataDTO (200 OK)
 * @throws 400 if deckId is not a valid UUID
 * @throws 401 if user not authenticated
 * @throws 404 if deck not found or not owned by user
 * @throws 500 if unexpected error occurs
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Validate deckId format
    const deckId = context.params.deckId;

    let validatedDeckId: string;
    try {
      validatedDeckId = deckIdSchema.parse(deckId);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", "Invalid deck ID format", 400, error.flatten().fieldErrors);
      }
      throw error; // Re-throw unexpected errors
    }

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Guard clause: authentication failed
    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 3: Call service layer
    const deckService = new DeckService(context.locals.supabase);
    const deck = await deckService.getDeckById(user.id, validatedDeckId);

    // Step 4: Return success response
    return successResponse(deck, 200);
  } catch (error) {
    // Handle DeckNotFoundError
    if (error instanceof DeckNotFoundError) {
      return errorResponse("DECK_NOT_FOUND", "Deck not found", 404);
    }

    // Log and handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/decks/[deckId]:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
