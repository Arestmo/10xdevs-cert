import type { APIRoute } from "astro";
import { z } from "zod";
import { DeckService, DeckNotFoundError, DuplicateDeckError } from "@/lib/services/deck.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import type { UpdateDeckRequestDTO } from "@/types";

// Disable static prerendering (SSR only)
export const prerender = false;

// Zod schema for UUID validation
const deckIdSchema = z.string().uuid("Invalid deck ID format");

// Zod schema for request body validation
const updateDeckSchema = z.object({
  name: z
    .string()
    .min(1, "Deck name must be at least 1 character")
    .max(100, "Deck name must not exceed 100 characters"),
});

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

/**
 * PATCH /api/decks/{deckId}
 *
 * Updates a deck's name.
 * Requires authentication and ownership validation.
 *
 * @param deckId - UUID path parameter
 * @param body - UpdateDeckRequestDTO { name: string }
 * @returns DeckDTO (200 OK)
 * @throws 400 if deckId or body is invalid
 * @throws 401 if user not authenticated
 * @throws 404 if deck not found or not owned by user
 * @throws 409 if deck with same name already exists
 * @throws 500 if unexpected error occurs
 */
export const PATCH: APIRoute = async (context) => {
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
      throw error;
    }

    // Step 2: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON in request body", 400);
    }

    let validatedData: UpdateDeckRequestDTO;
    try {
      validatedData = updateDeckSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, error.flatten().fieldErrors);
      }
      throw error;
    }

    // Step 3: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Guard clause: authentication failed
    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 4: Call service layer
    const deckService = new DeckService(context.locals.supabase);
    const deck = await deckService.updateDeck(user.id, validatedDeckId, validatedData);

    // Step 5: Return success response
    return successResponse(deck, 200);
  } catch (error) {
    // Handle DeckNotFoundError
    if (error instanceof DeckNotFoundError) {
      return errorResponse("DECK_NOT_FOUND", "Deck not found", 404);
    }

    // Handle DuplicateDeckError
    if (error instanceof DuplicateDeckError) {
      return errorResponse("DUPLICATE_DECK_NAME", error.message, 409);
    }

    // Log and handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in PATCH /api/decks/[deckId]:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
