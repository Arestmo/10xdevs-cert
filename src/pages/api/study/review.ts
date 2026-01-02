/**
 * POST /api/study/review
 *
 * Submits a review rating for a flashcard and updates FSRS scheduling parameters.
 *
 * This endpoint implements the core spaced repetition algorithm by:
 * - Validating user authentication and input data
 * - Verifying flashcard ownership
 * - Calculating new FSRS parameters based on the rating
 * - Updating the flashcard in the database
 * - Returning updated flashcard and preview intervals for all rating options
 *
 * Security:
 * - Requires authentication via Supabase Auth
 * - Validates flashcard ownership via deck relationship
 * - Prevents unauthorized access to other users' flashcards
 *
 * @module API.Study.Review
 */

import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import { submitReview, FlashcardNotFoundError } from "@/lib/services/study.service";
import type { ErrorResponseDTO, ReviewResponseDTO } from "@/types";

export const prerender = false;

/**
 * Validation schema for POST /api/study/review
 *
 * Validates:
 * - flashcard_id: Must be a valid UUID
 * - rating: Must be an integer 1-4 (1=Again, 2=Hard, 3=Good, 4=Easy)
 */
const submitReviewSchema = z.object({
  flashcard_id: z.string().uuid({ message: "flashcard_id must be a valid UUID" }),
  rating: z
    .number()
    .int()
    .min(1)
    .max(4)
    .refine((val) => [1, 2, 3, 4].includes(val), {
      message: "rating must be 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)",
    }),
});

/**
 * POST /api/study/review
 *
 * Handles flashcard review submission with FSRS scheduling.
 *
 * Request Body:
 * {
 *   "flashcard_id": "uuid",
 *   "rating": 1 | 2 | 3 | 4
 * }
 *
 * Success Response (200):
 * {
 *   "flashcard": { ...updated flashcard data },
 *   "next_intervals": {
 *     "again": "10m",
 *     "hard": "1d",
 *     "good": "14d",
 *     "easy": "30d"
 *   }
 * }
 *
 * Error Responses:
 * - 401: User not authenticated
 * - 400: Invalid request data (validation errors)
 * - 404: Flashcard not found or not owned by user
 * - 500: Internal server error (database or FSRS calculation failure)
 */
export const POST: APIRoute = async (context) => {
  // Step 1: Authentication check
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  // Guard clause: authentication required
  if (authError || !user) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Step 2: Parse and validate request body
  let requestBody: unknown;
  try {
    requestBody = await context.request.json();
  } catch {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INVALID_JSON",
        message: "Invalid JSON in request body",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Step 3: Validate request data with Zod
  let validatedData: { flashcard_id: string; rating: 1 | 2 | 3 | 4 };
  try {
    validatedData = submitReviewSchema.parse(requestBody) as { flashcard_id: string; rating: 1 | 2 | 3 | 4 };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid request data",
          details: error.flatten().fieldErrors,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Unexpected validation error
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Failed to validate request data",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Step 4: Call service layer to submit review
  try {
    const result: ReviewResponseDTO = await submitReview(
      context.locals.supabase,
      user.id,
      validatedData.flashcard_id,
      validatedData.rating
    );

    // Step 5: Return success response (happy path)
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Step 6: Handle service layer errors

    // Flashcard not found or not owned
    if (error instanceof FlashcardNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "FLASHCARD_NOT_FOUND",
          message: "Flashcard not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // Log unexpected errors for debugging
    // eslint-disable-next-line no-console
    console.error("Error submitting review:", {
      flashcard_id: validatedData.flashcard_id,
      user_id: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Internal server error
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
