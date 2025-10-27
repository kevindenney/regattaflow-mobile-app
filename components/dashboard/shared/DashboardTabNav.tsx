import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DashboardTab {
  key: string;
  label: string;
  icon: string;
  emoji?: string;
}

interface DashboardTabNavProps {
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (tabKey: string) => void;
  showIcons?: boolean;
}

export function DashboardTabNav({
  tabs,
  activeTab,
  onTabChange,
  showIcons = true
}: DashboardTabNavProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && styles.activeTab
              ]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                {showIcons && (
                  <View style={styles.iconContainer}>
                    {tab.emoji ? (
                      <Text style={[
                        styles.emoji,
                        isActive && styles.activeEmoji
                      ]}>
                        {tab.emoji}
                      </Text>
                    ) : (
                      <Ionicons
                        name={tab.icon as any}
                        size={18}
                        color={isActive ? '#1E40AF' : '#64748B'}
                      />
                    )}
                  </View>
                )}
                <Text style={[
                  styles.tabLabel,
                  isActive && styles.activeTabLabel
                ]}>
                  {tab.label}
                </Text>
              </View>

              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    minWidth: 100,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 16,
    opacity: 0.7,
  },
  activeEmoji: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    backgroundColor: '#1E40AF',
    borderRadius: 2,
  },
});