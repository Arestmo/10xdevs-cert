import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { RevealButtonProps } from "./types";

/**
 * RevealButton - Duży, prominentny przycisk "Pokaż odpowiedź"
 *
 * Zachęca użytkownika do odsłonięcia tyłu fiszki.
 * Automatycznie otrzymuje focus po wyrenderowaniu dla lepszego UX.
 */
export function RevealButton({ onReveal, autoFocus = true }: RevealButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className="mt-6 flex justify-center">
      <Button
        ref={buttonRef}
        variant="default"
        size="lg"
        onClick={onReveal}
        className="min-h-[44px] min-w-[200px]"
        aria-label="Pokaż odpowiedź. Naciśnij spację"
      >
        Pokaż odpowiedź
      </Button>
    </div>
  );
}
