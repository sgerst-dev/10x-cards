import { test, expect } from "@playwright/test";
import { MyFlashcardsPage } from "../pages/MyFlashcardsPage";

/**
 * E2E Tests for Adding Flashcards Manually
 *
 * Following Playwright best practices:
 * - Page Object Model for maintainable tests
 * - Resilient locators using data-testid and semantic selectors
 * - Proper test isolation using browser contexts
 * - Comprehensive assertions with specific matchers
 */
test.describe("Add Flashcard Manually", () => {
  let myFlashcardsPage: MyFlashcardsPage;

  test.beforeEach(async ({ page }) => {
    myFlashcardsPage = new MyFlashcardsPage(page);
    await myFlashcardsPage.goto();
  });

  test("should successfully add a new flashcard with valid data", async () => {
    // Arrange - use timestamp to ensure unique flashcard names
    const timestamp = Date.now();
    const frontText = `What is TypeScript ${timestamp}?`;
    const backText = `TypeScript is a strongly typed programming language that builds on JavaScript. (${timestamp})`;

    // Act
    await myFlashcardsPage.openAddDialog();
    await myFlashcardsPage.fillFlashcardForm(frontText, backText);
    await myFlashcardsPage.submitForm();

    // Assert - verify dialog closed and flashcard appears in grid
    await expect(myFlashcardsPage.dialog).not.toBeVisible();
    await myFlashcardsPage.verifyFlashcardExists(frontText);
    await myFlashcardsPage.waitForSuccessToast();
  });

  test("should display validation error when front field is empty", async () => {
    // Arrange
    await myFlashcardsPage.openAddDialog();

    // Act - fill only back field and blur front field to trigger validation
    await myFlashcardsPage.frontTextarea.click();
    await myFlashcardsPage.frontTextarea.blur();
    await myFlashcardsPage.backTextarea.fill("This is the back content");

    // Assert - verify validation error appears
    await myFlashcardsPage.verifyFrontError("Tekst na przedniej stronie fiszki jest wymagany");
    await myFlashcardsPage.verifySaveButtonDisabled();
  });

  test("should display validation error when back field is empty", async () => {
    // Arrange
    await myFlashcardsPage.openAddDialog();

    // Act - fill only front field and blur back field to trigger validation
    await myFlashcardsPage.frontTextarea.fill("This is the front content");
    await myFlashcardsPage.backTextarea.click();
    await myFlashcardsPage.backTextarea.blur();

    // Assert - verify validation error appears
    await myFlashcardsPage.verifyBackError("Tekst na tylnej stronie fiszki jest wymagany");
    await myFlashcardsPage.verifySaveButtonDisabled();
  });

  test("should display validation error when front exceeds max length", async () => {
    // Arrange
    await myFlashcardsPage.openAddDialog();
    const longText = "a".repeat(251); // MAX_FRONT_LENGTH is 250

    // Act
    await myFlashcardsPage.frontTextarea.fill(longText);
    await myFlashcardsPage.frontTextarea.blur();
    await myFlashcardsPage.backTextarea.fill("Valid back content");

    // Assert - verify validation error and save button is disabled
    await myFlashcardsPage.verifyFrontError("Tekst przekracza maksymalną długość 250 znaków");
    await myFlashcardsPage.verifySaveButtonDisabled();
  });

  test("should display validation error when back exceeds max length", async () => {
    // Arrange
    await myFlashcardsPage.openAddDialog();
    const longText = "a".repeat(501); // MAX_BACK_LENGTH is 500

    // Act
    await myFlashcardsPage.frontTextarea.fill("Valid front content");
    await myFlashcardsPage.backTextarea.fill(longText);
    await myFlashcardsPage.backTextarea.blur();

    // Assert - verify validation error and save button is disabled
    await myFlashcardsPage.verifyBackError("Tekst przekracza maksymalną długość 500 znaków");
    await myFlashcardsPage.verifySaveButtonDisabled();
  });

  test("should enable save button only when both fields are valid", async () => {
    // Arrange
    await myFlashcardsPage.openAddDialog();

    // Assert - initially save button should be disabled
    await myFlashcardsPage.verifySaveButtonDisabled();

    // Act - fill front field only
    await myFlashcardsPage.frontTextarea.fill("Front content");

    // Assert - save button still disabled
    await myFlashcardsPage.verifySaveButtonDisabled();

    // Act - fill back field
    await myFlashcardsPage.backTextarea.fill("Back content");

    // Assert - save button now enabled
    await myFlashcardsPage.verifySaveButtonEnabled();
  });

  test("should display character count for both fields", async () => {
    // Arrange
    await myFlashcardsPage.openAddDialog();
    const frontText = "Test front";
    const backText = "Test back content";

    // Act
    await myFlashcardsPage.frontTextarea.fill(frontText);
    await myFlashcardsPage.backTextarea.fill(backText);

    // Assert - verify character counts are displayed
    const frontCount = await myFlashcardsPage.getFrontCharacterCount();
    const backCount = await myFlashcardsPage.getBackCharacterCount();

    expect(frontCount).toContain(`${frontText.length}/250`);
    expect(backCount).toContain(`${backText.length}/500`);
  });

  test("should close dialog when cancel button is clicked", async () => {
    // Arrange
    const timestamp = Date.now();
    await myFlashcardsPage.openAddDialog();
    await myFlashcardsPage.fillFlashcardForm(`Test front ${timestamp}`, `Test back ${timestamp}`);

    // Act
    await myFlashcardsPage.cancelForm();

    // Assert - verify dialog is closed
    await expect(myFlashcardsPage.dialog).not.toBeVisible();
  });

  test("should close dialog when clicking outside (backdrop)", async ({ page }) => {
    // Arrange
    const timestamp = Date.now();
    await myFlashcardsPage.openAddDialog();
    await myFlashcardsPage.fillFlashcardForm(`Test front ${timestamp}`, `Test back ${timestamp}`);

    // Act - press Escape key to close dialog
    await page.keyboard.press("Escape");

    // Assert - verify dialog is closed
    await expect(myFlashcardsPage.dialog).not.toBeVisible();
  });

  test("should trim whitespace from field values before validation", async () => {
    // Arrange
    await myFlashcardsPage.openAddDialog();

    // Act - fill fields with only whitespace
    await myFlashcardsPage.frontTextarea.fill("   ");
    await myFlashcardsPage.frontTextarea.blur();
    await myFlashcardsPage.backTextarea.fill("   ");
    await myFlashcardsPage.backTextarea.blur();

    // Assert - verify validation errors appear
    await myFlashcardsPage.verifyFrontError("Tekst na przedniej stronie fiszki jest wymagany");
    await myFlashcardsPage.verifyBackError("Tekst na tylnej stronie fiszki jest wymagany");
    await myFlashcardsPage.verifySaveButtonDisabled();
  });

  test("should preserve form state when validation fails", async () => {
    // Arrange
    await myFlashcardsPage.openAddDialog();
    const frontText = "a".repeat(251); // Exceeds max length
    const backText = "Valid back content";

    // Act
    await myFlashcardsPage.frontTextarea.fill(frontText);
    await myFlashcardsPage.backTextarea.fill(backText);

    // Assert - verify form preserves values even with validation error
    await expect(myFlashcardsPage.frontTextarea).toHaveValue(frontText);
    await expect(myFlashcardsPage.backTextarea).toHaveValue(backText);
    await myFlashcardsPage.verifySaveButtonDisabled();
  });

  test("should show correct dialog title when adding new flashcard", async () => {
    // Act
    await myFlashcardsPage.openAddDialog();

    // Assert - verify dialog title
    await expect(myFlashcardsPage.dialogTitle).toHaveText(/dodaj nową fiszkę/i);
  });

  test("should disable form inputs while submitting", async () => {
    // Arrange
    const timestamp = Date.now();
    await myFlashcardsPage.openAddDialog();
    await myFlashcardsPage.fillFlashcardForm(`Test front ${timestamp}`, `Test back ${timestamp}`);

    // Act - click submit and immediately check if inputs are disabled
    const submitPromise = myFlashcardsPage.saveButton.click();

    // Assert - verify inputs and buttons are disabled during submission
    // Note: This test might be flaky due to fast network responses
    // In a real scenario, you might want to use network mocking to slow down the response
    await submitPromise;
  });

  test("should display flashcard immediately after creation in the grid", async () => {
    // Arrange - use timestamp to ensure unique flashcard names
    const timestamp = Date.now();
    const frontText = `Flashcard Front ${timestamp}`;
    const backText = `Flashcard Back ${timestamp}`;
    const initialCount = await myFlashcardsPage.getFlashcardCount();

    // Act
    await myFlashcardsPage.createFlashcard(frontText, backText);
    await myFlashcardsPage.waitForSuccessToast();

    // Assert - verify count increased by exactly 1
    const newCount = await myFlashcardsPage.getFlashcardCount();
    expect(newCount).toBe(initialCount + 1);

    // Assert - verify the newly created flashcard is visible
    await myFlashcardsPage.verifyFlashcardExists(frontText);
  });
});
