/**
 * DeckHeader Component
 *
 * Header section with deck name (inline editable) and statistics.
 * Includes back button to navigate to dashboard.
 * Composes: BackButton, InlineEditField, DeckStats
 */

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEditField } from "./InlineEditField";
import { DeckStats } from "./DeckStats";
import type { DeckHeaderProps } from "./types";

export function DeckHeader({
  deck,
  isEditingName,
  editedName,
  onEditNameStart,
  onEditNameChange,
  onEditNameSave,
  onEditNameCancel,
  isUpdatingName,
  nameError,
}: DeckHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Back button */}
      <div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground gap-2">
          <a href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Powrót do dashboard
          </a>
        </Button>
      </div>

      {/* Deck name (editable) */}
      <div>
        <InlineEditField
          value={deck.name}
          isEditing={isEditingName}
          editedValue={editedName}
          onEditStart={onEditNameStart}
          onChange={onEditNameChange}
          onSave={onEditNameSave}
          onCancel={onEditNameCancel}
          isLoading={isUpdatingName}
          error={nameError}
          maxLength={100}
          placeholder="Nazwa talii"
          ariaLabel="nazwa talii"
        />
      </div>

      {/* Deck statistics */}
      <DeckStats totalFlashcards={deck.totalFlashcards} dueFlashcards={deck.dueFlashcards} />

      {/* Divider */}
      <div className="border-t" />
    </div>
  );
}
