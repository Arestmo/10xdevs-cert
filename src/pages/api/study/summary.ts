/**
 * GET /api/study/summary
 *
 * Returns study summary for dashboard including total due cards,
 * next review date, and per-deck breakdown.
 *
 * @auth Required - User must be authenticated
 * @returns {StudySummaryResponseDTO} Study summary data
 * @throws {401} If user not authenticated
 * @throws {500} If server error occurs
 */

import type { APIRoute } from "astro";
import { getStudySummary } from "@/lib/services/study.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // Guard clause: Verify authentication
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

    // Fetch study summary from service layer
    const summary = await getStudySummary(context.locals.supabase, user.id);

    // Happy path: Return success response
    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Catch-all error handler
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
