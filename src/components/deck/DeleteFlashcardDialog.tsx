/**
 * DeleteFlashcardDialog Component
 *
 * Confirmation dialog for flashcard deletion.
 * Shows flashcard preview as warning.
 * Provides "Cancel" and "Delete" actions.
 */

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DeleteFlashcardDialogProps } from "./types";

export function DeleteFlashcardDialog({
  isOpen,
  onClose,
  onConfirm,
  flashcardPreview,
  isDeleting,
}: DeleteFlashcardDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę fiszkę?</AlertDialogTitle>
          <AlertDialogDescription>
            Fiszka: <span className="font-semibold">&quot;{flashcardPreview}&quot;</span>
            <br />
            <br />
            Ta akcja jest nieodwracalna. Historia nauki tej fiszki zostanie trwale utracona.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Usuwanie...
              </>
            ) : (
              "Usuń fiszkę"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
