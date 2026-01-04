/**
 * InlineEditField Component
 *
 * Inline editable text field with view and edit modes.
 * Supports keyboard interactions (Enter to save, Escape to cancel).
 * Displays loading state and error messages.
 */

import { useCallback, useEffect, useRef } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InlineEditFieldProps } from "./types";

export function InlineEditField({
  value,
  isEditing,
  editedValue,
  onEditStart,
  onChange,
  onSave,
  onCancel,
  isLoading,
  error,
  maxLength,
  placeholder = "Wprowadź tekst",
  ariaLabel,
}: InlineEditFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [onSave, onCancel]
  );

  // Validate if save button should be disabled
  const isSaveDisabled =
    isLoading || editedValue.trim().length === 0 || editedValue.length > maxLength || editedValue === value;

  // View mode - display text with edit button
  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{value}</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEditStart}
          aria-label={`Edytuj ${ariaLabel}`}
          className="text-muted-foreground hover:text-foreground h-8 w-8"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Edit mode - display input with save/cancel buttons
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={editedValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={ariaLabel}
          className="max-w-md text-2xl font-bold"
          disabled={isLoading}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onSave}
          disabled={isSaveDisabled}
          aria-label="Zapisz zmiany"
          className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Anuluj edycję"
          className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Character counter */}
      <div className="flex items-center justify-between text-xs">
        <span className={editedValue.length > maxLength ? "text-destructive" : "text-muted-foreground"}>
          {editedValue.length} / {maxLength} znaków
        </span>
      </div>

      {/* Error message */}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
