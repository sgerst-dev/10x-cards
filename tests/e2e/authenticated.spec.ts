import { test, expect } from "@playwright/test";
import { createAuthHelper } from "../helpers/auth.helper";

/**
 * Authenticated User Tests
 *
 * Note: These tests automatically use the authentication state from the setup project.
 * No need to call authHelper.login() - the user is already authenticated!
 */
test.describe("Authenticated User Tests", () => {
  test("should be already authenticated", async ({ page }) => {
    // Navigate to home page
    await page.goto("/");

    // Assert - verify we're authenticated (not redirected to login)
    expect(page.url()).not.toContain("/auth/login");
    await expect(page).toHaveTitle(/10x Cards/i);
  });

  test("should access protected page", async ({ page }) => {
    // Navigate to a protected page (e.g., flashcards library)
    await page.goto("/my-flashcards");

    // Assert - verify we can access the protected page directly
    await expect(page).toHaveURL(/\/my-flashcards/);
  });

  test("should logout successfully", async ({ page }) => {
    // Arrange - navigate to a page where the logout button is visible
    await page.goto("/my-flashcards");
    const authHelper = createAuthHelper(page);

    // Act - logout by clicking the logout button
    await authHelper.logout();

    // Assert - verify we're redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // Additional verification - try to access a protected page
    await page.goto("/my-flashcards");

    // Should still be on login page (or redirected back to it)
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
