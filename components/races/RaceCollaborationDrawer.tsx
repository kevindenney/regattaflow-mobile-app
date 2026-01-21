/**
 * RaceCollaborationDrawer Component
 *
 * Bottom sheet drawer for race collaboration features:
 * - Crew tab: View/manage collaborators, create invites
 * - Chat tab: Real-time messaging with collaborators
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetBackdrop,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from '@/components/ui/actionsheet';
import { useRaceCollaboration } from '@/hooks/useRaceCollaboration';
import { CollaboratorList } from './CollaboratorList';
import { ChatView } from './ChatView';
import { IOS_COLORS } from '@/components/cards/constants';
import { Users, MessageSquare, X } from 'lucide-react-native';
import { supabase } from '@/services/supabase';

interface RaceCollaborationDrawerProps {
  /** Regatta ID to show collaboration for */
  regattaId: string;
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer is closed */
  onClose: () => void;
}

type Tab = 'crew' | 'chat';

export function RaceCollaborationDrawer({
  regattaId,
  isOpen,
  onClose,
}: RaceCollaborationDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('crew');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { height: windowHeight } = useWindowDimensions();

  const {
    collaborators,
    messages,
    isLoading,
    isOwner,
    createInvite,
    sendMessage,
    removeCollaborator,
    updateAccessLevel,
  } = useRaceCollaboration(regattaId);

  // Get current user ID for chat styling
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Calculate drawer height (80% of screen)
  const drawerHeight = windowHeight * 0.8;

  // Count unread messages (simplified - just show total)
  const messageCount = messages.length;
  const pendingCount = collaborators.filter((c) => c.status === 'pending').length;

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={[styles.content, { height: drawerHeight }]}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Crew Collaboration</Text>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={IOS_COLORS.gray} />
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'crew' && styles.activeTab]}
            onPress={() => setActiveTab('crew')}
          >
            <Users
              size={18}
              color={activeTab === 'crew' ? IOS_COLORS.blue : IOS_COLORS.gray}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'crew' && styles.activeTabText,
              ]}
            >
              Crew
            </Text>
            {pendingCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
            onPress={() => setActiveTab('chat')}
          >
            <MessageSquare
              size={18}
              color={activeTab === 'chat' ? IOS_COLORS.blue : IOS_COLORS.gray}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'chat' && styles.activeTabText,
              ]}
            >
              Chat
            </Text>
            {messageCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{messageCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'crew' ? (
            <CollaboratorList
              collaborators={collaborators}
              isOwner={isOwner}
              onCreateInvite={createInvite}
              onRemove={removeCollaborator}
              onUpdateAccess={updateAccessLevel}
              isLoading={isLoading}
            />
          ) : (
            <ChatView
              messages={messages}
              onSend={sendMessage}
              currentUserId={currentUserId || undefined}
              isLoading={isLoading}
              placeholder="Message your crew..."
            />
          )}
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: IOS_COLORS.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: IOS_COLORS.gray5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: IOS_COLORS.gray6,
  },
  activeTab: {
    backgroundColor: `${IOS_COLORS.blue}15`,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.gray,
  },
  activeTabText: {
    color: IOS_COLORS.blue,
  },
  tabBadge: {
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: IOS_COLORS.systemBackground,
  },
  tabContent: {
    flex: 1,
  },
});

export default RaceCollaborationDrawer;
