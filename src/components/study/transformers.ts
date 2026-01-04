import type { StudyCardDTO } from "@/types";
import type { StudyCardViewModel } from "./types";

/**
 * Tworzy podgląd tekstu (pierwsze ~50 znaków)
 */
function createPreview(text: string, maxLength = 50): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Transformuje StudyCardDTO na StudyCardViewModel
 */
export function transformStudyCardDTO(dto: StudyCardDTO): StudyCardViewModel {
  return {
    id: dto.id,
    deckId: dto.deck_id,
    deckName: dto.deck_name,
    front: dto.front,
    back: dto.back,
    frontPreview: createPreview(dto.front),
  };
}

/**
 * Transformuje tablicę StudyCardDTO na tablicę StudyCardViewModel
 */
export function transformStudyCardDTOs(dtos: StudyCardDTO[]): StudyCardViewModel[] {
  return dtos.map(transformStudyCardDTO);
}
