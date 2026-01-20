import crypto from "node:crypto";
import type { GenerateFlashcardsProposalsResponse, FlashcardProposalDto, GenerationSessionEntity } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";
import { OpenRouterService } from "./openrouter.service";
import { FLASHCARD_GENERATION_SYSTEM_PROMPT, type FlashcardsAIResponse } from "./types/openrouter.types";
import {
  FLASHCARD_GENERATION_JSON_SCHEMA,
  FLASHCARD_GENERATION_CONFIG,
  createFlashcardGenerationPrompt,
} from "./types/flashcard-generation.types";

export interface FlashcardGenerationServiceError extends Error {
  code: number;
  message: string;
}

export class FlashcardGenerationService {
  private openRouterService: OpenRouterService;

  constructor(
    private supabase: SupabaseClient,
    private user_id: string
  ) {
    this.openRouterService = new OpenRouterService();
  }

  public async generateFlashcardProposals(source_text: string): Promise<GenerateFlashcardsProposalsResponse> {
    const source_text_hash = crypto.createHash("sha256").update(source_text, "utf8").digest("hex");

    const generation_session = await this.createGenerationSession(source_text_hash, source_text.length);

    try {
      const proposals = await this.generateFlashcardsProposalsFromAI(source_text);

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
   * Generates flashcard proposals using OpenRouter AI
   */
  private async generateFlashcardsProposalsFromAI(source_text: string): Promise<FlashcardProposalDto[]> {
    const aiResponse = await this.openRouterService.chatCompletion<FlashcardsAIResponse>({
      messages: [
        {
          role: "system",
          content: FLASHCARD_GENERATION_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: createFlashcardGenerationPrompt(source_text),
        },
      ],
      response_format: { ...FLASHCARD_GENERATION_JSON_SCHEMA },
      ...FLASHCARD_GENERATION_CONFIG,
    });

    if (!aiResponse.flashcards || !Array.isArray(aiResponse.flashcards)) {
      throw new Error("Invalid AI response: missing or invalid flashcards array");
    }

    return aiResponse.flashcards.map((flashcard) => ({
      front: flashcard.front,
      back: flashcard.back,
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
