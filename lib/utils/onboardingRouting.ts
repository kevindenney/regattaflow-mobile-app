import { getDashboardRoute } from '@/lib/utils/userTypeRouting';

export type OnboardingPersona = 'sailor' | 'coach' | 'club' | string | null | undefined;

const normalizeDomain = (activeDomain?: string | null): string | null => {
  const normalized = String(activeDomain || '').toLowerCase().trim();
  if (!normalized) return null;
  if (normalized === 'institution') return 'nursing';
  if (normalized === 'club') return 'sailing';
  return normalized;
};

const SAILING_FIRST_ONBOARDING_ROUTES = new Set([
  '/onboarding/experience',
  '/onboarding/boat-class',
  '/onboarding/home-club',
  '/onboarding/primary-fleet',
  '/onboarding/find-races',
  '/onboarding/first-activity/race-calendar',
  '/onboarding/first-activity/add-race',
]);

const appendDomainParam = (route: string, domain: string): string => {
  const [pathname, query = ''] = route.split('?');
  if (!pathname.startsWith('/onboarding/')) {
    return route;
  }
  const params = new URLSearchParams(query);
  if (!params.has('domain')) {
    params.set('domain', domain);
  }
  const encoded = params.toString();
  return encoded ? `${pathname}?${encoded}` : pathname;
};

export function guardOnboardingRouteForDomain(route: string, activeDomain?: string | null): string {
  const domain = normalizeDomain(activeDomain);
  if (!domain || domain === 'sailing') {
    return route;
  }

  const [pathname] = route.split('?');
  if (SAILING_FIRST_ONBOARDING_ROUTES.has(pathname)) {
    return appendDomainParam('/onboarding/profile/name-photo', domain);
  }

  return appendDomainParam(route, domain);
}

export function getOrganizationOnboardingRoute(activeDomain?: string | null): string {
  const domain = normalizeDomain(activeDomain);
  if (domain && domain !== 'sailing') {
    return `/(auth)/club-onboarding-enhanced?domain=${encodeURIComponent(domain)}`;
  }
  return '/(auth)/club-onboarding-enhanced';
}

export function getOnboardingStartRoute(
  persona: OnboardingPersona,
  activeDomain?: string | null
): string {
  const domain = normalizeDomain(activeDomain);

  if (persona === 'sailor') {
    return guardOnboardingRouteForDomain('/onboarding/profile/name-photo', domain);
  }

  if (persona === 'coach') {
    return '/(auth)/coach-onboarding-welcome';
  }

  if (persona === 'club') {
    return getOrganizationOnboardingRoute(domain);
  }

  return getDashboardRoute(persona as any, domain) as string;
}
