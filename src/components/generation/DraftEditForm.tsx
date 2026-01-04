/**
 * DraftEditForm Component
 *
 * Inline form to edit a draft before acceptance.
 */

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { DraftEditFormProps } from "./types";

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

export function DraftEditForm({ initialFront, initialBack, onSave, onCancel, isSubmitting }: DraftEditFormProps) {
  const [front, setFront] = useState(initialFront);
  const [back, setBack] = useState(initialBack);

  const isFrontValid = front.trim().length > 0 && front.length <= MAX_FRONT_LENGTH;
  const isBackValid = back.trim().length > 0 && back.length <= MAX_BACK_LENGTH;
  const isSaveDisabled = !isFrontValid || !isBackValid || isSubmitting;

  const handleSave = () => {
    if (!isSaveDisabled) {
      onSave(front.trim(), back.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Front Field */}
      <div className="space-y-2">
        <Label htmlFor="edit-front">Przód fiszki</Label>
        <Textarea
          id="edit-front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          disabled={isSubmitting}
          maxLength={MAX_FRONT_LENGTH}
          placeholder="Pytanie lub termin..."
          className="min-h-[80px] resize-none"
          aria-invalid={!isFrontValid}
        />
        <div
          className={
            front.length > MAX_FRONT_LENGTH ? "text-destructive text-xs font-semibold" : "text-muted-foreground text-xs"
          }
        >
          {front.length} / {MAX_FRONT_LENGTH} znaków
        </div>
      </div>

      {/* Back Field */}
      <div className="space-y-2">
        <Label htmlFor="edit-back">Tył fiszki</Label>
        <Textarea
          id="edit-back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          disabled={isSubmitting}
          maxLength={MAX_BACK_LENGTH}
          placeholder="Odpowiedź lub definicja..."
          className="min-h-[120px] resize-none"
          aria-invalid={!isBackValid}
        />
        <div
          className={
            back.length > MAX_BACK_LENGTH ? "text-destructive text-xs font-semibold" : "text-muted-foreground text-xs"
          }
        >
          {back.length} / {MAX_BACK_LENGTH} znaków
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isSaveDisabled} className="flex-1" size="sm">
          <Save className="mr-1 h-4 w-4" />
          Zapisz
        </Button>
        <Button onClick={onCancel} disabled={isSubmitting} variant="outline" className="flex-1" size="sm">
          <X className="mr-1 h-4 w-4" />
          Anuluj
        </Button>
      </div>
    </div>
  );
}
