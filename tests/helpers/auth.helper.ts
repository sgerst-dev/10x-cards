import type { Page } from "@playwright/test";

/**
 * Test authentication helper for logging into the application
 */
export class AuthHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Logs in to the application using credentials from environment variables
   * @throws Error if E2E_USERNAME or E2E_PASSWORD environment variables are not set
   */
  async login(): Promise<void> {
    const username = process.env.E2E_USERNAME as string;
    const password = process.env.E2E_PASSWORD as string;

    if (!username || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD environment variables must be set");
    }

    await this.loginWithCredentials(username, password);
  }

  /**
   * Logs in to the application with provided credentials
   * @param email - User email
   * @param password - User password
   */
  async loginWithCredentials(email: string, password: string): Promise<void> {
    // Navigate to login page
    await this.page.goto("/auth/login", { waitUntil: "networkidle" });

    // Fill in the login form
    await this.page.locator('input[type="email"]').fill(email);
    await this.page.locator('input[type="password"]').fill(password);

    // Submit the form - wait for navigation triggered by window.location.href
    await Promise.all([
      this.page.waitForNavigation({ 
        url: (url) => !url.pathname.includes("/auth/login"),
        timeout: 15000,
      }),
      this.page.locator('button[type="submit"]').click(),
    ]);
  }

  /**
   * Logs out from the application by clicking the logout button
   */
  async logout(): Promise<void> {
    // Ensure the page is fully loaded
    await this.page.waitForLoadState("networkidle");
    
    // Find the logout button and ensure it's visible and enabled
    const logoutButton = this.page.getByRole("button", { name: /wyloguj/i });
    await logoutButton.waitFor({ state: "visible" });
    
    // Click the logout button and wait for navigation
    await Promise.all([
      this.page.waitForURL(/\/auth\/login/, { timeout: 15000 }),
      logoutButton.click({ force: false }),
    ]);
  }

  /**
   * Checks if the user is currently logged in
   * @returns true if user is logged in, false otherwise
   */
  async isLoggedIn(): Promise<boolean> {
    // Check if we're not on the login page and have a valid session
    const currentUrl = this.page.url();
    return !currentUrl.includes("/auth/login");
  }
}

/**
 * Factory function to create an AuthHelper instance
 * @param page - Playwright Page instance
 * @returns AuthHelper instance
 */
export function createAuthHelper(page: Page): AuthHelper {
  return new AuthHelper(page);
}
