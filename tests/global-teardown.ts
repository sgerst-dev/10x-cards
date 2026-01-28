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

  console.log("\n🧹 Running global teardown - cleaning up test database...");

  try {
    // Create a browser context with authentication
    const browser = await chromium.launch();
    const context = await browser.newContext({
      storageState: "tests/.auth/user.json",
    });

    // Create API request context for database operations
    const request = context.request;
    const dbHelper = createDatabaseHelper(request, baseURL);

    // Delete all flashcards created during tests
    await dbHelper.deleteAllFlashcards();

    console.log("✅ Database cleanup completed successfully");

    await browser.close();
  } catch (error) {
    console.error("❌ Error during global teardown:", error);
    // Don't throw - we don't want teardown failures to fail the test run
  }
}

export default globalTeardown;
