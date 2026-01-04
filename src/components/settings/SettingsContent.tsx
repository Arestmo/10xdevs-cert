/**
 * SettingsContent Component
 *
 * Main settings page content component that orchestrates all settings sections.
 * Fetches user profile data using useSettings hook and renders appropriate
 * components based on loading, error, and data states.
 *
 * Rendering logic:
 * - Loading: Shows loading spinner
 * - Error: Shows error alert with retry button
 * - Success:
 *   - Page header with back button
 *   - AccountInfo section (email)
 *   - AILimitStatus section (AI generation limit)
 *   - DeleteAccountSection (danger zone)
 */

import { Loader2, ArrowLeft } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/components/hooks/useSettings";
import { AccountInfo } from "./AccountInfo";
import { AILimitStatus } from "./AILimitStatus";
import { DeleteAccountSection } from "./DeleteAccountSection";

export function SettingsContent() {
  const { data, isLoading, error, refetch } = useSettings();

  /**
   * Handles successful account deletion
   * Called before redirect to login
   */
  const handleDeleteSuccess = () => {
    // Cleanup or analytics can be added here
    // Actual redirect happens in DeleteAccountSection
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-sm">Ładowanie ustawień...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <p className="font-medium">Nie udało się załadować ustawień</p>
          <p className="text-sm">{error}</p>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={refetch} variant="outline">
            Spróbuj ponownie
          </Button>
        </div>
      </div>
    );
  }

  // No Data State (shouldn't happen, but handle gracefully)
  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Brak danych do wyświetlenia</p>
      </div>
    );
  }

  // Success State - Render Settings
  return (
    <div className="space-y-6">
      {/* Page Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <a href="/dashboard" aria-label="Wróć do dashboardu">
            <ArrowLeft className="size-5" />
          </a>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
      </div>

      {/* Account Information Section */}
      <AccountInfo email={data.email} />

      {/* AI Limit Status Section */}
      <AILimitStatus
        usedCount={data.usedAIFlashcards}
        totalLimit={data.totalAILimit}
        resetDate={data.aiLimitResetDate}
      />

      {/* Danger Zone - Delete Account Section */}
      <DeleteAccountSection onDeleteSuccess={handleDeleteSuccess} />
    </div>
  );
}
