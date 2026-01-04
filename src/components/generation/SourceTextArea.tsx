/**
 * SourceTextArea Component
 *
 * Text input field for source material with real-time character counter.
 * Supports paste from clipboard and validates maximum length.
 */

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { SourceTextAreaProps } from "./types";

const MAX_LENGTH = 5000;
const WARNING_THRESHOLD = 4500;

export function SourceTextArea({ value, onChange, disabled = false, error = null }: SourceTextAreaProps) {
  const currentLength = value.length;
  const isNearLimit = currentLength > WARNING_THRESHOLD;
  const isOverLimit = currentLength > MAX_LENGTH;

  return (
    <div className="space-y-2">
      <Label htmlFor="source-text">
        Materiał źródłowy
        <span className="text-muted-foreground ml-1 text-xs">(wklej tekst, z którego chcesz wygenerować fiszki)</span>
      </Label>

      <Textarea
        id="source-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={MAX_LENGTH}
        placeholder="Wklej tutaj tekst, z którego AI wygeneruje fiszki (np. notatki z wykładu, fragment podręcznika, artykuł)..."
        className="min-h-[200px] resize-none"
        aria-describedby="char-count"
        aria-invalid={!!error || isOverLimit}
      />

      <div className="flex items-center justify-between text-xs">
        <div
          id="char-count"
          className={
            isOverLimit
              ? "text-destructive font-semibold"
              : isNearLimit
                ? "text-warning font-medium"
                : "text-muted-foreground"
          }
        >
          {currentLength} / {MAX_LENGTH} znaków
        </div>

        {isNearLimit && !isOverLimit && <span className="text-warning">Zbliżasz się do limitu znaków</span>}

        {isOverLimit && <span className="text-destructive font-semibold">Przekroczono limit znaków!</span>}
      </div>

      {error && (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
