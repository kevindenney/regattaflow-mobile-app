/**
 * Signup Prompt Modal Component
 * Encourages guest users to create a free account
 * Shows contextual benefits based on the feature being accessed
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export type SignupPromptFeature =
  | 'multiple_races'
  | 'ai_analysis'
  | 'cloud_sync'
  | 'post_race_results'
  | 'default';

interface SignupPromptModalProps {
  visible: boolean;
  onClose: () => void;
  feature?: SignupPromptFeature;
  title?: string;
  message?: string;
}

export default function SignupPromptModal({
  visible,
  onClose,
  feature = 'default',
  title,
  message,
}: SignupPromptModalProps) {
  // Default content based on feature
  const getFeatureContent = () => {
    switch (feature) {
      case 'multiple_races':
        return {
          title: 'Add More Races',
          message: 'Create a free account to add unlimited races and track all your sailing events.',
          benefits: [
            'Add unlimited races',
            'Sync across all your devices',
            'Never lose your race data',
            'Access your races anywhere',
          ],
          icon: 'boat' as const,
        };
      case 'ai_analysis':
        return {
          title: 'AI Race Analysis',
          message: 'Get AI-powered insights and tactical recommendations for your races.',
          benefits: [
            'AI-powered race strategy',
            'Tactical recommendations',
            'Performance analytics',
            'Post-race analysis',
          ],
          icon: 'analytics' as const,
        };
      case 'cloud_sync':
        return {
          title: 'Sync Your Data',
          message: 'Keep your race data safe and accessible on all your devices.',
          benefits: [
            'Automatic cloud backup',
            'Access from any device',
            'Never lose your data',
            'Seamless sync',
          ],
          icon: 'cloud' as const,
        };
      case 'post_race_results':
        return {
          title: 'View Full Results',
          message: 'Create an account to save and view your complete race results and history.',
          benefits: [
            'Full race results history',
            'Performance tracking over time',
            'Compare results across races',
            'Export for coaching sessions',
          ],
          icon: 'trophy' as const,
        };
      default:
        return {
          title: title || 'Create Free Account',
          message: message || 'Sign up to unlock the full RegattaFlow experience.',
          benefits: [
            'Add unlimited races',
            'Sync across devices',
            'Cloud backup',
            'AI race analysis',
          ],
          icon: 'person-add' as const,
        };
    }
  };

  const content = getFeatureContent();

  const handleSignUp = () => {
    onClose();
    router.push('/(auth)/signup');
  };

  const handleSignIn = () => {
    onClose();
    router.push('/(auth)/login');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={styles.container}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#f8fafc" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name={content.icon} size={48} color="#0ea5e9" />
              </View>
            </View>

            <View style={styles.titleContainer}>
              <ThemedText style={styles.title}>{content.title}</ThemedText>
              <ThemedText style={styles.description}>{content.message}</ThemedText>
            </View>
          </View>

          {/* Benefits */}
          <View style={styles.benefitsSection}>
            <ThemedText style={styles.benefitsTitle}>Free Account Benefits</ThemedText>
            <View style={styles.benefitsList}>
              {content.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <Ionicons name="checkmark" size={20} color="#22c55e" />
                  </View>
                  <ThemedText style={styles.benefitText}>{benefit}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Free Account Card */}
          <View style={styles.freeCard}>
            <View style={styles.freeBadge}>
              <ThemedText style={styles.freeBadgeText}>100% Free</ThemedText>
            </View>

            <View style={styles.freeCardContent}>
              <ThemedText style={styles.freeCardTitle}>RegattaFlow Account</ThemedText>
              <ThemedText style={styles.freeCardPrice}>$0</ThemedText>
              <ThemedText style={styles.freeCardSubtext}>No credit card required</ThemedText>
            </View>

            <View style={styles.freeFeatures}>
              <View style={styles.freeFeatureItem}>
                <Ionicons name="infinite" size={16} color="#0ea5e9" />
                <ThemedText style={styles.freeFeatureText}>Unlimited races</ThemedText>
              </View>
              <View style={styles.freeFeatureItem}>
                <Ionicons name="sync" size={16} color="#0ea5e9" />
                <ThemedText style={styles.freeFeatureText}>Multi-device sync</ThemedText>
              </View>
              <View style={styles.freeFeatureItem}>
                <Ionicons name="cloud-upload" size={16} color="#0ea5e9" />
                <ThemedText style={styles.freeFeatureText}>Automatic backup</ThemedText>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
              <Ionicons name="person-add" size={20} color="#ffffff" />
              <ThemedText style={styles.primaryButtonText}>Create Free Account</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <ThemedText style={styles.secondaryButtonText}>Continue as Guest</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <ThemedText style={styles.signInText}>Already have an account?</ThemedText>
            <TouchableOpacity onPress={handleSignIn}>
              <ThemedText style={styles.signInLink}>Sign In</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Trust Indicators */}
          <View style={styles.trustIndicators}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
              <ThemedText style={styles.trustText}>Secure</ThemedText>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="lock-closed" size={16} color="#22c55e" />
              <ThemedText style={styles.trustText}>Privacy First</ThemedText>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="flash" size={16} color="#22c55e" />
              <ThemedText style={styles.trustText}>Instant Setup</ThemedText>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              Your current race data will be saved to your account
            </ThemedText>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  // Benefits
  benefitsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitIcon: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 16,
    color: '#e2e8f0',
    lineHeight: 24,
  },

  // Free Card
  freeCard: {
    marginHorizontal: 24,
    marginBottom: 28,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  freeBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  freeCardContent: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  freeCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  freeCardPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 2,
  },
  freeCardSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  freeFeatures: {
    gap: 10,
  },
  freeFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeFeatureText: {
    fontSize: 14,
    color: '#e2e8f0',
    flex: 1,
  },

  // Action Buttons
  actionButtons: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },

  // Sign In
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  signInText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },

  // Trust Indicators
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  trustItem: {
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
