import type { SupabaseClient } from "../../db/supabase.client";
import type { Json } from "../../db/database.types";
import type { FlashcardDto, GeneratedFlashcardToSaveDto, SaveGeneratedFlashcardsResponse } from "../../types";

export interface FlashcardServiceError extends Error {
  code: number;
  message: string;
}

export class FlashcardService {
  constructor(
    private supabase: SupabaseClient,
    private user_id: string
  ) {}

  public async saveGeneratedFlashcards(
    generation_id: string,
    flashcards: GeneratedFlashcardToSaveDto[]
  ): Promise<SaveGeneratedFlashcardsResponse> {
    // Call the stored procedure that handles both insert and update in a single transaction
    // The procedure verifies ownership, inserts flashcards, and updates the generation session
    const { data: inserted_flashcards, error } = await this.supabase.rpc("save_generated_flashcards", {
      p_user_id: this.user_id,
      p_generation_id: generation_id,
      p_flashcards: flashcards as unknown as Json,
    });

    if (error) {
      if (error.message.includes("Generation session not found")) {
        throw this.createServiceError(404, "Generation session not found");
      }

      if (error.message.includes("Flashcards from this generation session have already been saved")) {
        throw this.createServiceError(400, "Flashcards from this generation session have already been saved");
      }

      throw new Error(`Failed to save flashcards: ${error.message}`);
    }

    if (!inserted_flashcards || !Array.isArray(inserted_flashcards) || inserted_flashcards.length === 0) {
      throw new Error("Failed to save flashcards");
    }

    return {
      flashcards: inserted_flashcards as FlashcardDto[],
    };
  }

  private createServiceError(code: number, message: string): FlashcardServiceError {
    const service_error = new Error(message) as FlashcardServiceError;
    service_error.code = code;
    return service_error;
  }
}
