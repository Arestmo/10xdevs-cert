import type { APIRoute } from "astro";
import { z } from "zod";
import { DeckService, DuplicateDeckError } from "@/lib/services/deck.service";
import type { ErrorResponseDTO, CreateDeckRequestDTO, DeckDTO } from "@/types";

export const prerender = false;

// Schemat walidacji parametrów query
const listDecksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["created_at", "name", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

type ListDecksQueryParams = z.infer<typeof listDecksQuerySchema>;

// Schemat walidacji body dla POST
const createDeckBodySchema = z.object({
  name: z.string().min(1, "Name must not be empty").max(100, "Name must not exceed 100 characters"),
});

/**
 * GET /api/decks
 *
 * Retrieves a paginated list of user's decks with metadata.
 * Requires authentication.
 *
 * Query parameters:
 * - limit: number (1-100, default: 20)
 * - offset: number (≥0, default: 0)
 * - sort: "created_at" | "name" | "updated_at" (default: "created_at")
 * - order: "asc" | "desc" (default: "desc")
 *
 * @returns DecksListResponseDTO with pagination metadata
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
    limit: url.searchParams.get("limit"),
    offset: url.searchParams.get("offset"),
    sort: url.searchParams.get("sort"),
    order: url.searchParams.get("order"),
  };

  let validatedParams: ListDecksQueryParams;
  try {
    validatedParams = listDecksQuerySchema.parse(queryParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
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

  // Step 3: Call service and return response
  try {
    const deckService = new DeckService(context.locals.supabase);
    const response = await deckService.listDecks(user.id, validatedParams);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/decks:", error);

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

/**
 * POST /api/decks
 *
 * Creates a new deck for the authenticated user.
 * Requires authentication.
 *
 * Request body:
 * - name: string (1-100 characters, required)
 *
 * @returns DeckDTO (201 Created)
 * @throws 401 if user not authenticated
 * @throws 400 if validation fails
 * @throws 409 if deck with same name exists
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
  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    const errorResponse: ErrorResponseDTO = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid JSON in request body",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let validatedData: CreateDeckRequestDTO;
  try {
    validatedData = createDeckBodySchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: error.flatten().fieldErrors,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    // Re-throw unexpected validation errors
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

  // Step 3: Call service to create deck
  try {
    const deckService = new DeckService(context.locals.supabase);
    const deck: DeckDTO = await deckService.createDeck(user.id, validatedData);

    return new Response(JSON.stringify(deck), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    // Handle duplicate deck name
    if (error instanceof DuplicateDeckError) {
      const errorResponse: ErrorResponseDTO = {
        error: {
          code: "DUPLICATE_DECK",
          message: error.message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/decks:", error);

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
