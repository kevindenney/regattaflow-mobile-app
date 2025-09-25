/**
 * Documents Tab - AI-powered document management for sailing strategy
 */

import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform
} from 'react-native';
import { DocumentUploadCard } from '@/src/components/documents/DocumentUploadCard';
import { DocumentViewer } from '@/src/components/documents/DocumentViewer';
import { SubscriptionManager } from '@/src/components/subscription/SubscriptionManager';
import { useAuth } from '@/src/lib/contexts/AuthContext';
import { Tabs } from 'expo-router';

export default function DocumentsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'documents' | 'subscription'>('documents');

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authRequired}>
          <Text style={styles.authText}>Please sign in to access documents</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Tabs.Screen
        options={{
          title: 'Documents',
          headerShown: Platform.OS === 'ios',
        }}
      />

      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Race Documents & AI Strategy</Text>
            <Text style={styles.subtitle}>
              Upload sailing instructions, strategy guides, and race documents for AI-powered insights
            </Text>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabContainer}>
            <View style={styles.tabs}>
              <Text
                style={[styles.tab, activeTab === 'documents' && styles.activeTab]}
                onPress={() => setActiveTab('documents')}
              >
                Documents
              </Text>
              <Text
                style={[styles.tab, activeTab === 'subscription' && styles.activeTab]}
                onPress={() => setActiveTab('subscription')}
              >
                Subscription
              </Text>
            </View>
          </View>

          {activeTab === 'documents' ? (
            <>
              {/* Document Upload Section */}
              <View style={styles.section}>
                <DocumentUploadCard
                  onDocumentUploaded={(doc) => {
                    console.log('Document uploaded:', doc);
                  }}
                  onAnalysisComplete={(analysis) => {
                    console.log('Analysis complete:', analysis);
                  }}
                />
              </View>

              {/* Document Viewer Section */}
              <View style={styles.section}>
                <DocumentViewer
                  onInsightSelect={(insight) => {
                    console.log('Insight selected:', insight);
                    // Could navigate to strategy planner with this insight
                  }}
                />
              </View>
            </>
          ) : (
            <View style={styles.section}>
              <SubscriptionManager />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabs: {
    flexDirection: 'row',
    gap: 24,
  },
  tab: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    paddingBottom: 8,
  },
  activeTab: {
    color: '#007AFF',
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  section: {
    padding: 20,
  },
});