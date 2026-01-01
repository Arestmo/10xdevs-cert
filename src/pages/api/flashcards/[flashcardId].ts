/**
 * GET /api/flashcards/{flashcardId}
 *
 * Retrieves a single flashcard by ID with ownership verification.
 *
 * Security:
 * - Requires authentication
 * - Validates flashcard belongs to user's deck
 * - Returns 404 for both non-existent and unauthorized access (prevents info disclosure)
 *
 * @module FlashcardByIdEndpoint
 */

import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService } from "@/lib/services/flashcard.service";
import type { FlashcardDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

/**
 * Validation schema for flashcard ID parameter
 */
const GetFlashcardParamsSchema = z.object({
  flashcardId: z.string().uuid({
    message: "Invalid flashcard ID format",
  }),
});

/**
 * GET handler - Retrieves a single flashcard by ID
 *
 * Flow:
 * 1. Validate flashcardId parameter (UUID format)
 * 2. Authenticate user
 * 3. Retrieve flashcard with ownership verification
 * 4. Return flashcard or 404 if not found/unauthorized
 *
 * @param params - URL parameters containing flashcardId
 * @param locals - Astro locals with Supabase client
 * @returns Response with flashcard data or error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate flashcardId parameter
    const validation = GetFlashcardParamsSchema.safeParse({
      flashcardId: params.flashcardId,
    });

    if (!validation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid flashcard ID format",
          details: validation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { flashcardId } = validation.data;

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 3: Retrieve flashcard with ownership verification
    const flashcardService = new FlashcardService(locals.supabase);
    const flashcard = await flashcardService.getFlashcardByIdForUser(flashcardId, user.id);

    if (!flashcard) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FLASHCARD_NOT_FOUND",
          message: "Flashcard not found or not owned by user",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Return flashcard (happy path)
    const response: FlashcardDTO = flashcard;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 5: Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error fetching flashcard:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
