/**
 * GET /api/profile
 *
 * Retrieves the authenticated user's profile information, including their monthly
 * AI flashcard generation usage and remaining limit.
 *
 * @endpoint GET /api/profile
 * @authentication Required (JWT token)
 *
 * @returns {200} ProfileResponseDTO - User profile with computed remaining_ai_limit
 * @returns {401} ErrorResponseDTO - Authentication required
 * @returns {404} ErrorResponseDTO - Profile not found
 * @returns {500} ErrorResponseDTO - Internal server error
 *
 * @example Success Response (200)
 * {
 *   "user_id": "550e8400-e29b-41d4-a716-446655440000",
 *   "monthly_ai_flashcards_count": 45,
 *   "ai_limit_reset_date": "2024-12-01",
 *   "remaining_ai_limit": 155,
 *   "created_at": "2024-11-15T10:30:00Z",
 *   "updated_at": "2024-12-05T14:20:00Z"
 * }
 *
 * @example Error Response (401)
 * {
 *   "error": {
 *     "code": "UNAUTHORIZED",
 *     "message": "Authentication required. Please log in."
 *   }
 * }
 */

import type { APIContext } from "astro";
import { ProfileService, ProfileNotFoundError } from "@/lib/services/profile.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

// Disable prerendering for this API route (SSR only)
export const prerender = false;

/**
 * Handles GET requests to retrieve user profile
 *
 * Flow:
 * 1. Authenticate user via JWT token
 * 2. Call ProfileService to get profile with lazy reset
 * 3. Return success response with ProfileResponseDTO
 *
 * @param context - Astro API context with request, locals, etc.
 * @returns JSON response with profile data or error
 */
export async function GET(context: APIContext): Promise<Response> {
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

    // Step 2: Call service layer
    const service = new ProfileService(context.locals.supabase);
    const profile = await service.getProfile(user.id);

    // Step 3: Return success response
    return successResponse(profile, 200);
  } catch (error) {
    // Handle ProfileNotFoundError
    if (error instanceof ProfileNotFoundError) {
      return errorResponse("PROFILE_NOT_FOUND", "User profile not found", 404);
    }

    // Handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/profile:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred. Please try again later.", 500);
  }
}
