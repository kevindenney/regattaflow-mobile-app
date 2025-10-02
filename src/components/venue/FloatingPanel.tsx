/**
 * FloatingPanel Component
 * Reusable collapsible panel for map-first venue interface
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { Ionicons } from '@expo/vector-icons';

interface FloatingPanelProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  position?: 'bottom-left' | 'bottom-right' | 'left' | 'right';
  maxHeight?: number;
}

export function FloatingPanel({
  title,
  icon,
  badge,
  isExpanded,
  onToggle,
  children,
  position = 'bottom-left',
  maxHeight = 400,
}: FloatingPanelProps) {
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  const positionStyles = {
    'bottom-left': styles.bottomLeft,
    'bottom-right': styles.bottomRight,
    'left': styles.left,
    'right': styles.right,
  };

  return (
    <View style={[styles.container, positionStyles[position]]}>
      {/* Panel Header */}
      <TouchableOpacity
        style={[
          styles.header,
          isExpanded && styles.headerExpanded,
          !isExpanded && styles.headerCollapsed
        ]}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={styles.headerContent}>
          <Ionicons name={icon} size={20} color="#fff" />
          <ThemedText style={styles.headerTitle}>{title}</ThemedText>
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <ThemedText style={styles.badgeText}>{badge}</ThemedText>
            </View>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-down' : 'chevron-up'}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Panel Content */}
      {isExpanded && (
        <View style={[styles.content, { maxHeight }]}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
    minWidth: 300,
    maxWidth: 400,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
  },
  left: {
    top: 100,
    left: 20,
  },
  right: {
    top: 100,
    right: 20,
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0px 2px',
    elevation: 5,
  },
  headerCollapsed: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  headerExpanded: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // Content Styles
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    boxShadow: '0px 4px',
    elevation: 5,
  },
  scrollView: {
    padding: 16,
  },
});
