import { test as setup, expect } from "@playwright/test";
import { createAuthHelper } from "../helpers/auth.helper";

const authFile = "tests/.auth/user.json";

/**
 * Global setup: authenticate once and save the state
 * This runs before all tests and saves authentication state to a file
 */
setup("authenticate", async ({ page }) => {
  const authHelper = createAuthHelper(page);

  // Perform authentication
  await authHelper.login();

  // Verify authentication was successful
  expect(page.url()).not.toContain("/auth/login");

  // Save the authenticated state to file
  await page.context().storageState({ path: authFile });
});
