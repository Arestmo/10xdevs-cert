/**
 * Transformation functions for Deck View
 *
 * Converts API DTOs (snake_case) to ViewModels (camelCase)
 * and adds computed fields for UI display.
 */

import type { DeckWithMetadataDTO, FlashcardDTO } from "@/types";
import type { DeckViewModel, FlashcardViewModel } from "./types";

/**
 * Transform DeckWithMetadataDTO to DeckViewModel
 * Converts snake_case to camelCase
 */
export const transformDeckDTO = (dto: DeckWithMetadataDTO): DeckViewModel => ({
  id: dto.id,
  name: dto.name,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
  totalFlashcards: dto.total_flashcards,
  dueFlashcards: dto.due_flashcards,
});

/**
 * Transform FlashcardDTO to FlashcardViewModel
 * Converts snake_case to camelCase and adds frontPreview
 */
export const transformFlashcardDTO = (dto: FlashcardDTO): FlashcardViewModel => ({
  id: dto.id,
  deckId: dto.deck_id,
  front: dto.front,
  back: dto.back,
  source: dto.source,
  frontPreview: dto.front.length > 50 ? dto.front.substring(0, 50) + "..." : dto.front,
  createdAt: dto.created_at,
  updatedAt: dto.updated_at,
});

/**
 * Transform array of FlashcardDTOs to FlashcardViewModels
 */
export const transformFlashcardDTOs = (dtos: FlashcardDTO[]): FlashcardViewModel[] => dtos.map(transformFlashcardDTO);
