import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { roleHome } from '../../lib/gates';

export default function PersonaSelection() {
  const { fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const choose = async (role: 'sailor' | 'coach' | 'club') => {
    try {

      setLoading(true);

      const { data: me } = await supabase.auth.getUser();

      const id = me.user?.id as string | undefined;
      if (!id) {

        setLoading(false);
        return;
      }

      // Update user type and onboarding status

      await supabase.from('users').update({
        user_type: role,
        onboarding_completed: false,
        onboarding_step: 'user_type_selected'
      }).eq('id', id);

      // Fetch profile FIRST to update auth state

      await fetchUserProfile(id);

      // Navigate to role-specific onboarding

      if (role === 'sailor') {
        router.replace('/(auth)/onboarding-redesign');
      } else if (role === 'coach') {
        router.replace('/(auth)/coach-onboarding-welcome');
      } else if (role === 'club') {
        router.replace('/(auth)/club-onboarding-chat');
      }
    } catch (error) {

      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you'll use RegattaFlow</Text>

        <TouchableOpacity
          testID="choose-sailor"
          style={[styles.roleButton, loading && styles.disabled]}
          onPress={() => {

            choose('sailor');
          }}
          disabled={loading}
        >
          <Text style={styles.roleTitle}>⛵ Sailor</Text>
          <Text style={styles.roleDescription}>Track races, improve performance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="choose-coach"
          style={[styles.roleButton, loading && styles.disabled]}
          onPress={() => choose('coach')}
          disabled={loading}
        >
          <Text style={styles.roleTitle}>🎓 Coach</Text>
          <Text style={styles.roleDescription}>Offer coaching sessions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="choose-club"
          style={[styles.roleButton, loading && styles.disabled]}
          onPress={() => choose('club')}
          disabled={loading}
        >
          <Text style={styles.roleTitle}>🏛️ Club</Text>
          <Text style={styles.roleDescription}>Manage races and members</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 40,
  },
  roleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  disabled: {
    opacity: 0.5,
  },
});
