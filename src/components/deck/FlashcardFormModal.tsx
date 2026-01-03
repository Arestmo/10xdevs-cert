/**
 * FlashcardFormModal Component
 *
 * Modal with form for creating new or editing existing flashcard.
 * Features:
 * - Two textarea fields (front, back)
 * - Character counters
 * - Real-time validation
 * - Save and Cancel buttons
 * - Escape key to close
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FlashcardFormModalProps } from "./types";

const FRONT_MAX_LENGTH = 200;
const BACK_MAX_LENGTH = 500;

export function FlashcardFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingFlashcard,
  onCreateFlashcard,
  onUpdateFlashcard,
  isSubmitting,
}: FlashcardFormModalProps) {
  const isEditMode = !!editingFlashcard;

  // Form state
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Initialize form when modal opens or editing flashcard changes
  useEffect(() => {
    if (isOpen) {
      if (editingFlashcard) {
        setFront(editingFlashcard.front);
        setBack(editingFlashcard.back);
      } else {
        setFront("");
        setBack("");
      }
      setError(null);
    }
  }, [isOpen, editingFlashcard]);

  // Validation
  const isFrontValid = front.trim().length > 0 && front.length <= FRONT_MAX_LENGTH;
  const isBackValid = back.trim().length > 0 && back.length <= BACK_MAX_LENGTH;
  const isFormValid = isFrontValid && isBackValid;

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid || isSubmitting) {
      return;
    }

    setError(null);

    try {
      const formData = { front: front.trim(), back: back.trim() };

      if (isEditMode) {
        await onUpdateFlashcard(editingFlashcard.id, formData);
      } else {
        await onCreateFlashcard(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error saving flashcard:", err);
      setError("Nie udało się zapisać fiszki. Spróbuj ponownie.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edytuj fiszkę" : "Dodaj nową fiszkę"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Front field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="front">Przód fiszki *</Label>
              <span
                className={`text-xs ${front.length > FRONT_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
              >
                {front.length} / {FRONT_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Pytanie lub pojęcie do zapamiętania"
              maxLength={FRONT_MAX_LENGTH}
              rows={3}
              className={front.length > FRONT_MAX_LENGTH ? "border-destructive" : ""}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Back field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="back">Tył fiszki *</Label>
              <span
                className={`text-xs ${back.length > BACK_MAX_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
              >
                {back.length} / {BACK_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Odpowiedź lub wyjaśnienie"
              maxLength={BACK_MAX_LENGTH}
              rows={5}
              className={back.length > BACK_MAX_LENGTH ? "border-destructive" : ""}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Error message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : isEditMode ? (
                "Zapisz zmiany"
              ) : (
                "Dodaj fiszkę"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
