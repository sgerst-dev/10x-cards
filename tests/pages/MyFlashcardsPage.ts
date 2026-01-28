import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for My Flashcards Library page
 * Following best practices for maintainable E2E tests
 */
export class MyFlashcardsPage {
  readonly page: Page;

  // Page elements - using data-testid would be better, but we'll use accessible locators
  readonly addFlashcardButton: Locator;
  readonly flashcardGrid: Locator;
  readonly emptyStateMessage: Locator;

  // Dialog elements
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly frontTextarea: Locator;
  readonly backTextarea: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly frontCharacterCount: Locator;
  readonly backCharacterCount: Locator;
  readonly frontError: Locator;
  readonly backError: Locator;

  // Flashcard card elements
  readonly flashcardCards: Locator;

  // Alert dialog (delete confirmation)
  readonly alertDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;

  // Toast notifications
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main page elements
    this.addFlashcardButton = page.getByRole("button", {
      name: /Dodaj nową fiszkę/i,
    });
    this.flashcardGrid = page.locator('[class*="grid"]').filter({
      has: page.locator('[class*="card"]'),
    });
    this.emptyStateMessage = page.getByText(/nie masz jeszcze żadnych fiszek/i);

    // Dialog elements
    this.dialog = page.getByRole("dialog");
    this.dialogTitle = this.dialog.getByRole("heading");
    this.frontTextarea = this.dialog.locator("#front");
    this.backTextarea = this.dialog.locator("#back");
    this.saveButton = this.dialog.getByRole("button", { name: /zapisz/i });
    this.cancelButton = this.dialog.getByRole("button", { name: /anuluj/i });
    this.frontCharacterCount = this.dialog.locator("#front-count");
    this.backCharacterCount = this.dialog.locator("#back-count");
    this.frontError = this.dialog.locator("#front-error");
    this.backError = this.dialog.locator("#back-error");

    // Flashcard cards
    this.flashcardCards = page.locator("[data-flashcard-id]");

    // Alert dialog
    this.alertDialog = page.getByRole("alertdialog");
    this.confirmDeleteButton = this.alertDialog.getByRole("button", {
      name: /usuń/i,
    });
    this.cancelDeleteButton = this.alertDialog.getByRole("button", {
      name: /anuluj/i,
    });

    // Toast
    this.toast = page.locator("[data-sonner-toast]");
  }

  /**
   * Navigate to My Flashcards page
   */
  async goto(): Promise<void> {
    await this.page.goto("/my-flashcards");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Open the Add Flashcard dialog
   */
  async openAddDialog(): Promise<void> {
    await this.addFlashcardButton.click();
    await expect(this.dialog).toBeVisible();
    await expect(this.dialogTitle).toHaveText(/dodaj fiszkę/i);
  }

  /**
   * Fill in the flashcard form
   */
  async fillFlashcardForm(front: string, back: string): Promise<void> {
    await this.frontTextarea.fill(front);
    await this.backTextarea.fill(back);
  }

  /**
   * Submit the flashcard form
   */
  async submitForm(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Cancel the flashcard form
   */
  async cancelForm(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Create a new flashcard (full flow)
   */
  async createFlashcard(front: string, back: string): Promise<void> {
    await this.openAddDialog();
    await this.fillFlashcardForm(front, back);
    await this.submitForm();

    // Wait for dialog to close
    await expect(this.dialog).not.toBeVisible();
  }

  /**
   * Get a flashcard card by its front text
   */
  getFlashcardByFront(frontText: string): Locator {
    return this.page.locator("[data-flashcard-id]").filter({ hasText: frontText });
  }

  /**
   * Edit a flashcard by its front text
   */
  async editFlashcard(oldFront: string, newFront: string, newBack: string): Promise<void> {
    const flashcard = this.getFlashcardByFront(oldFront);
    const editButton = flashcard.getByRole("button", { name: /edytuj/i });

    await editButton.click();
    await expect(this.dialog).toBeVisible();
    await expect(this.dialogTitle).toHaveText(/edytuj fiszkę/i);

    await this.fillFlashcardForm(newFront, newBack);
    await this.submitForm();

    // Wait for dialog to close
    await expect(this.dialog).not.toBeVisible();
  }

  /**
   * Delete a flashcard by its front text
   */
  async deleteFlashcard(frontText: string): Promise<void> {
    const flashcard = this.getFlashcardByFront(frontText);
    const deleteButton = flashcard.getByRole("button", { name: /usuń/i });

    await deleteButton.click();
    await expect(this.alertDialog).toBeVisible();

    await this.confirmDeleteButton.click();

    // Wait for alert dialog to close
    await expect(this.alertDialog).not.toBeVisible();
  }

  /**
   * Get the count of flashcards on the page
   */
  async getFlashcardCount(): Promise<number> {
    try {
      return await this.flashcardCards.count();
    } catch {
      return 0;
    }
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return await this.emptyStateMessage.isVisible();
  }

  /**
   * Wait for success toast
   */
  async waitForSuccessToast(message?: string): Promise<void> {
    await expect(this.toast).toBeVisible();
    if (message) {
      await expect(this.toast).toContainText(message);
    }
  }

  /**
   * Wait for error toast
   */
  async waitForErrorToast(message?: string): Promise<void> {
    await expect(this.toast).toBeVisible();
    if (message) {
      await expect(this.toast).toContainText(message);
    }
  }

  /**
   * Verify flashcard exists on page
   */
  async verifyFlashcardExists(frontText: string): Promise<void> {
    const flashcard = this.getFlashcardByFront(frontText);
    await expect(flashcard).toBeVisible();
  }

  /**
   * Verify flashcard does not exist on page
   */
  async verifyFlashcardNotExists(frontText: string): Promise<void> {
    const flashcard = this.getFlashcardByFront(frontText);
    await expect(flashcard).not.toBeVisible();
  }

  /**
   * Get character count for front textarea
   */
  async getFrontCharacterCount(): Promise<string> {
    return (await this.frontCharacterCount.textContent()) || "";
  }

  /**
   * Get character count for back textarea
   */
  async getBackCharacterCount(): Promise<string> {
    return (await this.backCharacterCount.textContent()) || "";
  }

  /**
   * Verify validation error is shown for front field
   */
  async verifyFrontError(expectedError: string): Promise<void> {
    await expect(this.frontError).toBeVisible();
    await expect(this.frontError).toHaveText(expectedError);
  }

  /**
   * Verify validation error is shown for back field
   */
  async verifyBackError(expectedError: string): Promise<void> {
    await expect(this.backError).toBeVisible();
    await expect(this.backError).toHaveText(expectedError);
  }

  /**
   * Verify save button is disabled
   */
  async verifySaveButtonDisabled(): Promise<void> {
    await expect(this.saveButton).toBeDisabled();
  }

  /**
   * Verify save button is enabled
   */
  async verifySaveButtonEnabled(): Promise<void> {
    await expect(this.saveButton).toBeEnabled();
  }
}
