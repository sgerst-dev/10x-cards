/**
 * Test Data Factory
 * Generates randomized test data with timestamps for E2E tests
 */

/**
 * Generate a unique test identifier using timestamp and random string
 */
function generateTestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}`;
}

/**
 * Generate random flashcard front text
 * @param prefix - Optional prefix for the text (default: "E2E Test")
 * @returns Random front text with timestamp
 */
export function generateFlashcardFront(prefix = "E2E Test"): string {
  const testId = generateTestId();
  return `[${prefix}:${testId}] What is TypeScript?`;
}

/**
 * Generate random flashcard back text
 * @returns Random back text with timestamp
 */
export function generateFlashcardBack(): string {
  const testId = generateTestId();
  return `[Test:${testId}] TypeScript is a strongly typed programming language that builds on JavaScript.`;
}

/**
 * Generate a complete flashcard test data object
 * @param prefix - Optional prefix for the flashcard (default: "E2E Test")
 * @returns Object with front and back text
 */
export function generateFlashcard(prefix = "E2E Test"): {
  front: string;
  back: string;
} {
  const testId = generateTestId();
  return {
    front: `[${prefix}:${testId}] Question text`,
    back: `[${prefix}:${testId}] Answer text`,
  };
}

/**
 * Generate a flashcard with custom content but maintaining the test prefix
 * @param frontContent - Custom front content
 * @param backContent - Custom back content
 * @param prefix - Optional prefix for the flashcard (default: "E2E Test")
 * @returns Object with front and back text
 */
export function generateCustomFlashcard(
  frontContent: string,
  backContent: string,
  prefix = "E2E Test"
): {
  front: string;
  back: string;
} {
  const testId = generateTestId();
  return {
    front: `[${prefix}:${testId}] ${frontContent}`,
    back: `[${prefix}:${testId}] ${backContent}`,
  };
}

/**
 * Generate multiple flashcards
 * @param count - Number of flashcards to generate
 * @param prefix - Optional prefix for the flashcards (default: "E2E Test")
 * @returns Array of flashcard objects
 */
export function generateFlashcards(count: number, prefix = "E2E Test"): { front: string; back: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const testId = generateTestId();
    return {
      front: `[${prefix}:${testId}] Question ${i + 1}`,
      back: `[${prefix}:${testId}] Answer ${i + 1}`,
    };
  });
}

/**
 * Generate flashcard with long text for validation testing
 * @param frontLength - Length of front text (default: 250 - max limit)
 * @param backLength - Length of back text (default: 500 - max limit)
 * @param prefix - Optional prefix for the flashcard (default: "E2E Test")
 * @returns Object with front and back text
 */
export function generateLongFlashcard(
  frontLength = 250,
  backLength = 500,
  prefix = "E2E Test"
): {
  front: string;
  back: string;
} {
  const testId = generateTestId();
  const prefixText = `[${prefix}:${testId}] `;

  // Calculate remaining space after prefix
  const frontRemaining = frontLength - prefixText.length;
  const backRemaining = backLength - prefixText.length;

  return {
    front: prefixText + "a".repeat(Math.max(0, frontRemaining)),
    back: prefixText + "b".repeat(Math.max(0, backRemaining)),
  };
}

/**
 * Generate flashcard with special characters for edge case testing
 * @param prefix - Optional prefix for the flashcard (default: "E2E Test")
 * @returns Object with front and back text containing special characters
 */
export function generateSpecialCharFlashcard(prefix = "E2E Test"): {
  front: string;
  back: string;
} {
  const testId = generateTestId();
  return {
    front: `[${prefix}:${testId}] What is "escaping" in <JavaScript>?`,
    back: `[${prefix}:${testId}] Escaping is using \\ to include special chars like "quotes" & <tags>`,
  };
}

/**
 * Extract test ID from flashcard text
 * Useful for debugging and tracking specific test flashcards
 * @param text - Flashcard front or back text
 * @returns Test ID or null if not found
 */
export function extractTestId(text: string): string | null {
  const match = text.match(/\[.*?:(\d+_[a-z0-9]+)\]/);
  return match ? match[1] : null;
}

/**
 * Check if text is a test flashcard
 * @param text - Text to check
 * @returns true if text matches test flashcard pattern
 */
export function isTestFlashcard(text: string): boolean {
  return /^\[.*?:\d+_[a-z0-9]+\]/.test(text);
}

/**
 * Get the test prefix pattern for database cleanup
 * @returns RegExp pattern to match all test flashcards
 */
export function getTestFlashcardPattern(): RegExp {
  return /^\[.*?:\d+_[a-z0-9]+\]/;
}
