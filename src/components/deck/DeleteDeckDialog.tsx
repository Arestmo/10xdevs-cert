/**
 * DeleteDeckDialog Component
 *
 * Confirmation dialog for deck deletion.
 * Shows deck name and flashcard count as warning.
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
import type { DeleteDeckDialogProps } from "./types";

export function DeleteDeckDialog({
  isOpen,
  onClose,
  onConfirm,
  deckName,
  flashcardsCount,
  isDeleting,
}: DeleteDeckDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Czy na pewno chcesz usunąć tę talię?</AlertDialogTitle>
          <AlertDialogDescription>
            Talia <span className="font-semibold">&quot;{deckName}&quot;</span> zawiera{" "}
            <span className="font-semibold">{flashcardsCount}</span> {flashcardsCount === 1 ? "fiszkę" : "fiszek"}.
            <br />
            <br />
            Ta akcja jest nieodwracalna. Wszystkie fiszki w tej talii zostaną trwale usunięte.
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
              "Usuń talię"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
