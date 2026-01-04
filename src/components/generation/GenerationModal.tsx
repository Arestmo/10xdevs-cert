/**
 * GenerationModal Component
 *
 * Main modal component managing the entire AI flashcard generation flow.
 * Controls stages: input → generating → reviewing drafts.
 * Uses Dialog components from shadcn/ui.
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AILimitIndicator } from "./AILimitIndicator";
import { DeckSelector } from "./DeckSelector";
import { SourceTextArea } from "./SourceTextArea";
import { GenerateButton } from "./GenerateButton";
import { GenerationSpinner } from "./GenerationSpinner";
import { DraftsList } from "./DraftsList";
import { GenerationError } from "./GenerationError";
import { CloseConfirmDialog } from "./CloseConfirmDialog";
import { useAIGeneration } from "@/components/hooks/useAIGeneration";
import type { GenerationModalProps } from "./types";

export function GenerationModal({ isOpen, onClose, onSuccess, preselectedDeckId, decks }: GenerationModalProps) {
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const {
    state,
    remainingLimit,
    resetDate,
    isLoadingProfile,
    setSourceText,
    setSelectedDeckId,
    generate,
    isGenerating,
    acceptDraft,
    rejectDraft,
    startEditDraft,
    saveEditDraft,
    cancelEditDraft,
    createDeck,
    isCreatingDeck,
    createDeckError,
    unprocessedCount,
    acceptedCount,
    canGenerate,
    reset,
  } = useAIGeneration({ preselectedDeckId });

  // Handle closing modal
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // User wants to close the modal
      if (unprocessedCount > 0 && state.stage === "reviewing") {
        // Show confirmation dialog
        setShowCloseConfirm(true);
      } else {
        // Close directly
        handleClose();
      }
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    // Call onSuccess with accepted count if any drafts were accepted
    if (acceptedCount > 0) {
      onSuccess(acceptedCount);
    }
    handleClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  // Handle successful completion (all drafts processed)
  useEffect(() => {
    if (state.stage === "reviewing" && state.drafts.length > 0) {
      const allProcessed = state.drafts.every((d) => d.status === "accepted" || d.status === "rejected");
      if (allProcessed && acceptedCount > 0) {
        // All drafts processed, close modal after a brief delay
        const timer = setTimeout(() => {
          onSuccess(acceptedCount);
          handleClose();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [state.stage, state.drafts, acceptedCount, onSuccess]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generuj fiszki AI</DialogTitle>
            <DialogDescription>Wklej tekst źródłowy, a AI wygeneruje dla Ciebie fiszki do nauki</DialogDescription>
            <div className="pt-2">
              <AILimitIndicator remainingLimit={remainingLimit} resetDate={resetDate} isLoading={isLoadingProfile} />
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stage: Input */}
            {state.stage === "input" && (
              <>
                <DeckSelector
                  decks={decks}
                  selectedDeckId={state.selectedDeckId}
                  onSelect={setSelectedDeckId}
                  onCreateDeck={createDeck}
                  isCreatingDeck={isCreatingDeck}
                  createDeckError={createDeckError}
                  disabled={isGenerating}
                />

                <SourceTextArea value={state.sourceText} onChange={setSourceText} disabled={isGenerating} />

                <GenerateButton onClick={generate} disabled={!canGenerate} isLoading={isGenerating} />
              </>
            )}

            {/* Stage: Generating */}
            {state.stage === "generating" && <GenerationSpinner />}

            {/* Stage: Reviewing Drafts */}
            {state.stage === "reviewing" && state.generationId && (
              <DraftsList
                drafts={state.drafts}
                onAccept={acceptDraft}
                onReject={rejectDraft}
                onEdit={startEditDraft}
                onSaveEdit={saveEditDraft}
                onCancelEdit={cancelEditDraft}
                generationId={state.generationId}
              />
            )}

            {/* Stage: Error */}
            {state.stage === "error" && state.error && (
              <GenerationError
                error={state.error}
                onRetry={() => {
                  reset();
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <CloseConfirmDialog
        isOpen={showCloseConfirm}
        unprocessedCount={unprocessedCount}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
}
