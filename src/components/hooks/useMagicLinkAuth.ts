import { useState, useMemo } from "react";
import { supabaseClient } from "@/db/supabase.client";

/**
 * Custom hook for Magic Link authentication
 *
 * Manages the state and logic for sending magic link emails.
 * Includes email validation, loading states, and error handling.
 */
export function useMagicLinkAuth() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate email format
  const isEmailValid = useMemo(() => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, [email]);

  // Send magic link via Supabase
  const sendMagicLink = async () => {
    if (!isEmailValid) {
      setError("Podaj poprawny adres email");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (supabaseError) {
        console.error("Magic link error:", supabaseError);

        if (supabaseError.message.includes("rate limit")) {
          setError("Zbyt wiele prób. Spróbuj ponownie za kilka minut.");
        } else if (supabaseError.message.includes("network")) {
          setError("Nie udało się wysłać linku. Sprawdź połączenie z internetem.");
        } else {
          setError("Nie udało się wysłać linku. Spróbuj ponownie.");
        }
      } else {
        setIsSent(true);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setIsLoading(false);
    setIsSent(false);
    setError(null);
  };

  return {
    email,
    setEmail,
    isLoading,
    isSent,
    error,
    isEmailValid,
    sendMagicLink,
    resetForm,
  };
}
