/**
 * Unit tests for Generation validation schemas
 *
 * Tests cover:
 * - createGenerationRequestSchema validation
 * - rejectDraftRequestSchema validation
 * - Edge cases and error messages
 */

import { describe, it, expect } from "vitest";
import { createGenerationRequestSchema, rejectDraftRequestSchema } from "./generation.validation";

describe("Generation Validation Schemas", () => {
  describe("createGenerationRequestSchema", () => {
    it("should validate correct request with valid source_text and deck_id", () => {
      // Arrange
      const validRequest = {
        source_text: "This is valid source text for generating flashcards.",
        deck_id: crypto.randomUUID(),
      };

      // Act
      const result = createGenerationRequestSchema.safeParse(validRequest);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validRequest);
      }
    });

    it("should reject empty source_text", () => {
      // Arrange
      const invalidRequest = {
        source_text: "",
        deck_id: crypto.randomUUID(),
      };

      // Act
      const result = createGenerationRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("source_text cannot be empty");
      }
    });

    it("should reject source_text longer than 5000 characters", () => {
      // Arrange
      const longText = "a".repeat(5001);
      const invalidRequest = {
        source_text: longText,
        deck_id: crypto.randomUUID(),
      };

      // Act
      const result = createGenerationRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("source_text must be at most 5000 characters");
      }
    });

    it("should accept source_text at exactly 5000 characters", () => {
      // Arrange
      const maxLengthText = "a".repeat(5000);
      const validRequest = {
        source_text: maxLengthText,
        deck_id: crypto.randomUUID(),
      };

      // Act
      const result = createGenerationRequestSchema.safeParse(validRequest);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID format for deck_id", () => {
      // Arrange
      const invalidRequest = {
        source_text: "Valid text",
        deck_id: "not-a-uuid",
      };

      // Act
      const result = createGenerationRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("deck_id must be a valid UUID");
      }
    });

    it("should reject request with missing deck_id", () => {
      // Arrange
      const invalidRequest = {
        source_text: "Valid text",
      };

      // Act
      const result = createGenerationRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject request with missing source_text", () => {
      // Arrange
      const invalidRequest = {
        deck_id: crypto.randomUUID(),
      };

      // Act
      const result = createGenerationRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should allow request with extra unexpected fields (passthrough mode)", () => {
      // Arrange - Zod by default allows extra fields (passthrough mode)
      const requestWithExtra = {
        source_text: "Valid text",
        deck_id: crypto.randomUUID(),
        extra_field: "unexpected",
      };

      // Act
      const result = createGenerationRequestSchema.safeParse(requestWithExtra);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        // Extra fields are preserved in passthrough mode
        expect(result.data).toMatchObject({
          source_text: "Valid text",
          deck_id: expect.any(String),
        });
      }
    });
  });

  describe("rejectDraftRequestSchema", () => {
    it("should validate correct draft_index", () => {
      // Arrange
      const validRequest = {
        draft_index: 5,
      };

      // Act
      const result = rejectDraftRequestSchema.safeParse(validRequest);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.draft_index).toBe(5);
      }
    });

    it("should accept draft_index of 0", () => {
      // Arrange
      const validRequest = {
        draft_index: 0,
      };

      // Act
      const result = rejectDraftRequestSchema.safeParse(validRequest);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should reject negative draft_index", () => {
      // Arrange
      const invalidRequest = {
        draft_index: -1,
      };

      // Act
      const result = rejectDraftRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Draft index must be a non-negative integer");
      }
    });

    it("should reject non-integer draft_index", () => {
      // Arrange
      const invalidRequest = {
        draft_index: 5.5,
      };

      // Act
      const result = rejectDraftRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject missing draft_index", () => {
      // Arrange
      const invalidRequest = {};

      // Act
      const result = rejectDraftRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject draft_index as string", () => {
      // Arrange
      const invalidRequest = {
        draft_index: "5",
      };

      // Act
      const result = rejectDraftRequestSchema.safeParse(invalidRequest);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
