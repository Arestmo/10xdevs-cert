import type { APIRoute } from "astro";
import { z } from "zod";
import { getStudyCards, DeckNotFoundError } from "@/lib/services/study.service";
import type { ErrorResponseDTO, StudyCardsResponseDTO } from "@/types";

export const prerender = false;

/**
 * Validation schema for GET /api/study/cards query parameters
 *
 * Validates:
 * - deck_id: Optional UUID to filter cards to a specific deck
 * - limit: Number of cards to return (1-200, default 50)
 */
const getStudyCardsQuerySchema = z.object({
  deck_id: z.string().uuid({ message: "deck_id must be a valid UUID" }).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

type GetStudyCardsQueryParams = z.infer<typeof getStudyCardsQuerySchema>;

/**
 * GET /api/study/cards
 *
 * Retrieves flashcards that are due for review in a study session.
 * Implements spaced repetition by querying cards where next_review <= NOW()
 * and returning them sorted by review priority (oldest due first).
 *
 * Query parameters:
 * - deck_id: UUID (optional) - Filter cards to a specific deck
 * - limit: number (1-200, default: 50) - Maximum number of cards to return
 *
 * Response includes:
 * - data: Array of StudyCardDTO (flashcards with deck names)
 * - total_due: Total count of all due cards (respecting deck_id filter)
 * - returned_count: Number of cards actually returned (limited by limit parameter)
 *
 * @returns 200 OK with StudyCardsResponseDTO
 * @throws 400 if query parameters validation fails
 * @throws 401 if user not authenticated
 * @throws 404 if deck_id provided but deck not found or not owned
 * @throws 500 if unexpected error occurs
 */
export const GET: APIRoute = async (context) => {
  // Step 1: Validate authentication
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  // Guard clause: user not authenticated
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

  // Step 2: Validate query parameters
  const url = new URL(context.request.url);
  const queryParams = {
    deck_id: url.searchParams.get("deck_id"),
    limit: url.searchParams.get("limit"),
  };

  let validatedParams: GetStudyCardsQueryParams;
  try {
    validatedParams = getStudyCardsQuerySchema.parse(queryParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid query parameters",
          details: error.flatten().fieldErrors,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Unexpected error during validation
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Get study cards via service
  try {
    const response: StudyCardsResponseDTO = await getStudyCards(
      context.locals.supabase,
      user.id,
      validatedParams.deck_id,
      validatedParams.limit
    );

    // Step 4: Return success response (happy path)
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Step 5: Handle errors

    // Handle deck not found error
    if (error instanceof DeckNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DECK_NOT_FOUND",
          message: "Deck not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log error for debugging (in production, use proper logging service)
    // eslint-disable-next-line no-console
    console.error("Error fetching study cards:", error);

    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
