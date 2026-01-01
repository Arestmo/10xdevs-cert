import type { APIRoute } from "astro";
import { z } from "zod";
import { GenerationService, GenerationNotFoundError } from "@/lib/services/generation.service";
import { rejectDraftRequestSchema } from "@/lib/validations/generation.validation";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

export const prerender = false;

/**
 * POST /api/generations/{generationId}/reject
 *
 * Log rejection of an AI-generated draft
 *
 * @returns 201 Created with event details
 * @returns 400 Bad Request if validation fails
 * @returns 401 Unauthorized if user not authenticated
 * @returns 404 Not Found if generation doesn't exist or isn't owned by user
 * @returns 500 Internal Server Error on unexpected failure
 */
export const POST: APIRoute = async (context) => {
  try {
    // Step 1: Validate generationId UUID format
    const { generationId } = context.params;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!generationId || !uuidRegex.test(generationId)) {
      return errorResponse("INVALID_GENERATION_ID", "Invalid generation ID format", 400);
    }

    // Step 2: Parse and validate request body
    const body = await context.request.json();
    const validatedData = rejectDraftRequestSchema.parse(body);

    // Step 3: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 4: Call service layer
    const service = new GenerationService(context.locals.supabase);
    const event = await service.rejectDraft(user.id, generationId, validatedData.draft_index);

    // Step 5: Return success response
    return successResponse(event, 201);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return errorResponse("INVALID_DRAFT_INDEX", "Draft index must be a non-negative integer", 400);
    }

    // Handle generation not found
    if (error instanceof GenerationNotFoundError) {
      return errorResponse("GENERATION_NOT_FOUND", "Generation not found", 404);
    }

    // Log and handle unexpected errors
    console.error("Failed to reject draft:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to log rejection event", 500);
  }
};
