/**
 * AI Circuit Breaker
 *
 * Prevents cascading failures when AI APIs (Claude, etc.) are down.
 * Tracks consecutive failures and stops making calls once a threshold
 * is reached, then periodically probes to detect recovery.
 *
 * States:
 *   CLOSED  – normal operation, requests pass through
 *   OPEN    – too many failures, requests are rejected immediately
 *   HALF_OPEN – cooldown elapsed, one probe request allowed through
 */

import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('CircuitBreaker');

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit (default: 3) */
  failureThreshold?: number;
  /** How long the circuit stays open before allowing a probe, in ms (default: 30 s) */
  cooldownMs?: number;
  /** Max cooldown after exponential back-off, in ms (default: 5 min) */
  maxCooldownMs?: number;
  /** Multiplier applied to cooldown after each consecutive open (default: 2) */
  backoffMultiplier?: number;
  /** Optional name for logging (default: 'AI') */
  name?: string;
}

const DEFAULTS: Required<CircuitBreakerOptions> = {
  failureThreshold: 3,
  cooldownMs: 30_000,
  maxCooldownMs: 5 * 60 * 1000,
  backoffMultiplier: 2,
  name: 'AI',
};

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private openedAt: number | null = null;
  private currentCooldown: number;
  private successesSinceReset = 0;

  private readonly opts: Required<CircuitBreakerOptions>;

  constructor(options?: CircuitBreakerOptions) {
    this.opts = { ...DEFAULTS, ...options };
    this.currentCooldown = this.opts.cooldownMs;
  }

  // ── Public API ──────────────────────────────────────────────

  /**
   * Execute `fn` through the circuit breaker.
   * If the circuit is OPEN and cooldown hasn't elapsed, throws immediately
   * with a descriptive error (no network call made).
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canAttempt()) {
      const retryIn = this.msUntilHalfOpen();
      throw new CircuitOpenError(
        `${this.opts.name} circuit breaker is OPEN – retry in ${Math.ceil(retryIn / 1000)}s`,
        retryIn,
      );
    }

    // If transitioning from OPEN → HALF_OPEN, let one request through
    if (this.state === 'OPEN') {
      this.transitionTo('HALF_OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /** Current circuit state */
  getState(): CircuitState {
    // Recalculate in case cooldown has elapsed since last check
    if (this.state === 'OPEN' && this.cooldownElapsed()) {
      return 'HALF_OPEN';
    }
    return this.state;
  }

  /** Diagnostic info for UI / logging */
  getStatus() {
    return {
      state: this.getState(),
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : null,
      currentCooldownMs: this.currentCooldown,
      msUntilHalfOpen: this.state === 'OPEN' ? this.msUntilHalfOpen() : 0,
    };
  }

  /** Manually reset the breaker (e.g. user added credits) */
  reset(): void {
    logger.info(`${this.opts.name} circuit breaker manually reset`);
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.openedAt = null;
    this.currentCooldown = this.opts.cooldownMs;
    this.successesSinceReset = 0;
  }

  // ── Internal helpers ────────────────────────────────────────

  private canAttempt(): boolean {
    if (this.state === 'CLOSED' || this.state === 'HALF_OPEN') return true;
    // OPEN – check if cooldown elapsed → allow a probe
    return this.cooldownElapsed();
  }

  private cooldownElapsed(): boolean {
    if (!this.openedAt) return true;
    return Date.now() - this.openedAt >= this.currentCooldown;
  }

  private msUntilHalfOpen(): number {
    if (!this.openedAt) return 0;
    return Math.max(0, this.currentCooldown - (Date.now() - this.openedAt));
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      logger.info(`${this.opts.name} circuit breaker recovered – closing circuit`);
    }
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.openedAt = null;
    this.currentCooldown = this.opts.cooldownMs; // reset backoff
    this.successesSinceReset++;
  }

  private onFailure(error: unknown): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      // Probe failed – reopen with increased cooldown
      this.currentCooldown = Math.min(
        this.currentCooldown * this.opts.backoffMultiplier,
        this.opts.maxCooldownMs,
      );
      this.transitionTo('OPEN');
      return;
    }

    if (this.consecutiveFailures >= this.opts.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  private transitionTo(newState: CircuitState): void {
    const prev = this.state;
    this.state = newState;

    if (newState === 'OPEN') {
      this.openedAt = Date.now();
      logger.warn(
        `${this.opts.name} circuit breaker OPEN after ${this.consecutiveFailures} failures ` +
          `(cooldown ${Math.ceil(this.currentCooldown / 1000)}s)`,
      );
    } else if (newState === 'HALF_OPEN') {
      logger.info(`${this.opts.name} circuit breaker HALF_OPEN – sending probe request`);
    }
  }
}

/**
 * Error thrown when the circuit is open (no network call was made).
 * Callers can use `retryAfterMs` to show a countdown to the user.
 */
export class CircuitOpenError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.name = 'CircuitOpenError';
    this.retryAfterMs = retryAfterMs;
  }
}

// ── Singleton for the main AI circuit breaker ─────────────────

let _aiCircuitBreaker: CircuitBreaker | null = null;

/** Shared circuit breaker instance for all AI/Claude API calls */
export function getAICircuitBreaker(): CircuitBreaker {
  if (!_aiCircuitBreaker) {
    _aiCircuitBreaker = new CircuitBreaker({
      name: 'Claude API',
      failureThreshold: 3,
      cooldownMs: 30_000,       // 30 s initial
      maxCooldownMs: 5 * 60_000, // 5 min max
      backoffMultiplier: 2,
    });
  }
  return _aiCircuitBreaker;
}

/** Reset the shared AI circuit breaker (e.g. user added credits) */
export function resetAICircuitBreaker(): void {
  getAICircuitBreaker().reset();
}
