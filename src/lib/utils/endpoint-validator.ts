/**
 * Endpoint validation utilities for development and testing
 */

import type { GenerateFlashcardsProposalsCommand, GenerateFlashcardsProposalsResponse } from "../../types";

/**
 * Sample valid request payload for testing
 */
export const sampleValidRequest: GenerateFlashcardsProposalsCommand = {
  source_text:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur? At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
};

/**
 * Sample requests that should fail validation
 */
export const sampleInvalidRequests = {
  tooShort: {
    source_text: "Too short text",
  },
  tooLong: {
    source_text: "A".repeat(10001), // Over 10,000 characters
  },
  missing: {},
  wrongType: {
    source_text: 123,
  },
};

/**
 * Expected response structure type check
 */
export function validateResponseStructure(response: GenerateFlashcardsProposalsResponse): boolean {
  return (
    typeof response.generation_id === "string" &&
    typeof response.generated_count === "number" &&
    Array.isArray(response.flashcards_proposals) &&
    response.flashcards_proposals.every(
      (proposal) =>
        typeof proposal.front === "string" && typeof proposal.back === "string" && proposal.source === "ai_generated"
    )
  );
}

/**
 * Base test scenario interface
 */
interface BaseTestScenario {
  description: string;
  payload: unknown;
  expectedStatus: number;
  skipAuth?: boolean;
}

/**
 * Test scenarios for different error conditions
 */
export const testScenarios: Record<string, BaseTestScenario> = {
  validRequest: {
    description: "Valid request with proper source_text",
    payload: sampleValidRequest,
    expectedStatus: 200,
  },
  shortText: {
    description: "Text too short (< 1000 characters)",
    payload: sampleInvalidRequests.tooShort,
    expectedStatus: 400,
  },
  longText: {
    description: "Text too long (> 10000 characters)",
    payload: sampleInvalidRequests.tooLong,
    expectedStatus: 400,
  },
  missingText: {
    description: "Missing source_text field",
    payload: sampleInvalidRequests.missing,
    expectedStatus: 400,
  },
  wrongType: {
    description: "Wrong type for source_text",
    payload: sampleInvalidRequests.wrongType,
    expectedStatus: 400,
  },
  noAuth: {
    description: "No authentication token",
    payload: sampleValidRequest,
    expectedStatus: 401,
    skipAuth: true,
  },
};

/**
 * Utility to create test curl commands for manual testing
 */
export function generateCurlCommands(baseUrl = "http://localhost:3000"): string[] {
  const commands: string[] = [];

  for (const [, scenario] of Object.entries(testScenarios)) {
    if (scenario.skipAuth) {
      commands.push(`# ${scenario.description}
curl -X POST "${baseUrl}/api/flashcards/generate-proposals" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(scenario.payload)}'
`);
    } else {
      commands.push(`# ${scenario.description}
curl -X POST "${baseUrl}/api/flashcards/generate-proposals" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \\
  -d '${JSON.stringify(scenario.payload)}'
`);
    }
  }

  return commands;
}

/**
 * Development helper to log test commands
 */
export function logTestCommands(): void {
  const commands = generateCurlCommands();
  // eslint-disable-next-line no-console
  console.log("=== Test Commands for /api/flashcards/generate-proposals ===");
  commands.forEach((cmd) => {
    // eslint-disable-next-line no-console
    console.log(cmd);
  });
}
