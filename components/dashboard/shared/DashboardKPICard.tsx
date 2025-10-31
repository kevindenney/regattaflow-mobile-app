// @ts-nocheck

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconColor?: string;
  gradientColors?: string[];
  onPress?: () => void;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
}

export function DashboardKPICard({
  title,
  value,
  subtitle,
  icon,
  iconColor = '#0066CC',
  gradientColors = ['#FFFFFF', '#F8FAFC'],
  onPress,
  trend
}: DashboardKPICardProps) {
  const CardWrapper = onPress ? TouchableOpacity : View;

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      case 'stable': return 'remove';
      default: return null;
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up': return '#10B981';
      case 'down': return '#EF4444';
      case 'stable': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <CardWrapper
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...(Platform.OS === 'web' && {
        onMouseEnter: (e: any) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
        },
        onMouseLeave: (e: any) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
        },
      })}
    >
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Ionicons name={icon as any} size={24} color={iconColor} />
          {trend && (
            <View style={styles.trendContainer}>
              <Ionicons
                name={getTrendIcon() as any}
                size={16}
                color={getTrendColor()}
              />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {trend.value}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </LinearGradient>
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 2px',
    elevation: 3,
    marginHorizontal: 4,
    marginVertical: 6,
    ...(Platform.OS === 'web' && {
      // @ts-ignore - Web-specific CSS properties
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      cursor: 'pointer',
    }),
  } as any,
  gradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    alignItems: 'flex-start',
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
});
