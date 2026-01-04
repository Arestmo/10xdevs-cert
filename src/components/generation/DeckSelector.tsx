/**
 * DeckSelector Component
 *
 * Dropdown to select target deck with option to create a new deck.
 * Uses Select component from shadcn/ui.
 */

import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DeckSelectorProps } from "./types";

const CREATE_NEW_DECK_VALUE = "__create_new__";
const MAX_DECK_NAME_LENGTH = 100;

export function DeckSelector({
  decks,
  selectedDeckId,
  onSelect,
  onCreateDeck,
  isCreatingDeck,
  createDeckError,
  disabled = false,
}: DeckSelectorProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");

  const handleSelectChange = (value: string) => {
    if (value === CREATE_NEW_DECK_VALUE) {
      setIsCreatingNew(true);
    } else {
      onSelect(value);
    }
  };

  const handleCreateDeck = async () => {
    if (newDeckName.trim().length === 0 || newDeckName.length > MAX_DECK_NAME_LENGTH) {
      return;
    }

    try {
      const newDeck = await onCreateDeck(newDeckName.trim());
      // Success - select the new deck and exit creation mode
      onSelect(newDeck.id);
      setIsCreatingNew(false);
      setNewDeckName("");
    } catch (error) {
      // Error is handled by parent (createDeckError prop)
      console.error("Failed to create deck:", error);
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingNew(false);
    setNewDeckName("");
  };

  const isCreateButtonDisabled =
    newDeckName.trim().length === 0 || newDeckName.length > MAX_DECK_NAME_LENGTH || isCreatingDeck;

  // Find selected deck name for display
  const selectedDeck = decks.find((d) => d.id === selectedDeckId);

  return (
    <div className="space-y-2">
      <Label htmlFor="deck-selector">
        Talia docelowa
        <span className="text-muted-foreground ml-1 text-xs">(wybierz, gdzie zapisać wygenerowane fiszki)</span>
      </Label>

      {isCreatingNew ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Input
              id="new-deck-name"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Nazwa nowej talii"
              maxLength={MAX_DECK_NAME_LENGTH}
              disabled={isCreatingDeck}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreateButtonDisabled) {
                  handleCreateDeck();
                } else if (e.key === "Escape") {
                  handleCancelCreate();
                }
              }}
              aria-invalid={!!createDeckError}
              aria-describedby={createDeckError ? "deck-error" : undefined}
            />

            <div className="text-muted-foreground text-xs">
              {newDeckName.length} / {MAX_DECK_NAME_LENGTH} znaków
            </div>

            {createDeckError && (
              <p id="deck-error" className="text-destructive text-xs" role="alert">
                {createDeckError}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateDeck} disabled={isCreateButtonDisabled} className="flex-1">
              <Check className="mr-1 h-4 w-4" />
              Utwórz
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelCreate}
              disabled={isCreatingDeck}
              className="flex-1"
            >
              <X className="mr-1 h-4 w-4" />
              Anuluj
            </Button>
          </div>
        </div>
      ) : (
        <Select value={selectedDeckId ?? undefined} onValueChange={handleSelectChange} disabled={disabled}>
          <SelectTrigger id="deck-selector" className="w-full">
            <SelectValue placeholder="Wybierz talię..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CREATE_NEW_DECK_VALUE}>
              <div className="flex items-center gap-2 font-medium">
                <Plus className="h-4 w-4" />
                Utwórz nową talię
              </div>
            </SelectItem>

            {decks.length > 0 && (
              <>
                <div className="bg-border my-1 h-px" />
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={deck.id}>
                    {deck.name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
