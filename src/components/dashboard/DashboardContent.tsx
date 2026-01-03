/**
 * DashboardContent Component
 *
 * Main dashboard content component that orchestrates all dashboard tiles.
 * Fetches data using useDashboard hook and renders appropriate components
 * based on loading, error, and data states.
 *
 * Rendering logic:
 * - Loading: Shows loading spinner
 * - Error: Shows error alert with retry button
 * - Success:
 *   - DueReviewTile (if totalDue > 0)
 *   - CreateDeckTile (always shown)
 *   - GenerateAITile (always shown)
 *   - DeckGrid (if hasDecks === true)
 *   - EmptyState (if hasDecks === false)
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/hooks/useDashboard";
import { DueReviewTile } from "./DueReviewTile";
import { CreateDeckTile } from "./CreateDeckTile";
import { GenerateAITile } from "./GenerateAITile";
import { DeckGrid } from "./DeckGrid";
import { EmptyState } from "./EmptyState";
import { CreateDeckModal } from "./CreateDeckModal";
import { GenerationModal } from "@/components/generation/GenerationModal";
import type { DeckDTO } from "@/types";
import type { DeckOption } from "@/components/generation/types";

export function DashboardContent() {
  const { data, isLoading, error, refetch } = useDashboard();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);

  /**
   * Opens the create deck modal
   */
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  /**
   * Closes the create deck modal
   */
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  /**
   * Handles successful deck creation
   * Refetches dashboard data to show the new deck
   */
  const handleDeckCreated = async (deck: DeckDTO) => {
    // eslint-disable-next-line no-console
    console.log("Deck created:", deck);
    // Refetch dashboard data to include the new deck
    await refetch();
  };

  /**
   * Opens the AI generation modal
   */
  const handleOpenGenerationModal = () => {
    setIsGenerationModalOpen(true);
  };

  /**
   * Closes the AI generation modal
   */
  const handleCloseGenerationModal = () => {
    setIsGenerationModalOpen(false);
  };

  /**
   * Handles successful AI generation
   * Refetches dashboard data to show new flashcards
   */
  const handleGenerationSuccess = async (acceptedCount: number) => {
    // eslint-disable-next-line no-console
    console.log("Generated flashcards:", acceptedCount);
    // Refetch dashboard data to update counts
    await refetch();
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="text-sm">Ładowanie dashboardu...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <p className="font-medium">Nie udało się załadować danych</p>
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

  // Prepare deck options for GenerationModal
  const deckOptions: DeckOption[] = data.decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
  }));

  // Success State - Render Dashboard
  return (
    <div className="space-y-6">
      {/* Top Section: Due Review Tile and Action Tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Due Review Tile - only show if there are cards due */}
        {data.hasDueCards && <DueReviewTile dueCount={data.totalDue} />}

        {/* Create Deck Tile - always shown */}
        <CreateDeckTile onClick={handleOpenCreateModal} />

        {/* Generate AI Tile - always shown */}
        <GenerateAITile onClick={handleOpenGenerationModal} />
      </div>

      {/* Decks Section */}
      {data.hasDecks ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Twoje talie</h2>
          <DeckGrid decks={data.decks} />
        </div>
      ) : (
        <EmptyState onCreateDeck={handleOpenCreateModal} />
      )}

      {/* Create Deck Modal */}
      <CreateDeckModal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} onSuccess={handleDeckCreated} />

      {/* AI Generation Modal */}
      <GenerationModal
        isOpen={isGenerationModalOpen}
        onClose={handleCloseGenerationModal}
        onSuccess={handleGenerationSuccess}
        decks={deckOptions}
      />
    </div>
  );
}
