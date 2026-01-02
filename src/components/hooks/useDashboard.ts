/**
 * useDashboard Hook
 *
 * Custom hook for managing dashboard state and data fetching.
 * Fetches and aggregates data from multiple API endpoints:
 * - GET /api/decks - user's deck list with metadata
 * - GET /api/study/summary - study session summary
 *
 * Transforms backend DTOs (snake_case) to frontend ViewModels (camelCase).
 */

import { useState, useEffect, useCallback } from "react";
import type { DecksListResponseDTO, StudySummaryResponseDTO } from "@/types";
import type { DashboardViewModel, DeckTileData, UseDashboardReturn } from "@/components/dashboard/types";

/**
 * Hook for fetching and managing dashboard data
 *
 * @returns Dashboard state with data, loading, error states and refetch function
 *
 * @example
 * const { data, isLoading, error, refetch } = useDashboard();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Alert>{error}</Alert>;
 * if (!data) return null;
 *
 * return <DashboardView data={data} />;
 */
export function useDashboard(): UseDashboardReturn {
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches data from both API endpoints and aggregates into DashboardViewModel
   */
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch data from both endpoints in parallel
      const [decksResponse, summaryResponse] = await Promise.all([
        fetch("/api/decks?limit=100&sort=name&order=asc"),
        fetch("/api/study/summary"),
      ]);

      // Step 2: Handle authentication errors (401) - redirect to login
      if (decksResponse.status === 401 || summaryResponse.status === 401) {
        window.location.href = "/login?redirect=/dashboard";
        return;
      }

      // Step 3: Handle server errors (500)
      if (!decksResponse.ok || !summaryResponse.ok) {
        setError("Nie udało się załadować danych. Spróbuj ponownie później.");
        setIsLoading(false);
        return;
      }

      // Step 4: Parse JSON responses
      const decksData: DecksListResponseDTO = await decksResponse.json();
      const summaryData: StudySummaryResponseDTO = await summaryResponse.json();

      // Step 5: Transform DTOs to ViewModels (snake_case → camelCase)
      const decks: DeckTileData[] = decksData.data.map((deck) => ({
        id: deck.id,
        name: deck.name,
        totalFlashcards: deck.total_flashcards,
        dueFlashcards: deck.due_flashcards,
      }));

      // Step 6: Aggregate into DashboardViewModel
      const viewModel: DashboardViewModel = {
        totalDue: summaryData.total_due,
        nextReviewDate: summaryData.next_review_date,
        decks,
        hasDecks: decks.length > 0,
        hasDueCards: summaryData.total_due > 0,
      };

      setData(viewModel);
    } catch (err) {
      // Handle network errors or unexpected failures
      // eslint-disable-next-line no-console
      console.error("Error fetching dashboard data:", err);
      setError("Nie udało się załadować danych. Sprawdź połączenie i odśwież stronę.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboardData,
  };
}
