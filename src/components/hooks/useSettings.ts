/**
 * useSettings Hook
 *
 * Custom hook for managing settings view state and operations.
 * Fetches user profile data and handles account deletion.
 *
 * Responsibilities:
 * - Fetch profile data from GET /api/profile
 * - Fetch user email from Supabase auth session
 * - Transform ProfileResponseDTO to SettingsViewModel
 * - Handle account deletion via DELETE /api/account
 * - Manage loading, error, and success states
 */

import { useState, useEffect, useCallback } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { ProfileResponseDTO, DeleteAccountRequestDTO } from "@/types";
import type { SettingsViewModel, UseSettingsReturn, DeleteAccountResult } from "@/components/settings/types";

/**
 * Total monthly AI flashcards limit
 */
const TOTAL_AI_LIMIT = 200;

/**
 * Hook for fetching and managing settings data
 *
 * @returns Settings state with data, loading, error states and operations
 *
 * @example
 * const { data, isLoading, error, refetch, deleteAccount } = useSettings();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Alert>{error}</Alert>;
 * if (!data) return null;
 *
 * return <SettingsView data={data} onDelete={deleteAccount} />;
 */
export function useSettings(): UseSettingsReturn {
  const [data, setData] = useState<SettingsViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches profile data and user email, transforms to ViewModel
   */
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Fetch profile and auth user in parallel
      const [profileResponse, authResult] = await Promise.all([fetch("/api/profile"), supabaseClient.auth.getUser()]);

      // Step 2: Handle authentication errors (401) - redirect to login
      if (profileResponse.status === 401 || authResult.error || !authResult.data.user) {
        window.location.href = "/login?redirect=/settings";
        return;
      }

      // Step 3: Handle profile not found (404)
      if (profileResponse.status === 404) {
        setError("Nie znaleziono profilu użytkownika");
        setIsLoading(false);
        return;
      }

      // Step 4: Handle server errors (500)
      if (!profileResponse.ok) {
        setError("Nie udało się załadować danych. Sprawdź połączenie i spróbuj ponownie.");
        setIsLoading(false);
        return;
      }

      // Step 5: Parse JSON response
      const profileData: ProfileResponseDTO = await profileResponse.json();

      // Step 6: Extract user email
      const userEmail = authResult.data.user.email;

      // Guard clause: email must exist
      if (!userEmail) {
        setError("Nie udało się pobrać adresu email");
        setIsLoading(false);
        return;
      }

      // Step 7: Transform DTO to ViewModel (snake_case → camelCase)
      const viewModel: SettingsViewModel = {
        email: userEmail,
        usedAIFlashcards: profileData.monthly_ai_flashcards_count,
        remainingAILimit: profileData.remaining_ai_limit,
        totalAILimit: TOTAL_AI_LIMIT,
        aiLimitResetDate: profileData.ai_limit_reset_date,
      };

      setData(viewModel);
    } catch (err) {
      // Handle network errors or unexpected failures
      // eslint-disable-next-line no-console
      console.error("Error fetching settings data:", err);
      setError("Nie udało się załadować danych. Sprawdź połączenie i odśwież stronę.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Deletes user account with confirmation
   *
   * @param confirmation - Must be exactly "DELETE" to proceed
   * @returns Result object with success flag and optional error message
   */
  const deleteAccount = useCallback(async (confirmation: string): Promise<DeleteAccountResult> => {
    try {
      const requestBody: DeleteAccountRequestDTO = {
        confirmation,
      };

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle authentication errors (401) - redirect to login
      if (response.status === 401) {
        window.location.href = "/login";
        return { success: false, error: "Sesja wygasła" };
      }

      // Handle validation errors (400)
      if (response.status === 400) {
        return {
          success: false,
          error: "Nieprawidłowe potwierdzenie. Wpisz dokładnie: DELETE",
        };
      }

      // Handle server errors (500)
      if (response.status === 500) {
        return {
          success: false,
          error: "Nie udało się usunąć konta. Spróbuj ponownie.",
        };
      }

      // Success (200)
      if (response.status === 200) {
        return { success: true };
      }

      // Unexpected status code
      return {
        success: false,
        error: "Wystąpił nieoczekiwany błąd",
      };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error deleting account:", err);
      return {
        success: false,
        error: "Nie udało się połączyć z serwerem",
      };
    }
  }, []);

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchProfile,
    deleteAccount,
  };
}
