import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerAction?: {
    label: string;
    onPress: () => void;
    icon?: string;
  };
  onTitlePress?: () => void;
  showBorder?: boolean;
  padding?: number;
  backgroundColor?: string;
  borderColor?: string;
  shadowColor?: string;
}

export function DashboardSection({
  title,
  subtitle,
  children,
  headerAction,
  onTitlePress,
  showBorder = true,
  padding = 16,
  backgroundColor,
  borderColor,
  shadowColor
}: DashboardSectionProps) {
  return (
    <View style={[
      styles.container,
      showBorder && styles.withBorder,
      { padding },
      backgroundColor && { backgroundColor },
      borderColor && { borderColor },
      shadowColor && { shadowColor }
    ]}>
      <View style={styles.header}>
        {onTitlePress ? (
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={onTitlePress}
            activeOpacity={0.7}
          >
            <Text style={[styles.title, styles.clickableTitle]}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </TouchableOpacity>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        )}

        {headerAction && (
          <TouchableOpacity
            style={styles.headerAction}
            onPress={headerAction.onPress}
            activeOpacity={0.7}
          >
            {headerAction.icon && (
              <Ionicons
                name={headerAction.icon as any}
                size={16}
                color="#3B82F6"
              />
            )}
            <Text style={styles.actionLabel}>{headerAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginVertical: 12,
    marginHorizontal: 16,
  },
  withBorder: {
    borderRadius: 20,
    boxShadow: '0px 4px',
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  clickableTitle: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
});