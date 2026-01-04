/**
 * DraftsList Component
 *
 * Scrollable list of generated drafts with numbering and action buttons.
 */

import { DraftItem } from "./DraftItem";
import type { DraftsListProps } from "./types";

export function DraftsList({
  drafts,
  onAccept,
  onReject,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  generationId,
}: DraftsListProps) {
  const totalDrafts = drafts.length;
  const acceptedCount = drafts.filter((d) => d.status === "accepted").length;
  const rejectedCount = drafts.filter((d) => d.status === "rejected").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Wygenerowano {totalDrafts} {totalDrafts === 1 ? "fiszkę" : "fiszek"}
        </h3>
        <div className="text-muted-foreground text-sm">
          Zaakceptowano: {acceptedCount} | Odrzucono: {rejectedCount}
        </div>
      </div>

      {/* Scrollable List */}
      <div
        className="max-h-[400px] space-y-3 overflow-y-auto pr-2"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {drafts.map((draft, index) => (
          <DraftItem
            key={`${generationId}-${index}`}
            draft={draft}
            index={index}
            total={totalDrafts}
            onAccept={() => onAccept(index)}
            onReject={() => onReject(index)}
            onEdit={() => onEdit(index)}
            onSaveEdit={(front, back) => onSaveEdit(index, front, back)}
            onCancelEdit={() => onCancelEdit(index)}
            isSubmitting={draft.isSubmitting}
          />
        ))}
      </div>

      {/* Help Text */}
      <p className="text-muted-foreground text-center text-xs">
        Możesz edytować fiszki przed zaakceptowaniem. Odrzucone fiszki nie zostaną zapisane.
      </p>
    </div>
  );
}
