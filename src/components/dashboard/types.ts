/**
 * Type Definitions for Dashboard View
 *
 * Contains all ViewModel types and component Props specific to the dashboard.
 * These types transform backend DTOs (snake_case) into frontend-friendly models (camelCase).
 */

import type { DeckDTO } from "@/types";

/**
 * ViewModel for main dashboard view
 * Aggregates data from multiple API endpoints
 */
export interface DashboardViewModel {
  /** Total count of flashcards due for review across all decks */
  totalDue: number;
  /** Date of next scheduled review (null if no cards scheduled) */
  nextReviewDate: string | null;
  /** List of user's decks with metadata */
  decks: DeckTileData[];
  /** Whether user has any decks */
  hasDecks: boolean;
  /** Whether there are cards due for review */
  hasDueCards: boolean;
}

/**
 * Data for single deck tile
 * Transformed from DeckWithMetadataDTO (snake_case → camelCase)
 */
export interface DeckTileData {
  id: string;
  name: string;
  totalFlashcards: number;
  dueFlashcards: number;
}

/**
 * Form data for deck creation
 */
export interface CreateDeckFormData {
  name: string;
}

/**
 * State for useDashboard hook
 */
export interface UseDashboardState {
  data: DashboardViewModel | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Return type for useDashboard hook
 */
export interface UseDashboardReturn extends UseDashboardState {
  /** Function to refresh dashboard data */
  refetch: () => Promise<void>;
}

/**
 * Props for DueReviewTile component
 */
export interface DueReviewTileProps {
  dueCount: number;
}

/**
 * Props for CreateDeckTile component
 */
export interface CreateDeckTileProps {
  onClick: () => void;
}

/**
 * Props for DeckGrid component
 */
export interface DeckGridProps {
  decks: DeckTileData[];
}

/**
 * Props for DeckTile component
 */
export interface DeckTileProps {
  deck: DeckTileData;
}

/**
 * Props for EmptyState component
 */
export interface EmptyStateProps {
  onCreateDeck: () => void;
}

/**
 * Props for CreateDeckModal component
 */
export interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (deck: DeckDTO) => void;
}

/**
 * Props for DashboardContent component
 * Currently no props needed - component fetches data internally
 */
// Removed DashboardContentProps - not needed as component has no props
