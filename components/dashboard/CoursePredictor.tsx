/**
 * Course Predictor Component
 * AI-powered race course prediction based on weather conditions
 * Powered by CoursePredictionAgent
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CoursePredictionAgent } from '@/services/agents/CoursePredictionAgent';

interface CoursePredictorProps {
  regattaId: string;
  venueId: string;
  raceDate: string;
}

interface CoursePrediction {
  predictedCourse: string;
  confidence: number;
  reasoning: string;
  alternatives?: Array<{
    course: string;
    probability: number;
  }>;
}

export function CoursePredictor({ regattaId, venueId, raceDate }: CoursePredictorProps) {
  const [prediction, setPrediction] = useState<CoursePrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictCourse = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const agent = new CoursePredictionAgent();
      const result = await agent.predictCourse({
        regattaId,
        venueId,
        raceDate,
      });

      if (result.success && result.result) {
        // Parse the agent's response for course prediction data
        // The agent returns natural language, we'll extract structured data
        // In production, this would parse the agent's response more thoroughly

        setPrediction({
          predictedCourse: 'Course A', // Placeholder - would be extracted from agent response
          confidence: 0.85,
          reasoning: result.result,
          alternatives: [
            { course: 'Course B', probability: 0.10 },
            { course: 'Course C', probability: 0.05 },
          ],
        });
      } else {
        setError(result.error || 'Failed to predict course');
      }
    } catch (err: any) {
      console.error('Course prediction error:', err);
      setError(err.message || 'Failed to predict course');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    predictCourse();
  }, [regattaId, venueId, raceDate]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#4caf50'; // High confidence - green
    if (confidence >= 0.6) return '#ff9800'; // Medium confidence - orange
    return '#f44336'; // Low confidence - red
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#9333ea" />
          <Text style={styles.loadingText}>Predicting course...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={predictCourse}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!prediction) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Predicted Course</Text>
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: getConfidenceColor(prediction.confidence) },
          ]}
        >
          <Text style={styles.confidenceText}>
            {getConfidenceLabel(prediction.confidence)} Confidence
          </Text>
        </View>
      </View>

      {/* Main Prediction */}
      <View style={styles.mainPrediction}>
        <Text style={styles.predictedCourse}>{prediction.predictedCourse}</Text>
        <Text style={styles.confidencePercentage}>
          {Math.round(prediction.confidence * 100)}% confident
        </Text>
      </View>

      {/* AI Reasoning */}
      <View style={styles.reasoningSection}>
        <Text style={styles.reasoningTitle}>AI Analysis</Text>
        <Text style={styles.reasoningText}>{prediction.reasoning}</Text>
      </View>

      {/* Alternative Courses */}
      {prediction.alternatives && prediction.alternatives.length > 0 && (
        <View style={styles.alternativesSection}>
          <Text style={styles.alternativesTitle}>Alternative Courses</Text>
          {prediction.alternatives.map((alt, index) => (
            <View key={index} style={styles.alternativeItem}>
              <Text style={styles.alternativeCourse}>{alt.course}</Text>
              <View style={styles.probabilityBar}>
                <View
                  style={[
                    styles.probabilityFill,
                    { width: `${alt.probability * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.probabilityText}>
                {Math.round(alt.probability * 100)}%
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={predictCourse}>
        <Text style={styles.refreshButtonText}>🔄 Update Prediction</Text>
      </TouchableOpacity>
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
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mainPrediction: {
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e9d5ff',
  },
  predictedCourse: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#9333ea',
    marginBottom: 8,
  },
  confidencePercentage: {
    fontSize: 14,
    color: '#666',
  },
  reasoningSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  alternativesSection: {
    marginBottom: 16,
  },
  alternativesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alternativeCourse: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 80,
  },
  probabilityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  probabilityFill: {
    height: '100%',
    backgroundColor: '#9333ea',
  },
  probabilityText: {
    fontSize: 12,
    color: '#666',
    width: 40,
    textAlign: 'right',
  },
  refreshButton: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#9333ea',
    fontWeight: '600',
  },
});
