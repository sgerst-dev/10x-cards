import { useState, useCallback } from "react";
import type {
  FlashcardProposalViewModel,
  FlashcardsGeneratorState,
  GenerateFlashcardsProposalsCommand,
  SaveGeneratedFlashcardsCommand,
} from "../types";
import type { GenerateFlashcardsProposalsResponse, SaveGeneratedFlashcardsResponse } from "@/types";

interface UseFlashcardGeneratorReturn extends FlashcardsGeneratorState {
  generateProposals: (text: string) => Promise<void>;
  toggleProposalStatus: (id: string) => void;
  updateProposal: (id: string, front: string, back: string) => void;
  saveSelected: () => Promise<SaveGeneratedFlashcardsResponse | undefined>;
  resetState: () => void;
}

const initialState: FlashcardsGeneratorState = {
  inputText: "",
  generationId: null,
  proposals: [],
  isGenerating: false,
  isSaving: false,
  error: null,
};

export function useFlashcardGenerator(): UseFlashcardGeneratorReturn {
  const [state, setState] = useState<FlashcardsGeneratorState>(initialState);

  const generateProposals = useCallback(async (text: string) => {
    setState((prev) => ({ ...prev, isGenerating: true, error: null }));

    try {
      const command: GenerateFlashcardsProposalsCommand = {
        source_text: text,
      };

      const response = await fetch("/api/flashcards/generate-flashcards-proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenerateFlashcardsProposalsResponse = await response.json();

      const proposals: FlashcardProposalViewModel[] = data.flashcards_proposals.map((proposal) => ({
        id: crypto.randomUUID(),
        front: proposal.front,
        back: proposal.back,
        status: "accepted" as const,
        isEdited: false,
      }));

      setState((prev) => ({
        ...prev,
        inputText: text,
        generationId: data.generation_id,
        proposals,
        isGenerating: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się wygenerować propozycji fiszek";
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
    }
  }, []);

  const toggleProposalStatus = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.map((proposal) =>
        proposal.id === id
          ? {
              ...proposal,
              status: proposal.status === "accepted" ? "rejected" : "accepted",
            }
          : proposal
      ),
    }));
  }, []);

  const updateProposal = useCallback((id: string, front: string, back: string) => {
    setState((prev) => ({
      ...prev,
      proposals: prev.proposals.map((proposal) =>
        proposal.id === id ? { ...proposal, front, back, isEdited: true } : proposal
      ),
    }));
  }, []);

  const saveSelected = useCallback(async () => {
    if (!state.generationId) {
      setState((prev) => ({ ...prev, error: "Brak ID generowania" }));
      return;
    }

    const acceptedProposals = state.proposals.filter((p) => p.status === "accepted");

    if (acceptedProposals.length === 0) {
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const command: SaveGeneratedFlashcardsCommand = {
        generation_id: state.generationId,
        flashcards: acceptedProposals.map((proposal) => ({
          front: proposal.front,
          back: proposal.back,
          source: proposal.isEdited ? ("ai_edited" as const) : ("ai_generated" as const),
        })),
      };

      const response = await fetch("/api/flashcards/save-generated-flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: SaveGeneratedFlashcardsResponse = await response.json();

      setState(initialState);

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się zapisać fiszek";
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: errorMessage,
      }));
    }
  }, [state.generationId, state.proposals]);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    generateProposals,
    toggleProposalStatus,
    updateProposal,
    saveSelected,
    resetState,
  };
}
