/**
 * Unit tests for OpenRouterService
 *
 * Tests cover:
 * - Successful flashcard generation
 * - API error handling (rate limit, server error, timeout)
 * - Response validation
 * - Max cards enforcement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterError } from "@/types";

// Mock import.meta.env before importing the service
vi.stubGlobal("import.meta", {
  env: {
    OPENROUTER_API_KEY: "test-key-for-singleton",
  },
});

import { OpenRouterService } from "./openrouter.service";

// Mock fetch globally
global.fetch = vi.fn();

describe("OpenRouterService", () => {
  let service: OpenRouterService;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    service = new OpenRouterService({
      apiKey: mockApiKey,
      defaultModel: "openai/gpt-4o-mini",
      defaultTimeout: 30000,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should throw OpenRouterError when API key is missing", () => {
      // Act & Assert
      expect(() => new OpenRouterService({ apiKey: "" })).toThrow(OpenRouterError);
      expect(() => new OpenRouterService({ apiKey: "" })).toThrow("API key is required");
    });

    it("should throw OpenRouterError when timeout is invalid", () => {
      // Act & Assert
      expect(() => new OpenRouterService({ apiKey: "test", defaultTimeout: -1 })).toThrow(OpenRouterError);
      expect(() => new OpenRouterService({ apiKey: "test", defaultTimeout: 0 })).toThrow(
        "Timeout must be a positive number"
      );
    });

    it("should use default values when not provided", () => {
      // Act
      const service = new OpenRouterService({ apiKey: "test" });

      // Assert
      expect(service.defaultModel).toBe("openai/gpt-4o-mini");
      expect(service.baseUrl).toBe("https://openrouter.ai/api/v1");
    });
  });

  describe("generateFlashcards()", () => {
    it("should generate flashcards successfully with valid response", async () => {
      // Arrange
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [
                  { front: "Question 1", back: "Answer 1" },
                  { front: "Question 2", back: "Answer 2" },
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
        model: "openai/gpt-4o-mini",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await service.generateFlashcards({
        sourceText: "Test content",
        maxCards: 20,
      });

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        index: 0,
        front: "Question 1",
        back: "Answer 1",
      });
      expect(fetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle API rate limit (429)", async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({ error: { message: "Rate limit exceeded" } }),
      } as Response);

      // Act & Assert
      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          maxCards: 20,
        })
      ).rejects.toThrow(OpenRouterError);

      try {
        await service.generateFlashcards({
          sourceText: "Test",
          maxCards: 20,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        expect((error as OpenRouterError).code).toBe("RATE_LIMITED");
      }
    });

    it("should handle API server error (500)", async () => {
      // Arrange
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ error: { message: "Server error" } }),
      } as Response);

      // Act & Assert
      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          maxCards: 20,
        })
      ).rejects.toThrow(OpenRouterError);

      try {
        await service.generateFlashcards({
          sourceText: "Test",
          maxCards: 20,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        expect((error as OpenRouterError).code).toBe("SERVER_ERROR");
      }
    });

    it("should handle timeout", async () => {
      // Arrange
      const abortError = new Error("Aborted");
      abortError.name = "AbortError";
      vi.mocked(fetch).mockRejectedValue(abortError);

      // Act & Assert
      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          maxCards: 20,
        })
      ).rejects.toThrow(OpenRouterError);

      try {
        await service.generateFlashcards({
          sourceText: "Test",
          maxCards: 20,
        });
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        expect((error as OpenRouterError).code).toBe("TIMEOUT");
      }
    });

    it("should validate response schema and filter invalid cards", async () => {
      // Arrange
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [
                  { front: "Valid Question", back: "Valid Answer" },
                  { front: "Invalid" }, // Missing 'back'
                  { back: "Also Invalid" }, // Missing 'front'
                ],
              }),
            },
            finish_reason: "stop",
          },
        ],
        model: "openai/gpt-4o-mini",
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await service.generateFlashcards({
        sourceText: "Test",
        maxCards: 20,
      });

      // Assert
      expect(result).toHaveLength(1); // Only the valid card
      expect(result[0]).toMatchObject({
        front: "Valid Question",
        back: "Valid Answer",
      });
    });

    it("should truncate flashcard content to max length", async () => {
      // Arrange
      const longFront = "a".repeat(300); // Exceeds 200 char limit
      const longBack = "b".repeat(600); // Exceeds 500 char limit

      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                flashcards: [{ front: longFront, back: longBack }],
              }),
            },
            finish_reason: "stop",
          },
        ],
        model: "openai/gpt-4o-mini",
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await service.generateFlashcards({
        sourceText: "Test",
        maxCards: 20,
      });

      // Assert
      expect(result[0].front).toHaveLength(200);
      expect(result[0].back).toHaveLength(500);
    });

    it("should throw OpenRouterError when response is empty", async () => {
      // Arrange
      const mockResponse = {
        choices: [
          {
            message: {
              content: "",
            },
            finish_reason: "stop",
          },
        ],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act & Assert
      await expect(
        service.generateFlashcards({
          sourceText: "Test",
          maxCards: 20,
        })
      ).rejects.toThrow(OpenRouterError);
    });
  });

  describe("chatCompletion()", () => {
    it("should throw OpenRouterError when messages array is empty", async () => {
      // Act & Assert
      await expect(
        service.chatCompletion({
          messages: [],
        })
      ).rejects.toThrow(OpenRouterError);
      await expect(
        service.chatCompletion({
          messages: [],
        })
      ).rejects.toThrow("At least one message is required");
    });

    it("should handle network errors", async () => {
      // Arrange
      vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));

      // Act & Assert
      await expect(
        service.chatCompletion({
          messages: [{ role: "user", content: "Test" }],
        })
      ).rejects.toThrow(OpenRouterError);

      try {
        await service.chatCompletion({
          messages: [{ role: "user", content: "Test" }],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(OpenRouterError);
        expect((error as OpenRouterError).code).toBe("NETWORK_ERROR");
      }
    });
  });
});
