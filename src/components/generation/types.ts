/**
 * Type definitions for AI Generation Modal components
 *
 * This file contains ViewModel types and Props interfaces for the AI flashcard
 * generation flow. These types extend the base DTOs from src/types.ts with
 * local UI state management.
 */

// ============================================================================
// ViewModel Types (local UI state)
// ============================================================================

/**
 * Status draftu w przepływie generowania
 */
export type DraftStatus = "pending" | "accepted" | "rejected" | "editing";

/**
 * ViewModel dla pojedynczego draftu
 * Rozszerza FlashcardDraftDTO o stan lokalny
 */
export interface DraftViewModel {
  index: number;
  front: string;
  back: string;
  status: DraftStatus;
  /** Edytowana treść przodu (gdy status === 'editing') */
  editedFront?: string;
  /** Edytowana treść tyłu (gdy status === 'editing') */
  editedBack?: string;
  /** Czy operacja na drafcie jest w toku */
  isSubmitting: boolean;
  /** Czy draft był edytowany przed akceptacją */
  wasEdited: boolean;
}

/**
 * Opcja talii w selektorze
 */
export interface DeckOption {
  id: string;
  name: string;
}

/**
 * Etapy przepływu generowania
 */
export type GenerationStage = "input" | "generating" | "reviewing" | "error";

/**
 * Stan modalu generowania
 */
export interface GenerationState {
  stage: GenerationStage;
  sourceText: string;
  selectedDeckId: string | null;
  isCreatingNewDeck: boolean;
  newDeckName: string;
  generationId: string | null;
  drafts: DraftViewModel[];
  remainingLimit: number;
  resetDate: string;
  error: GenerationErrorType | null;
}

/**
 * Typy błędów generowania
 */
export type GenerationErrorType =
  | { code: "AI_SERVICE_ERROR"; message: string }
  | { code: "AI_LIMIT_EXCEEDED"; resetDate: string; currentCount: number; limit: number }
  | { code: "DECK_NOT_FOUND"; message: string }
  | { code: "VALIDATION_ERROR"; message: string; details?: Record<string, string[]> }
  | { code: "NETWORK_ERROR"; message: string }
  | { code: "UNKNOWN"; message: string };

// ============================================================================
// Component Props Types
// ============================================================================

export interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (acceptedCount: number) => void;
  preselectedDeckId?: string;
  decks: DeckOption[];
}

export interface AILimitIndicatorProps {
  remainingLimit: number;
  resetDate: string;
  isLoading?: boolean;
}

export interface DeckSelectorProps {
  decks: DeckOption[];
  selectedDeckId: string | null;
  onSelect: (deckId: string) => void;
  onCreateDeck: (name: string) => Promise<DeckOption>;
  isCreatingDeck: boolean;
  createDeckError: string | null;
  disabled?: boolean;
}

export interface SourceTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | null;
}

export interface GenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading?: boolean;
}

export interface DraftsListProps {
  drafts: DraftViewModel[];
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
  onEdit: (index: number) => void;
  onSaveEdit: (index: number, front: string, back: string) => void;
  onCancelEdit: (index: number) => void;
  generationId: string;
}

export interface DraftItemProps {
  draft: DraftViewModel;
  index: number;
  total: number;
  onAccept: () => void;
  onReject: () => void;
  onEdit: () => void;
  onSaveEdit: (front: string, back: string) => void;
  onCancelEdit: () => void;
  isSubmitting: boolean;
}

export interface DraftEditFormProps {
  initialFront: string;
  initialBack: string;
  onSave: (front: string, back: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export interface GenerationErrorProps {
  error: GenerationErrorType;
  onRetry: () => void;
}

export interface CloseConfirmDialogProps {
  isOpen: boolean;
  unprocessedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseAIGenerationReturn {
  // Stan
  state: GenerationState;

  // Limity
  remainingLimit: number;
  resetDate: string;
  isLoadingProfile: boolean;

  // Akcje formularza
  setSourceText: (text: string) => void;
  setSelectedDeckId: (deckId: string | null) => void;

  // Akcje generowania
  generate: () => Promise<void>;
  isGenerating: boolean;

  // Akcje na draftach
  acceptDraft: (index: number) => Promise<void>;
  rejectDraft: (index: number) => Promise<void>;
  startEditDraft: (index: number) => void;
  saveEditDraft: (index: number, front: string, back: string) => void;
  cancelEditDraft: (index: number) => void;

  // Tworzenie talii
  createDeck: (name: string) => Promise<DeckOption>;
  isCreatingDeck: boolean;
  createDeckError: string | null;

  // Pomocnicze
  unprocessedCount: number;
  acceptedCount: number;
  canGenerate: boolean;
  reset: () => void;
}
