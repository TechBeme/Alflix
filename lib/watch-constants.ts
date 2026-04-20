/**
 * Shared constants for watch progress tracking.
 * Safe to import from both client and server components.
 */

/**
 * Minimum progress threshold - videos must reach this % to appear in watch history/continue watching.
 * This prevents accidental taps from creating history entries.
 */
export const MINIMUM_PROGRESS_THRESHOLD = 10;

/**
 * Completion threshold - videos at or above this % are considered "watched".
 * Accounts for credits at the end of movies/episodes.
 */
export const COMPLETION_THRESHOLD = 90;
