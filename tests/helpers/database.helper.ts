import type { APIRequestContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Database helper for managing test data
 * Provides methods for cleaning up flashcards after tests
 */
export class DatabaseHelper {
  private request: APIRequestContext;
  private baseURL: string;
  private supabase;

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL;
    
    // Create Supabase client using environment variables
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.PUBLIC_SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY must be set in environment");
    }
    
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
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
   * Uses direct database query for efficiency
   */
  async deleteAllFlashcards(): Promise<void> {
    try {
      // Get E2E credentials from environment
      const email = process.env.E2E_USERNAME;
      const password = process.env.E2E_PASSWORD;

      if (!email || !password) {
        console.warn("E2E_USERNAME and E2E_PASSWORD must be set for cleanup");
        return;
      }

      // Sign in with E2E credentials
      const { data: authData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError || !authData.user) {
        console.error("Error signing in for cleanup:", signInError);
        return;
      }

      console.log(`🔐 Signed in as ${authData.user.email} for cleanup`);

      // Delete all flashcards for this user in a single query
      const { error: deleteError, count } = await this.supabase
        .from('flashcards')
        .delete({ count: 'exact' })
        .eq('user_id', authData.user.id);

      if (deleteError) {
        console.error("Error deleting flashcards:", deleteError);
        return;
      }

      console.log(`🗑️  Deleted ${count ?? 0} flashcard(s) for user ${authData.user.email}`);

      // Sign out after cleanup
      await this.supabase.auth.signOut();
    } catch (error) {
      console.error("Error during flashcard cleanup:", error);
    }
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
