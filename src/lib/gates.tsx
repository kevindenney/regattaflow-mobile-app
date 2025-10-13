import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../providers/AuthProvider';

export const AuthGate = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  if (state === 'checking') return null;
  if (state === 'signed_out') return <Redirect href="/" />;
  return <>{children}</>;
};

export const RoleGate = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  if (state === 'checking') return null;
  if (state === 'signed_out') return <Redirect href="/" />;
  if (state === 'needs_role') return <Redirect href="/(auth)/persona-selection" />;
  return <>{children}</>;
};

export const roleHome = (role: 'sailor' | 'coach' | 'club') => {
  if (role === 'sailor') return '/(tabs)/dashboard';
  if (role === 'coach') return '/(tabs)/dashboard';
  return '/(tabs)/dashboard';
};
