import type { ErrorResponseDTO } from "@/types";

/**
 * Creates a standardized error response
 *
 * @param code - Machine-readable error code (e.g., 'UNAUTHORIZED', 'VALIDATION_ERROR')
 * @param message - Human-readable error message
 * @param status - HTTP status code
 * @param details - Optional additional error context
 * @returns Response object with JSON body and appropriate headers
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  const body: ErrorResponseDTO = {
    error: { code, message, details },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates a standardized success response
 *
 * @param data - Response data to be serialized
 * @param status - HTTP status code (default: 200)
 * @returns Response object with JSON body and appropriate headers
 */
export function successResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
