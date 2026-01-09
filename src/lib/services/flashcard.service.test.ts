/**
 * Unit tests for FlashcardService
 *
 * Tests cover:
 * - Creating flashcards (manual and AI-generated)
 * - Listing flashcards with filters
 * - Updating flashcards without resetting FSRS
 * - Deleting flashcards
 * - Ownership validation
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FlashcardService, DeckNotFoundError } from "./flashcard.service";
import { createMockSupabase, createMockQueryBuilder } from "@/tests/helpers/supabase-mock";
import { createDeck, createFlashcard } from "@/tests/factories";
import type { CreateFlashcardRequestDTO, UpdateFlashcardRequestDTO } from "@/types";

describe("FlashcardService", () => {
  let service: FlashcardService;
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  const mockUserId = crypto.randomUUID();
  const mockDeckId = crypto.randomUUID();

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new FlashcardService(mockSupabase);
    vi.clearAllMocks();
  });

  describe("createFlashcard()", () => {
    it("should create manual flashcard successfully", async () => {
      // Arrange
      const request: CreateFlashcardRequestDTO = {
        deck_id: mockDeckId,
        front: "What is TypeScript?",
        back: "A typed superset of JavaScript",
        source: "manual",
      };

      const mockDeck = createDeck({ id: mockDeckId, user_id: mockUserId });
      const mockFlashcard = createFlashcard({
        deck_id: mockDeckId,
        front: request.front,
        back: request.back,
        source: "manual",
      });

      const deckQueryBuilder = createMockQueryBuilder({ data: mockDeck, error: null });
      const flashcardQueryBuilder = createMockQueryBuilder({ data: mockFlashcard, error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder) // deck ownership validation
        .mockReturnValueOnce(flashcardQueryBuilder); // flashcard insert

      // Act
      const result = await service.createFlashcard(mockUserId, request);

      // Assert
      expect(result).toEqual(mockFlashcard);
      expect(flashcardQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          deck_id: mockDeckId,
          front: request.front,
          back: request.back,
          source: "manual",
          state: 0, // new state
          stability: 0.0,
          difficulty: 0.0,
        })
      );
    });

    it("should create AI flashcard with generation_id and log event", async () => {
      // Arrange
      const generationId = crypto.randomUUID();
      const request: CreateFlashcardRequestDTO = {
        deck_id: mockDeckId,
        front: "AI Question",
        back: "AI Answer",
        source: "ai",
        generation_id: generationId,
        was_edited: false,
      };

      const mockDeck = createDeck({ id: mockDeckId, user_id: mockUserId });
      const mockFlashcard = createFlashcard({
        deck_id: mockDeckId,
        source: "ai",
      });

      const deckQueryBuilder = createMockQueryBuilder({ data: mockDeck, error: null });
      const flashcardQueryBuilder = createMockQueryBuilder({ data: mockFlashcard, error: null });
      const eventQueryBuilder = createMockQueryBuilder({ data: null, error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder)
        .mockReturnValueOnce(flashcardQueryBuilder)
        .mockReturnValueOnce(eventQueryBuilder); // event insert

      // Act
      const result = await service.createFlashcard(mockUserId, request);

      // Assert
      expect(result).toEqual(mockFlashcard);
      expect(eventQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          flashcard_id: mockFlashcard.id,
          generation_id: generationId,
          event_type: "ACCEPTED",
        })
      );
    });

    it("should log EDITED event when AI flashcard was edited", async () => {
      // Arrange
      const generationId = crypto.randomUUID();
      const request: CreateFlashcardRequestDTO = {
        deck_id: mockDeckId,
        front: "Edited Question",
        back: "Edited Answer",
        source: "ai",
        generation_id: generationId,
        was_edited: true,
      };

      const mockDeck = createDeck({ id: mockDeckId, user_id: mockUserId });
      const mockFlashcard = createFlashcard({ deck_id: mockDeckId });

      const deckQueryBuilder = createMockQueryBuilder({ data: mockDeck, error: null });
      const flashcardQueryBuilder = createMockQueryBuilder({ data: mockFlashcard, error: null });
      const eventQueryBuilder = createMockQueryBuilder({ data: null, error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder)
        .mockReturnValueOnce(flashcardQueryBuilder)
        .mockReturnValueOnce(eventQueryBuilder);

      // Act
      await service.createFlashcard(mockUserId, request);

      // Assert
      expect(eventQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: "EDITED",
        })
      );
    });

    it("should throw DeckNotFoundError when deck doesn't exist", async () => {
      // Arrange
      const request: CreateFlashcardRequestDTO = {
        deck_id: mockDeckId,
        front: "Question",
        back: "Answer",
        source: "manual",
      };

      const deckQueryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "Not found" },
      });
      mockSupabase.from = vi.fn().mockReturnValue(deckQueryBuilder);

      // Act & Assert
      await expect(service.createFlashcard(mockUserId, request)).rejects.toThrow(DeckNotFoundError);
    });
  });

  describe("updateFlashcard()", () => {
    it("should update flashcard content without resetting FSRS params", async () => {
      // Arrange
      const flashcardId = crypto.randomUUID();
      const updates: UpdateFlashcardRequestDTO = {
        front: "Updated Question",
        back: "Updated Answer",
      };

      const existingFlashcard = createFlashcard({
        id: flashcardId,
        deck_id: mockDeckId,
        stability: 5.0,
        reps: 10,
        state: 2, // review state
      });

      const updatedFlashcard = {
        ...existingFlashcard,
        front: updates.front,
        back: updates.back,
        // FSRS params should remain unchanged
      };

      const fetchQueryBuilder = createMockQueryBuilder({
        data: { ...existingFlashcard, decks: { user_id: mockUserId } },
        error: null,
      });
      const updateQueryBuilder = createMockQueryBuilder({ data: updatedFlashcard, error: null });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(fetchQueryBuilder) // ownership check
        .mockReturnValueOnce(updateQueryBuilder); // update

      // Act
      const result = await service.updateFlashcard(flashcardId, mockUserId, updates);

      // Assert
      expect(result).toEqual(updatedFlashcard);
      expect(updateQueryBuilder.update).toHaveBeenCalledWith({
        front: updates.front,
        back: updates.back,
      });
      // Verify FSRS params weren't included in update
      expect(updateQueryBuilder.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          stability: expect.anything(),
          reps: expect.anything(),
        })
      );
    });

    it("should return null when flashcard not found or not owned", async () => {
      // Arrange
      const flashcardId = crypto.randomUUID();
      const updates: UpdateFlashcardRequestDTO = { front: "Updated" };

      const fetchQueryBuilder = createMockQueryBuilder({
        data: null,
        error: null,
      });
      mockSupabase.from = vi.fn().mockReturnValue(fetchQueryBuilder);

      // Act
      const result = await service.updateFlashcard(flashcardId, mockUserId, updates);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("deleteFlashcard()", () => {
    it("should delete flashcard successfully", async () => {
      // Arrange
      const flashcardId = crypto.randomUUID();

      const fetchQueryBuilder = createMockQueryBuilder({
        data: { id: flashcardId, decks: { user_id: mockUserId } },
        error: null,
      });
      const deleteQueryBuilder = createMockQueryBuilder({ data: null, error: null });

      mockSupabase.from = vi.fn().mockReturnValueOnce(fetchQueryBuilder).mockReturnValueOnce(deleteQueryBuilder);

      // Act
      const result = await service.deleteFlashcard(flashcardId, mockUserId);

      // Assert
      expect(result).toBe(true);
      expect(deleteQueryBuilder.delete).toHaveBeenCalled();
    });

    it("should return false when flashcard not found or not owned", async () => {
      // Arrange
      const flashcardId = crypto.randomUUID();

      const fetchQueryBuilder = createMockQueryBuilder({
        data: null,
        error: null,
      });
      mockSupabase.from = vi.fn().mockReturnValue(fetchQueryBuilder);

      // Act
      const result = await service.deleteFlashcard(flashcardId, mockUserId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("listFlashcards()", () => {
    it("should return flashcards list with pagination", async () => {
      // Arrange
      const mockFlashcards = [
        { ...createFlashcard(), decks: { user_id: mockUserId } },
        { ...createFlashcard(), decks: { user_id: mockUserId } },
      ];

      const queryBuilder = createMockQueryBuilder({
        data: mockFlashcards,
        error: null,
        count: 2,
      });
      mockSupabase.from = vi.fn().mockReturnValue(queryBuilder);

      // Act
      const result = await service.listFlashcards(mockUserId, {
        limit: 50,
        offset: 0,
        sort: "created_at",
        order: "desc",
      });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 2,
        limit: 50,
        offset: 0,
        has_more: false,
      });
    });

    it("should filter by deck_id when provided", async () => {
      // Arrange
      const deckQueryBuilder = createMockQueryBuilder({
        data: { id: mockDeckId },
        error: null,
      });
      const flashcardsQueryBuilder = createMockQueryBuilder({
        data: [],
        error: null,
        count: 0,
      });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce(deckQueryBuilder) // deck verification
        .mockReturnValueOnce(flashcardsQueryBuilder); // flashcards query

      // Act
      await service.listFlashcards(mockUserId, {
        deck_id: mockDeckId,
        limit: 50,
        offset: 0,
        sort: "created_at",
        order: "desc",
      });

      // Assert
      expect(flashcardsQueryBuilder.eq).toHaveBeenCalledWith("deck_id", mockDeckId);
    });

    it("should throw DeckNotFoundError when deck_id provided but deck not found", async () => {
      // Arrange
      const queryBuilder = createMockQueryBuilder({
        data: null,
        error: { message: "Not found" },
      });
      mockSupabase.from = vi.fn().mockReturnValue(queryBuilder);

      // Act & Assert
      await expect(
        service.listFlashcards(mockUserId, {
          deck_id: mockDeckId,
          limit: 50,
          offset: 0,
          sort: "created_at",
          order: "desc",
        })
      ).rejects.toThrow(DeckNotFoundError);
    });
  });
});
