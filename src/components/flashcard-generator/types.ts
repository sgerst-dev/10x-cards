import type { GenerateFlashcardsProposalsCommand, SaveGeneratedFlashcardsCommand } from "@/types";

/**
 * ViewModel dla pojedynczej propozycji (stan lokalny)
 */
export interface FlashcardProposalViewModel {
  id: string; // UUID generowane na frontendzie (do kluczy React i identyfikacji)
  front: string;
  back: string;
  status: "accepted" | "rejected";
  isEdited: boolean; // Flaga potrzebna do ustawienia source: 'ai_edited'
}

/**
 * Stan hooka useFlashcardGenerator
 */
export interface FlashcardsGeneratorState {
  inputText: string;
  generationId: string | null; // ID sesji generowania zwrócone z API
  proposals: FlashcardProposalViewModel[];
  isGenerating: boolean;
  isSaving: boolean;
  error: string | null;
}

export type { GenerateFlashcardsProposalsCommand, SaveGeneratedFlashcardsCommand };
