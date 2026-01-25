import type { SupabaseClient } from "../../db/supabase.client";
import type { Json } from "../../db/database.types";
import type {
  FlashcardDto,
  GeneratedFlashcardToSaveDto,
  SaveGeneratedFlashcardsResponse,
  GetFlashcardsResponse,
  PaginationDto,
  FlashcardEntity,
  CreateFlashcardCommand,
  CreateFlashcardResponse,
  UpdateFlashcardCommand,
  UpdateFlashcardResponse,
} from "../../types";

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
        throw this.createServiceError(404, "Sesja generacji nie została znaleziona");
      }

      if (error.message.includes("Flashcards from this generation session have already been saved")) {
        throw this.createServiceError(400, "Fiszki z tej sesji generacji zostały już zapisane");
      }

      throw new Error(`Nie udało się zapisać fiszek: ${error.message}`);
    }

    if (!inserted_flashcards || !Array.isArray(inserted_flashcards) || inserted_flashcards.length === 0) {
      throw new Error("Nie udało się zapisać fiszek");
    }

    return {
      flashcards: inserted_flashcards as FlashcardDto[],
    };
  }

  /**
   * Tworzy nową flashcard utworzoną ręcznie przez użytkownika
   *
   * @param command - dane flashcardy (front, back)
   * @returns CreateFlashcardResponse z utworzoną flashcard
   */
  public async createFlashcard(command: CreateFlashcardCommand): Promise<CreateFlashcardResponse> {
    const { data: flashcard_data, error: insert_error } = await this.supabase
      .from("flashcards")
      .insert({
        user_id: this.user_id,
        front: command.front,
        back: command.back,
        source: "user_created",
        generation_id: null,
      })
      .select("id, front, back, source, created_at, updated_at")
      .single();

    if (insert_error) {
      throw new Error(`Nie udało się utworzyć fiszki: ${insert_error.message}`);
    }

    if (!flashcard_data) {
      throw new Error("Nie udało się utworzyć fiszki: brak zwróconych danych");
    }

    const flashcard: FlashcardDto = {
      id: flashcard_data.id,
      front: flashcard_data.front,
      back: flashcard_data.back,
      source: flashcard_data.source as FlashcardEntity["source"],
      created_at: flashcard_data.created_at,
      updated_at: flashcard_data.updated_at,
    };

    return flashcard;
  }

  /**
   * Pobiera paginowaną listę flashcards użytkownika
   *
   * @param page - numer strony (1-based)
   * @param limit - liczba elementów na stronę
   * @returns GetFlashcardsResponse z flashcards i metadanymi paginacji
   */
  public async getUserFlashcards(page: number, limit: number): Promise<GetFlashcardsResponse> {
    const offset = (page - 1) * limit;

    const { count: total_items, error: count_error } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", this.user_id);

    if (count_error) {
      throw new Error(`Nie udało się policzyć fiszek: ${count_error.message}`);
    }

    // Pobranie flashcards z paginacją i sortowaniem
    const { data: flashcards_data, error: select_error } = await this.supabase
      .from("flashcards")
      .select("id, front, back, source, created_at, updated_at")
      .eq("user_id", this.user_id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (select_error) {
      throw new Error(`Nie udało się pobrać fiszek: ${select_error.message}`);
    }

    const flashcards: FlashcardDto[] = (flashcards_data || []).map((flashcard) => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source as FlashcardEntity["source"],
      created_at: flashcard.created_at,
      updated_at: flashcard.updated_at,
    }));

    const total_pages = Math.ceil((total_items || 0) / limit);

    const pagination: PaginationDto = {
      current_page: page,
      total_pages,
      total_items: total_items || 0,
      limit,
    };

    return {
      flashcards,
      pagination,
    };
  }

  /**
   * Aktualizuje istniejącą flashcard użytkownika
   *
   * @param flashcard_id - UUID flashcardy do aktualizacji
   * @param command - dane do aktualizacji (front, back)
   * @returns UpdateFlashcardResponse z zaktualizowaną flashcard
   * @throws FlashcardServiceError z kodem 404 jeśli flashcard nie istnieje lub nie należy do użytkownika
   */
  public async updateFlashcard(
    flashcard_id: string,
    command: UpdateFlashcardCommand
  ): Promise<UpdateFlashcardResponse> {
    const { data: flashcard_data, error: update_error } = await this.supabase
      .from("flashcards")
      .update({
        front: command.front,
        back: command.back,
      })
      .eq("id", flashcard_id)
      .eq("user_id", this.user_id)
      .select("id, front, back, source, created_at")
      .single();

    if (update_error) {
      if (update_error.code === "PGRST116") {
        throw this.createServiceError(404, "Fiszka nie została znaleziona");
      }

      throw new Error(`Nie udało się zaktualizować fiszki: ${update_error.message}`);
    }

    if (!flashcard_data) {
      throw this.createServiceError(404, "Fiszka nie została znaleziona");
    }

    const flashcard: UpdateFlashcardResponse = {
      id: flashcard_data.id,
      front: flashcard_data.front,
      back: flashcard_data.back,
      source: flashcard_data.source as FlashcardEntity["source"],
      created_at: flashcard_data.created_at,
    };

    return flashcard;
  }

  /**
   * Usuwa flashcard użytkownika (hard delete)
   *
   * @param flashcard_id - UUID flashcardy do usunięcia
   * @returns Promise<void> - pusta odpowiedź w przypadku sukcesu
   * @throws FlashcardServiceError z kodem 404 jeśli flashcard nie istnieje lub nie należy do użytkownika
   */
  public async deleteFlashcard(flashcard_id: string): Promise<void> {
    const { error: delete_error, count } = await this.supabase
      .from("flashcards")
      .delete({ count: "exact" })
      .eq("id", flashcard_id)
      .eq("user_id", this.user_id);

    if (delete_error) {
      throw new Error(`Nie udało się usunąć fiszki: ${delete_error.message}`);
    }

    if (count === 0) {
      throw this.createServiceError(404, "Fiszka nie została znaleziona");
    }
  }

  private createServiceError(code: number, message: string): FlashcardServiceError {
    const service_error = new Error(message) as FlashcardServiceError;
    service_error.code = code;
    return service_error;
  }
}
