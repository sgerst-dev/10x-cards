import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should load the login page successfully", async ({ page }) => {
    // Arrange & Act
    await page.goto("/auth/login");

    // Assert
    await expect(page).toHaveTitle(/10x Cards/i);
  });

  test("should display login form elements", async ({ page }) => {
    // Arrange & Act
    await page.goto("/auth/login");

    // Assert - verify form is present
    const emailInput = await page.locator('input[type="email"]');

    await expect(emailInput).toBeVisible();
  });
});
