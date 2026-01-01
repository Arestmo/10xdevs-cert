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
import type { FlashcardDTO, ErrorResponseDTO, UpdateFlashcardRequestDTO } from "@/types";

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
 * Validation schema for flashcard ID parameter (PATCH)
 */
const PatchFlashcardParamsSchema = z.object({
  flashcardId: z.string().uuid({
    message: "Invalid flashcard ID format",
  }),
});

/**
 * Validation schema for flashcard ID parameter (DELETE)
 */
const DeleteFlashcardParamsSchema = z.object({
  flashcardId: z.string().uuid({
    message: "Invalid flashcard ID format",
  }),
});

/**
 * Validation schema for request body (PATCH)
 *
 * Constraints:
 * - At least one field (front or back) must be provided
 * - front: 1-200 characters (if provided)
 * - back: 1-500 characters (if provided)
 */
const PatchFlashcardBodySchema = z
  .object({
    front: z.string().min(1, "Front cannot be empty").max(200, "Front must be at most 200 characters").optional(),
    back: z.string().min(1, "Back cannot be empty").max(500, "Back must be at most 500 characters").optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
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

/**
 * PATCH handler - Updates flashcard content
 *
 * Flow:
 * 1. Validate flashcardId parameter
 * 2. Parse and validate request body
 * 3. Authenticate user
 * 4. Update flashcard via service
 * 5. Return updated flashcard or error
 *
 * @param params - URL parameters containing flashcardId
 * @param request - Request object with JSON body
 * @param locals - Astro locals with Supabase client
 * @returns Response with updated flashcard or error
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Validate flashcardId parameter
    const paramsValidation = PatchFlashcardParamsSchema.safeParse({
      flashcardId: params.flashcardId,
    });

    if (!paramsValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid flashcard ID format",
          details: paramsValidation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { flashcardId } = paramsValidation.data;

    // Step 2: Parse and validate request body
    const body = await request.json();
    const bodyValidation = PatchFlashcardBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation error",
          details: bodyValidation.error.flatten(),
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updates: UpdateFlashcardRequestDTO = bodyValidation.data;

    // Step 3: Authenticate user
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

    // Step 4: Update flashcard via service
    const flashcardService = new FlashcardService(locals.supabase);
    const updatedFlashcard = await flashcardService.updateFlashcard(flashcardId, user.id, updates);

    if (!updatedFlashcard) {
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

    // Step 5: Return updated flashcard (happy path)
    const response: FlashcardDTO = updatedFlashcard;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 6: Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error updating flashcard:", error);

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

/**
 * DELETE handler - Deletes a flashcard
 *
 * Flow:
 * 1. Validate flashcardId parameter
 * 2. Authenticate user
 * 3. Delete flashcard via service (with ownership verification)
 * 4. Return 204 No Content or error
 *
 * @param params - URL parameters containing flashcardId
 * @param locals - Astro locals with Supabase client
 * @returns Response with 204 on success or error
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Validate flashcardId parameter
    const validation = DeleteFlashcardParamsSchema.safeParse({
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

    // Step 3: Delete flashcard via service
    const flashcardService = new FlashcardService(locals.supabase);
    const deleted = await flashcardService.deleteFlashcard(flashcardId, user.id);

    if (!deleted) {
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

    // Step 4: Return 204 No Content (happy path)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // Step 5: Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error deleting flashcard:", error);

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
