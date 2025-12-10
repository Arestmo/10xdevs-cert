import { z } from "zod";

/**
 * Validation schema for POST /api/generations request body
 *
 * Validates:
 * - source_text: 1-5000 characters
 * - deck_id: valid UUID format
 */
export const createGenerationRequestSchema = z.object({
  source_text: z
    .string()
    .min(1, "source_text cannot be empty")
    .max(5000, "source_text must be at most 5000 characters"),
  deck_id: z.string().uuid("deck_id must be a valid UUID"),
});

/**
 * Inferred TypeScript type from validation schema
 */
export type CreateGenerationRequest = z.infer<typeof createGenerationRequestSchema>;
