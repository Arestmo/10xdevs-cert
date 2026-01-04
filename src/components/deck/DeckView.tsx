/**
 * DeckView Component
 *
 * Main container for deck view.
 * Orchestrates all sub-components and manages UI state.
 * Handles data fetching, CRUD operations, and user interactions.
 */

import { useState, useCallback, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useDeckView } from "@/components/hooks/useDeckView";
import { DeckHeader } from "./DeckHeader";
import { DeckActions } from "./DeckActions";
import { FlashcardList } from "./FlashcardList";
import { FlashcardFormModal } from "./FlashcardFormModal";
import { DeleteDeckDialog } from "./DeleteDeckDialog";
import { DeleteFlashcardDialog } from "./DeleteFlashcardDialog";
import { GenerationModal } from "@/components/generation/GenerationModal";
import type { DeckViewProps, FlashcardViewModel } from "./types";
import type { DeckOption } from "@/components/generation/types";

export function DeckView({ deckId }: DeckViewProps) {
  // Data and operations from custom hook
  const {
    deck,
    flashcards,
    isLoading,
    error,
    updateDeckName,
    deleteDeck,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    isUpdatingName,
    isDeletingDeck,
    isCreatingFlashcard,
    isUpdatingFlashcard,
    isDeletingFlashcard,
    nameUpdateError,
    refetch,
  } = useDeckView(deckId);

  // UI state for deck name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // UI state for flashcard accordion
  const [expandedFlashcardId, setExpandedFlashcardId] = useState<string | null>(null);

  // UI state for modals and dialogs
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardViewModel | null>(null);
  const [isDeleteDeckDialogOpen, setIsDeleteDeckDialogOpen] = useState(false);
  const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardViewModel | null>(null);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);

  // Handlers for deck name editing
  const handleEditNameStart = useCallback(() => {
    if (deck) {
      setEditedName(deck.name);
      setIsEditingName(true);
    }
  }, [deck]);

  const handleEditNameSave = useCallback(async () => {
    if (editedName.trim() && editedName !== deck?.name) {
      await updateDeckName(editedName.trim());
      if (!nameUpdateError) {
        setIsEditingName(false);
      }
    }
  }, [editedName, deck?.name, updateDeckName, nameUpdateError]);

  const handleEditNameCancel = useCallback(() => {
    setIsEditingName(false);
    setEditedName("");
  }, []);

  // Handlers for flashcard operations
  const handleAddFlashcard = useCallback(() => {
    setEditingFlashcard(null);
    setIsAddFormOpen(true);
  }, []);

  const handleEditFlashcard = useCallback((flashcard: FlashcardViewModel) => {
    setEditingFlashcard(flashcard);
    setIsAddFormOpen(true);
  }, []);

  const handleDeleteFlashcard = useCallback((flashcard: FlashcardViewModel) => {
    setDeletingFlashcard(flashcard);
  }, []);

  const handleFlashcardFormSuccess = useCallback(() => {
    setIsAddFormOpen(false);
    setEditingFlashcard(null);
  }, []);

  const handleConfirmDeleteFlashcard = useCallback(async () => {
    if (deletingFlashcard) {
      const success = await deleteFlashcard(deletingFlashcard.id);
      if (success) {
        setDeletingFlashcard(null);
      }
    }
  }, [deletingFlashcard, deleteFlashcard]);

  const handleConfirmDeleteDeck = useCallback(async () => {
    await deleteDeck();
    // Note: deleteDeck redirects to dashboard on success
  }, [deleteDeck]);

  // Handlers for AI generation
  const handleOpenGenerationModal = useCallback(() => {
    setIsGenerationModalOpen(true);
  }, []);

  const handleCloseGenerationModal = useCallback(() => {
    setIsGenerationModalOpen(false);
  }, []);

  const handleGenerationSuccess = useCallback(
    async (acceptedCount: number) => {
      // eslint-disable-next-line no-console
      console.log("Generated flashcards:", acceptedCount);
      // Refetch deck data to update counts and flashcard list
      await refetch();
    },
    [refetch]
  );

  // Prepare deck options for GenerationModal
  const deckOptions: DeckOption[] = useMemo(() => {
    if (!deck) return [];
    return [{ id: deck.id, name: deck.name }];
  }, [deck]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Ładowanie talii...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !deck) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Nie udało się załadować talii</h2>
            <p className="text-sm text-muted-foreground">{error || "Talia nie została znaleziona"}</p>
          </div>
          <a
            href="/dashboard"
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Powrót do dashboard
          </a>
        </div>
      </div>
    );
  }

  // Main view
  return (
    <div className="space-y-6">
      {/* Header */}
      <DeckHeader
        deck={deck}
        isEditingName={isEditingName}
        editedName={editedName}
        onEditNameStart={handleEditNameStart}
        onEditNameChange={setEditedName}
        onEditNameSave={handleEditNameSave}
        onEditNameCancel={handleEditNameCancel}
        isUpdatingName={isUpdatingName}
        nameError={nameUpdateError}
      />

      {/* Actions */}
      <DeckActions
        deckId={deckId}
        dueCount={deck.dueFlashcards}
        totalFlashcards={deck.totalFlashcards}
        onAddFlashcard={handleAddFlashcard}
        onGenerateFlashcards={handleOpenGenerationModal}
        onDeleteDeck={() => setIsDeleteDeckDialogOpen(true)}
      />

      {/* Flashcards List */}
      <div className="mt-8">
        <FlashcardList
          flashcards={flashcards}
          expandedId={expandedFlashcardId}
          onExpand={setExpandedFlashcardId}
          onEdit={handleEditFlashcard}
          onDelete={handleDeleteFlashcard}
        />
      </div>

      {/* Flashcard Form Modal */}
      <FlashcardFormModal
        isOpen={isAddFormOpen}
        onClose={() => {
          setIsAddFormOpen(false);
          setEditingFlashcard(null);
        }}
        onSuccess={handleFlashcardFormSuccess}
        editingFlashcard={editingFlashcard}
        onCreateFlashcard={createFlashcard}
        onUpdateFlashcard={updateFlashcard}
        isSubmitting={isCreatingFlashcard || isUpdatingFlashcard}
      />

      {/* Delete Deck Dialog */}
      <DeleteDeckDialog
        isOpen={isDeleteDeckDialogOpen}
        onClose={() => setIsDeleteDeckDialogOpen(false)}
        onConfirm={handleConfirmDeleteDeck}
        deckName={deck.name}
        flashcardsCount={deck.totalFlashcards}
        isDeleting={isDeletingDeck}
      />

      {/* Delete Flashcard Dialog */}
      <DeleteFlashcardDialog
        isOpen={!!deletingFlashcard}
        onClose={() => setDeletingFlashcard(null)}
        onConfirm={handleConfirmDeleteFlashcard}
        flashcardPreview={deletingFlashcard?.frontPreview || ""}
        isDeleting={isDeletingFlashcard}
      />

      {/* AI Generation Modal */}
      <GenerationModal
        isOpen={isGenerationModalOpen}
        onClose={handleCloseGenerationModal}
        onSuccess={handleGenerationSuccess}
        preselectedDeckId={deckId}
        decks={deckOptions}
      />
    </div>
  );
}
