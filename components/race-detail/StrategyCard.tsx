/**
 * Strategy Card Base Component
 * Reusable card for race strategy sections
 * Inspired by Apple Weather's card design
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type CardStatus = 'ready' | 'generating' | 'not_set' | 'error';

interface StrategyCardProps {
  icon: string; // MaterialCommunityIcons name
  title: string;
  children: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  status?: CardStatus;
  statusMessage?: string;
  onExpand?: () => void;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: string;
}

export function StrategyCard({
  icon,
  title,
  children,
  expandable = false,
  defaultExpanded = false,
  status = 'ready',
  statusMessage,
  onExpand,
  onAction,
  actionLabel,
  actionIcon,
}: StrategyCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [animation] = useState(new Animated.Value(defaultExpanded ? 1 : 0));

  const normalizedChildren = useMemo(() => (
    React.Children.map(children, (child, index) => {
      if (child == null) {
        return null;
      }

      if (typeof child === 'string') {
        if (child.trim().length === 0) {
          return null;
        }

        return (
          <Text key={`text-child-${index}`} style={styles.fallbackText}>
            {child}
          </Text>
        );
      }

      if (typeof child === 'number') {
        return (
          <Text key={`number-child-${index}`} style={styles.fallbackText}>
            {child}
          </Text>
        );
      }

      return child;
    })
  ), [children]);

  const toggleExpand = () => {
    const newExpanded = !expanded;
    setExpanded(newExpanded);

    Animated.spring(animation, {
      toValue: newExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 10,
    }).start();

    onExpand?.();
  };

  const getCardStyle = () => {
    switch (status) {
      case 'generating':
        return styles.cardGenerating;
      case 'not_set':
        return styles.cardNotSet;
      case 'error':
        return styles.cardError;
      default:
        return styles.cardReady;
    }
  };

  const getIconColor = () => {
    switch (status) {
      case 'generating':
        return '#3B82F6';
      case 'not_set':
        return '#94A3B8';
      case 'error':
        return '#EF4444';
      default:
        return '#3B82F6';
    }
  };

  const renderStatusIndicator = () => {
    if (status === 'generating') {
      return (
        <View style={styles.statusIndicator}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.statusText}>
            {statusMessage || 'Analyzing...'}
          </Text>
        </View>
      );
    }

    if (status === 'not_set') {
      return (
        <View style={styles.statusIndicator}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#94A3B8" />
          <Text style={[styles.statusText, styles.statusTextNotSet]}>
            {statusMessage || 'Tap to add'}
          </Text>
        </View>
      );
    }

    if (status === 'error') {
      return (
        <View style={styles.statusIndicator}>
          <MaterialCommunityIcons name="alert" size={16} color="#EF4444" />
          <Text style={[styles.statusText, styles.statusTextError]}>
            {statusMessage || 'Error loading'}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.card, getCardStyle()]}>
      {/* Card Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={expandable ? toggleExpand : undefined}
        activeOpacity={expandable ? 0.7 : 1}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={icon as any}
              size={20}
              color={getIconColor()}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.headerRight}>
          {renderStatusIndicator()}

          {expandable && (
            <Animated.View
              style={{
                transform: [{
                  rotate: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  }),
                }],
              }}
            >
              <MaterialCommunityIcons
                name="chevron-down"
                size={20}
                color="#64748B"
              />
            </Animated.View>
          )}

          {onAction && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onAction}
            >
              {actionIcon && (
                <MaterialCommunityIcons
                  name={actionIcon as any}
                  size={16}
                  color="#3B82F6"
                />
              )}
              {actionLabel && (
                <Text style={styles.actionLabel}>{actionLabel}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Card Content */}
      {(!expandable || expanded) && (
        <Animated.View
          style={[
            styles.content,
            expandable && {
              opacity: animation,
              maxHeight: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 2000],
              }),
            },
          ]}
        >
          {normalizedChildren}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardReady: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardGenerating: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#F0F9FF',
  },
  cardNotSet: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    opacity: 0.8,
  },
  cardError: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  statusTextNotSet: {
    color: '#94A3B8',
  },
  statusTextError: {
    color: '#EF4444',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  actionLabel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  fallbackText: {
    fontSize: 14,
    color: '#0F172A',
  },
});
