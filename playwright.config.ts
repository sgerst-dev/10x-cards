import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  globalTeardown: "./tests/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Setup project - runs first to authenticate
    {
      name: "setup",
      testMatch: /.*\.setup\.ts$/,
      testDir: "./tests/setup",
    },
    // Chromium tests without authentication (for login/register tests only)
    {
      name: "chromium-unauthenticated",
      testMatch: /.*(login|register)\.spec\.ts$/,
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    // Chromium tests with authentication (all tests except login/register)
    {
      name: "chromium",
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /.*(login|register)\.spec\.ts$/,
      testDir: "./tests/e2e",
      use: {
        ...devices["Desktop Chrome"],
        // Use saved authentication state for all tests
        storageState: "tests/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
