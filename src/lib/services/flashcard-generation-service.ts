import crypto from "node:crypto";
import type { GenerateFlashcardsProposalsResponse, FlashcardProposalDto, GenerationSessionEntity } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";

export interface FlashcardGenerationServiceError extends Error {
  code: number;
  message: string;
}

export class FlashcardGenerationService {
  constructor(
    private supabase: SupabaseClient,
    private user_id: string
  ) {}

  public async generateFlashcardProposals(source_text: string): Promise<GenerateFlashcardsProposalsResponse> {
    const source_text_hash = crypto.createHash("sha256").update(source_text, "utf8").digest("hex");

    const generation_session = await this.createGenerationSession(source_text_hash, source_text.length);

    try {
      const proposals = await this.generateFlashcardsProposalsFromAI();

      await this.updateGenerationSessionCount(generation_session.id, proposals.length);

      return {
        generation_id: generation_session.id,
        generated_count: proposals.length,
        flashcards_proposals: proposals,
      };
    } catch (error) {
      await this.logGenerationError(error as Error, source_text_hash, source_text.length, generation_session.id);
      throw error;
    }
  }

  /**
   * Creates new generation session in database
   */
  private async createGenerationSession(
    source_text_hash: string,
    source_text_length: number
  ): Promise<GenerationSessionEntity> {
    const { data: session, error } = await this.supabase
      .from("generation_sessions")
      .insert({
        user_id: this.user_id,
        model: `${import.meta.env.OPEN_ROUTER_MODEL}`,
        source_text_hash,
        source_text_length,
        generated_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create generation session: ${error.message}`);
    }

    return session;
  }

  /**
   * Updates generated proposals count in session
   */
  private async updateGenerationSessionCount(generation_id: string, generated_count: number) {
    await this.supabase
      .from("generation_sessions")
      .update({ generated_count: generated_count })
      .eq("id", generation_id);
  }

  /**
   * Mock proposal generation - OpenRouter API call will be implemented here
   */
  private async generateFlashcardsProposalsFromAI(): Promise<FlashcardProposalDto[]> {
    // TODO: Implement actual OpenRouter API call using _source_text
    // For now return mock response

    await new Promise((resolve) => setTimeout(resolve, 1500)); // simulate delay

    return Array.from({ length: 3 }, (_, idx) => ({
      front: `Sample question ${idx + 1}`,
      back: `Sample answer ${idx + 1}`,
      source: "ai_generated" as const,
    }));
  }

  /**
   * Logs generation error to generation_errors table
   */
  private async logGenerationError(
    error: Error | FlashcardGenerationServiceError,
    source_text_hash: string,
    source_text_length: number,
    generation_id?: string
  ) {
    const model = `${import.meta.env.OPEN_ROUTER_MODEL}`;

    await this.supabase.from("generation_errors").insert({
      user_id: this.user_id,
      model,
      source_text_hash,
      source_text_length,
      generation_id: generation_id || null,
      error_code: String((error as FlashcardGenerationServiceError).code || 500),
      error_message: error.message || "Unknown error",
    });
  }
}
