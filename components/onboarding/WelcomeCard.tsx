/**
 * WelcomeCard — Centered modal card shown after signup.
 *
 * Interest-aware welcome screen with quick links to important features.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export interface WelcomeCardProps {
  visible: boolean;
  onStartTour: () => void;
  onSkip: () => void;
  onNavigate?: (route: string) => void;
  interestSlug?: string | null;
}

interface QuickLink {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  route: string;
  color: string;
}

const SAILING_LINKS: QuickLink[] = [
  {
    icon: 'add-circle',
    title: 'Add a Race',
    description: 'Track an upcoming regatta',
    route: '/(tabs)/races',
    color: '#2563EB',
  },
  {
    icon: 'school',
    title: 'Learn Tactics',
    description: 'Racing strategies & tips',
    route: '/(tabs)/learn',
    color: '#059669',
  },
  {
    icon: 'people',
    title: 'Find a Coach',
    description: 'Connect with sailing coaches',
    route: '/coach/discover',
    color: '#7C3AED',
  },
];

const GENERIC_LINKS: QuickLink[] = [
  {
    icon: 'add-circle',
    title: 'Add a Step',
    description: 'Create your first timeline step',
    route: '/(tabs)/races',
    color: '#2563EB',
  },
  {
    icon: 'compass',
    title: 'Browse Programs',
    description: 'Discover pathways and blueprints',
    route: '/(tabs)/learn',
    color: '#059669',
  },
  {
    icon: 'people',
    title: 'Find People',
    description: 'Connect with peers and mentors',
    route: '/(tabs)/connect',
    color: '#7C3AED',
  },
];

const SAILING_SLUGS = new Set(['sail-racing', 'sailing']);

function getLinks(interestSlug?: string | null): QuickLink[] {
  if (interestSlug && SAILING_SLUGS.has(interestSlug)) return SAILING_LINKS;
  return GENERIC_LINKS;
}

function getTitle(interestSlug?: string | null): string {
  if (interestSlug && SAILING_SLUGS.has(interestSlug)) return 'Welcome to BetterAt Sailing!';
  return 'Welcome to BetterAt!';
}

function getDescription(interestSlug?: string | null): string {
  if (interestSlug && SAILING_SLUGS.has(interestSlug)) {
    return 'Your sailing race companion. Here\'s how to get started:';
  }
  return 'Track your progress, learn from others, and reach your goals. Here\'s how to get started:';
}

function getIcon(interestSlug?: string | null): string {
  if (interestSlug && SAILING_SLUGS.has(interestSlug)) return '⛵';
  return '🚀';
}

export function WelcomeCard({ visible, onStartTour, onSkip, onNavigate, interestSlug }: WelcomeCardProps) {
  const { width } = useWindowDimensions();

  if (!visible) return null;

  const cardWidth = Math.min(380, width - 40);
  const links = getLinks(interestSlug);

  const handleQuickLink = (route: string) => {
    onSkip(); // Dismiss the card
    onNavigate?.(route);
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.backdrop}
    >
      <View style={[styles.card, { width: cardWidth }]}>
        <Text style={styles.emoji}>{getIcon(interestSlug)}</Text>
        <Text style={styles.title}>{getTitle(interestSlug)}</Text>
        <Text style={styles.description}>
          {getDescription(interestSlug)}
        </Text>

        {/* Quick Links */}
        <View style={styles.linksContainer}>
          {links.map((link, index) => (
            <TouchableOpacity
              key={index}
              style={styles.linkButton}
              onPress={() => handleQuickLink(link.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.linkIcon, { backgroundColor: `${link.color}15` }]}>
                <Ionicons name={link.icon} size={24} color={link.color} />
              </View>
              <View style={styles.linkContent}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkDescription}>{link.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.dismissButtonText}>Got it, let me explore</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  linksContainer: {
    width: '100%',
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  linkIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 13,
    color: '#64748B',
  },
  dismissButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  dismissButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563EB',
  },
});
