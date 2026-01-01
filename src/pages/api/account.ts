import type { APIRoute } from "astro";
import { z } from "zod";
import { AccountService, AccountDeletionError } from "@/lib/services/account.service";
import { errorResponse, successResponse } from "@/lib/utils/api-response";
import type { DeleteAccountResponseDTO } from "@/types";

// Disable static prerendering (SSR only)
export const prerender = false;

// Zod schema for request body validation
const deleteAccountSchema = z.object({
  confirmation: z.string().refine((val) => val === "DELETE", {
    message: "Confirmation string must be 'DELETE'",
  }),
});

/**
 * DELETE /api/account
 *
 * Deletes user account and all associated data (GDPR compliance).
 * Requires explicit confirmation string to prevent accidental deletion.
 *
 * Flow:
 * 1. Parse and validate request body
 * 2. Authenticate user
 * 3. Delete user via AccountService (triggers cascade deletion)
 * 4. Invalidate session
 * 5. Return success response
 *
 * Cascade deletion order (automatic via database constraints):
 * - auth.users → profiles → decks → flashcards
 * - auth.users → profiles → generation_events
 *
 * @returns 200 OK with success message
 * @throws 400 if confirmation string invalid or missing
 * @throws 401 if user not authenticated
 * @throws 500 if deletion or session invalidation fails
 */
export const DELETE: APIRoute = async (context) => {
  try {
    // Step 1: Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await context.request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON in request body", 400);
    }

    try {
      deleteAccountSchema.parse(requestBody);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return errorResponse("VALIDATION_ERROR", "Invalid request data", 400, error.flatten().fieldErrors);
      }
      throw error;
    }

    // Step 2: Authenticate user
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    // Guard clause: authentication failed
    if (authError || !user) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401);
    }

    // Step 3: Delete user account via service
    const accountService = new AccountService(context.locals.supabase);
    await accountService.deleteAccount(user.id);

    // Step 4: Invalidate session
    await context.locals.supabase.auth.signOut();

    // Step 5: Return success response
    const response: DeleteAccountResponseDTO = {
      message: "Account successfully deleted",
    };
    return successResponse(response, 200);
  } catch (error) {
    // Handle AccountDeletionError
    if (error instanceof AccountDeletionError) {
      // eslint-disable-next-line no-console
      console.error("Account deletion failed:", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return errorResponse("INTERNAL_ERROR", "Failed to delete account", 500);
    }

    // Log and handle unexpected errors
    // eslint-disable-next-line no-console
    console.error("Error in DELETE /api/account:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
};
