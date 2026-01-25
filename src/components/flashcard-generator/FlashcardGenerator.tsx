import { useState, useEffect } from "react";
import { toast } from "sonner";
import { GenerateFlashcardInput } from "./components/GenerateFlashcardInput";
import { FlashcardsProposalsList } from "./components/FlashcardsProposalsList";
import { FlashcardsProposalsListSkeleton } from "./components/FlashcardsProposalsListSkeleton";
import { SaveActions } from "./components/SaveActions";
import { EditFlashcardProposalDialog } from "./components/EditFlashcardProposalDialog";
import { UnsavedChangesDialog } from "./components/UnsavedChangesDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useFlashcardGenerator } from "./hooks/useFlashcardGenerator";
import type { FlashcardProposalViewModel } from "./types";

export function FlashcardGenerator() {
  const {
    proposals,
    isGenerating,
    isSaving,
    error,
    generateProposals,
    toggleProposalStatus,
    updateProposal,
    saveSelected,
    resetState,
    hasUnsavedChanges,
  } = useFlashcardGenerator();

  const [localInputText, setLocalInputText] = useState("");
  const [editingProposal, setEditingProposal] = useState<FlashcardProposalViewModel | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Notify other components about unsaved changes via custom event
  useEffect(() => {
    const event = new CustomEvent("unsavedChanges", { detail: { hasUnsavedChanges } });
    window.dispatchEvent(event);
  }, [hasUnsavedChanges]);

  // Listen for clear unsaved changes event (from Header when user confirms navigation)
  useEffect(() => {
    const handleClearUnsavedChanges = () => {
      resetState();
    };

    window.addEventListener("clearUnsavedChanges", handleClearUnsavedChanges);
    return () => window.removeEventListener("clearUnsavedChanges", handleClearUnsavedChanges);
  }, [resetState]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleGenerate = async () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => async () => {
        await generateProposals(localInputText);
      });
      setShowUnsavedDialog(true);
      return;
    }
    await generateProposals(localInputText);
  };

  const handleConfirmUnsavedAction = () => {
    setShowUnsavedDialog(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancelUnsavedAction = () => {
    setShowUnsavedDialog(false);
    setPendingAction(null);
  };

  const handleToggleStatus = (id: string) => {
    toggleProposalStatus(id);
  };

  const handleEdit = (id: string) => {
    const proposal = proposals.find((p) => p.id === id);
    if (proposal) {
      setEditingProposal(proposal);
    }
  };

  const handleSaveEdit = (id: string, front: string, back: string) => {
    updateProposal(id, front, back);
    setEditingProposal(null);
  };

  const handleSaveSelected = async () => {
    try {
      await saveSelected();
      toast.success("Fiszki zostały pomyślnie zapisane!");
      setLocalInputText("");
    } catch {
      toast.error("Nie udało się zapisać fiszek", {
        description: "Spróbuj ponownie później",
      });
    }
  };

  const acceptedCount = proposals.filter((p) => p.status === "accepted").length;

  return (
    <div className="container mx-auto max-w-7xl space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Generator Fiszek</h1>
        <p className="text-muted-foreground">Wprowadź tekst, a AI wygeneruje dla Ciebie propozycje fiszek do nauki</p>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <GenerateFlashcardInput
        value={localInputText}
        onChange={setLocalInputText}
        onGenerate={handleGenerate}
        isLoading={isGenerating}
      />

      {isGenerating ? (
        <FlashcardsProposalsListSkeleton />
      ) : proposals.length > 0 ? (
        <FlashcardsProposalsList proposals={proposals} onStatusChange={handleToggleStatus} onEdit={handleEdit} />
      ) : null}

      <SaveActions
        totalCount={proposals.length}
        acceptedCount={acceptedCount}
        onSave={handleSaveSelected}
        isSaving={isSaving}
      />

      <EditFlashcardProposalDialog
        isOpen={!!editingProposal}
        proposal={editingProposal}
        onSave={handleSaveEdit}
        onClose={() => setEditingProposal(null)}
      />

      <UnsavedChangesDialog
        isOpen={showUnsavedDialog}
        onConfirm={handleConfirmUnsavedAction}
        onCancel={handleCancelUnsavedAction}
      />
    </div>
  );
}
