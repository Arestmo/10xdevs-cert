/**
 * Unit tests for GenerationService
 *
 * Tests cover:
 * - Happy path generation flow
 * - Deck ownership validation
 * - AI limit checking and lazy reset
 * - OpenRouter API error handling
 * - Draft rejection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GenerationService,
  DeckNotFoundError,
  AILimitExceededError,
  GenerationNotFoundError,
} from "./generation.service";
import { createMockSupabase, createMockQueryBuilder } from "@/tests/helpers/supabase-mock";
import { createProfile, createDeck, createFlashcardDrafts } from "@/tests/factories";
import type { CreateGenerationRequestDTO } from "@/types";

// Mock OpenRouter service
vi.mock("./openrouter.service", () => ({
  openRouterService: {
    generateFlashcards: vi.fn(),
  },
}));

import { openRouterService } from "./openrouter.service";

describe("GenerationService", () => {
  let service: GenerationService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  const mockUserId = crypto.randomUUID();
  const mockDeckId = crypto.randomUUID();

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new GenerationService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("generateFlashcards()", () => {
    const mockRequest: CreateGenerationRequestDTO = {
      source_text: "Test text for flashcard generation",
      deck_id: mockDeckId,
    };

    it("should generate flashcards successfully - happy path", async () => {
      // Arrange
      const mockDeck = createDeck({ id: mockDeckId, user_id: mockUserId });
      const mockProfile = createProfile({ user_id: mockUserId, monthly_ai_flashcards_count: 50 });
      const mockDrafts = createFlashcardDrafts(10);

      // Mock deck ownership verification
      const deckQueryBuilder = createMockQueryBuilder({ data: mockDeck, error: null });
      mockSupabase.from = vi.fn().mockReturnValue(deckQueryBuilder);

      // Mock profile fetch
      const profileQueryBuilder = createMockQueryBuilder({ data: mockProfile, error: null });
      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder) // First call: deck verification
        .mockReturnValueOnce(profileQueryBuilder); // Second call: profile fetch

      // Mock OpenRouter API
      vi.mocked(openRouterService.generateFlashcards).mockResolvedValue(mockDrafts);

      // Mock RPC increment
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

      // Mock generation events insert
      const eventsQueryBuilder = createMockQueryBuilder({ data: [], error: null });
      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder)
        .mockReturnValueOnce(profileQueryBuilder)
        .mockReturnValueOnce(eventsQueryBuilder);

      // Act
      const result = await service.generateFlashcards(mockUserId, mockRequest);

      // Assert
      expect(result).toMatchObject({
        generation_id: expect.any(String),
        drafts: mockDrafts,
        generated_count: 10,
        remaining_ai_limit: 140, // 200 - 50 - 10
      });
      expect(openRouterService.generateFlashcards).toHaveBeenCalledWith({
        sourceText: mockRequest.source_text,
        maxCards: 20,
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith("increment_ai_usage", {
        p_user_id: mockUserId,
        p_count: 10,
      });
    });

    it("should throw DeckNotFoundError when deck doesn't exist", async () => {
      // Arrange
      const deckQueryBuilder = createMockQueryBuilder({ data: null, error: { message: "Not found" } });
      mockSupabase.from = vi.fn().mockReturnValue(deckQueryBuilder);

      // Act & Assert
      await expect(service.generateFlashcards(mockUserId, mockRequest)).rejects.toThrow(DeckNotFoundError);
    });

    it("should throw DeckNotFoundError when deck doesn't belong to user (RLS)", async () => {
      // Arrange - RLS filters out the deck, so query returns null
      const deckQueryBuilder = createMockQueryBuilder({ data: null, error: null });
      mockSupabase.from = vi.fn().mockReturnValue(deckQueryBuilder);

      // Act & Assert
      await expect(service.generateFlashcards(mockUserId, mockRequest)).rejects.toThrow(DeckNotFoundError);
    });

    it("should throw AILimitExceededError when monthly limit reached", async () => {
      // Arrange
      const mockDeck = createDeck({ id: mockDeckId, user_id: mockUserId });
      const mockProfile = createProfile({
        user_id: mockUserId,
        monthly_ai_flashcards_count: 200, // Limit reached
      });

      const deckQueryBuilder = createMockQueryBuilder({ data: mockDeck, error: null });
      const profileQueryBuilder = createMockQueryBuilder({ data: mockProfile, error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder)
        .mockReturnValueOnce(profileQueryBuilder);

      // Act & Assert
      await expect(service.generateFlashcards(mockUserId, mockRequest)).rejects.toThrow(AILimitExceededError);
    });

    it("should perform lazy reset when reset date is in previous month", async () => {
      // Arrange
      const mockDeck = createDeck({ id: mockDeckId, user_id: mockUserId });

      // Set reset date to last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const mockProfile = createProfile({
        user_id: mockUserId,
        monthly_ai_flashcards_count: 200, // Was at limit
        ai_limit_reset_date: lastMonth.toISOString().split("T")[0],
      });

      const mockDrafts = createFlashcardDrafts(5);

      const deckQueryBuilder = createMockQueryBuilder({ data: mockDeck, error: null });
      const profileQueryBuilder = createMockQueryBuilder({ data: mockProfile, error: null });
      const updateQueryBuilder = createMockQueryBuilder({ data: null, error: null });
      const eventsQueryBuilder = createMockQueryBuilder({ data: [], error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder) // deck verification
        .mockReturnValueOnce(profileQueryBuilder) // profile fetch
        .mockReturnValueOnce(updateQueryBuilder) // profile update (lazy reset)
        .mockReturnValueOnce(eventsQueryBuilder); // events insert

      vi.mocked(openRouterService.generateFlashcards).mockResolvedValue(mockDrafts);
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });

      // Act
      const result = await service.generateFlashcards(mockUserId, mockRequest);

      // Assert
      expect(result.remaining_ai_limit).toBe(195); // 200 - 5 (after reset)

      // Verify update was called to reset the limit
      expect(updateQueryBuilder.update).toHaveBeenCalled();
    });

    it("should throw error when OpenRouter API fails", async () => {
      // Arrange
      const mockDeck = createDeck({ id: mockDeckId, user_id: mockUserId });
      const mockProfile = createProfile({ user_id: mockUserId, monthly_ai_flashcards_count: 50 });

      const deckQueryBuilder = createMockQueryBuilder({ data: mockDeck, error: null });
      const profileQueryBuilder = createMockQueryBuilder({ data: mockProfile, error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder)
        .mockReturnValueOnce(profileQueryBuilder);

      // Mock OpenRouter API failure
      vi.mocked(openRouterService.generateFlashcards).mockRejectedValue(new Error("OpenRouter API failed"));

      // Act & Assert
      await expect(service.generateFlashcards(mockUserId, mockRequest)).rejects.toThrow("OpenRouter API failed");
    });

    it("should throw error when increment AI usage fails", async () => {
      // Arrange
      const mockDeck = createDeck({ id: mockDeckId, user_id: mockUserId });
      const mockProfile = createProfile({ user_id: mockUserId, monthly_ai_flashcards_count: 50 });
      const mockDrafts = createFlashcardDrafts(5);

      const deckQueryBuilder = createMockQueryBuilder({ data: mockDeck, error: null });
      const profileQueryBuilder = createMockQueryBuilder({ data: mockProfile, error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder)
        .mockReturnValueOnce(profileQueryBuilder);

      vi.mocked(openRouterService.generateFlashcards).mockResolvedValue(mockDrafts);

      // Mock RPC failure
      mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "RPC failed" } });

      // Act & Assert
      await expect(service.generateFlashcards(mockUserId, mockRequest)).rejects.toThrow(
        "Failed to increment AI usage count"
      );
    });
  });

  describe("rejectDraft()", () => {
    const mockGenerationId = crypto.randomUUID();
    const mockDraftIndex = 0;

    it("should log REJECTED event successfully", async () => {
      // Arrange
      const mockEvent = {
        id: crypto.randomUUID(),
        user_id: mockUserId,
        generation_id: mockGenerationId,
        flashcard_id: null,
        event_type: "REJECTED" as const,
        created_at: new Date().toISOString(),
      };

      // Mock verification query (check generation exists)
      const verifyQueryBuilder = createMockQueryBuilder({
        data: { id: crypto.randomUUID() },
        error: null,
      });

      // Mock insert query
      const insertQueryBuilder = createMockQueryBuilder({
        data: mockEvent,
        error: null,
      });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(verifyQueryBuilder) // verification
        .mockReturnValueOnce(insertQueryBuilder); // insert

      // Act
      const result = await service.rejectDraft(mockUserId, mockGenerationId, mockDraftIndex);

      // Assert
      expect(result).toMatchObject({
        id: mockEvent.id,
        generation_id: mockGenerationId,
        event_type: "REJECTED",
      });
    });

    it("should throw GenerationNotFoundError when generation doesn't exist", async () => {
      // Arrange
      const verifyQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "Not found" },
      });

      mockSupabase.from = vi.fn().mockReturnValue(verifyQueryBuilder);

      // Act & Assert
      await expect(service.rejectDraft(mockUserId, mockGenerationId, mockDraftIndex)).rejects.toThrow(
        GenerationNotFoundError
      );
    });

    it("should throw GenerationNotFoundError when generation doesn't belong to user", async () => {
      // Arrange - RLS filters out the generation
      const verifyQueryBuilder = createMockQueryBuilder({
        data: null,
        error: null,
      });

      mockSupabase.from = vi.fn().mockReturnValue(verifyQueryBuilder);

      // Act & Assert
      await expect(service.rejectDraft(mockUserId, mockGenerationId, mockDraftIndex)).rejects.toThrow(
        GenerationNotFoundError
      );
    });

    it("should throw error when insert REJECTED event fails", async () => {
      // Arrange
      const verifyQueryBuilder = createMockQueryBuilder({
        data: { id: crypto.randomUUID() },
        error: null,
      });

      const insertQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "Insert failed" },
      });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(verifyQueryBuilder)
        .mockReturnValueOnce(insertQueryBuilder);

      // Act & Assert
      await expect(service.rejectDraft(mockUserId, mockGenerationId, mockDraftIndex)).rejects.toThrow(
        "Failed to insert rejection event"
      );
    });
  });
});
