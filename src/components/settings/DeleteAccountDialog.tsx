/**
 * DeleteAccountDialog Component
 *
 * Two-step confirmation dialog for account deletion (GDPR compliance).
 * Step 1 (warning): Shows consequences and asks for confirmation to proceed
 * Step 2 (confirmation): Requires user to type "DELETE" to confirm
 *
 * Handles API call to DELETE /api/account and manages loading/error states.
 */

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { DeleteAccountDialogProps, DialogStep } from "./types";
import type { DeleteAccountRequestDTO } from "@/types";

/**
 * Required confirmation text (case-sensitive)
 */
const CONFIRMATION_TEXT = "DELETE";

export function DeleteAccountDialog({ isOpen, onOpenChange, onSuccess }: DeleteAccountDialogProps) {
  const [step, setStep] = useState<DialogStep>("warning");
  const [confirmationText, setConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Validation: text must be exactly "DELETE"
  const isConfirmationValid = confirmationText === CONFIRMATION_TEXT;

  /**
   * Resets all state when dialog is closed
   */
  const handleClose = () => {
    setStep("warning");
    setConfirmationText("");
    setIsDeleting(false);
    setDeleteError(null);
    onOpenChange(false);
  };

  /**
   * Moves from warning step to confirmation step
   */
  const handleContinue = () => {
    setStep("confirmation");
    setDeleteError(null);
  };

  /**
   * Handles account deletion
   * Calls DELETE /api/account and handles response/errors
   */
  const handleConfirmDelete = async () => {
    // Guard clause: validation must pass
    if (!isConfirmationValid) {
      setDeleteError("Wpisz dokładnie: DELETE");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const requestBody: DeleteAccountRequestDTO = {
        confirmation: confirmationText,
      };

      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle authentication error - redirect to login
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      // Handle validation error (400)
      if (response.status === 400) {
        setDeleteError("Nieprawidłowy tekst potwierdzenia");
        setIsDeleting(false);
        return;
      }

      // Handle server error (500)
      if (response.status === 500) {
        setDeleteError("Nie udało się usunąć konta. Spróbuj ponownie.");
        setIsDeleting(false);
        return;
      }

      // Success (200)
      if (response.status === 200) {
        // Call success callback (will redirect to login)
        onSuccess();
        handleClose();
        return;
      }

      // Unexpected status code
      setDeleteError("Wystąpił nieoczekiwany błąd");
      setIsDeleting(false);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error deleting account:", err);
      setDeleteError("Nie udało się połączyć z serwerem");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        {/* Step 1: Warning */}
        {step === "warning" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Czy na pewno chcesz usunąć konto?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-left">
                  <p>Ta operacja jest nieodwracalna. Zostaną trwale usunięte:</p>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>Wszystkie Twoje talie</li>
                    <li>Wszystkie fiszki</li>
                    <li>Historia nauki i logi powtórek</li>
                    <li>Parametry algorytmu FSRS</li>
                    <li>Konto użytkownika</li>
                  </ul>
                  <p className="pt-2 text-sm font-medium">Czy chcesz kontynuować?</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose}>Anuluj</AlertDialogCancel>
              <Button variant="destructive" onClick={handleContinue}>
                Kontynuuj
              </Button>
            </AlertDialogFooter>
          </>
        )}

        {/* Step 2: Confirmation */}
        {step === "confirmation" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Potwierdź usunięcie</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-left">
                  <p>
                    Aby potwierdzić usunięcie konta, wpisz dokładnie:{" "}
                    <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span>
                  </p>

                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Wpisz DELETE"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      disabled={isDeleting}
                      className="font-mono"
                      aria-label="Pole potwierdzenia usunięcia konta"
                      aria-invalid={confirmationText ? !isConfirmationValid : undefined}
                      aria-describedby={
                        confirmationText && !isConfirmationValid
                          ? "confirmation-error"
                          : deleteError
                            ? "delete-error"
                            : undefined
                      }
                    />

                    {/* Validation error */}
                    {confirmationText && !isConfirmationValid && (
                      <p id="confirmation-error" className="text-destructive text-sm" role="alert">
                        Tekst musi być dokładnie: {CONFIRMATION_TEXT}
                      </p>
                    )}
                  </div>

                  {/* API error */}
                  {deleteError && (
                    <Alert id="delete-error" variant="destructive" className="text-sm" role="alert">
                      {deleteError}
                    </Alert>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleClose} disabled={isDeleting}>
                Anuluj
              </AlertDialogCancel>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={!isConfirmationValid || isDeleting}>
                {isDeleting ? "Usuwanie..." : "Potwierdź usunięcie"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
