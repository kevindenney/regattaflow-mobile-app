import React from 'react';
import { router } from 'expo-router';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { roleHome } from '../../lib/gates';

export default function Login() {
  const { state, user } = useAuth();

  const onSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      /* show error */
      return;
    }
    if (state === 'needs_role') {
      router.replace('/(auth)/persona-selection');
      return;
    }
    if (user?.user_type) {
      router.replace(roleHome(user.user_type));
      return;
    }
    router.replace('/(auth)/persona-selection');
  };

  return null;
}
