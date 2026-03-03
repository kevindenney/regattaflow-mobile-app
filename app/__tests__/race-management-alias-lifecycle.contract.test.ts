import fs from 'node:fs';
import path from 'node:path';

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('race-management alias lifecycle contract', () => {
  it('defines redirect-only feature flag and alias telemetry tracker', () => {
    const flagsSource = readSource('lib/featureFlags.ts');
    const aliasRouteSource = readSource('app/(tabs)/race-management.tsx');
    const telemetrySource = readSource('lib/navigation/raceManagementAlias.ts');

    expect(flagsSource).toContain('RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY');
    expect(aliasRouteSource).toContain('trackRaceManagementAliasUsage');
    expect(aliasRouteSource).toContain("isFeatureEnabled('RACE_MANAGEMENT_ALIAS_REDIRECT_ONLY')");
    expect(aliasRouteSource).toContain('<Redirect href="/(tabs)/programs" />');
    expect(telemetrySource).toContain('ALIAS_COUNTER_KEY');
    expect(telemetrySource).toContain("logger.info('race_management_alias_hit'");
  });
});
