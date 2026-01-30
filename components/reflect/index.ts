/**
 * Reflect Tab Components
 *
 * Components for the sailor's personal reflection and progress tracking tab,
 * similar to Strava's "You" tab.
 */

// Phase 1 - Progress & Race Log
export { WeeklyCalendar } from './WeeklyCalendar';
export { MonthlyStatsCard } from './MonthlyStatsCard';
export { PerformanceTrendChart } from './PerformanceTrendChart';
export { RaceLogCard } from './RaceLogCard';
export { RelativeEffortCard } from './RelativeEffortCard';

// Phase 2 - Profile & Stats
export { ReflectProfileHeader } from './ReflectProfileHeader';
export { StatisticsSection } from './StatisticsSection';
export { VenuesVisitedSection } from './VenuesVisitedSection';
export { BoatsSection } from './BoatsSection';

// Phase 3 - Achievements & Challenges
export { AchievementsSection } from './AchievementsSection';
export { PersonalRecordsCard } from './PersonalRecordsCard';
export { ChallengesSection } from './ChallengesSection';

// Phase 4 - Social & Notifications
export { SocialStatsCard } from './SocialStatsCard';
export { RecentActivitySection } from './RecentActivitySection';
export type { ActivityType, RecentActivity } from './RecentActivitySection';
export { NotificationBellButton } from './NotificationBellButton';
