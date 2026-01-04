/**
 * DraftItem Component
 *
 * Single flashcard draft with front/back display and action buttons.
 */

import { Check, Pencil, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DraftEditForm } from "./DraftEditForm";
import type { DraftItemProps } from "./types";

export function DraftItem({
  draft,
  index,
  total,
  onAccept,
  onReject,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  isSubmitting,
}: DraftItemProps) {
  const isEditing = draft.status === "editing";
  const isAccepted = draft.status === "accepted";
  const isRejected = draft.status === "rejected";
  const isPending = draft.status === "pending";

  return (
    <Card className={isAccepted ? "border-green-500 bg-green-50 dark:bg-green-950/20" : isRejected ? "opacity-50" : ""}>
      <CardContent className="pt-6">
        {/* Header with number and status */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-muted-foreground text-sm font-medium">
            Fiszka {index + 1}/{total}
          </div>
          {isAccepted && (
            <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Zaakceptowano</span>
            </div>
          )}
          {isRejected && (
            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <X className="h-4 w-4" />
              <span className="font-medium">Odrzucono</span>
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <DraftEditForm
            initialFront={draft.editedFront ?? draft.front}
            initialBack={draft.editedBack ?? draft.back}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="space-y-4">
            {/* Front */}
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Przód</div>
              <div className="text-sm">{draft.front}</div>
            </div>

            {/* Back */}
            <div className="space-y-1">
              <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Tył</div>
              <div className="text-sm">{draft.back}</div>
            </div>

            {/* Action Buttons */}
            {isPending && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={onAccept}
                  disabled={isSubmitting}
                  variant="default"
                  size="sm"
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  <Check className="mr-1 h-4 w-4" />
                  Akceptuj
                </Button>
                <Button onClick={onEdit} disabled={isSubmitting} variant="outline" size="sm" className="flex-1">
                  <Pencil className="mr-1 h-4 w-4" />
                  Edytuj
                </Button>
                <Button onClick={onReject} disabled={isSubmitting} variant="destructive" size="sm" className="flex-1">
                  <X className="mr-1 h-4 w-4" />
                  Odrzuć
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
