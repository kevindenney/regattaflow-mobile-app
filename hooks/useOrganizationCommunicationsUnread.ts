import { useCallback, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { programService } from '@/services/ProgramService';
import { supabase } from '@/services/supabase';

export function useOrganizationCommunicationsUnread() {
  const { user } = useAuth();
  const { ready, activeOrganization } = useOrganization();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const organizationId = activeOrganization?.id ?? null;
  const userId = user?.id ?? null;

  const refresh = useCallback(async () => {
    if (!organizationId || !userId) {
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const nextCount = await programService.getUnreadThreadCount(organizationId, userId);
      setUnreadCount(nextCount);
    } finally {
      setLoading(false);
    }
  }, [organizationId, userId]);

  useEffect(() => {
    if (!ready || !isFocused || !organizationId || !userId) {
      return;
    }

    void refresh();

    const channel = supabase.channel(`org-unread-count:${organizationId}:${userId}`);
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communication_messages', filter: `organization_id=eq.${organizationId}` },
        () => void refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communication_thread_reads', filter: `organization_id=eq.${organizationId}` },
        () => void refresh()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'communication_threads', filter: `organization_id=eq.${organizationId}` },
        () => void refresh()
      )
      .subscribe();

    const interval = setInterval(() => {
      void refresh();
    }, 60_000);

    return () => {
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [ready, isFocused, organizationId, userId, refresh]);

  return {
    unreadCount,
    loading,
    refresh,
  };
}
