import { Platform } from 'react-native';

const STORAGE_KEY = 'betterat_last_view_state';

export interface LastViewState {
  /** The selected step/race ID the user was viewing */
  selectedStepId: string | null;
  /** The interest slug that was active */
  interestSlug: string | null;
  /** Whether the grid/zoomed-out view was active */
  isGridView: boolean | null;
  /** Timestamp of when this was saved (for staleness checks) */
  savedAt: number;
}

/** Save the current view state (web only, no-op on native). */
export function saveLastViewState(state: Partial<LastViewState>): void {
  if (Platform.OS !== 'web') return;

  try {
    const existing = getLastViewState();
    const merged: LastViewState = {
      selectedStepId: 'selectedStepId' in state ? (state.selectedStepId ?? null) : (existing?.selectedStepId ?? null),
      interestSlug: 'interestSlug' in state ? (state.interestSlug ?? null) : (existing?.interestSlug ?? null),
      isGridView: 'isGridView' in state ? (state.isGridView ?? null) : (existing?.isGridView ?? null),
      savedAt: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Silently ignore — quota errors, SSR, etc.
  }
}

/** Read the previously saved view state (web only, returns null on native). */
export function getLastViewState(): LastViewState | null {
  if (Platform.OS !== 'web') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastViewState;
    // Ignore state older than 24 hours
    if (Date.now() - parsed.savedAt > 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Clear the saved view state (call on sign-out). */
export function clearLastViewState(): void {
  if (Platform.OS !== 'web') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore
  }
}
