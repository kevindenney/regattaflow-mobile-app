/**
 * QuickTipsPanel
 *
 * A bottom sheet panel that displays quick tips for a checklist item.
 * Used for items that don't need a full wizard but benefit from guidance.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { BookOpen, Check, ChevronRight, Info, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useUserSettings } from '@/hooks/useUserSettings';
import type { ChecklistItem } from '@/types/checklists';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  purple: '#AF52DE',
  green: '#34C759',
  orange: '#FF9500',
  gray: '#8E8E93',
  gray2: '#636366',
  gray3: '#48484A',
  gray4: '#3A3A3C',
  gray5: '#2C2C2E',
  gray6: '#1C1C1E',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
};

interface QuickTipsPanelProps {
  item: ChecklistItem;
  visible: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function QuickTipsPanel({
  item,
  visible,
  onComplete,
  onCancel,
}: QuickTipsPanelProps) {
  const router = useRouter();
  const { settings } = useUserSettings();

  const tips = item.quickTips || [];
  const hasLearningLink = !!item.learningModuleSlug;

  const handleLearnMore = useCallback(() => {
    if (item.learningModuleSlug) {
      // Navigate directly to the lesson player
      router.push({
        pathname: `/(tabs)/learn/${item.learningModuleSlug}/player`,
        params: {
          lessonId: item.learningModuleId,
        },
      });
      onCancel(); // Close the panel when navigating
    }
  }, [item.learningModuleSlug, item.learningModuleId, router, onCancel]);

  const handleGotIt = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Don't render if quick tips are disabled in settings
  if (!settings.showQuickTips) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />
        <View style={styles.container}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={styles.blurContainer}>
              <PanelContent
                item={item}
                tips={tips}
                hasLearningLink={hasLearningLink}
                onLearnMore={handleLearnMore}
                onGotIt={handleGotIt}
                onCancel={onCancel}
              />
            </BlurView>
          ) : (
            <View style={[styles.blurContainer, styles.androidContainer]}>
              <PanelContent
                item={item}
                tips={tips}
                hasLearningLink={hasLearningLink}
                onLearnMore={handleLearnMore}
                onGotIt={handleGotIt}
                onCancel={onCancel}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

interface PanelContentProps {
  item: ChecklistItem;
  tips: string[];
  hasLearningLink: boolean;
  onLearnMore: () => void;
  onGotIt: () => void;
  onCancel: () => void;
}

function PanelContent({
  item,
  tips,
  hasLearningLink,
  onLearnMore,
  onGotIt,
  onCancel,
}: PanelContentProps) {
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Info size={18} color={IOS_COLORS.blue} />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color={IOS_COLORS.gray} />
        </Pressable>
      </View>

      {/* Description */}
      {item.description && (
        <Text style={styles.description}>{item.description}</Text>
      )}

      {/* Tips List */}
      <ScrollView
        style={styles.tipsContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tipsHeader}>QUICK TIPS</Text>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipRow}>
            <View style={styles.tipBullet}>
              <Text style={styles.tipBulletText}>{index + 1}</Text>
            </View>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        {hasLearningLink && (
          <Pressable style={styles.learnButton} onPress={onLearnMore}>
            <BookOpen size={16} color={IOS_COLORS.purple} />
            <Text style={styles.learnButtonText}>Learn More</Text>
            <ChevronRight size={16} color={IOS_COLORS.purple} />
          </Pressable>
        )}
        <Pressable style={styles.gotItButton} onPress={onGotIt}>
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.gotItButtonText}>Got It</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  container: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  blurContainer: {
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingHorizontal: 20,
  },
  androidContainer: {
    backgroundColor: IOS_COLORS.secondaryBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 20,
    marginBottom: 16,
  },
  tipsContainer: {
    maxHeight: 240,
  },
  tipsHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: IOS_COLORS.tertiaryLabel,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  tipBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: `${IOS_COLORS.blue}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBulletText: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.blue,
  },
  tipText: {
    fontSize: 15,
    color: IOS_COLORS.label,
    lineHeight: 20,
    flex: 1,
  },
  actions: {
    marginTop: 16,
    gap: 10,
  },
  learnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: `${IOS_COLORS.purple}15`,
    gap: 6,
  },
  learnButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.purple,
    flex: 1,
    textAlign: 'center',
  },
  gotItButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: IOS_COLORS.blue,
    gap: 8,
  },
  gotItButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default QuickTipsPanel;
