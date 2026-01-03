/**
 * CloseConfirmDialog Component
 *
 * Warning dialog before closing the modal when unprocessed drafts exist.
 */

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
import type { CloseConfirmDialogProps } from "./types";

export function CloseConfirmDialog({ isOpen, unprocessedCount, onConfirm, onCancel }: CloseConfirmDialogProps) {
  const getFiszkaWord = (count: number): string => {
    if (count === 1) return "fiszkę";
    if (count >= 2 && count <= 4) return "fiszki";
    return "fiszek";
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Nieprzetworzne fiszki</AlertDialogTitle>
          <AlertDialogDescription>
            Masz {unprocessedCount} {getFiszkaWord(unprocessedCount)}, które nie zostały zaakceptowane ani odrzucone.
            Czy na pewno chcesz zamknąć? <span className="font-semibold">Nieprzetworzne drafty zostaną utracone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Wróć do draftów</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Zamknij mimo to
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
