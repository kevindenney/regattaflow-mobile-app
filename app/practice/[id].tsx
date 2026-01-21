/**
 * Practice Detail Screen (Tufte Redesign)
 *
 * Phase-based practice session view following Tufte principles:
 * - Typography-driven hierarchy
 * - Phase navigation with auto-detection
 * - Dense, information-rich display
 * - Minimal visual chrome
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  MoreHorizontal,
  Trash2,
  Edit3,
  Play,
} from 'lucide-react-native';
import { IOS_COLORS, TUFTE_BACKGROUND } from '@/components/cards/constants';
import { TufteSessionHeader, TuftePhaseNavigator } from '@/components/practice/tufte';
import {
  PreparePhaseContent,
  LaunchPhaseContent,
  TrainPhaseContent,
  ReflectPhaseContent,
} from '@/components/practice/phases';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { usePracticeChecklist } from '@/hooks/usePracticeChecklist';
import { practiceSessionService } from '@/services/PracticeSessionService';
import { useAuth } from '@/providers/AuthProvider';
import {
  PracticePhase,
  getCurrentPracticePhase,
} from '@/types/practice';
import { RigTuningWizard } from '@/components/checklist-tools/wizards/RigTuningWizard';
import { ForecastCheckWizard } from '@/components/checklist-tools/wizards/ForecastCheckWizard';
import {
  PracticeChecklistItem,
  getPracticeChecklistItems,
} from '@/lib/checklists/practiceChecklists';

export default function PracticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { session, isLoading, error, refresh } = usePracticeSession({
    sessionId: id || '',
  });

  // Phase state - auto-detect by default, allow manual override
  const autoPhase = useMemo(() => {
    if (!session) return 'practice_prepare' as PracticePhase;
    return getCurrentPracticePhase(session);
  }, [session]);

  const [manualPhase, setManualPhase] = useState<PracticePhase | null>(null);
  const currentPhase = manualPhase || autoPhase;

  // Checklist completions via hook (persisted to AsyncStorage)
  const {
    completions,
    toggleItem: handleToggleItem,
    isLoading: checklistLoading,
  } = usePracticeChecklist({
    sessionId: id || '',
    sessionName: session?.title,
    phase: currentPhase,
  });

  const [showMenu, setShowMenu] = useState(false);

  // Wizard state for checklist tool modals
  const [activeWizard, setActiveWizard] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PracticeChecklistItem | null>(null);

  // Get all checklist items for current phase to look up tool info
  const phaseChecklistItems = useMemo(
    () => getPracticeChecklistItems(currentPhase),
    [currentPhase]
  );

  // Handle opening the appropriate tool for a checklist item
  const handleOpenTool = useCallback((itemId: string) => {
    const item = phaseChecklistItems.find(i => i.id === itemId);
    if (!item) return;

    if (item.toolType === 'full_wizard' && item.toolId) {
      setActiveWizard(item.toolId);
      setSelectedItem(item);
    }
    // For quick_tips or other types, we could show a different panel
    // For now, just toggle completion
  }, [phaseChecklistItems]);

  // Handle wizard completion
  const handleWizardComplete = useCallback(() => {
    if (selectedItem) {
      handleToggleItem(selectedItem.id);
    }
    setActiveWizard(null);
    setSelectedItem(null);
  }, [selectedItem, handleToggleItem]);

  // Handle wizard cancel
  const handleWizardCancel = useCallback(() => {
    setActiveWizard(null);
    setSelectedItem(null);
  }, []);

  // Navigation
  const handleBack = () => router.back();

  const handlePhaseChange = (phase: PracticePhase) => {
    setManualPhase(phase === autoPhase ? null : phase);
  };

  // Session actions
  const handleStartSession = async () => {
    if (!session) return;
    try {
      await practiceSessionService.updateSession(session.id, {
        status: 'in_progress',
      });
      refresh();
    } catch (err) {
      console.error('Failed to start session:', err);
      Alert.alert('Error', 'Failed to start session');
    }
  };

  const handleCompleteSession = async () => {
    if (!session) return;
    try {
      await practiceSessionService.completeSession(session.id, {
        actualDurationMinutes: session.durationMinutes || 30,
      });
      refresh();
    } catch (err) {
      console.error('Failed to complete session:', err);
      Alert.alert('Error', 'Failed to complete session');
    }
  };

  const handleCompleteDrill = useCallback(async (drillId: string) => {
    if (!session) return;
    try {
      // Update drill completion (would call service in production)
      refresh();
    } catch (err) {
      console.error('Failed to complete drill:', err);
    }
  }, [session, refresh]);

  const handleRateDrill = useCallback(async (drillId: string, rating: number, notes?: string) => {
    if (!session) return;
    try {
      // Update drill rating (would call service in production)
      refresh();
    } catch (err) {
      console.error('Failed to rate drill:', err);
    }
  }, [session, refresh]);

  const handleUpdateReflection = useCallback(async (reflection: {
    overallRating?: number;
    reflectionNotes?: string;
    keyLearning?: string;
    nextFocus?: string;
  }) => {
    if (!session) return;
    try {
      // Update session reflection (would call service in production)
    } catch (err) {
      console.error('Failed to update reflection:', err);
    }
  }, [session]);

  const handleLogEquipmentIssue = useCallback(async (issue: string) => {
    // Would persist to carryover system
  }, []);

  const handleDeleteSession = () => {
    Alert.alert(
      'Delete Practice',
      'Are you sure you want to delete this practice session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await practiceSessionService.deleteSession(session!.id);
              router.back();
            } catch (err) {
              console.error('Failed to delete session:', err);
              Alert.alert('Error', 'Failed to delete session');
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={IOS_COLORS.blue} />
          <Text style={styles.loadingText}>Loading practice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Practice not found</Text>
          <TouchableOpacity style={styles.backErrorButton} onPress={handleBack}>
            <Text style={styles.backErrorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Session title from focus area
  const sessionTitle = session.focusAreas?.[0]?.skillArea
    ? session.focusAreas[0].skillArea
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    : session.title || 'Practice Session';

  const isOrganizer = session.createdBy === user?.id;
  const canStart = session.status === 'planned' && isOrganizer;

  // Render phase content
  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 'practice_prepare':
        return (
          <PreparePhaseContent
            session={session}
            completions={completions}
            onToggleItem={handleToggleItem}
            onItemAction={handleOpenTool}
          />
        );
      case 'practice_launch':
        return (
          <LaunchPhaseContent
            session={session}
            completions={completions}
            onToggleItem={handleToggleItem}
            onItemAction={handleOpenTool}
          />
        );
      case 'practice_train':
        return (
          <TrainPhaseContent
            session={session}
            onCompleteDrill={handleCompleteDrill}
            onCompleteSession={handleCompleteSession}
          />
        );
      case 'practice_reflect':
        return (
          <ReflectPhaseContent
            session={session}
            completions={completions}
            onToggleItem={handleToggleItem}
            onRateDrill={handleRateDrill}
            onUpdateReflection={handleUpdateReflection}
            onLogEquipmentIssue={handleLogEquipmentIssue}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color={IOS_COLORS.blue} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal size={24} color={IOS_COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Menu Dropdown */}
        {showMenu && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                // Navigate to edit
              }}
            >
              <Edit3 size={18} color={IOS_COLORS.label} />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDestructive]}
              onPress={() => {
                setShowMenu(false);
                handleDeleteSession();
              }}
            >
              <Trash2 size={18} color={IOS_COLORS.red} />
              <Text style={[styles.menuItemText, styles.menuItemTextDestructive]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tufte Header */}
        <View style={styles.headerContent}>
          <TufteSessionHeader
            title={sessionTitle}
            status={session.status}
            durationMinutes={session.durationMinutes}
            date={session.scheduledDate}
            venueName={session.venueName}
            aiSuggested={session.aiSuggested}
          />
        </View>

        {/* Phase Navigator */}
        <TuftePhaseNavigator
          currentPhase={currentPhase}
          sessionStatus={session.status}
          onPhaseChange={handlePhaseChange}
        />

        {/* Phase Content */}
        <View style={styles.contentContainer}>
          {renderPhaseContent()}
        </View>

        {/* Start Button (floating, only in Prepare/Launch phases) */}
        {canStart && ['practice_prepare', 'practice_launch'].includes(currentPhase) && (
          <View style={styles.floatingButtonContainer}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartSession}
            >
              <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Rig Tuning Wizard Modal */}
      <Modal
        visible={activeWizard === 'rig_tuning_wizard'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'rig_tuning_wizard' && (
          <RigTuningWizard
            item={{
              id: selectedItem.id,
              label: selectedItem.label,
              description: selectedItem.description,
              priority: selectedItem.priority || 'medium',
              completed: !!completions[selectedItem.id],
              category: selectedItem.category,
              toolId: selectedItem.toolId,
              toolType: selectedItem.toolType,
            }}
            raceEventId={session.id}
            boatId={session.boatId}
            boatClass={session.boatClassName}
            classId={session.boatClassId}
            wind={session.windSpeedMin ? {
              direction: session.windDirection ? `${session.windDirection}°` : 'Variable',
              speedMin: session.windSpeedMin,
              speedMax: session.windSpeedMax || session.windSpeedMin,
            } : undefined}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}
      </Modal>

      {/* Forecast Check Wizard Modal */}
      <Modal
        visible={activeWizard === 'forecast_check'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleWizardCancel}
      >
        {selectedItem && activeWizard === 'forecast_check' && (
          <ForecastCheckWizard
            item={{
              id: selectedItem.id,
              label: selectedItem.label,
              description: selectedItem.description,
              priority: selectedItem.priority || 'medium',
              completed: !!completions[selectedItem.id],
              category: selectedItem.category,
              toolId: selectedItem.toolId,
              toolType: selectedItem.toolType,
            }}
            raceEventId={session.id}
            boatId={session.boatId}
            venue={session.venueId ? {
              id: session.venueId,
              name: session.venueName || 'Practice Venue',
            } : null}
            raceDate={session.scheduledDate}
            raceName={session.title || 'Practice Session'}
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE_BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 17,
    fontWeight: '400',
    color: IOS_COLORS.blue,
  },
  menuButton: {
    padding: 4,
  },
  menuDropdown: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    paddingVertical: 4,
    zIndex: 100,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 140,
  },
  menuItemDestructive: {
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
  },
  menuItemTextDestructive: {
    color: IOS_COLORS.red,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  backErrorButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: IOS_COLORS.blue,
    borderRadius: 10,
  },
  backErrorButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    backgroundColor: TUFTE_BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.gray5,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: IOS_COLORS.green,
    borderRadius: 12,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
