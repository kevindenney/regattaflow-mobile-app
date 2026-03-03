import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RaceManagementAlias');
const ALIAS_COUNTER_KEY = 'rf_race_management_alias_hits';
const ALIAS_LAST_HIT_AT_KEY = 'rf_race_management_alias_last_hit_at';

export async function trackRaceManagementAliasUsage(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ALIAS_COUNTER_KEY);
    const count = Number.parseInt(String(raw || '0'), 10);
    const next = Number.isFinite(count) ? count + 1 : 1;
    const nowIso = new Date().toISOString();

    await Promise.all([
      AsyncStorage.setItem(ALIAS_COUNTER_KEY, String(next)),
      AsyncStorage.setItem(ALIAS_LAST_HIT_AT_KEY, nowIso),
    ]);

    logger.info('race_management_alias_hit', { count: next, at: nowIso });
  } catch (error) {
    logger.warn('Unable to persist race-management alias telemetry', { error });
  }
}
