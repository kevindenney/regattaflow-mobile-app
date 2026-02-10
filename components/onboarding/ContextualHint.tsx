/**
 * ContextualHint — Visual hint component.
 *
 * Wraps children and shows a small popover card when the hint is visible.
 * White card with blue left border, arrow pointing at the wrapped element,
 * and a "Got it" dismissal button. Backdrop is transparent so the app stays
 * interactive.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ContextualHintProps {
  /** Whether the hint popover is visible. */
  visible: boolean;
  /** Title text for the hint. */
  title: string;
  /** Description / body text. */
  description: string;
  /** Called when user taps "Got it". */
  onDismiss: () => void;
  /** Where to place the popover relative to the child. */
  position?: 'top' | 'bottom';
  /** Wrap the target element. */
  children: React.ReactNode;
  /** Optional extra style for the outer container. */
  style?: ViewStyle;
}

export function ContextualHint({
  visible,
  title,
  description,
  onDismiss,
  position = 'bottom',
  children,
  style,
}: ContextualHintProps) {
  return (
    <View style={[styles.wrapper, style]}>
      {/* Target element */}
      {children}

      {/* Popover */}
      {visible && (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.popover,
            position === 'top' ? styles.popoverTop : styles.popoverBottom,
          ]}
          pointerEvents="box-none"
        >
          {/* Arrow */}
          <View
            style={[
              styles.arrow,
              position === 'top' ? styles.arrowBottom : styles.arrowTop,
            ]}
          />

          <View style={styles.card}>
            <View style={styles.blueBorder} />
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismiss}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.dismissText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  popover: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  popoverTop: {
    bottom: '100%',
    marginBottom: 8,
  },
  popoverBottom: {
    top: '100%',
    marginTop: 8,
  },
  arrow: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    zIndex: 1,
  },
  arrowTop: {
    top: -6,
  },
  arrowBottom: {
    bottom: -6,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 320,
    width: '100%',
    overflow: 'hidden',
  },
  blueBorder: {
    width: 4,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  content: {
    flex: 1,
    padding: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  dismissButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
});
