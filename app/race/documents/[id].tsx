/**
 * Race Documents Route
 *
 * Document management screen for a specific race.
 * Shows all source documents with provenance tracking.
 */

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DocumentManagementScreen } from '@/components/documents/management';
import { supabase } from '@/services/supabase';

interface RegattaInfo {
  id: string;
  name: string;
}

export default function RaceDocumentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [regatta, setRegatta] = useState<RegattaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load regatta info
  useEffect(() => {
    async function loadRegatta() {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('regattas')
          .select('id, name')
          .eq('id', id)
          .single();

        if (error) {
          console.error('[RaceDocumentsScreen] Failed to load regatta:', error);
          return;
        }

        setRegatta(data);
      } catch (error) {
        console.error('[RaceDocumentsScreen] Error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRegatta();
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/races');
    }
  };

  if (isLoading || !id) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <DocumentManagementScreen
      regattaId={id}
      regattaName={regatta?.name}
      onBack={handleBack}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
});
