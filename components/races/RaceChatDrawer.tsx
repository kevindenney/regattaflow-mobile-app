/**
 * RaceChatDrawer Component
 *
 * Single-purpose bottom sheet for race chat functionality.
 * Extracted from RaceCollaborationDrawer as part of Phase 2b cleanup.
 *
 * Features:
 * - Real-time messaging with collaborators
 * - Simple, focused interface
 * - Uses shared ChatView component
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  Actionsheet,
  ActionsheetContent,
  ActionsheetBackdrop,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from '@/components/ui/actionsheet';
import { useRaceCollaboration } from '@/hooks/useRaceCollaboration';
import { ChatView } from './ChatView';
import { IOS_COLORS } from '@/components/cards/constants';
import { MessageSquare, X } from 'lucide-react-native';
import { supabase } from '@/services/supabase';

// =============================================================================
// TYPES
// =============================================================================

interface RaceChatDrawerProps {
  /** Regatta ID for the chat */
  regattaId: string;
  /** Race name for display (optional) */
  raceName?: string;
  /** Whether the drawer is open */
  isOpen: boolean;
  /** Callback when drawer is closed */
  onClose: () => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RaceChatDrawer({
  regattaId,
  raceName,
  isOpen,
  onClose,
}: RaceChatDrawerProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
    collaborators,
  } = useRaceCollaboration(regattaId);

  // Get current user ID for chat styling
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Count active collaborators for subtitle
  const activeCollaboratorCount = collaborators.filter(
    (c) => c.status === 'accepted'
  ).length;

  // ---------------------------------------------------------------------------
  // RENDER: HEADER
  // ---------------------------------------------------------------------------

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <MessageSquare size={20} color={IOS_COLORS.blue} />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {raceName ? `${raceName} Chat` : 'Race Chat'}
          </Text>
          {activeCollaboratorCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {activeCollaboratorCount} collaborator{activeCollaboratorCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </View>
      <Pressable
        style={styles.closeButton}
        onPress={onClose}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={24} color={IOS_COLORS.gray} />
      </Pressable>
    </View>
  );

  // ---------------------------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------------------------

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose} snapPoints={[75]}>
      <ActionsheetBackdrop />
      <ActionsheetContent style={styles.content}>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>

        {renderHeader()}

        <View style={styles.chatContainer}>
          <ChatView
            messages={messages}
            onSend={sendMessage}
            onDelete={deleteMessage}
            currentUserId={currentUserId || undefined}
            isLoading={isLoading}
            placeholder="Message your crew..."
          />
        </View>
      </ActionsheetContent>
    </Actionsheet>
  );
}

// =============================================================================
// STYLES
// =============================================================================

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: IOS_COLORS.label,
  },
  headerSubtitle: {
    fontSize: 13,
    color: IOS_COLORS.gray,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  chatContainer: {
    flex: 1,
  },
});

export default RaceChatDrawer;
