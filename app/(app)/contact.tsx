/**
 * Contact Page - Get in touch with RegattaFlow team
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';

export default function ContactScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Construct mailto URL
    const subject = encodeURIComponent(formData.subject || 'Contact from RegattaFlow App');
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    const mailtoUrl = `mailto:hello@regattaflow.app?subject=${subject}&body=${body}`;

    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Email Not Available',
        'Please send your message directly to hello@regattaflow.app'
      );
    });
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  return (
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Ionicons name="mail" size={48} color="#0ea5e9" />
            <ThemedText style={styles.title}>Contact Us</ThemedText>
            <ThemedText style={styles.subtitle}>
              Get in touch with our sailing experts
            </ThemedText>
          </View>
        </View>

        {/* Contact Methods */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Get in Touch</ThemedText>

          <View style={styles.contactMethods}>
            <TouchableOpacity
              style={styles.contactMethod}
              onPress={() => openLink('mailto:hello@regattaflow.app')}
            >
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
                <Ionicons name="mail" size={24} color="#0ea5e9" />
              </View>
              <View style={styles.contactContent}>
                <ThemedText style={styles.contactTitle}>Email</ThemedText>
                <ThemedText style={styles.contactDescription}>hello@regattaflow.app</ThemedText>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactMethod}
              onPress={() => openLink('https://twitter.com/regattaflow')}
            >
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <Ionicons name="logo-twitter" size={24} color="#22c55e" />
              </View>
              <View style={styles.contactContent}>
                <ThemedText style={styles.contactTitle}>Twitter</ThemedText>
                <ThemedText style={styles.contactDescription}>@regattaflow</ThemedText>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#64748b" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactMethod}
              onPress={() => openLink('https://linkedin.com/company/regattaflow')}
            >
              <View style={[styles.contactIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                <Ionicons name="logo-linkedin" size={24} color="#8b5cf6" />
              </View>
              <View style={styles.contactContent}>
                <ThemedText style={styles.contactTitle}>LinkedIn</ThemedText>
                <ThemedText style={styles.contactDescription}>RegattaFlow</ThemedText>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Send us a Message</ThemedText>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Name *</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Your full name"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Email *</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="your.email@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Subject</ThemedText>
              <TextInput
                style={styles.input}
                value={formData.subject}
                onChangeText={(text) => setFormData({ ...formData, subject: text })}
                placeholder="What's this about?"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Message *</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.message}
                onChangeText={(text) => setFormData({ ...formData, message: text })}
                placeholder="Tell us how we can help you..."
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <ThemedText style={styles.submitButtonText}>Send Message</ThemedText>
              <Ionicons name="send" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Sections */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Support & Resources</ThemedText>

          <View style={styles.supportGrid}>
            <SupportCard
              icon="help-circle"
              title="Help Center"
              description="Find answers to common questions"
              action={() => Alert.alert('Coming Soon', 'Help center will be available soon!')}
            />

            <SupportCard
              icon="document-text"
              title="Documentation"
              description="Technical guides and API docs"
              action={() => Alert.alert('Coming Soon', 'Documentation will be available soon!')}
            />

            <SupportCard
              icon="people"
              title="Community"
              description="Join our sailing community"
              action={() => Alert.alert('Coming Soon', 'Community platform coming soon!')}
            />

            <SupportCard
              icon="bug"
              title="Report Bug"
              description="Found an issue? Let us know"
              action={() => openLink('mailto:support@regattaflow.app?subject=Bug Report')}
            />
          </View>
        </View>

        {/* Office Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Our Team</ThemedText>

          <View style={styles.officeCard}>
            <View style={styles.officeHeader}>
              <Ionicons name="location" size={24} color="#0ea5e9" />
              <ThemedText style={styles.officeTitle}>Global Team</ThemedText>
            </View>
            <ThemedText style={styles.officeDescription}>
              RegattaFlow is built by a distributed team of sailing enthusiasts and technology experts
              located around the world. From Hong Kong to San Francisco, Sydney to Southampton,
              we bring global sailing expertise to every feature we build.
            </ThemedText>
            <View style={styles.officeHours}>
              <ThemedText style={styles.officeHoursTitle}>Response Time</ThemedText>
              <ThemedText style={styles.officeHoursText}>
                We typically respond within 24 hours during business days.
                For urgent issues, please mark your email as "URGENT".
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Have a question about racing strategy, venue intelligence, or technical features?
            Our team of sailing experts is here to help.
          </ThemedText>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

interface SupportCardProps {
  icon: string;
  title: string;
  description: string;
  action: () => void;
}

function SupportCard({ icon, title, description, action }: SupportCardProps) {
  return (
    <TouchableOpacity style={styles.supportCard} onPress={action}>
      <View style={styles.supportIcon}>
        <Ionicons name={icon as any} size={24} color="#0ea5e9" />
      </View>
      <ThemedText style={styles.supportTitle}>{title}</ThemedText>
      <ThemedText style={styles.supportDescription}>{description}</ThemedText>
    </TouchableOpacity>
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 16,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 20,
  },

  // Contact Methods
  contactMethods: {
    gap: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  contactDescription: {
    fontSize: 14,
    color: '#94a3b8',
  },

  // Form
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Support Grid
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  supportCard: {
    width: '45%',
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  supportIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 6,
  },
  supportDescription: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Office
  officeCard: {
    backgroundColor: '#1e293b',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  officeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  officeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f8fafc',
  },
  officeDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 20,
  },
  officeHours: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  officeHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  officeHoursText: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});