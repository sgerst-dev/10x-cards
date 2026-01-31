import { chromium, FullConfig } from "@playwright/test";
import { createDatabaseHelper } from "./helpers/database.helper";
import dotenv from "dotenv";
import path from "path";

/**
 * Global teardown script
 * Runs once after all tests complete to clean up test data from the database
 */
async function globalTeardown(config: FullConfig) {
  // Load test environment variables
  dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3000";

  try {
    // Create a minimal browser context for the request API
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const request = context.request;

    // Create database helper (it will handle login internally)
    const dbHelper = createDatabaseHelper(request, baseURL);

    // Delete all flashcards created during tests
    await dbHelper.deleteAllFlashcards();

    await browser.close();
  } catch {
    // Don't throw - we don't want teardown failures to fail the test run
  }
}

export default globalTeardown;
