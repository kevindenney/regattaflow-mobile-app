// @ts-nocheck

/**
 * Strategy Preview Component
 * Displays upwind and downwind race strategy summaries
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { useRouter } from 'expo-router';

interface StrategyPreviewProps {
  regattaId: string;
}

interface Strategy {
  upwind_strategy_summary?: string;
  downwind_strategy_summary?: string;
  key_tactics?: string[];
}

export function StrategyPreview({ regattaId }: StrategyPreviewProps) {
  const router = useRouter();

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStrategy = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('regattas')
        .select('upwind_strategy_summary, downwind_strategy_summary, key_tactics')
        .eq('id', regattaId)
        .single();

      if (error) throw error;

      setStrategy(data);
    } catch (error) {
      console.error('Error loading strategy:', error);
      setStrategy(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStrategy();
  }, [regattaId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0077be" />
        <Text style={styles.loadingText}>Loading strategy...</Text>
      </View>
    );
  }

  if (!strategy?.upwind_strategy_summary && !strategy?.downwind_strategy_summary) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Strategy Yet</Text>
        <Text style={styles.emptyText}>
          Strategy will be available after race briefing
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📋 Race Strategy</Text>
        <TouchableOpacity onPress={() => router.push(`/regatta/${regattaId}/strategy`)}>
          <Text style={styles.viewAllText}>View Full →</Text>
        </TouchableOpacity>
      </View>

      {/* Upwind Strategy */}
      {strategy.upwind_strategy_summary && (
        <View style={styles.strategySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⬆️</Text>
            <Text style={styles.sectionTitle}>Upwind</Text>
          </View>
          <Text style={styles.strategyText}>
            {strategy.upwind_strategy_summary}
          </Text>
        </View>
      )}

      {/* Downwind Strategy */}
      {strategy.downwind_strategy_summary && (
        <View style={styles.strategySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⬇️</Text>
            <Text style={styles.sectionTitle}>Downwind</Text>
          </View>
          <Text style={styles.strategyText}>
            {strategy.downwind_strategy_summary}
          </Text>
        </View>
      )}

      {/* Key Tactics */}
      {strategy.key_tactics && strategy.key_tactics.length > 0 && (
        <View style={styles.tacticsSection}>
          <Text style={styles.tacticsTitle}>🎯 Key Tactics</Text>
          {strategy.key_tactics.map((tactic, index) => (
            <View key={index} style={styles.tacticItem}>
              <Text style={styles.tacticBullet}>•</Text>
              <Text style={styles.tacticText}>{tactic}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#0077be',
    fontWeight: '600',
  },
  strategySection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  strategyText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tacticsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  tacticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tacticItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tacticBullet: {
    fontSize: 16,
    color: '#0077be',
    marginRight: 8,
    fontWeight: 'bold',
  },
  tacticText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
