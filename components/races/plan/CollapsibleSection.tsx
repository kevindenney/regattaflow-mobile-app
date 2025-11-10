/**
 * CollapsibleSection Component
 * Expandable/collapsible section for organizing PLAN mode content
 *
 * Features:
 * - Smooth expand/collapse animation
 * - State persistence across app sessions
 * - Badge indicators (counts, completion status)
 * - Accessibility support
 * - Priority-based default states
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type SectionPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CollapsibleSectionProps {
  /** Unique ID for state persistence */
  id: string;

  /** Section title */
  title: string;

  /** Optional icon component */
  icon?: React.ReactNode;

  /** Optional badge text (e.g., "3 items", "2/5 complete") */
  badge?: string;

  /** Badge color variant */
  badgeVariant?: 'default' | 'success' | 'warning' | 'info';

  /** Default expanded state (if no persisted state exists) */
  defaultExpanded?: boolean;

  /** Priority level (affects default expanded state) */
  priority?: SectionPriority;

  /** Section content */
  children: React.ReactNode;

  /** Callback when expand/collapse state changes */
  onToggle?: (expanded: boolean) => void;

  /** Force expanded state (overrides user preference) */
  forceExpanded?: boolean;
}

const STORAGE_KEY_PREFIX = '@regattaflow:section:';

export function CollapsibleSection({
  id,
  title,
  icon,
  badge,
  badgeVariant = 'default',
  defaultExpanded = false,
  priority,
  children,
  onToggle,
  forceExpanded,
}: CollapsibleSectionProps) {
  // Determine default state based on priority
  const getDefaultExpanded = () => {
    if (forceExpanded !== undefined) return forceExpanded;
    if (defaultExpanded !== undefined) return defaultExpanded;
    // Priority 1-4: Expanded by default
    // Priority 5-8: Collapsed by default
    return priority ? priority <= 4 : false;
  };

  const [isExpanded, setIsExpanded] = useState(getDefaultExpanded());
  const [isInitialized, setIsInitialized] = useState(false);
  const rotateAnim = useRef(new Animated.Value(getDefaultExpanded() ? 1 : 0)).current;
  const supportsNativeDriver = Platform.OS !== 'web';

  // Load persisted state on mount
  useEffect(() => {
    loadPersistedState();
  }, []);

  // Update rotation animation when expanded state changes
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: supportsNativeDriver,
    }).start();
  }, [isExpanded, supportsNativeDriver]);

  // Handle forceExpanded prop
  useEffect(() => {
    if (forceExpanded !== undefined && forceExpanded !== isExpanded) {
      setIsExpanded(forceExpanded);
    }
  }, [forceExpanded]);

  const loadPersistedState = async () => {
    try {
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (stored !== null) {
        const persistedExpanded = JSON.parse(stored);
        // Only use persisted state if not force expanded
        if (forceExpanded === undefined) {
          setIsExpanded(persistedExpanded);
        }
      }
    } catch (error) {
      console.warn(`Failed to load section state for ${id}:`, error);
    } finally {
      setIsInitialized(true);
    }
  };

  const persistState = async (expanded: boolean) => {
    try {
      await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(expanded));
    } catch (error) {
      console.warn(`Failed to persist section state for ${id}:`, error);
    }
  };

  const handleToggle = () => {
    // Don't allow toggle if force expanded
    if (forceExpanded !== undefined) return;

    // Configure animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    persistState(newExpanded);
    onToggle?.(newExpanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const getBadgeColors = () => {
    switch (badgeVariant) {
      case 'success':
        return { bg: '#DEF7EC', text: '#03543F', border: '#84E1BC' };
      case 'warning':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      case 'info':
        return { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
    }
  };

  const badgeColors = getBadgeColors();

  // Don't render until state is loaded (prevents flash)
  if (!isInitialized && !forceExpanded) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        accessibilityLabel={`${title} section`}
        accessibilityHint={`${isExpanded ? 'Collapse' : 'Expand'} to ${isExpanded ? 'hide' : 'show'} section content`}
        accessibilityState={{ expanded: isExpanded }}
        disabled={forceExpanded !== undefined}
      >
        {/* Chevron Icon */}
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <ChevronRight size={20} color="#6B7280" />
        </Animated.View>

        {/* Custom Icon (optional) */}
        {icon && (
          <View style={styles.iconContainer}>
            {typeof icon === 'string' || typeof icon === 'number' ? (
              <Text style={styles.iconTextFallback}>{icon}</Text>
            ) : (
              icon
            )}
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Badge (optional) */}
        {badge && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: badgeColors.bg,
                borderColor: badgeColors.border,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: badgeColors.text }]}>
              {badge}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Section Content */}
      {isExpanded && (
        <View style={styles.content}>
          {React.Children.map(children, (child, index) => {
            if (typeof child === 'string' || typeof child === 'number') {
              return (
                <Text key={`content-text-${index}`} style={styles.contentTextFallback}>
                  {child}
                </Text>
              );
            }
            return child;
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 2,
  },
  iconContainer: {
    marginLeft: 8,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconTextFallback: {
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    paddingHorizontal: 4,
    paddingTop: 8,
    gap: 12,
  },
  contentTextFallback: {
    fontSize: 14,
    color: '#1F2937',
  },
});
