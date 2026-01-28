import { APIRequestContext } from "@playwright/test";

/**
 * Database helper for managing test data
 * Provides methods for cleaning up flashcards after tests
 */
export class DatabaseHelper {
  private request: APIRequestContext;
  private baseURL: string;

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL;
  }

  /**
   * Delete a flashcard by ID
   * @param flashcardId - The ID of the flashcard to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteFlashcard(flashcardId: string): Promise<void> {
    const response = await this.request.delete(`${this.baseURL}/api/flashcards/delete-flashcard?id=${flashcardId}`);

    if (!response.ok() && response.status() !== 404) {
      throw new Error(`Failed to delete flashcard: ${response.status()} ${response.statusText()}`);
    }
  }

  /**
   * Get all flashcards for the authenticated user
   * @returns Array of flashcard objects
   */
  async getAllFlashcards(): Promise<{ id: string; front: string; back: string }[]> {
    const response = await this.request.get(`${this.baseURL}/api/flashcards/get-user-flashcards?page=1&limit=1000`);

    if (!response.ok()) {
      throw new Error(`Failed to get flashcards: ${response.status()} ${response.statusText()}`);
    }

    const data = await response.json();
    return data.flashcards || [];
  }

  /**
   * Delete all flashcards for the authenticated user
   * Useful for cleaning up after tests
   */
  async deleteAllFlashcards(): Promise<void> {
    const flashcards = await this.getAllFlashcards();

    // Delete all flashcards in parallel
    await Promise.all(flashcards.map((flashcard) => this.deleteFlashcard(flashcard.id)));
  }

  /**
   * Delete flashcards created during tests
   * Matches flashcards by front text pattern (e.g., "Test:")
   * @param pattern - Pattern to match against flashcard front text
   */
  async deleteFlashcardsByPattern(pattern: string | RegExp): Promise<void> {
    const flashcards = await this.getAllFlashcards();
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

    const testFlashcards = flashcards.filter((f) => regex.test(f.front));

    await Promise.all(testFlashcards.map((flashcard) => this.deleteFlashcard(flashcard.id)));
  }

  /**
   * Get flashcard by front text
   * @param frontText - The front text to search for
   * @returns The flashcard object or null if not found
   */
  async getFlashcardByFront(frontText: string): Promise<{ id: string; front: string; back: string } | null> {
    const flashcards = await this.getAllFlashcards();
    return flashcards.find((f) => f.front === frontText) || null;
  }

  /**
   * Verify flashcard exists in database
   * @param frontText - The front text to search for
   * @returns true if flashcard exists, false otherwise
   */
  async flashcardExists(frontText: string): Promise<boolean> {
    const flashcard = await this.getFlashcardByFront(frontText);
    return flashcard !== null;
  }
}

/**
 * Factory function to create a DatabaseHelper instance
 * @param request - Playwright APIRequestContext
 * @param baseURL - Base URL of the application
 * @returns DatabaseHelper instance
 */
export function createDatabaseHelper(request: APIRequestContext, baseURL: string): DatabaseHelper {
  return new DatabaseHelper(request, baseURL);
}
