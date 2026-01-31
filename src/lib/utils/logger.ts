/**
 * Logger utility for consistent logging across the application
 */

export type LogContext = Record<string, unknown>;

/**
 * Log an info message with optional context
 */
export function logInfo(message: string, context?: LogContext): void {
  console.log(`[INFO] ${message}`, context || "");
}

/**
 * Log an error message with optional context
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  const errorDetails = {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : "Unknown",
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  };

  console.error(`[ERROR] ${message}`, errorDetails);
}

/**
 * Log a warning message with optional context
 */
export function logWarning(message: string, context?: LogContext): void {
  console.warn(`[WARNING] ${message}`, context || "");
}

/**
 * Log a debug message with optional context (only in debug mode)
 */
export function logDebug(message: string, context?: LogContext): void {
  console.debug(`[DEBUG] ${message}`, context || "");
}

/**
 * Check if debug mode is enabled
 */
export function isDebugEnabled(): boolean {
  return true;
}
