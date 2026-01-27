/**
 * AmendmentsViewer
 *
 * Displays amendments to race documents (NOR/SI).
 * Shows list of amendments with read/unread status.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  FileText,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import type { ChecklistToolProps } from '@/lib/checklists/toolRegistry';
import { useRaceDocuments } from '@/hooks/useRaceDocuments';
import { useAuth } from '@/providers/AuthProvider';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray2: '#636366',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  background: '#F2F2F7',
  secondaryBackground: '#FFFFFF',
};

interface AmendmentsViewerProps extends ChecklistToolProps {
  // Additional props if needed
}

export function AmendmentsViewer({
  item,
  regattaId,
  onComplete,
  onCancel,
}: AmendmentsViewerProps) {
  const { user } = useAuth();
  const [reviewedAmendments, setReviewedAmendments] = useState<Set<string>>(new Set());

  // Load documents for this race
  const { documentsForDisplay, loading: docsLoading, refresh } = useRaceDocuments({
    raceId: regattaId,
    userId: user?.id,
  });

  // Filter for amendment documents
  const amendments = useMemo(() => {
    return documentsForDisplay.filter((doc) => doc.type === 'amendment');
  }, [documentsForDisplay]);

  const allReviewed = amendments.length > 0 &&
    amendments.every((a) => reviewedAmendments.has(a.id));

  const handleToggleReviewed = useCallback((amendmentId: string) => {
    setReviewedAmendments((prev) => {
      const next = new Set(prev);
      if (next.has(amendmentId)) {
        next.delete(amendmentId);
      } else {
        next.add(amendmentId);
      }
      return next;
    });
  }, []);

  const handleOpenDocument = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeButton}
          onPress={onCancel}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={IOS_COLORS.gray} />
        </Pressable>
        <Text style={styles.headerTitle}>Amendments</Text>
        <Pressable
          style={styles.refreshButton}
          onPress={() => refresh?.()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RefreshCw size={20} color={IOS_COLORS.blue} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentInner}
      >
        {/* Icon Header */}
        <View style={styles.iconHeader}>
          <View style={styles.iconCircle}>
            <FileText size={32} color={IOS_COLORS.orange} />
          </View>
          <Text style={styles.title}>Document Amendments</Text>
          <Text style={styles.subtitle}>
            Check for any changes or updates to the NOR and SI
          </Text>
        </View>

        {/* Amendments List */}
        {amendments.length > 0 ? (
          <View style={styles.amendmentsList}>
            {amendments.map((amendment, index) => {
              const isReviewed = reviewedAmendments.has(amendment.id);
              return (
                <View
                  key={amendment.id}
                  style={[styles.amendmentCard, isReviewed && styles.amendmentCardReviewed]}
                >
                  <Pressable
                    style={styles.amendmentCheckbox}
                    onPress={() => handleToggleReviewed(amendment.id)}
                  >
                    {isReviewed ? (
                      <CheckCircle2 size={24} color={IOS_COLORS.green} />
                    ) : (
                      <Circle size={24} color={IOS_COLORS.orange} />
                    )}
                  </Pressable>
                  <View style={styles.amendmentContent}>
                    <Text style={styles.amendmentNumber}>
                      Amendment {index + 1}
                    </Text>
                    <Text style={styles.amendmentName} numberOfLines={2}>
                      {amendment.name}
                    </Text>
                    {amendment.uploadedAt && (
                      <Text style={styles.amendmentDate}>
                        Posted {new Date(amendment.uploadedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  {amendment.url && (
                    <Pressable
                      style={styles.openButton}
                      onPress={() => handleOpenDocument(amendment.url!)}
                    >
                      <ExternalLink size={18} color={IOS_COLORS.blue} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.noAmendmentsCard}>
            <View style={styles.noAmendmentsIcon}>
              <Check size={24} color={IOS_COLORS.green} />
            </View>
            <Text style={styles.noAmendmentsTitle}>No Amendments Found</Text>
            <Text style={styles.noAmendmentsText}>
              No amendments have been posted for this race yet. Check the official notice board before race day.
            </Text>
          </View>
        )}

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <AlertTriangle size={20} color={IOS_COLORS.orange} />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Check Before Every Race</Text>
            <Text style={styles.warningText}>
              Amendments can be posted at any time. Always check the official notice board on race day for any last-minute changes.
            </Text>
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Tips</Text>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Amendments override the original SI/NOR content
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Note the time amendments were posted
            </Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>
              Confirm via VHF if uncertain about changes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Pressable
          style={[
            styles.completeButton,
            allReviewed ? styles.completeButtonSuccess : styles.completeButtonWarning,
          ]}
          onPress={handleComplete}
        >
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>
            {allReviewed || amendments.length === 0
              ? 'Mark as Checked'
              : `${reviewedAmendments.size}/${amendments.length} Reviewed`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOS_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: IOS_COLORS.separator,
  },
  closeButton: {
    padding: 4,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  refreshButton: {
    padding: 4,
    minWidth: 40,
    alignItems: 'flex-end',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${IOS_COLORS.orange}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: IOS_COLORS.label,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  amendmentsList: {
    gap: 10,
    marginBottom: 20,
  },
  amendmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: IOS_COLORS.orange,
  },
  amendmentCardReviewed: {
    borderLeftColor: IOS_COLORS.green,
    opacity: 0.8,
  },
  amendmentCheckbox: {
    width: 24,
    height: 24,
  },
  amendmentContent: {
    flex: 1,
  },
  amendmentNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: IOS_COLORS.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  amendmentName: {
    fontSize: 15,
    fontWeight: '500',
    color: IOS_COLORS.label,
    marginBottom: 4,
  },
  amendmentDate: {
    fontSize: 12,
    color: IOS_COLORS.secondaryLabel,
  },
  openButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `${IOS_COLORS.blue}12`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAmendmentsCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: `${IOS_COLORS.green}08`,
    borderRadius: 12,
    marginBottom: 20,
  },
  noAmendmentsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${IOS_COLORS.green}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noAmendmentsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: IOS_COLORS.green,
    marginBottom: 6,
  },
  noAmendmentsText: {
    fontSize: 14,
    color: IOS_COLORS.secondaryLabel,
    textAlign: 'center',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    backgroundColor: `${IOS_COLORS.orange}10`,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: `${IOS_COLORS.orange}30`,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.orange,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: IOS_COLORS.secondaryLabel,
    lineHeight: 18,
  },
  tipsCard: {
    backgroundColor: `${IOS_COLORS.blue}08`,
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 10,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: IOS_COLORS.blue,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  bottomAction: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: IOS_COLORS.separator,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  completeButtonSuccess: {
    backgroundColor: IOS_COLORS.green,
  },
  completeButtonWarning: {
    backgroundColor: IOS_COLORS.orange,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AmendmentsViewer;
