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

    // Check if we already have cached proposals for this source text
    const cached_session = await this.findCachedGenerationSession(source_text_hash);

    if (cached_session) {
      // Add source field when returning cached proposals (it's always "ai_generated" for proposals)
      const cached_proposals = (cached_session.generated_proposals as Array<{ front: string; back: string }>).map(
        (proposal) => ({
          front: proposal.front,
          back: proposal.back,
          source: "ai_generated" as const,
        })
      );

      return {
        generation_id: cached_session.id,
        generated_count: cached_session.generated_count,
        flashcards_proposals: cached_proposals,
      };
    }

    // No cache found, generate new proposals
    const generation_session = await this.createGenerationSession(source_text_hash, source_text.length);

    try {
      const proposals = await this.generateFlashcardsProposalsFromAI(source_text);

      await this.updateGenerationSessionWithProposals(generation_session.id, proposals);

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
   * Finds cached generation session with proposals for the same source text hash
   */
  private async findCachedGenerationSession(source_text_hash: string): Promise<GenerationSessionEntity | null> {
    const { data: session, error } = await this.supabase
      .from("generation_sessions")
      .select("*")
      .eq("user_id", this.user_id)
      .eq("source_text_hash", source_text_hash)
      .not("generated_proposals", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // Log error but don't throw - we'll generate new proposals instead
      console.error("Error finding cached session:", error);
      return null;
    }

    return session;
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
      throw new Error(`Nie udało się utworzyć sesji generacji: ${error.message}`);
    }

    return session;
  }

  /**
   * Updates generation session with proposals and count
   */
  private async updateGenerationSessionWithProposals(generation_id: string, proposals: FlashcardProposalDto[]) {
    // Store only front and back in cache (source is always "ai_generated" for proposals)
    const proposals_to_cache = proposals.map(({ front, back }) => ({ front, back }));

    const { error } = await this.supabase
      .from("generation_sessions")
      .update({
        generated_count: proposals.length,
        generated_proposals: proposals_to_cache,
      })
      .eq("id", generation_id);

    if (error) {
      console.error("Error updating generation session with proposals:", error);
      // Don't throw - the proposals were generated successfully, we just couldn't cache them
    }
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
