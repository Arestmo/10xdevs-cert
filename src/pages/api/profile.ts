import type { APIRoute } from "astro";
import { ProfileService, ProfileNotFoundError } from "@/lib/services/profile.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";

// Disable static prerendering (SSR only)
export const prerender = false;

/**
 * GET /api/profile
 *
 * Retrieves the authenticated user's profile with AI generation limit information.
 *
 * Flow:
 * 1. Authenticate user
 * 2. Fetch profile via ProfileService (includes lazy reset logic)
 * 3. Return ProfileResponseDTO with remaining_ai_limit
 *
 * @returns 200 OK with ProfileResponseDTO
 * @throws 401 if user not authenticated
 * @throws 404 if profile not found
 * @throws 500 if unexpected error occurs
 */
export const GET: APIRoute = async (context) => {
  try {
    // Step 1: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Guard clause: authentication failed
    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 2: Fetch profile via ProfileService
    const profileService = new ProfileService(context.locals.supabase);
    const profile = await profileService.getProfile(user.id);

    // Step 3: Return success response
    return successResponse(profile, 200);
  } catch (error) {
    // Handle ProfileNotFoundError
    if (error instanceof ProfileNotFoundError) {
      // eslint-disable-next-line no-console
      console.error("Profile not found:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return errorResponse("NOT_FOUND", "User profile not found", 404);
    }

    // Log and handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in GET /api/profile:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
