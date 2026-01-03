/**
 * GenerateButton Component
 *
 * Button to trigger flashcard generation. Active only when validation conditions are met.
 */

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GenerateButtonProps } from "./types";

export function GenerateButton({ onClick, disabled, isLoading = false }: GenerateButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled || isLoading} className="w-full" size="lg">
      <Sparkles className="mr-2 h-5 w-5" />
      {isLoading ? "Generowanie..." : "Generuj fiszki"}
    </Button>
  );
}
