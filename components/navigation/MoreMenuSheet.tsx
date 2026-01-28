/**
 * MoreMenuSheet - iOS Settings-style bottom sheet for the "More" tab menu
 *
 * Full-width bottom sheet that slides up with animation, featuring:
 * - Animated backdrop + spring slide-up
 * - Drag-to-dismiss gesture (pan down to close, snap back on release)
 * - User identity header with avatar/initials
 * - Grouped sections with colored icon backgrounds
 * - "Complete Profile" callout card
 */

import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SHADOWS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useCallback, useEffect } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FLOATING_TAB_BAR_BOTTOM_MARGIN, FLOATING_TAB_BAR_HEIGHT } from './FloatingTabBar';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MoreMenuItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  isWarning?: boolean;
  iconBg?: string;
  /** Section this item belongs to */
  section?: string;
}

export interface MoreMenuSection {
  key: string;
  title?: string;
  items: MoreMenuItem[];
}

export interface MoreMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  menuItems: MoreMenuItem[];
  onItemPress: (route: string) => void;
  userProfile?: { full_name?: string; email?: string; avatar_url?: string };
  userType?: string;
  isGuest?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.65;
const SHEET_BORDER_RADIUS = 24;
const SHEET_HORIZONTAL_MARGIN = 12;
const AVATAR_SIZE = 40;

// Section definitions for grouping
const SECTION_MAP: Record<string, string> = {};

const SECTION_TITLES: Record<string, string> = {};

const SECTION_ORDER = ['callout'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function groupMenuItems(items: MoreMenuItem[]): MoreMenuSection[] {
  const sections: MoreMenuSection[] = [];
  const sectionMap = new Map<string, MoreMenuItem[]>();

  for (const item of items) {
    if (item.isWarning) {
      // Callout items get their own special section
      if (!sectionMap.has('callout')) sectionMap.set('callout', []);
      sectionMap.get('callout')!.push(item);
      continue;
    }

    const sectionKey = SECTION_MAP[item.key] ?? 'other';
    if (!sectionMap.has(sectionKey)) sectionMap.set(sectionKey, []);
    sectionMap.get(sectionKey)!.push(item);
  }

  for (const key of SECTION_ORDER) {
    const items = sectionMap.get(key);
    if (items && items.length > 0) {
      sections.push({
        key,
        title: key === 'callout' ? undefined : SECTION_TITLES[key],
        items,
      });
    }
  }

  // Any items not in SECTION_ORDER
  for (const [key, items] of sectionMap) {
    if (!SECTION_ORDER.includes(key) && items.length > 0) {
      sections.push({ key, title: key.charAt(0).toUpperCase() + key.slice(1), items });
    }
  }

  return sections;
}

// ─── Worklets ────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DragHandle() {
  return (
    <View style={styles.dragHandleContainer}>
      <View style={styles.dragHandle} />
    </View>
  );
}

