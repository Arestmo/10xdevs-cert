/**
 * Type definitions for Deck View components
 *
 * This file contains all ViewModels, Props interfaces, and utility types
 * used in the Deck View feature.
 */

import type { FlashcardDTO } from "@/types";

// ============================================================================
// ViewModels
// ============================================================================

/**
 * ViewModel for deck view
 * Transformation from DeckWithMetadataDTO (snake_case → camelCase)
 */
export interface DeckViewModel {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  totalFlashcards: number;
  dueFlashcards: number;
}

/**
 * ViewModel for individual flashcard
 * Transformation from FlashcardDTO (snake_case → camelCase)
 */
export interface FlashcardViewModel {
  id: string;
  deckId: string;
  front: string;
  back: string;
  source: "ai" | "manual";
  /** Preview of front (~50 characters) */
  frontPreview: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Flashcard form data
 */
export interface FlashcardFormData {
  front: string;
  back: string;
}

/**
 * Deck view state
 */
export interface DeckViewState {
  deck: DeckViewModel | null;
  flashcards: FlashcardViewModel[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    total: number;
    hasMore: boolean;
    offset: number;
  };
}

// ============================================================================
// Component Props
// ============================================================================

export interface DeckViewProps {
  deckId: string;
}

export interface DeckHeaderProps {
  deck: DeckViewModel;
  isEditingName: boolean;
  editedName: string;
  onEditNameStart: () => void;
  onEditNameChange: (name: string) => void;
  onEditNameSave: () => void;
  onEditNameCancel: () => void;
  isUpdatingName: boolean;
  nameError: string | null;
}

export interface InlineEditFieldProps {
  value: string;
  isEditing: boolean;
  editedValue: string;
  onEditStart: () => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
  maxLength: number;
  placeholder?: string;
  ariaLabel: string;
}

export interface DeckStatsProps {
  totalFlashcards: number;
  dueFlashcards: number;
}

export interface DeckActionsProps {
  deckId: string;
  dueCount: number;
  totalFlashcards: number;
  onAddFlashcard: () => void;
  onGenerateFlashcards: () => void;
  onDeleteDeck: () => void;
}

export interface FlashcardListProps {
  flashcards: FlashcardViewModel[];
  expandedId: string | null;
  onExpand: (id: string | null) => void;
  onEdit: (flashcard: FlashcardViewModel) => void;
  onDelete: (flashcard: FlashcardViewModel) => void;
}

export interface FlashcardAccordionItemProps {
  flashcard: FlashcardViewModel;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export interface FlashcardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingFlashcard?: FlashcardViewModel | null;
  onCreateFlashcard: (data: FlashcardFormData) => Promise<FlashcardDTO>;
  onUpdateFlashcard: (id: string, data: FlashcardFormData) => Promise<FlashcardDTO>;
  isSubmitting: boolean;
}

export interface DeleteDeckDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deckName: string;
  flashcardsCount: number;
  isDeleting: boolean;
}

export interface DeleteFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  flashcardPreview: string;
  isDeleting: boolean;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseDeckViewReturn {
  // Data
  deck: DeckViewModel | null;
  flashcards: FlashcardViewModel[];

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;

  // Errors
  error: string | null;

  // Pagination
  hasMore: boolean;

  // Actions
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;

  // Deck operations
  updateDeckName: (name: string) => Promise<void>;
  deleteDeck: () => Promise<boolean>;
  isUpdatingName: boolean;
  isDeletingDeck: boolean;
  nameUpdateError: string | null;

  // Flashcard operations
  createFlashcard: (data: FlashcardFormData) => Promise<FlashcardDTO>;
  updateFlashcard: (id: string, data: FlashcardFormData) => Promise<FlashcardDTO>;
  deleteFlashcard: (id: string) => Promise<boolean>;
  isCreatingFlashcard: boolean;
  isUpdatingFlashcard: boolean;
  isDeletingFlashcard: boolean;
}
