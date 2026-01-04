/**
 * useDeckView Hook
 *
 * Custom hook for managing deck view state and API operations.
 * Handles:
 * - Fetching deck metadata and flashcards
 * - Pagination for flashcard list
 * - CRUD operations for deck (update name, delete)
 * - CRUD operations for flashcards (create, update, delete)
 * - Error handling and loading states
 *
 * @param deckId - UUID of the deck to manage
 */

import { useState, useEffect, useCallback } from "react";
import type {
  DeckWithMetadataDTO,
  FlashcardsListResponseDTO,
  FlashcardDTO,
  UpdateDeckRequestDTO,
  CreateFlashcardRequestDTO,
  UpdateFlashcardRequestDTO,
} from "@/types";
import type { DeckViewModel, FlashcardViewModel, FlashcardFormData, UseDeckViewReturn } from "@/components/deck/types";
import { transformDeckDTO, transformFlashcardDTOs, transformFlashcardDTO } from "@/components/deck/transformers";

const FLASHCARDS_LIMIT = 50;

/**
 * Hook for managing deck view state and operations
 */
export function useDeckView(deckId: string): UseDeckViewReturn {
  // Data state
  const [deck, setDeck] = useState<DeckViewModel | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardViewModel[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    hasMore: false,
  });

  // Operation states
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [isCreatingFlashcard, setIsCreatingFlashcard] = useState(false);
  const [isUpdatingFlashcard, setIsUpdatingFlashcard] = useState(false);
  const [isDeletingFlashcard, setIsDeletingFlashcard] = useState(false);
  const [nameUpdateError, setNameUpdateError] = useState<string | null>(null);

  /**
   * Fetch deck metadata and flashcards
   */
  const fetchDeckData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch deck metadata and flashcards in parallel
      const [deckResponse, flashcardsResponse] = await Promise.all([
        fetch(`/api/decks/${deckId}`),
        fetch(`/api/flashcards?deck_id=${deckId}&limit=${FLASHCARDS_LIMIT}&offset=0&sort=created_at&order=desc`),
      ]);

      // Step 2: Handle authentication errors (401)
      if (deckResponse.status === 401 || flashcardsResponse.status === 401) {
        window.location.href = `/login?redirect=/decks/${deckId}`;
        return;
      }

      // Step 3: Handle deck not found (404)
      if (deckResponse.status === 404) {
        setError("Talia nie została znaleziona");
        setIsLoading(false);
        return;
      }

      // Step 4: Handle server errors (500)
      if (!deckResponse.ok || !flashcardsResponse.ok) {
        setError("Nie udało się załadować danych. Spróbuj ponownie później.");
        setIsLoading(false);
        return;
      }

      // Step 5: Parse JSON responses
      const deckData: DeckWithMetadataDTO = await deckResponse.json();
      const flashcardsData: FlashcardsListResponseDTO = await flashcardsResponse.json();

      // Step 6: Transform DTOs to ViewModels
      const deckViewModel = transformDeckDTO(deckData);
      const flashcardViewModels = transformFlashcardDTOs(flashcardsData.data);

      // Step 7: Update state
      setDeck(deckViewModel);
      setFlashcards(flashcardViewModels);
      setPagination({
        total: flashcardsData.pagination.total,
        offset: flashcardsData.pagination.limit,
        hasMore: flashcardsData.pagination.has_more,
      });
    } catch (err) {
      // Handle network errors or unexpected failures
      // eslint-disable-next-line no-console
      console.error("Error fetching deck data:", err);
      setError("Nie udało się załadować danych. Sprawdź połączenie i odśwież stronę.");
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  /**
   * Load more flashcards (pagination)
   */
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      const response = await fetch(
        `/api/flashcards?deck_id=${deckId}&limit=${FLASHCARDS_LIMIT}&offset=${pagination.offset}&sort=created_at&order=desc`
      );

      if (!response.ok) {
        return;
      }

      const data: FlashcardsListResponseDTO = await response.json();
      const newFlashcards = transformFlashcardDTOs(data.data);

      setFlashcards((prev) => [...prev, ...newFlashcards]);
      setPagination({
        total: data.pagination.total,
        offset: pagination.offset + data.pagination.limit,
        hasMore: data.pagination.has_more,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error loading more flashcards:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [deckId, pagination.hasMore, pagination.offset, isLoadingMore]);

  /**
   * Update deck name
   */
  const updateDeckName = useCallback(
    async (name: string) => {
      setIsUpdatingName(true);
      setNameUpdateError(null);

      try {
        const requestBody: UpdateDeckRequestDTO = { name };

        const response = await fetch(`/api/decks/${deckId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
          window.location.href = `/login?redirect=/decks/${deckId}`;
          return;
        }

        if (response.status === 409) {
          setNameUpdateError("Talia o tej nazwie już istnieje");
          return;
        }

        if (!response.ok) {
          setNameUpdateError("Nie udało się zaktualizować nazwy talii");
          return;
        }

        // Update deck in state
        setDeck((prev) => (prev ? { ...prev, name } : null));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error updating deck name:", err);
        setNameUpdateError("Wystąpił błąd podczas aktualizacji nazwy");
      } finally {
        setIsUpdatingName(false);
      }
    },
    [deckId]
  );

  /**
   * Delete deck
   */
  const deleteDeck = useCallback(async (): Promise<boolean> => {
    setIsDeletingDeck(true);

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        window.location.href = `/login?redirect=/dashboard`;
        return false;
      }

      if (!response.ok) {
        return false;
      }

      // Redirect to dashboard after successful deletion
      window.location.href = "/dashboard";
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error deleting deck:", err);
      return false;
    } finally {
      setIsDeletingDeck(false);
    }
  }, [deckId]);

  /**
   * Create flashcard
   */
  const createFlashcard = useCallback(
    async (data: FlashcardFormData): Promise<FlashcardDTO> => {
      setIsCreatingFlashcard(true);

      try {
        const requestBody: CreateFlashcardRequestDTO = {
          deck_id: deckId,
          front: data.front,
          back: data.back,
          source: "manual",
        };

        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
          window.location.href = `/login?redirect=/decks/${deckId}`;
          throw new Error("Unauthorized");
        }

        if (!response.ok) {
          throw new Error("Failed to create flashcard");
        }

        const flashcard: FlashcardDTO = await response.json();

        // Add to flashcards list at the beginning (newest first)
        const flashcardViewModel = transformFlashcardDTO(flashcard);
        setFlashcards((prev) => [flashcardViewModel, ...prev]);

        // Update deck metadata
        setDeck((prev) =>
          prev
            ? {
                ...prev,
                totalFlashcards: prev.totalFlashcards + 1,
              }
            : null
        );

        return flashcard;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error creating flashcard:", err);
        throw err;
      } finally {
        setIsCreatingFlashcard(false);
      }
    },
    [deckId]
  );

  /**
   * Update flashcard
   */
  const updateFlashcard = useCallback(
    async (id: string, data: FlashcardFormData): Promise<FlashcardDTO> => {
      setIsUpdatingFlashcard(true);

      try {
        const requestBody: UpdateFlashcardRequestDTO = {
          front: data.front,
          back: data.back,
        };

        const response = await fetch(`/api/flashcards/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 401) {
          window.location.href = `/login?redirect=/decks/${deckId}`;
          throw new Error("Unauthorized");
        }

        if (!response.ok) {
          throw new Error("Failed to update flashcard");
        }

        const flashcard: FlashcardDTO = await response.json();

        // Update in flashcards list
        const flashcardViewModel = transformFlashcardDTO(flashcard);
        setFlashcards((prev) => prev.map((f) => (f.id === id ? flashcardViewModel : f)));

        return flashcard;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error updating flashcard:", err);
        throw err;
      } finally {
        setIsUpdatingFlashcard(false);
      }
    },
    [deckId]
  );

  /**
   * Delete flashcard
   */
  const deleteFlashcard = useCallback(
    async (id: string): Promise<boolean> => {
      setIsDeletingFlashcard(true);

      try {
        const response = await fetch(`/api/flashcards/${id}`, {
          method: "DELETE",
        });

        if (response.status === 401) {
          window.location.href = `/login?redirect=/decks/${deckId}`;
          return false;
        }

        if (!response.ok) {
          return false;
        }

        // Remove from flashcards list
        setFlashcards((prev) => prev.filter((f) => f.id !== id));

        // Update deck metadata
        setDeck((prev) =>
          prev
            ? {
                ...prev,
                totalFlashcards: prev.totalFlashcards - 1,
              }
            : null
        );

        return true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error deleting flashcard:", err);
        return false;
      } finally {
        setIsDeletingFlashcard(false);
      }
    },
    [deckId]
  );

  // Fetch data on mount
  useEffect(() => {
    fetchDeckData();
  }, [fetchDeckData]);

  return {
    // Data
    deck,
    flashcards,

    // Loading states
    isLoading,
    isLoadingMore,

    // Errors
    error,

    // Pagination
    hasMore: pagination.hasMore,

    // Actions
    refetch: fetchDeckData,
    loadMore,

    // Deck operations
    updateDeckName,
    deleteDeck,
    isUpdatingName,
    isDeletingDeck,
    nameUpdateError,

    // Flashcard operations
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    isCreatingFlashcard,
    isUpdatingFlashcard,
    isDeletingFlashcard,
  };
}
