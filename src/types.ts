import type { Tables, Enums } from "./db/database.types";

// ============================================================================
// BASE ENTITY LINKS (from database models)
// ============================================================================

export type FlashcardEntity = Tables<"flashcards">;
export type GenerationSessionEntity = Tables<"generation_sessions">;
export type FlashcardSource = Enums<"flashcard_source">;

// ============================================================================
// DTOs (Data Transfer Objects) - API Responses
// ============================================================================

/**
 * Standardowy DTO flashcarda dla list i zapisanych rekordów.
 */
export type FlashcardDto = Omit<FlashcardEntity, "user_id" | "generation_id">;

/**
 * DTO dla odpowiedzi, które nie zwracają updated_at
 * (GET /api/flashcards/{id}, PUT /api/flashcards/{id}).
 */
export type FlashcardSlimDto = Omit<FlashcardDto, "updated_at">;

/**
 * Paginacja w odpowiedzi listy.
 */
export interface PaginationDto {
  current_page: number;
  total_pages: number;
  total_items: number;
  limit: number;
}

/**
 * GET /api/flashcards
 */
export interface GetFlashcardsResponse {
  flashcards: FlashcardDto[];
  pagination: PaginationDto;
}

/**
 * DTO propozycji fiszki wygenerowanej przez LLM
 */
export interface FlashcardProposalDto {
  front: FlashcardEntity["front"];
  back: FlashcardEntity["back"];
  source: Extract<FlashcardSource, "ai_generated">;
}

/**
 * POST /api/flashcards/generate-proposals
 */
export interface GenerateFlashcardsProposalsResponse {
  generation_id: GenerationSessionEntity["id"];
  generated_count: GenerationSessionEntity["generated_count"];
  flashcards_proposals: FlashcardProposalDto[];
}

/**
 * POST /api/flashcards/save-generated-flashcards
 */
export interface SaveGeneratedFlashcardsResponse {
  flashcards: FlashcardDto[];
}

/**
 * POST /api/flashcards
 */
export type CreateFlashcardResponse = FlashcardDto;

/**
 * GET /api/flashcards/{id}
 */
export type GetFlashcardResponse = FlashcardSlimDto;

/**
 * PUT /api/flashcards/{id}
 */
export type UpdateFlashcardResponse = FlashcardSlimDto;

// ============================================================================
// COMMAND MODELS - API Request Bodies
// ============================================================================

/**
 * POST /api/flashcards/generate-proposals
 */
export interface GenerateFlashcardsProposalsCommand {
  source_text: string;
}

/**
 * Element zapisu AI (wybrane/edytowane propozycje).
 */
export interface GeneratedFlashcardToSaveDto {
  front: FlashcardEntity["front"];
  back: FlashcardEntity["back"];
  source: Extract<FlashcardSource, "ai_generated" | "ai_edited">;
}

/**
 * POST /api/flashcards/save-generated-flashcards
 */
export interface SaveGeneratedFlashcardsCommand {
  generation_id: GenerationSessionEntity["id"];
  flashcards: GeneratedFlashcardToSaveDto[];
}

/**
 * POST /api/flashcards
 */
export interface CreateFlashcardCommand {
  front: string;
  back: string;
}

/**
 * PUT /api/flashcards/{id}
 */
export interface UpdateFlashcardCommand {
  front: string;
  back: string;
}

/**
 * GET /api/flashcards (query)
 */
export interface GetFlashcardsQuery {
  page?: number;
  limit?: number;
}
