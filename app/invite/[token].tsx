/**
 * Invite Acceptance Page
 *
 * Landing page for users who click an organization invite link.
 * Shows org info and allows accepting/declining the invite.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import {
  organizationInviteService,
  type OrganizationInviteRecord,
} from '@/services/OrganizationInviteService';
import { getOnboardingContext } from '@/lib/onboarding/interestContext';
import { supabase } from '@/services/supabase';

export default function InviteTokenPage() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { user, isGuest } = useAuth();

  const [invite, setInvite] = useState<OrganizationInviteRecord | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgInterestSlug, setOrgInterestSlug] = useState<string | null>(null);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    loadInviteDetails();
  }, [token]);

  const loadInviteDetails = async () => {
    if (!token) {
      setError('Invalid invite link');
      setLoading(false);
      return;
    }

    try {
      const inviteData = await organizationInviteService.getInviteByToken(token);
      if (!inviteData) {
        setError('This invite link is invalid or has expired');
        setLoading(false);
        return;
      }

      setInvite(inviteData);

      // Mark as opened
      try {
        await organizationInviteService.markInviteOpenedByToken(token);
      } catch {
        // Non-critical
      }

      // Fetch org name
      if (inviteData.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name,interest_slug')
          .eq('id', inviteData.organization_id)
          .single();
        if (org) {
          setOrgName(org.name);
          setOrgInterestSlug(org.interest_slug || null);
        }
      }

      // Fetch inviter name
      if (inviteData.invited_by) {
        const { data: inviter } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', inviteData.invited_by)
          .single();
        if (inviter?.full_name) {
          setInviterName(inviter.full_name);
        }
      }
    } catch (err) {
      setError('Failed to load invite details');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!token) return;
    setResponding(true);
    try {
      await organizationInviteService.acceptInviteTokenForCurrentUser(token);
      setAccepted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invite');
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setResponding(true);
    try {
      await organizationInviteService.declineInviteByTokenForCurrentUser(token);
      router.replace('/');
    } catch (err: any) {
      setError(err?.message || 'Failed to decline invite');
    } finally {
      setResponding(false);
    }
  };

  const handleSignUp = () => {
    router.push({
      pathname: '/(auth)/signup',
      params: {
        inviteToken: token,
        ...(orgInterestSlug ? { interest: orgInterestSlug } : {}),
      },
    });
  };

  const handleSignIn = () => {
    router.push({
      pathname: '/(auth)/login',
      params: { inviteToken: token },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !invite) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle" size={64} color="#DC2626" />
          </View>
          <Text style={styles.errorTitle}>Invite Not Found</Text>
          <Text style={styles.errorText}>
            {error || 'This invite link is invalid or has expired'}
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.secondaryButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Accepted state
  if (accepted) {
    const ctx = getOnboardingContext(orgInterestSlug || undefined);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={[styles.successIcon, orgInterestSlug ? { backgroundColor: ctx.color + '18' } : undefined]}>
            <Ionicons name="checkmark-circle" size={64} color={orgInterestSlug ? ctx.color : '#16A34A'} />
          </View>
          <Text style={styles.successTitle}>Welcome to {orgName || 'the organization'}!</Text>
          {invite?.role_label && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{invite.role_label}</Text>
            </View>
          )}
          <Text style={styles.successText}>
            You've been added as a member. You can now access the organization's content and programs.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              if (orgInterestSlug) {
                // Route to the org's interest page
                router.replace(`/${orgInterestSlug}` as any);
              } else {
                router.replace('/(tabs)/races' as any);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>
              {orgInterestSlug ? `Explore ${ctx.interestName}` : 'Go to Dashboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAlreadyResponded = invite?.status === 'accepted' || invite?.status === 'declined';
  const ctx = getOnboardingContext(orgInterestSlug || undefined);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Org Icon */}
          <View style={[styles.orgIcon, { backgroundColor: orgInterestSlug ? ctx.color : '#2563EB' }]}>
            <Ionicons name="business" size={48} color="#FFFFFF" />
          </View>

          {/* Invite Text */}
          <Text style={styles.heading}>You're Invited!</Text>
          <Text style={styles.subheading}>
            Join <Text style={styles.orgName}>{orgName || 'an organization'}</Text>
          </Text>

          {/* Interest Badge */}
          {orgInterestSlug && (
            <View style={[styles.interestBadge, { backgroundColor: ctx.color + '18', borderColor: ctx.color + '40' }]}>
              <Text style={[styles.interestBadgeText, { color: ctx.color }]}>
                {ctx.interestName}
              </Text>
            </View>
          )}

          {/* Invite Details Card */}
          <View style={styles.detailsCard}>
            {invite?.role_label && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Role</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{invite.role_label}</Text>
                </View>
              </View>
            )}
            {inviterName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Invited by</Text>
                <Text style={styles.detailValue}>{inviterName}</Text>
              </View>
            )}
            {invite?.invitee_email && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>For</Text>
                <Text style={styles.detailValue}>{invite.invitee_email}</Text>
              </View>
            )}
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Actions */}
          {isAlreadyResponded ? (
            <View style={styles.respondedBanner}>
              <Ionicons
                name={invite?.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                size={20}
                color={invite?.status === 'accepted' ? '#16A34A' : '#DC2626'}
              />
              <Text style={styles.respondedText}>
                This invite has already been {invite?.status}.
              </Text>
            </View>
          ) : isGuest ? (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
                <Text style={styles.primaryButtonText}>Sign Up to Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleSignIn}>
                <Text style={styles.secondaryButtonText}>
                  Already have an account? Sign In
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryButton, responding && styles.buttonDisabled]}
                onPress={handleAccept}
                disabled={responding}
              >
                {responding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Accept Invite</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.declineButton, responding && styles.buttonDisabled]}
                onPress={handleDecline}
                disabled={responding}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  orgIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 12,
  },
  orgName: {
    color: '#2563EB',
    fontWeight: '600',
  },
  interestBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 20,
  },
  interestBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  roleBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  errorBanner: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 14,
  },
  respondedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 14,
    width: '100%',
  },
  respondedText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '500',
  },
  declineButton: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  declineButtonText: {
    fontSize: 15,
    color: '#64748B',
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
