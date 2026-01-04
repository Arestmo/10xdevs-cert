/**
 * Type Definitions for Settings View
 *
 * This file contains all ViewModels and Props types for the Settings view.
 * Transformations from DTOs (snake_case) to ViewModels (camelCase) happen in useSettings hook.
 *
 * @module settings/types
 */

/**
 * ViewModel for settings view
 * Transformation from ProfileResponseDTO (snake_case → camelCase)
 */
export interface SettingsViewModel {
  /** Email użytkownika (z sesji auth) */
  email: string;
  /** Liczba wygenerowanych fiszek AI w tym miesiącu */
  usedAIFlashcards: number;
  /** Pozostały limit fiszek AI */
  remainingAILimit: number;
  /** Całkowity miesięczny limit (200) */
  totalAILimit: number;
  /** Data resetu limitu (format YYYY-MM-DD) */
  aiLimitResetDate: string;
}

/**
 * Stan hooka useSettings
 */
export interface UseSettingsState {
  data: SettingsViewModel | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Return type hooka useSettings
 */
export interface UseSettingsReturn extends UseSettingsState {
  /** Funkcja do ponownego pobrania danych */
  refetch: () => Promise<void>;
  /** Funkcja do usunięcia konta */
  deleteAccount: (confirmation: string) => Promise<DeleteAccountResult>;
}

/**
 * Wynik operacji usunięcia konta
 */
export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

/**
 * Krok w dialogu usuwania konta
 */
export type DialogStep = "warning" | "confirmation";

/**
 * Props dla AccountInfo
 */
export interface AccountInfoProps {
  email: string;
}

/**
 * Props dla AILimitStatus
 */
export interface AILimitStatusProps {
  usedCount: number;
  totalLimit: number;
  resetDate: string;
}

/**
 * Props dla DeleteAccountSection
 */
export interface DeleteAccountSectionProps {
  onDeleteSuccess: () => void;
}

/**
 * Props dla DeleteAccountDialog
 */
export interface DeleteAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}
