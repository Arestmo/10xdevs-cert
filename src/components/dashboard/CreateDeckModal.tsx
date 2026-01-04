/**
 * CreateDeckModal Component
 *
 * Modal dialog with form for creating a new deck.
 * Handles validation, API calls, and error states.
 * Validates deck name (1-100 characters) and handles duplicate names.
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { CreateDeckModalProps } from "./types";
import type { DeckDTO, ErrorResponseDTO, CreateDeckRequestDTO } from "@/types";

const MAX_NAME_LENGTH = 100;

export function CreateDeckModal({ isOpen, onClose, onSuccess }: CreateDeckModalProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characterCount = name.length;
  const isValid = characterCount > 0 && characterCount <= MAX_NAME_LENGTH;

  /**
   * Resets form state when modal is closed
   */
  const handleClose = () => {
    setName("");
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  /**
   * Handles form submission
   * Calls POST /api/decks and handles response/errors
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate before submit
    if (!isValid) {
      setError("Nazwa talii musi mieć od 1 do 100 znaków");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const requestBody: CreateDeckRequestDTO = { name: name.trim() };

      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle authentication error - redirect to login
      if (response.status === 401) {
        window.location.href = "/login?redirect=/dashboard";
        return;
      }

      // Handle validation errors (400)
      if (response.status === 400) {
        const errorData: ErrorResponseDTO = await response.json();
        setError(errorData.error.message || "Nieprawidłowe dane formularza");
        setIsSubmitting(false);
        return;
      }

      // Handle duplicate deck name (409)
      if (response.status === 409) {
        setError("Talia o tej nazwie już istnieje. Wybierz inną nazwę.");
        setIsSubmitting(false);
        return;
      }

      // Handle server errors (500)
      if (response.status === 500) {
        setError("Wystąpił błąd serwera. Spróbuj ponownie później.");
        setIsSubmitting(false);
        return;
      }

      // Handle success (201)
      if (response.status === 201) {
        const deck: DeckDTO = await response.json();
        onSuccess(deck);
        handleClose();
        return;
      }

      // Handle unexpected status codes
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      setIsSubmitting(false);
    } catch (err) {
      // Handle network errors
      // eslint-disable-next-line no-console
      console.error("Error creating deck:", err);
      setError("Nie udało się utworzyć talii. Sprawdź połączenie i spróbuj ponownie.");
      setIsSubmitting(false);
    }
  };

  /**
   * Handles Enter key press in input field
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isValid && !isSubmitting) {
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowa talia</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="text-sm">
              {error}
            </Alert>
          )}

          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="deck-name" className="text-sm font-medium">
              Nazwa talii
            </label>
            <Input
              id="deck-name"
              type="text"
              placeholder="np. Angielski - słówka podstawowe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_NAME_LENGTH}
              disabled={isSubmitting}
              aria-describedby="character-count"
              aria-invalid={!isValid && characterCount > 0}
            />

            {/* Character Counter */}
            <div
              id="character-count"
              className={`text-xs ${characterCount > MAX_NAME_LENGTH ? "text-destructive" : "text-muted-foreground"}`}
            >
              {characterCount} / {MAX_NAME_LENGTH} znaków
            </div>
          </div>

          {/* Footer Buttons */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Tworzenie..." : "Utwórz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
