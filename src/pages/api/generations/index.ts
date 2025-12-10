import type { APIContext } from "astro";
import { createGenerationRequestSchema } from "@/lib/validations/generation.validation";
import { GenerationService, DeckNotFoundError, AILimitExceededError } from "@/lib/services/generation.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import type { GenerationResponseDTO } from "@/types";

/**
 * Disable static generation for this API endpoint
 * This endpoint requires SSR for authentication and database access
 */
export const prerender = false;

/**
 * POST /api/generations
 *
 * Generates AI-powered flashcard drafts from source text
 *
 * Request body:
 * - source_text: string (1-5000 characters)
 * - deck_id: string (UUID)
 *
 * Response codes:
 * - 200: Success - returns generation_id, drafts, generated_count, remaining_ai_limit
 * - 400: Validation error - invalid source_text or deck_id
 * - 401: Unauthorized - missing or invalid JWT token
 * - 403: Forbidden - monthly AI limit exceeded
 * - 404: Not found - deck doesn't exist or doesn't belong to user
 * - 503: Service unavailable - OpenRouter API error
 * - 500: Internal server error - unexpected error
 *
 * @param context - Astro API context with locals.supabase
 * @returns Response with JSON body
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Guard clause: authentication failed
    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required. Please log in.", 401);
    }

    // Step 2: Parse and validate request body
    const body = await context.request.json();
    const validationResult = createGenerationRequestSchema.safeParse(body);

    // Guard clause: validation failed
    if (!validationResult.success) {
      return errorResponse("VALIDATION_ERROR", "Validation failed", 400, {
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    // Step 3: Call service layer
    const service = new GenerationService(context.locals.supabase);
    const result: GenerationResponseDTO = await service.generateFlashcards(user.id, validationResult.data);

    // Step 4: Return success response
    return successResponse(result, 200);
  } catch (error) {
    // Handle known error: deck not found
    if (error instanceof DeckNotFoundError) {
      return errorResponse("DECK_NOT_FOUND", error.message, 404);
    }

    // Handle known error: AI limit exceeded
    if (error instanceof AILimitExceededError) {
      return errorResponse(
        "AI_LIMIT_EXCEEDED",
        `Monthly AI generation limit exceeded (${error.limit} flashcards/month). Limit resets on the 1st of next month.`,
        403,
        {
          current_count: error.currentCount,
          limit: error.limit,
          reset_date: error.resetDate.toISOString().split("T")[0],
        }
      );
    }

    // Handle OpenRouter service errors
    if (error instanceof Error && error.message.includes("OpenRouter")) {
      return errorResponse("AI_SERVICE_ERROR", "AI service temporarily unavailable. Please try again later.", 503, {
        provider: "OpenRouter",
      });
    }

    // Handle unexpected errors
    console.error("Unexpected error in POST /api/generations:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred. Please try again later.", 500);
  }
}
