import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AccessibilityInfo,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';

/**
 * VisuallyHidden
 *
 * Hides content visually but keeps it accessible to screen readers.
 * Perfect for icon-only buttons that need descriptive text.
 *
 * @example
 * // Icon button with hidden label
 * <TouchableOpacity>
 *   <Icon name="search" size={24} />
 *   <VisuallyHidden>Search races</VisuallyHidden>
 * </TouchableOpacity>
 *
 * @example
 * // Skip link for keyboard navigation
 * <VisuallyHidden>
 *   <Link href="#main-content">Skip to main content</Link>
 * </VisuallyHidden>
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={styles.visuallyHidden}
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      {children}
    </Text>
  );
}

/**
 * LiveRegion
 *
 * Announces dynamic content changes to screen readers.
 * Use for status updates, error messages, loading states, etc.
 *
 * @example
 * // Announce race updates
 * <LiveRegion polite>
 *   Race starts in 5 minutes
 * </LiveRegion>
 *
 * @example
 * // Announce errors (assertive = immediate)
 * <LiveRegion assertive>
 *   Failed to load weather data. Please try again.
 * </LiveRegion>
 *
 * @example
 * // Announce form validation
 * {error && (
 *   <LiveRegion assertive>
 *     {error}
 *   </LiveRegion>
 * )}
 */
interface LiveRegionProps {
  children: React.ReactNode;
  /** Polite: waits for user to pause (default) */
  polite?: boolean;
  /** Assertive: interrupts immediately */
  assertive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LiveRegion({ children, polite = true, assertive = false, style }: LiveRegionProps) {
  return (
    <View
      accessibilityLiveRegion={assertive ? 'assertive' : 'polite'}
      accessibilityRole="alert"
      style={style}
    >
      <Text>{children}</Text>
    </View>
  );
}

/**
 * Heading
 *
 * Semantic heading component for proper document structure.
 * Screen readers use headings for navigation.
 *
 * @example
 * // Page title
 * <Heading level={1}>Race Dashboard</Heading>
 *
 * @example
 * // Section heading
 * <Heading level={2}>Upcoming Races</Heading>
 *
 * @example
 * // Card heading
 * <Heading level={3} style={{ fontSize: 18 }}>
 *   Next Race: Dragon Class Championship
 * </Heading>
 */
interface HeadingProps {
  children: React.ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  style?: TextStyle;
}

export function Heading({ children, level, style }: HeadingProps) {
  const headingStyles = [
    styles[`heading${level}` as keyof typeof styles] as TextStyle,
    style,
  ];

  return (
    <Text
      accessibilityRole="header"
      style={headingStyles}
    >
      {children}
    </Text>
  );
}

/**
 * LoadingAnnouncer
 *
 * Announces loading states to screen readers.
 * Automatically announces when loading starts and completes.
 *
 * @example
 * // Basic loading indicator
 * <LoadingAnnouncer
 *   loading={isLoadingRaces}
 *   message="Loading races"
 * />
 *
 * @example
 * // With completion message
 * <LoadingAnnouncer
 *   loading={isLoadingWeather}
 *   message="Loading weather data"
 *   completionMessage="Weather data loaded"
 * />
 *
 * @example
 * // Inline with content
 * {isLoading ? (
 *   <LoadingAnnouncer loading={true} message="Loading race results" />
 * ) : (
 *   <RaceResults data={results} />
 * )}
 */
interface LoadingAnnouncerProps {
  loading: boolean;
  message: string;
  completionMessage?: string;
  /** Show visual spinner (default: false, only announces) */
  showSpinner?: boolean;
}

export function LoadingAnnouncer({
  loading,
  message,
  completionMessage = 'Loading complete',
  showSpinner = false,
}: LoadingAnnouncerProps) {
  const [previousLoading, setPreviousLoading] = useState(loading);

  useEffect(() => {
    if (loading !== previousLoading) {
      setPreviousLoading(loading);

      // Announce to screen reader
      const announcement = loading ? message : completionMessage;
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [loading, previousLoading, message, completionMessage]);

  if (!loading && !showSpinner) {
    return null;
  }

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={styles.loadingContainer}
    >
      {showSpinner && loading && (
        <View style={styles.spinner}>
          {/* Add your spinner component here if needed */}
        </View>
      )}
      <VisuallyHidden>
        {loading ? message : completionMessage}
      </VisuallyHidden>
    </View>
  );
}

/**
 * AnnouncementHelper
 *
 * Programmatically announce messages to screen readers.
 * Use for dynamic announcements that don't fit LiveRegion.
 *
 * @example
 * // Announce race start
 * const announceRaceStart = () => {
 *   AccessibilityInfo.announceForAccessibility('Race has started');
 * };
 *
 * @example
 * // Announce venue switch
 * useEffect(() => {
 *   if (currentVenue) {
 *     AccessibilityInfo.announceForAccessibility(
 *       `Switched to ${currentVenue.name}`
 *     );
 *   }
 * }, [currentVenue]);
 */

const styles = StyleSheet.create({
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    opacity: 0,
  },
  heading1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  heading4: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  heading5: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  heading6: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
});

/**
 * Usage Guidelines:
 *
 * 1. VisuallyHidden:
 *    - Use for icon-only buttons
 *    - Skip navigation links
 *    - Additional context for screen readers
 *    - DO NOT use for important visible content
 *
 * 2. LiveRegion:
 *    - Use polite for non-critical updates (race times, weather changes)
 *    - Use assertive for errors and warnings
 *    - Keep messages concise and clear
 *    - Update sparingly to avoid announcement spam
 *
 * 3. Heading:
 *    - Always start with level 1 for page title
 *    - Don't skip levels (1 → 2 → 3, not 1 → 3)
 *    - Use for all section titles
 *    - Enables screen reader navigation
 *
 * 4. LoadingAnnouncer:
 *    - Use for async data loading
 *    - Provide clear loading messages
 *    - Include completion announcements
 *    - Consider showSpinner for visual users
 *
 * Common Patterns:
 *
 * // Icon button
 * <AccessibleTouchTarget onPress={handleSearch}>
 *   <SearchIcon />
 *   <VisuallyHidden>Search races</VisuallyHidden>
 * </AccessibleTouchTarget>
 *
 * // Form error
 * {error && (
 *   <LiveRegion assertive>
 *     <Text style={styles.error}>{error}</Text>
 *   </LiveRegion>
 * )}
 *
 * // Page structure
 * <View>
 *   <Heading level={1}>Dashboard</Heading>
 *   <Heading level={2}>Upcoming Races</Heading>
 *   {races.map(race => (
 *     <View key={race.id}>
 *       <Heading level={3}>{race.name}</Heading>
 *     </View>
 *   ))}
 * </View>
 */
