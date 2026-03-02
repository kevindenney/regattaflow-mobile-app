import type { OrganizationType, WorkspaceDomain } from '@/providers/OrganizationProvider';

export type OnboardingDomain = 'sailing' | 'nursing';

type WelcomeCopy = {
  greeting: string;
  subMessage: string;
};

type FeatureCardCopy = {
  key: string;
  title: string;
  description: string;
  badge?: string;
};

type FeaturesCopy = {
  subtitleLead: string;
  subtitleTail: string;
  cards: FeatureCardCopy[];
};

const normalizeDomain = (value: string | null | undefined): string => String(value || '').toLowerCase().trim();

export function resolveOnboardingDomain(params: {
  paramDomain?: string | null;
  activeDomain?: WorkspaceDomain | string | null;
  organizationType?: OrganizationType | string | null;
}): OnboardingDomain {
  const explicitDomain = normalizeDomain(params.paramDomain);
  const workspaceDomain = normalizeDomain(params.activeDomain);
  const organizationType = normalizeDomain(params.organizationType);

  if (organizationType === 'institution') {
    return 'nursing';
  }
  if (explicitDomain === 'sailing') {
    return 'sailing';
  }
  if (explicitDomain) {
    return 'nursing';
  }
  if (workspaceDomain === 'sailing') {
    return 'sailing';
  }
  return 'nursing';
}

export const ONBOARDING_WELCOME_COPY: Record<OnboardingDomain, WelcomeCopy> = {
  sailing: {
    greeting: "Hi. I'm working hard to build my dream app for tracking your sailing adventures.",
    subMessage: 'I hope you love using RegattaFlow to track your days on the water.',
  },
  nursing: {
    greeting: "Hi. I'm building RegattaFlow to help teams run better programs and learning experiences.",
    subMessage: 'I hope this helps you stay organized, connected, and improving every week.',
  },
};

export const ONBOARDING_FEATURES_COPY: Record<OnboardingDomain, FeaturesCopy> = {
  sailing: {
    subtitleLead: 'Waiting for fresh wind?',
    subtitleTail: 'Get the most out of RegattaFlow.',
    cards: [
      {
        key: 'watch-app',
        title: 'Install the Watch App',
        description: 'Track your races and performance directly from your wrist.',
        badge: 'Planned',
      },
      {
        key: 'reminders',
        title: 'Enable Smart Reminders',
        description: "If you forget to start recording, RegattaFlow can alert you when you're near the start line.",
      },
      {
        key: 'account',
        title: 'Create an Account',
        description: 'Make a free RegattaFlow account so your future recordings are kept safe online.',
      },
      {
        key: 'community',
        title: 'Join the Community',
        description: 'Find crew, join clubs, and connect with other sailors near you.',
      },
    ],
  },
  nursing: {
    subtitleLead: 'Getting set up?',
    subtitleTail: 'Get the most out of RegattaFlow.',
    cards: [
      {
        key: 'watch-app',
        title: 'Install the Watch App',
        description: 'Track your sessions and progress without opening your phone.',
        badge: 'Planned',
      },
      {
        key: 'reminders',
        title: 'Enable Smart Reminders',
        description: 'If you miss a check-in or task, RegattaFlow can remind you right on time.',
      },
      {
        key: 'account',
        title: 'Create an Account',
        description: 'Create your account so assignments, notes, and progress stay synced.',
      },
      {
        key: 'community',
        title: 'Join Your Team',
        description: 'Join your cohort and stay connected with your team and mentors.',
      },
    ],
  },
};
