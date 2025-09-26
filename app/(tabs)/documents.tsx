/**
 * Documents Tab - AI-Powered Document Upload and Processing
 * Complete integration with our race strategy AI system
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DocumentUploadCard } from '@/src/components/documents/DocumentUploadCard';
import type { StoredDocument } from '@/src/services/storage/DocumentStorageService';
import type { DocumentAnalysis, RaceCourseExtraction } from '@/src/lib/types/ai-knowledge';

export default function DocumentsScreen() {
  console.log('📄 Documents: AI-Powered Document Processing Loading');

  const [recentAnalyses, setRecentAnalyses] = useState<DocumentAnalysis[]>([]);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  const handleDocumentUploaded = (document: StoredDocument) => {
    console.log('📄 Document uploaded:', document.filename);
    setShowUploadSuccess(true);
    setTimeout(() => setShowUploadSuccess(false), 3000);
  };

  const handleAnalysisComplete = (analysis: DocumentAnalysis) => {
    console.log('🧠 AI Analysis complete:', analysis.documentClass);
    setRecentAnalyses(prev => [analysis, ...prev].slice(0, 5));

    Alert.alert(
      '🧠 AI Analysis Complete!',
      `Document analyzed as: ${analysis.documentClass}\n\n` +
      `Confidence: ${Math.round((analysis.confidence || 0.8) * 100)}%\n` +
      `Key Insights: ${analysis.insights.length}\n\n` +
      `Summary: ${analysis.summary.slice(0, 100)}...`,
      [{ text: 'View Strategy', style: 'default' }, { text: 'OK', style: 'cancel' }]
    );
  };

  const handleCourseExtracted = (course: RaceCourseExtraction) => {
    console.log('🏁 Race course extracted:', course.courseLayout.type);

    Alert.alert(
      '🏁 Race Course Extracted!',
      `Course Type: ${course.courseLayout.type}\n` +
      `Marks: ${course.marks.length}\n` +
      `Confidence: ${Math.round(course.extractionMetadata.overallConfidence * 100)}%\n\n` +
      `Ready to generate AI race strategy!`,
      [
        { text: 'Generate Strategy', style: 'default' },
        { text: 'View 3D Course', style: 'default' },
        { text: 'OK', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🧠 AI Document Processing</Text>
          <Text style={styles.subtitle}>Upload sailing instructions for AI analysis</Text>
        </View>

        {/* Success Banner */}
        {showUploadSuccess && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={24} color="#00CC44" />
            <Text style={styles.successText}>Document uploaded successfully!</Text>
          </View>
        )}

        {/* Document Upload Component */}
        <DocumentUploadCard
          onDocumentUploaded={handleDocumentUploaded}
          onAnalysisComplete={handleAnalysisComplete}
          onCourseExtracted={handleCourseExtracted}
        />

        {/* Recent Analysis */}
        {recentAnalyses.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>🎯 Recent AI Analysis</Text>
            {recentAnalyses.map((analysis, index) => (
              <View key={index} style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <Text style={styles.analysisTitle}>{analysis.documentClass}</Text>
                  <Text style={styles.analysisConfidence}>
                    {Math.round((analysis.confidence || 0.8) * 100)}% confidence
                  </Text>
                </View>
                <Text style={styles.analysisSummary}>
                  {analysis.summary.slice(0, 120)}...
                </Text>
                <Text style={styles.analysisInsights}>
                  {analysis.insights.length} tactical insights • {analysis.keyTopics.length} key topics
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="camera" size={24} color="#0066CC" />
            <Text style={styles.actionText}>Photo Sailing Instructions</Text>
            <Text style={styles.actionSubtext}>OCR text extraction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="document-text" size={24} color="#00CC44" />
            <Text style={styles.actionText}>Upload PDF Documents</Text>
            <Text style={styles.actionSubtext}>AI-powered parsing</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="brain" size={24} color="#FF8000" />
            <Text style={styles.actionText}>Generate Race Strategy</Text>
            <Text style={styles.actionSubtext}>From uploaded documents</Text>
          </TouchableOpacity>
        </View>

        {/* AI Features Info */}
        <View style={styles.featuresInfo}>
          <Text style={styles.featuresTitle}>🚀 AI Features</Text>
          <Text style={styles.featureItem}>🧠 Intelligent document parsing with Gemini AI</Text>
          <Text style={styles.featureItem}>🏁 Automatic race course extraction</Text>
          <Text style={styles.featureItem}>📍 GPS venue detection and local intelligence</Text>
          <Text style={styles.featureItem}>🎯 AI-generated tactical recommendations</Text>
          <Text style={styles.featureItem}>🗺️ 3D course visualization</Text>
          <Text style={styles.featureItem}>📱 Mobile race day interface</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00CC44',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00AA00',
    marginLeft: 12,
  },
  recentSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  analysisCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  analysisConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00CC44',
  },
  analysisSummary: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  analysisInsights: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    margin: 20,
    marginTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 16,
    flex: 1,
  },
  actionSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  featuresInfo: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#E3F2FD',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066CC',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0066CC',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
    paddingLeft: 8,
  },
});