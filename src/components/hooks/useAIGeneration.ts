/**
 * Custom hook for AI flashcard generation flow
 *
 * Manages the complete lifecycle of AI generation:
 * - Fetching user profile and AI limits
 * - Managing form state (source text, selected deck)
 * - Triggering generation and handling drafts
 * - Accepting/rejecting/editing drafts
 * - Creating new decks
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import type { GenerationState, DraftViewModel, DeckOption, UseAIGenerationReturn } from "@/components/generation/types";
import type {
  ProfileResponseDTO,
  CreateGenerationRequestDTO,
  GenerationResponseDTO,
  FlashcardDraftDTO,
  CreateFlashcardRequestDTO,
  RejectDraftRequestDTO,
  DeckDTO,
} from "@/types";

interface UseAIGenerationOptions {
  preselectedDeckId?: string;
}

export function useAIGeneration(options: UseAIGenerationOptions = {}): UseAIGenerationReturn {
  const { preselectedDeckId } = options;

  // ============================================================================
  // State Management
  // ============================================================================

  const [state, setState] = useState<GenerationState>({
    stage: "input",
    sourceText: "",
    selectedDeckId: preselectedDeckId ?? null,
    isCreatingNewDeck: false,
    newDeckName: "",
    generationId: null,
    drafts: [],
    remainingLimit: 200,
    resetDate: "",
    error: null,
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [createDeckError, setCreateDeckError] = useState<string | null>(null);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Transform API drafts to ViewModel with local UI state
   */
  const transformDrafts = useCallback((apiDrafts: FlashcardDraftDTO[]): DraftViewModel[] => {
    return apiDrafts.map((draft) => ({
      ...draft,
      status: "pending" as const,
      isSubmitting: false,
      wasEdited: false,
    }));
  }, []);

  /**
   * Update draft status
   */
  const setDraftStatus = useCallback((index: number, status: DraftViewModel["status"]) => {
    setState((prev) => ({
      ...prev,
      drafts: prev.drafts.map((draft, i) => (i === index ? { ...draft, status } : draft)),
    }));
  }, []);

  /**
   * Update draft submitting state
   */
  const setDraftSubmitting = useCallback((index: number, isSubmitting: boolean) => {
    setState((prev) => ({
      ...prev,
      drafts: prev.drafts.map((draft, i) => (i === index ? { ...draft, isSubmitting } : draft)),
    }));
  }, []);

  // ============================================================================
  // Computed Values
  // ============================================================================

  const unprocessedCount = useMemo(
    () => state.drafts.filter((d) => d.status === "pending" || d.status === "editing").length,
    [state.drafts]
  );

  const acceptedCount = useMemo(() => state.drafts.filter((d) => d.status === "accepted").length, [state.drafts]);

  const canGenerate = useMemo(
    () =>
      state.sourceText.trim().length > 0 &&
      state.sourceText.length <= 5000 &&
      state.selectedDeckId !== null &&
      state.remainingLimit > 0,
    [state.sourceText, state.selectedDeckId, state.remainingLimit]
  );

  // ============================================================================
  // API Calls - Profile
  // ============================================================================

  /**
   * Fetch user profile to get AI generation limits
   */
  const fetchProfile = useCallback(async (): Promise<void> => {
    setIsLoadingProfile(true);
    try {
      const response = await fetch("/api/profile");

      if (response.status === 401) {
        window.location.href = "/login?redirect=/dashboard";
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const profile: ProfileResponseDTO = await response.json();
      setState((prev) => ({
        ...prev,
        remainingLimit: profile.remaining_ai_limit,
        resetDate: profile.ai_limit_reset_date,
      }));
    } catch (error) {
      console.error("Error fetching profile:", error);
      setState((prev) => ({
        ...prev,
        error: { code: "NETWORK_ERROR", message: "Nie udało się pobrać danych profilu" },
      }));
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ============================================================================
  // API Calls - Generation
  // ============================================================================

  /**
   * Generate flashcard drafts from source text
   */
  const generate = useCallback(async (): Promise<void> => {
    if (!canGenerate) return;
    if (!state.selectedDeckId) return;

    setState((prev) => ({ ...prev, stage: "generating", error: null }));
    setIsGenerating(true);

    try {
      const requestBody: CreateGenerationRequestDTO = {
        source_text: state.sourceText,
        deck_id: state.selectedDeckId,
      };

      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401) {
        window.location.href = "/login?redirect=/dashboard";
        return;
      }

      if (response.status === 403) {
        const error = await response.json();
        setState((prev) => ({
          ...prev,
          stage: "error",
          error: {
            code: "AI_LIMIT_EXCEEDED",
            resetDate: error.error.details.reset_date,
            currentCount: error.error.details.current_count,
            limit: error.error.details.limit,
          },
        }));
        return;
      }

      if (response.status === 503) {
        setState((prev) => ({
          ...prev,
          stage: "error",
          error: { code: "AI_SERVICE_ERROR", message: "Usługa AI jest tymczasowo niedostępna" },
        }));
        return;
      }

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const data: GenerationResponseDTO = await response.json();
      const drafts = transformDrafts(data.drafts);

      setState((prev) => ({
        ...prev,
        stage: "reviewing",
        generationId: data.generation_id,
        drafts,
        remainingLimit: data.remaining_ai_limit,
      }));
    } catch (error) {
      console.error("Error generating flashcards:", error);
      setState((prev) => ({
        ...prev,
        stage: "error",
        error: { code: "UNKNOWN", message: "Wystąpił nieoczekiwany błąd" },
      }));
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, state.sourceText, state.selectedDeckId, state.remainingLimit, transformDrafts]);

  // ============================================================================
  // API Calls - Draft Actions
  // ============================================================================

  /**
   * Accept a draft and save it as a flashcard
   */
  const acceptDraft = useCallback(
    async (index: number): Promise<void> => {
      const draft = state.drafts[index];
      if (!draft || draft.status !== "pending") return;
      if (!state.selectedDeckId) return;

      setDraftSubmitting(index, true);

      try {
        const requestBody: CreateFlashcardRequestDTO = {
          deck_id: state.selectedDeckId,
          front: draft.front,
          back: draft.back,
          source: "ai",
          generation_id: state.generationId,
          was_edited: draft.wasEdited,
        };

        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
          window.location.href = "/login?redirect=/dashboard";
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to accept draft");
        }

        setDraftStatus(index, "accepted");
      } catch (error) {
        console.error("Error accepting draft:", error);
        // TODO: Show toast notification
      } finally {
        setDraftSubmitting(index, false);
      }
    },
    [state.drafts, state.selectedDeckId, state.generationId, setDraftSubmitting, setDraftStatus]
  );

  /**
   * Reject a draft
   */
  const rejectDraft = useCallback(
    async (index: number): Promise<void> => {
      const draft = state.drafts[index];
      if (!draft || draft.status !== "pending") return;

      setDraftSubmitting(index, true);

      try {
        const requestBody: RejectDraftRequestDTO = { draft_index: index };

        const response = await fetch(`/api/generations/${state.generationId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
          window.location.href = "/login?redirect=/dashboard";
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to reject draft");
        }

        setDraftStatus(index, "rejected");
      } catch (error) {
        console.error("Error rejecting draft:", error);
        // TODO: Show toast notification
      } finally {
        setDraftSubmitting(index, false);
      }
    },
    [state.drafts, state.generationId, setDraftSubmitting, setDraftStatus]
  );

  /**
   * Start editing a draft
   */
  const startEditDraft = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      drafts: prev.drafts.map((draft, i) =>
        i === index
          ? {
              ...draft,
              status: "editing" as const,
              editedFront: draft.front,
              editedBack: draft.back,
            }
          : draft
      ),
    }));
  }, []);

  /**
   * Save edited draft
   */
  const saveEditDraft = useCallback((index: number, front: string, back: string) => {
    setState((prev) => ({
      ...prev,
      drafts: prev.drafts.map((draft, i) =>
        i === index
          ? {
              ...draft,
              front,
              back,
              status: "pending" as const,
              wasEdited: true,
              editedFront: undefined,
              editedBack: undefined,
            }
          : draft
      ),
    }));
  }, []);

  /**
   * Cancel editing a draft
   */
  const cancelEditDraft = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      drafts: prev.drafts.map((draft, i) =>
        i === index
          ? {
              ...draft,
              status: "pending" as const,
              editedFront: undefined,
              editedBack: undefined,
            }
          : draft
      ),
    }));
  }, []);

  // ============================================================================
  // API Calls - Deck Creation
  // ============================================================================

  /**
   * Create a new deck
   */
  const createDeck = useCallback(async (name: string): Promise<DeckOption> => {
    setIsCreatingDeck(true);
    setCreateDeckError(null);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.status === 401) {
        window.location.href = "/login?redirect=/dashboard";
        throw new Error("Unauthorized");
      }

      if (response.status === 409) {
        setCreateDeckError("Talia o tej nazwie już istnieje");
        throw new Error("Duplicate deck name");
      }

      if (!response.ok) {
        throw new Error("Failed to create deck");
      }

      const deck: DeckDTO = await response.json();
      return { id: deck.id, name: deck.name };
    } catch (error) {
      console.error("Error creating deck:", error);
      throw error;
    } finally {
      setIsCreatingDeck(false);
    }
  }, []);

  // ============================================================================
  // Form Actions
  // ============================================================================

  const setSourceText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, sourceText: text }));
  }, []);

  const setSelectedDeckId = useCallback((deckId: string | null) => {
    setState((prev) => ({ ...prev, selectedDeckId: deckId }));
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    setState({
      stage: "input",
      sourceText: "",
      selectedDeckId: preselectedDeckId ?? null,
      isCreatingNewDeck: false,
      newDeckName: "",
      generationId: null,
      drafts: [],
      remainingLimit: state.remainingLimit,
      resetDate: state.resetDate,
      error: null,
    });
  }, [preselectedDeckId, state.remainingLimit, state.resetDate]);

  // ============================================================================
  // Return Hook API
  // ============================================================================

  return {
    // Stan
    state,

    // Limity
    remainingLimit: state.remainingLimit,
    resetDate: state.resetDate,
    isLoadingProfile,

    // Akcje formularza
    setSourceText,
    setSelectedDeckId,

    // Akcje generowania
    generate,
    isGenerating,

    // Akcje na draftach
    acceptDraft,
    rejectDraft,
    startEditDraft,
    saveEditDraft,
    cancelEditDraft,

    // Tworzenie talii
    createDeck,
    isCreatingDeck,
    createDeckError,

    // Pomocnicze
    unprocessedCount,
    acceptedCount,
    canGenerate,
    reset,
  };
}
