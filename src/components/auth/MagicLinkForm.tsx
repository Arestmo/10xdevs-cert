import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMagicLinkAuth } from "@/components/hooks/useMagicLinkAuth";

/**
 * Magic Link Form Component
 *
 * Alternative authentication method - sends a login link to user's email.
 * Includes email validation and displays success/error messages.
 */
export function MagicLinkForm() {
  const { email, setEmail, isLoading, isSent, error, isEmailValid, sendMagicLink } = useMagicLinkAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMagicLink();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Adres email</Label>
        <Input
          id="email"
          type="email"
          placeholder="twoj@email.pl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading || isSent}
          required
          aria-invalid={!!error}
          aria-describedby={error ? "email-error" : undefined}
        />
        {error && (
          <p id="email-error" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="outline"
        size="lg"
        disabled={isLoading || isSent || !isEmailValid}
        className="w-full"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Wysyłanie...</span>
          </div>
        ) : isSent ? (
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Link wysłany</span>
          </div>
        ) : (
          "Wyślij link do logowania"
        )}
      </Button>

      {isSent && (
        <Alert>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <AlertDescription>
            Link do logowania został wysłany na adres <strong>{email}</strong>. Sprawdź swoją skrzynkę pocztową. Link
            jest ważny przez 1 godzinę.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
