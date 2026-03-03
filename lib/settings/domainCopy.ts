export interface DomainCopyContext {
  isSailingDomain: boolean;
}

export function getDefaultUserTypeLabel({ isSailingDomain }: DomainCopyContext): string {
  return isSailingDomain ? 'Sailor' : 'Member';
}

export function getTabsSettingsCopy({ isSailingDomain }: DomainCopyContext) {
  return {
    onboardingSubtitle: isSailingDomain
      ? 'Finish setting up your sailing profile'
      : 'Finish setting up your profile',
    connectedDevicesSubtitle: isSailingDomain
      ? 'GPS, sensors, and wearable integrations'
      : 'Sensors, tools, and wearable integrations',
    claudeAssistantHelper: isSailingDomain
      ? 'Ask Claude to draft communications, plan events, or answer member questions using your club data.'
      : 'Ask Claude to draft communications, plan programs, or answer learner questions using your organization data.',
  };
}

export function getAccountModalCopy({ isSailingDomain }: DomainCopyContext) {
  return {
    signedOutDescription: isSailingDomain
      ? 'Sign in to manage your account, track your races, and sync across devices.'
      : 'Sign in to manage your account, track your activity, and sync across devices.',
    resourcesSectionHeader: isSailingDomain ? 'Boats' : 'Resources',
    emptyResourcesLabel: isSailingDomain ? 'No boats added yet' : 'No resources added yet',
    addResourcesLabel: isSailingDomain ? 'Add Boat' : 'Add Resource',
  };
}

export function getConnectedDevicesCopy({ isSailingDomain }: DomainCopyContext) {
  return {
    heroDescription: isSailingDomain
      ? 'Connect external sensors and devices to enhance your sailing data. Track performance metrics, record race data, and gain deeper insights.'
      : 'Connect external sensors and devices to enhance your operational data. Track key metrics, record session data, and gain deeper insights.',
    deviceDescriptions: {
      gps: isSailingDomain
        ? 'Connect GPS units for precise position tracking during races.'
        : 'Connect GPS units for precise location tracking during sessions.',
      speed: isSailingDomain
        ? 'Boat speed and VMG data from onboard instruments.'
        : 'Speed and movement data from connected instruments.',
      exertion: isSailingDomain
        ? 'Track physical exertion during races for performance analysis.'
        : 'Track physical exertion during sessions for performance analysis.',
      situational: isSailingDomain
        ? 'Automatic Identification System data for fleet tracking.'
        : 'Ambient and network telemetry feeds for group tracking.',
    },
  };
}

export function getUnitsCopy({ isSailingDomain }: DomainCopyContext) {
  return {
    nauticalDescription: isSailingDomain
      ? 'Distance in nautical miles (nm), speed in knots (kts). Standard for sailing.'
      : 'Distance in nautical miles (nm), speed in knots (kts). Useful for maritime and navigation workflows.',
    infoDescription: isSailingDomain
      ? 'This setting affects how distances and speeds are displayed throughout the app, including race data, weather forecasts, and venue information.'
      : 'This setting affects how distances and speeds are displayed throughout the app, including event data, weather forecasts, and location information.',
  };
}

export function getDeleteAccountCopy({ isSailingDomain }: DomainCopyContext) {
  return {
    dataLossItems: isSailingDomain
      ? [
          'Your profile and personal information',
          'All race history, results, and performance data',
          'Saved venues, documents, and tuning guides',
          'Crew associations and fleet memberships',
          'Coaching sessions and strategies',
          'All AI-generated insights and analysis',
          'Any active subscriptions (will be cancelled)',
        ]
      : [
          'Your profile and personal information',
          'All session history, outcomes, and performance data',
          'Saved locations, documents, and reference materials',
          'Team associations and organization memberships',
          'Coaching sessions and program plans',
          'All AI-generated insights and analysis',
          'Any active subscriptions (will be cancelled)',
        ],
  };
}
