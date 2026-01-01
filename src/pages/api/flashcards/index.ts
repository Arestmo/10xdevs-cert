import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService, DeckNotFoundError } from "@/lib/services/flashcard.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

// Validation schema for query parameters
const getFlashcardsQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at", "next_review", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

type GetFlashcardsQueryParams = z.infer<typeof getFlashcardsQuerySchema>;

/**
 * GET /api/flashcards
 *
 * Retrieves a paginated list of user's flashcards with optional deck filtering.
 * Requires authentication.
 *
 * Query parameters:
 * - deck_id: UUID (optional) - Filter flashcards by specific deck
 * - limit: number (1-100, default: 20) - Maximum number of items per page
 * - offset: number (≥0, default: 0) - Number of items to skip
 * - sort: "created_at" | "next_review" | "updated_at" (default: "created_at") - Field to sort by
 * - order: "asc" | "desc" (default: "desc") - Sort direction
 *
 * @returns FlashcardsListResponseDTO with pagination metadata
 * @throws 401 if user not authenticated
 * @throws 400 if validation fails
 * @throws 404 if deck_id provided but deck not found or not owned
 * @throws 500 if unexpected error occurs
 */
export const GET: APIRoute = async (context) => {
  // Step 1: Validate authentication
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "UNAUTHORIZED",
        message: "User not authenticated",
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
    offset: url.searchParams.get("offset"),
    sort: url.searchParams.get("sort"),
    order: url.searchParams.get("order"),
  };

  let validatedParams: GetFlashcardsQueryParams;
  try {
    validatedParams = getFlashcardsQuerySchema.parse(queryParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "INVALID_QUERY_PARAMETERS",
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
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Call service and return response
  try {
    const flashcardService = new FlashcardService(context.locals.supabase);
    const response = await flashcardService.listFlashcards(user.id, validatedParams);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
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
    console.error("Error in GET /api/flashcards:", error);

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
