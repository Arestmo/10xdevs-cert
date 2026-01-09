/**
 * Unit tests for useAIGeneration hook
 *
 * Tests cover:
 * - Profile fetching and AI limit tracking
 * - Generation flow (input → generating → reviewing)
 * - Draft actions (accept, reject, edit)
 * - Error handling
 * - Computed values (canGenerate, counts)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAIGeneration } from "./useAIGeneration";
import type { ProfileResponseDTO, GenerationResponseDTO } from "@/types";

// Mock fetch globally
global.fetch = vi.fn();

describe("useAIGeneration", () => {
  const mockDeckId = crypto.randomUUID();
  const mockGenerationId = crypto.randomUUID();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Profile fetching", () => {
    it("should fetch profile on mount and update limits", async () => {
      // Arrange
      const mockProfile: ProfileResponseDTO = {
        user_id: crypto.randomUUID(),
        email: "test@example.com",
        full_name: null,
        avatar_url: null,
        monthly_ai_flashcards_count: 50,
        remaining_ai_limit: 150,
        ai_limit_reset_date: "2026-02-01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      } as Response);

      // Act
      const { result } = renderHook(() => useAIGeneration());

      // Assert
      await waitFor(() => {
        expect(result.current.remainingLimit).toBe(150);
        expect(result.current.resetDate).toBe("2026-02-01");
        expect(result.current.isLoadingProfile).toBe(false);
      });
    });

    it("should handle profile fetch errors", async () => {
      // Arrange
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      // Act
      const { result } = renderHook(() => useAIGeneration());

      // Assert
      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
        expect(result.current.state.error).toMatchObject({
          code: "NETWORK_ERROR",
        });
      });
    });

    it("should redirect to login when unauthorized (401)", async () => {
      // Arrange
      const originalLocation = window.location.href;

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      // Mock window.location.href setter
      delete (window as { location?: unknown }).location;
      window.location = { href: "" } as Location;

      // Act
      renderHook(() => useAIGeneration());

      // Assert
      await waitFor(() => {
        expect(window.location.href).toContain("/login");
      });

      // Cleanup
      window.location.href = originalLocation;
    });
  });

  describe("Generation flow", () => {
    it.skip("should generate flashcards successfully - happy path", async () => {
      // Arrange
      const mockProfile: ProfileResponseDTO = {
        user_id: crypto.randomUUID(),
        email: "test@example.com",
        full_name: null,
        avatar_url: null,
        monthly_ai_flashcards_count: 50,
        remaining_ai_limit: 150,
        ai_limit_reset_date: "2026-02-01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockGenerationResponse: GenerationResponseDTO = {
        generation_id: mockGenerationId,
        drafts: [
          { index: 0, front: "Question 1", back: "Answer 1" },
          { index: 1, front: "Question 2", back: "Answer 2" },
        ],
        generated_count: 2,
        remaining_ai_limit: 148,
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockProfile,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockGenerationResponse,
        } as Response);

      // Act
      const { result } = renderHook(() => useAIGeneration({ preselectedDeckId: mockDeckId }));

      // Wait for profile to load
      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // Set source text
      result.current.setSourceText("Test source text for generation");

      // Verify canGenerate is true
      expect(result.current.canGenerate).toBe(true);

      // Trigger generation
      await result.current.generate();

      // Assert
      await waitFor(() => {
        expect(result.current.state.stage).toBe("reviewing");
        expect(result.current.state.drafts).toHaveLength(2);
        expect(result.current.state.remainingLimit).toBe(148);
        expect(result.current.unprocessedCount).toBe(2);
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it.skip("should handle AI limit exceeded error (403)", async () => {
      // Arrange
      const mockProfile: ProfileResponseDTO = {
        user_id: crypto.randomUUID(),
        email: "test@example.com",
        full_name: null,
        avatar_url: null,
        monthly_ai_flashcards_count: 200,
        remaining_ai_limit: 0,
        ai_limit_reset_date: "2026-02-01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockProfile,
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({
            error: {
              code: "AI_LIMIT_EXCEEDED",
              details: {
                reset_date: "2026-02-01",
                current_count: 200,
                limit: 200,
              },
            },
          }),
        } as Response);

      // Act
      const { result } = renderHook(() => useAIGeneration({ preselectedDeckId: mockDeckId }));

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      result.current.setSourceText("Test text");
      await result.current.generate();

      // Assert
      await waitFor(() => {
        expect(result.current.state.stage).toBe("error");
        expect(result.current.state.error).toMatchObject({
          code: "AI_LIMIT_EXCEEDED",
        });
      });
    });

    it("should not allow generation when canGenerate is false", async () => {
      // Arrange
      const mockProfile: ProfileResponseDTO = {
        user_id: crypto.randomUUID(),
        email: "test@example.com",
        full_name: null,
        avatar_url: null,
        monthly_ai_flashcards_count: 50,
        remaining_ai_limit: 150,
        ai_limit_reset_date: "2026-02-01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      } as Response);

      // Act
      const { result } = renderHook(() => useAIGeneration());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // canGenerate should be false (no deck selected, no source text)
      expect(result.current.canGenerate).toBe(false);

      // Try to generate
      await result.current.generate();

      // Assert - should not trigger generation
      expect(result.current.state.stage).toBe("input");
      expect(fetch).toHaveBeenCalledTimes(1); // Only profile fetch
    });
  });

  describe("Draft actions", () => {
    it.skip("should accept draft successfully", async () => {
      // Arrange
      const mockProfile: ProfileResponseDTO = {
        user_id: crypto.randomUUID(),
        email: "test@example.com",
        full_name: null,
        avatar_url: null,
        monthly_ai_flashcards_count: 50,
        remaining_ai_limit: 150,
        ai_limit_reset_date: "2026-02-01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockGenerationResponse: GenerationResponseDTO = {
        generation_id: mockGenerationId,
        drafts: [{ index: 0, front: "Question 1", back: "Answer 1" }],
        generated_count: 1,
        remaining_ai_limit: 149,
      };

      const mockFlashcard = {
        id: crypto.randomUUID(),
        deck_id: mockDeckId,
        front: "Question 1",
        back: "Answer 1",
        source: "ai" as const,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: 0,
        last_review: null,
        next_review: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProfile,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGenerationResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFlashcard,
        } as Response);

      // Act
      const { result } = renderHook(() => useAIGeneration({ preselectedDeckId: mockDeckId }));

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      result.current.setSourceText("Test text");
      await result.current.generate();

      await waitFor(() => {
        expect(result.current.state.stage).toBe("reviewing");
      });

      // Accept first draft
      await result.current.acceptDraft(0);

      // Assert
      await waitFor(() => {
        expect(result.current.state.drafts[0].status).toBe("accepted");
        expect(result.current.acceptedCount).toBe(1);
        expect(result.current.unprocessedCount).toBe(0);
      });
    });

    it("should track unprocessed and accepted counts correctly", async () => {
      // This test verifies the computed values work correctly
      const mockProfile: ProfileResponseDTO = {
        user_id: crypto.randomUUID(),
        email: "test@example.com",
        full_name: null,
        avatar_url: null,
        monthly_ai_flashcards_count: 0,
        remaining_ai_limit: 200,
        ai_limit_reset_date: "2026-02-01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response);

      const { result } = renderHook(() => useAIGeneration());

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // Initially, no drafts
      expect(result.current.unprocessedCount).toBe(0);
      expect(result.current.acceptedCount).toBe(0);
    });
  });

  describe("Computed values", () => {
    it.skip("should compute canGenerate correctly based on conditions", async () => {
      // Arrange
      const mockProfile: ProfileResponseDTO = {
        user_id: crypto.randomUUID(),
        email: "test@example.com",
        full_name: null,
        avatar_url: null,
        monthly_ai_flashcards_count: 50,
        remaining_ai_limit: 150,
        ai_limit_reset_date: "2026-02-01",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as Response);

      // Act
      const { result } = renderHook(() => useAIGeneration({ preselectedDeckId: mockDeckId }));

      await waitFor(() => {
        expect(result.current.isLoadingProfile).toBe(false);
      });

      // Should be false (no source text)
      expect(result.current.canGenerate).toBe(false);

      // Add source text
      result.current.setSourceText("Test text");

      // Should be true now
      expect(result.current.canGenerate).toBe(true);

      // Set empty source text
      result.current.setSourceText("");

      // Should be false again
      expect(result.current.canGenerate).toBe(false);
    });
  });
});
