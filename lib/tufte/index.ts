/**
 * Tufte-Style Data Visualization Utilities
 *
 * Inspired by Edward Tufte's principles:
 * - High data-ink ratio
 * - Sparklines (word-sized graphics)
 * - Minimal chartjunk
 * - Dense, informative displays
 */

// Unicode block characters for bar charts (from empty to full)
const BLOCK_CHARS = ['░', '▒', '▓', '█'];
const EMPTY_BLOCK = '░';
const FULL_BLOCK = '█';

// Unicode sparkline characters (8 levels of height)
const SPARKLINE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/**
 * Generate a Unicode bar representation of a percentage value
 * @param value - Percentage value (0-100)
 * @param width - Number of characters wide (default 10)
 * @returns Unicode string like "████████░░" for 80%
 */
export function unicodeBar(value: number, width: number = 10): string {
  const clampedValue = Math.max(0, Math.min(100, value));
  const filledCount = Math.round((clampedValue / 100) * width);
  const emptyCount = width - filledCount;
  return FULL_BLOCK.repeat(filledCount) + EMPTY_BLOCK.repeat(emptyCount);
}

/**
 * Generate a Unicode sparkline from an array of values
 * @param values - Array of numeric values
 * @param options - Configuration options
 * @returns Unicode string like "▁▂▃▄▅▆▇█"
 */
export function sparkline(
  values: number[],
  options: {
    min?: number;
    max?: number;
    width?: number; // If set, will sample/interpolate to this width
  } = {}
): string {
  if (!values || values.length === 0) return '';

  // Calculate min/max from data if not provided
  const min = options.min ?? Math.min(...values);
  const max = options.max ?? Math.max(...values);
  const range = max - min || 1; // Avoid division by zero

  // Sample values if width is specified and different from values length
  let sampledValues = values;
  if (options.width && options.width !== values.length) {
    sampledValues = sampleArray(values, options.width);
  }

  // Map each value to a sparkline character
  return sampledValues
    .map((v) => {
      const normalized = (v - min) / range;
      const index = Math.round(normalized * (SPARKLINE_CHARS.length - 1));
      return SPARKLINE_CHARS[Math.max(0, Math.min(SPARKLINE_CHARS.length - 1, index))];
    })
    .join('');
}

/**
 * Generate a trend arrow based on comparison
 * @param current - Current value
 * @param previous - Previous value
 * @param threshold - Minimum change to show arrow (default 0.5)
 * @returns Arrow character or empty string
 */
export function trendArrow(
  current: number,
  previous: number,
  threshold: number = 0.5
): string {
  const diff = current - previous;
  if (Math.abs(diff) < threshold) return '→';
  return diff > 0 ? '↑' : '↓';
}

/**
 * Format a position ordinal (1st, 2nd, 3rd, etc.)
 */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Sample an array to a specific length using linear interpolation
 */
function sampleArray(arr: number[], targetLength: number): number[] {
  if (arr.length === 0) return [];
  if (arr.length === 1) return Array(targetLength).fill(arr[0]);
  if (targetLength >= arr.length) return arr;

  const result: number[] = [];
  const step = (arr.length - 1) / (targetLength - 1);

  for (let i = 0; i < targetLength; i++) {
    const pos = i * step;
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);
    const weight = pos - lower;

    if (lower === upper) {
      result.push(arr[lower]);
    } else {
      result.push(arr[lower] * (1 - weight) + arr[upper] * weight);
    }
  }

  return result;
}

/**
 * Format a number with consistent decimal places
 */
export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Create a simple ASCII divider line
 */
export function dividerLine(width: number = 60): string {
  return '─'.repeat(width);
}

/**
 * Pad a string to a specific width (for alignment)
 */
export function padEnd(str: string, width: number): string {
  return str.padEnd(width);
}

export function padStart(str: string, width: number): string {
  return str.padStart(width);
}