function UserHeader({
  userProfile,
  isGuest,
  onSignIn,
}: {
  userProfile?: { full_name?: string; email?: string; avatar_url?: string };
  isGuest?: boolean;
  onSignIn?: () => void;
}) {
  if (isGuest) {
    return (
      <View style={styles.userHeader}>
        <View style={[styles.avatar, styles.avatarGuest]}>
          <Ionicons name="person-outline" size={20} color={IOS_COLORS.systemGray} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Guest</Text>
          <Pressable onPress={onSignIn} hitSlop={8}>
            <Text style={styles.signInLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const name = userProfile?.full_name || 'Sailor';
  const email = userProfile?.email;
  const initials = getInitials(name);

  return (
    <View style={styles.userHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{name}</Text>
        {email ? (
          <Text style={styles.userEmail} numberOfLines={1}>{email}</Text>
        ) : null}
      </View>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
  );
}

function CalloutCard({
  item,
  onPress,
}: {
  item: MoreMenuItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
    >
      {({ pressed }) => (
        <View style={[styles.calloutCard, pressed && styles.calloutCardPressed]}>
          <Ionicons name="warning" size={20} color={IOS_COLORS.systemOrange} style={styles.calloutIcon} />
          <View style={styles.calloutContent}>
            <Text style={styles.calloutTitle}>Complete Your Profile</Text>
            <Text style={styles.calloutSubtitle}>Add your boat to unlock all features</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={IOS_COLORS.tertiaryLabel} />
        </View>
      )}
    </Pressable>
  );
}

function MenuRow({
  item,
  isLast,
  onPress,
}: {
  item: MoreMenuItem;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <Pressable
        onPress={() => {
          triggerHaptic('selection');
          onPress();
        }}
      >
        {({ pressed }) => (
          <View style={[styles.menuRow, pressed && styles.menuRowPressed]}>
            <Ionicons name={item.icon as any} size={20} color={IOS_COLORS.secondaryLabel} />
            <Text style={styles.menuRowLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={IOS_COLORS.tertiaryLabel} />
          </View>
        )}
      </Pressable>
      {!isLast && <View style={styles.rowSeparator} />}
    </>
  );
}

function GroupedSection({
  section,
  onItemPress,
}: {
  section: MoreMenuSection;
  onItemPress: (route: string) => void;
}) {
  if (section.key === 'callout') {
    return (
      <View style={styles.calloutSection}>
        {section.items.map((item) => (
          <CalloutCard
            key={item.key}
            item={item}
            onPress={() => onItemPress(item.route)}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.sectionContainer}>
      {section.title && <SectionHeader title={section.title} />}
      <View style={styles.sectionCard}>
        {section.items.map((item, index) => (
          <MenuRow
            key={item.key}
            item={item}
            isLast={index === section.items.length - 1}
            onPress={() => onItemPress(item.route)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MoreMenuSheet({
  visible,
  onClose,
  menuItems,
  onItemPress,
  userProfile,
  userType,
  isGuest,
}: MoreMenuSheetProps) {
  const insets = useSafeAreaInsets();
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(MAX_SHEET_HEIGHT);
  const contextY = useSharedValue(0);

  // Track whether the component should render at all
  const [shouldRender, setShouldRender] = React.useState(false);

  const handleDismissComplete = useCallback(() => {
    setShouldRender(false);
  }, []);

  const dismissViaGesture = useCallback(() => {
    triggerHaptic('impactLight');
    onClose();
  }, [onClose]);

  const fireSnapHaptic = useCallback(() => {
    triggerHaptic('impactLight');
  }, []);

  // ── Drag-to-dismiss gesture ────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .activeOffsetY(15)
    .failOffsetY(-5)
    .onStart(() => {
      contextY.value = sheetTranslateY.value;
    })
    .onUpdate((e) => {
      sheetTranslateY.value = clamp(
        contextY.value + e.translationY,
        -20, // slight over-drag upward
        MAX_SHEET_HEIGHT,
      );
    })
    .onEnd((e) => {
      const threshold = MAX_SHEET_HEIGHT * 0.35;
      const shouldDismiss =
        sheetTranslateY.value > threshold || e.velocityY > 800;

      if (shouldDismiss) {
        sheetTranslateY.value = withTiming(MAX_SHEET_HEIGHT, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) {
            runOnJS(dismissViaGesture)();
          }
        });
      } else {
        sheetTranslateY.value = withTiming(0, { duration: 250 });
        runOnJS(fireSnapHaptic)();
      }
    });

  // ── Animate in / out ───────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      sheetTranslateY.value = withTiming(0, { duration: 300 });
    } else if (shouldRender) {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      sheetTranslateY.value = withTiming(
        MAX_SHEET_HEIGHT,
        { duration: 250 },
        (finished) => {
          if (finished) {
            runOnJS(handleDismissComplete)();
          }
        },
      );
    }
  }, [visible, shouldRender, backdropOpacity, sheetTranslateY, handleDismissComplete]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  if (!shouldRender) return null;

  const sections = groupMenuItems(menuItems);

  // Position the sheet above the floating tab bar
  const tabBarClearance = FLOATING_TAB_BAR_HEIGHT + Math.max(Math.round(insets.bottom / 2), 8) + FLOATING_TAB_BAR_BOTTOM_MARGIN;

  const sheetContent = (
    <>
      <DragHandle />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <UserHeader
          userProfile={userProfile}
          isGuest={isGuest}
        />
        <View style={styles.headerSeparator} />

        {sections.map((section) => (
          <GroupedSection
            key={section.key}
            section={section}
            onItemPress={onItemPress}
          />
        ))}
      </ScrollView>
    </>
  );

  return (
    <GestureHandlerRootView style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.sheetOuter,
            { bottom: tabBarClearance, maxHeight: MAX_SHEET_HEIGHT },
            sheetStyle,
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint="systemChromeMaterial"
              style={styles.blurBackground}
            >
              {sheetContent}
            </BlurView>
          ) : (
            <View style={styles.solidBackground}>
              {sheetContent}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheetOuter: {
    position: 'absolute',
    left: SHEET_HORIZONTAL_MARGIN,
    right: SHEET_HORIZONTAL_MARGIN,
    borderRadius: SHEET_BORDER_RADIUS,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        ...IOS_SHADOWS.lg,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
      } as any,
    }),
  },
  blurBackground: {
    // BlurView fills the parent; borderRadius handled by sheetOuter overflow
  },
  solidBackground: {
    ...Platform.select({
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.97)',
      },
      web: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } as any,
      default: {
        backgroundColor: '#FFFFFF',
      },
    }),
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Drag handle
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: IOS_COLORS.systemGray4,
  },

  // User header
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: IOS_COLORS.systemBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGuest: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    ...IOS_TYPOGRAPHY.headline,
    color: IOS_COLORS.label,
  },
  userEmail: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.secondaryLabel,
    marginTop: 1,
  },
  signInLink: {
    ...IOS_TYPOGRAPHY.subhead,
    color: IOS_COLORS.systemBlue,
    fontWeight: '500',
  },
  headerSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginHorizontal: 20,
  },

  // Sections
  sectionContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    ...IOS_TYPOGRAPHY.footnote,
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    marginHorizontal: 16,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      } as any,
    }),
  },

  // Callout card
  calloutSection: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  calloutCard: {
    backgroundColor: 'rgba(255, 248, 225, 0.85)',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: IOS_COLORS.systemOrange,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  calloutCardPressed: {
    opacity: 0.7,
  },
  calloutIcon: {
    marginRight: 10,
  },
  calloutContent: {
    flex: 1,
  },
  calloutTitle: {
    ...IOS_TYPOGRAPHY.subhead,
    fontWeight: '600',
    color: '#92400E',
  },
  calloutSubtitle: {
    ...IOS_TYPOGRAPHY.footnote,
    color: '#B45309',
    marginTop: 2,
  },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  menuRowPressed: {
    backgroundColor: IOS_COLORS.systemGray5,
  },
  menuRowLabel: {
    ...IOS_TYPOGRAPHY.body,
    color: IOS_COLORS.label,
    flex: 1,
    marginLeft: 12,
  },
  rowSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
    marginLeft: 14 + 20 + 12, // padding + icon + gap
  },
});
