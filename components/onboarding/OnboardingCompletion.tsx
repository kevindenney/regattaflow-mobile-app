import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface OnboardingCompletionProps {
  userType: 'sailor' | 'coach' | 'club';
  userName?: string;
  nextSteps?: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    route?: string;
  }>;
  onComplete?: () => void;
}

export const OnboardingCompletion: React.FC<OnboardingCompletionProps> = ({
  userType,
  userName,
  nextSteps,
  onComplete,
}) => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Celebration animation sequence
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getWelcomeMessage = () => {
    switch (userType) {
      case 'sailor':
        return {
          title: '🎉 Welcome Aboard!',
          subtitle: `You're all set, ${userName || 'Sailor'}! Let's start tracking your races.`,
          color: '#0066CC',
        };
      case 'coach':
        return {
          title: '🏆 Profile Complete!',
          subtitle: `Your coaching profile is live, ${userName || 'Coach'}! Start connecting with sailors.`,
          color: '#059669',
        };
      case 'club':
        return {
          title: '⚓ Club Setup Complete!',
          subtitle: `Your club is ready to go, ${userName || 'Admin'}! Start managing regattas.`,
          color: '#DC2626',
        };
    }
  };

  const defaultNextSteps = {
    sailor: [
      {
        icon: 'calendar' as const,
        title: 'Join a Race',
        description: 'Browse upcoming regattas and register',
        route: '/(tabs)/races',
      },
      {
        icon: 'boat' as const,
        title: 'Track Performance',
        description: 'Start logging your races and analyze results',
        route: '/(tabs)/races',
      },
      {
        icon: 'people' as const,
        title: 'Build Your Crew',
        description: 'Invite crew members and manage your team',
        route: '/(tabs)/crew',
      },
    ],
    coach: [
      {
        icon: 'trophy' as const,
        title: 'Complete Your Profile',
        description: 'Add certifications and sailing achievements',
        route: '/(tabs)/more',
      },
      {
        icon: 'calendar' as const,
        title: 'Set Availability',
        description: 'Manage your coaching schedule',
        route: '/(tabs)/schedule',
      },
      {
        icon: 'people' as const,
        title: 'Find Clients',
        description: 'Browse sailors looking for coaching',
        route: '/(tabs)/clients',
      },
    ],
    club: [
      {
        icon: 'calendar' as const,
        title: 'Create First Event',
        description: 'Set up your first regatta or race series',
        route: '/(tabs)/events',
      },
      {
        icon: 'people' as const,
        title: 'Invite Members',
        description: 'Add club members and race committee',
        route: '/(tabs)/members',
      },
      {
        icon: 'settings' as const,
        title: 'Configure Settings',
        description: 'Customize scoring and race formats',
        route: '/(tabs)/more',
      },
    ],
  };

  const message = getWelcomeMessage();
  const steps = nextSteps || defaultNextSteps[userType];

  return (
    <View style={styles.container}>
      {/* Celebration Icon */}
      <Animated.View
        style={[
          styles.celebrationIcon,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: `${message.color}15` }]}>
          <Ionicons name="checkmark-circle" size={80} color={message.color} />
        </View>
      </Animated.View>

      {/* Welcome Message */}
      <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.subtitle}>{message.subtitle}</Text>
      </Animated.View>

      {/* Next Steps */}
      <Animated.View style={[styles.nextStepsContainer, { opacity: fadeAnim }]}>
        <Text style={styles.nextStepsTitle}>Next Steps</Text>

        {steps.map((step, index) => (
          <TouchableOpacity
            key={index}
            style={styles.stepCard}
            onPress={() => {
              if (step.route) {
                router.replace(step.route as any);
              }
            }}
          >
            <View style={[styles.stepIcon, { backgroundColor: `${message.color}15` }]}>
              <Ionicons name={step.icon} size={24} color={message.color} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Action Button */}
      <Animated.View style={[styles.actionContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: message.color }]}
          onPress={() => {
            if (onComplete) {
              onComplete();
            } else {
              // Route based on user type
              const defaultRoute = userType === 'sailor' ? '/(tabs)/races' : '/(tabs)/dashboard';
              router.replace(defaultRoute as any);
            }
          }}
        >
          <Text style={styles.actionButtonText}>Go to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            if (steps[0]?.route) {
              router.replace(steps[0].route as any);
            } else {
              // Route based on user type
              const defaultRoute = userType === 'sailor' ? '/(tabs)/races' : '/(tabs)/dashboard';
              router.replace(defaultRoute as any);
            }
          }}
        >
          <Text style={styles.skipButtonText}>Take a Quick Tour</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
    paddingTop: 60,
  },
  celebrationIcon: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 26,
  },
  nextStepsContainer: {
    marginBottom: 32,
  },
  nextStepsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 'auto',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#64748B',
  },
});
