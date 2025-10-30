/**
 * Environment-aware logging utility for RegattaFlow
 *
 * Usage:
 *   const logger = createLogger('ComponentName');
 *   logger.debug('Debug info', { data }); // Only in development
 *   logger.info('Info message');           // Only in development
 *   logger.warn('Warning message');        // Always logged
 *   logger.error('Error occurred', error); // Always logged
 *
 * Verbosity Control:
 *   Set SHOW_VERBOSE_LOGS = false to hide noisy component logs
 *   Contexts in VERBOSE_CONTEXTS will only log when SHOW_VERBOSE_LOGS = true
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

// Verbosity control - set to false to reduce console noise during development
const SHOW_VERBOSE_LOGS = false; // Set to true when you need detailed debugging

// Contexts that are considered "verbose" (noisy during normal development)
const VERBOSE_CONTEXTS = [
  'RealtimeService',
  'RacesScreen',
  '_layout',
  'AuthProvider',
  'RaceDetailScrollable',
  'FleetOverview',
];

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Debug-level logging - only shown in development
   * Use for detailed debugging information
   * Respects verbosity settings for noisy contexts
   */
  debug(...args: any[]) {
    if (isDevelopment) {
      // Skip verbose contexts when verbosity is disabled
      if (!SHOW_VERBOSE_LOGS && VERBOSE_CONTEXTS.includes(this.context)) {
        return;
      }
      console.log(`[${this.context}]`, ...args);
    }
  }

  /**
   * Info-level logging - only shown in development
   * Use for general informational messages
   * Respects verbosity settings for noisy contexts
   */
  info(...args: any[]) {
    if (isDevelopment) {
      // Skip verbose contexts when verbosity is disabled
      if (!SHOW_VERBOSE_LOGS && VERBOSE_CONTEXTS.includes(this.context)) {
        return;
      }
      console.info(`[${this.context}]`, ...args);
    }
  }

  /**
   * Warning-level logging - always shown
   * Use for non-critical issues that should be addressed
   */
  warn(...args: any[]) {
    console.warn(`[${this.context}]`, ...args);
  }

  /**
   * Error-level logging - always shown
   * Use for errors and exceptions
   */
  error(...args: any[]) {
    console.error(`[${this.context}]`, ...args);
  }

  /**
   * Creates a child logger with nested context
   * Example: logger.child('SubComponent') creates '[ParentContext:SubComponent]'
   */
  child(subContext: string): Logger {
    return new Logger(`${this.context}:${subContext}`);
  }
}

/**
 * Creates a new logger instance with the given context
 * @param context - The context/component name for the logger
 * @returns Logger instance
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context);
};

/**
 * Default logger for global use
 */
export const logger = createLogger('App');
