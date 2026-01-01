import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardService, DeckNotFoundError } from "@/lib/services/flashcard.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

// Validation schema for query parameters (GET)
const getFlashcardsQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at", "next_review", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

type GetFlashcardsQueryParams = z.infer<typeof getFlashcardsQuerySchema>;

/**
 * Validation schema for creating a new flashcard (POST)
 *
 * Validates:
 * - deck_id: Must be a valid UUID
 * - front: 1-200 characters
 * - back: 1-500 characters
 * - source: Either "ai" or "manual"
 * - generation_id: Required when source is "ai", otherwise optional/null
 * - was_edited: Optional boolean, defaults to false
 */
const createFlashcardSchema = z
  .object({
    deck_id: z.string().uuid({ message: "deck_id must be a valid UUID" }),
    front: z
      .string()
      .min(1, { message: "front must contain at least 1 character" })
      .max(200, { message: "front must not exceed 200 characters" }),
    back: z
      .string()
      .min(1, { message: "back must contain at least 1 character" })
      .max(500, { message: "back must not exceed 500 characters" }),
    source: z.enum(["ai", "manual"], {
      errorMap: () => ({ message: "source must be either 'ai' or 'manual'" }),
    }),
    generation_id: z.string().uuid({ message: "generation_id must be a valid UUID" }).nullable().optional(),
    was_edited: z.boolean().optional().default(false),
  })
  .refine(
    (data) => {
      // When source is "ai", generation_id must be provided and not null
      if (data.source === "ai" && !data.generation_id) {
        return false;
      }
      return true;
    },
    {
      message: "generation_id is required when source is 'ai'",
      path: ["generation_id"],
    }
  );

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

/**
 * POST /api/flashcards
 *
 * Creates a new flashcard in the system.
 * Supports two creation modes:
 * - Manual creation: User creates flashcard from scratch
 * - AI-generated acceptance: User accepts (with optional edits) an AI draft
 *
 * When accepting AI-generated flashcard, automatically logs generation event
 * (ACCEPTED or EDITED) to track AI usage analytics.
 *
 * Request body (snake_case):
 * - deck_id: string UUID (required)
 * - front: string 1-200 chars (required)
 * - back: string 1-500 chars (required)
 * - source: "ai" | "manual" (required)
 * - generation_id: string UUID | null (required when source="ai")
 * - was_edited: boolean (optional, default: false)
 *
 * @returns 201 Created with FlashcardDTO
 * @throws 400 if validation fails
 * @throws 401 if user not authenticated
 * @throws 404 if deck not found or not owned
 * @throws 500 if unexpected error occurs
 */
export const POST: APIRoute = async (context) => {
  // Step 1: Validate authentication
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

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

  // Step 2: Parse and validate request body
  let body;
  try {
    body = await context.request.json();
  } catch {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "INVALID_JSON",
        message: "Request body must be valid JSON",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const validationResult = createFlashcardSchema.safeParse(body);

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input data",
        details: {
          field: firstError.path.join("."),
          issue: firstError.message,
        },
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Create flashcard via service
  try {
    const flashcardService = new FlashcardService(context.locals.supabase);
    const flashcard = await flashcardService.createFlashcard(user.id, validationResult.data);

    // Step 4: Return success response with 201 Created
    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Step 5: Handle errors
    if (error instanceof DeckNotFoundError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DECK_NOT_FOUND",
          message: "Deck not found or access denied",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors for debugging
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/flashcards:", error);

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
