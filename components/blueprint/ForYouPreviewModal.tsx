/**
 * ForYouPreviewModal — Preview a suggested step before adopting it.
 *
 * Lets the user read the full step content (title, description, source)
 * from a FOR YOU card, then decide to Adopt or Dismiss without leaving
 * the current screen.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStepById } from '@/services/TimelineStepService';
import type { TimelineStepRecord } from '@/types/timeline-steps';
import type { ForYouItem } from '@/hooks/useForYouItems';

const C = {
  bg: '#FFFFFF',
  border: '#E5E4E1',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#9C9B99',
  accent: '#00897B',
  accentBg: 'rgba(0,137,123,0.08)',
  dismiss: '#C44536',
  dismissBg: 'rgba(196,69,54,0.08)',
} as const;

interface ForYouPreviewModalProps {
  visible: boolean;
  item: ForYouItem | null;
  isActionLoading: boolean;
  onAdopt: () => void;
  onDismiss: () => void;
  onClose: () => void;
}

export function ForYouPreviewModal({
  visible,
  item,
  isActionLoading,
  onAdopt,
  onDismiss,
  onClose,
}: ForYouPreviewModalProps) {
  const [stepRecord, setStepRecord] = useState<TimelineStepRecord | null>(null);
  const [loadingStep, setLoadingStep] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStepRecord = useCallback(() => {
    if (!item || item.type !== 'blueprint_update') return;
    const stepId = item.data.stepId as string | undefined;
    if (!stepId) return;
    setLoadingStep(true);
    setLoadError(null);
    getStepById(stepId)
      .then((record) => setStepRecord(record))
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load step');
      })
      .finally(() => setLoadingStep(false));
  }, [item]);

  // When modal opens with a blueprint_update item, fetch the full step record
  useEffect(() => {
    if (!visible || !item) {
      setStepRecord(null);
      setLoadError(null);
      return;
    }
    if (item.type !== 'blueprint_update') {
      setStepRecord(null);
      return;
    }
    loadStepRecord();
  }, [visible, item, loadStepRecord]);

  if (!item) return null;

  const sourceLabel =
    item.type === 'blueprint_update'
      ? (item.data.blueprintTitle as string | undefined) ?? 'Blueprint'
      : item.type === 'peer_suggestion'
        ? `from ${(item.data.actorName as string) ?? 'someone'}`
        : item.type === 'org_blueprint'
          ? 'Organization pathway'
          : 'Suggestion';

  const description =
    item.type === 'peer_suggestion'
      ? ((item.data.stepDescription as string | undefined) ?? null)
      : (stepRecord?.description ?? null);

  const category = stepRecord?.category ?? null;
  const subStepsRaw = (stepRecord?.metadata as any)?.sub_steps;
  const subSteps: string[] = Array.isArray(subStepsRaw)
    ? subStepsRaw.map((s: any) => (typeof s === 'string' ? s : s?.title)).filter(Boolean)
    : [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: C.bg,
            borderRadius: 16,
            width: '100%',
            maxWidth: 480,
            maxHeight: '85%',
            overflow: 'hidden',
            ...(Platform.OS === 'web'
              ? { boxShadow: '0 16px 48px rgba(0,0,0,0.22)' }
              : {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.22,
                  shadowRadius: 36,
                  elevation: 16,
                }),
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <Ionicons name="book-outline" size={12} color={C.accent} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: C.accent,
                    letterSpacing: 0.3,
                    textTransform: 'uppercase',
                  }}
                  numberOfLines={1}
                >
                  {sourceLabel}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 19,
                  fontWeight: '700',
                  color: C.labelDark,
                  lineHeight: 24,
                }}
              >
                {item.title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#f2f1ee',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={16} color={C.labelMid} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            style={{ maxHeight: 420 }}
            contentContainerStyle={{ padding: 20, gap: 14 }}
            showsVerticalScrollIndicator
          >
            {category ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: C.accentBg,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: C.accent,
                    textTransform: 'capitalize',
                  }}
                >
                  {category}
                </Text>
              </View>
            ) : null}

            {loadingStep ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator color={C.accent} />
                <Text
                  style={{
                    fontSize: 12,
                    color: C.labelMid,
                    marginTop: 8,
                  }}
                >
                  Loading step details…
                </Text>
              </View>
            ) : loadError ? (
              <View style={{ alignItems: 'center', paddingVertical: 12, gap: 10 }}>
                <Text style={{ fontSize: 13, color: C.dismiss, textAlign: 'center' }}>
                  Couldn't load step details. Check your connection and try again.
                </Text>
                <Pressable
                  onPress={loadStepRecord}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: C.accentBg,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.accent }}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : description ? (
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: C.labelDark,
                }}
              >
                {description}
              </Text>
            ) : (
              <Text
                style={{
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: C.labelLight,
                }}
              >
                No description provided.
              </Text>
            )}

            {subSteps.length > 0 ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: C.labelMid,
                    letterSpacing: 0.3,
                    textTransform: 'uppercase',
                  }}
                >
                  Sub-steps
                </Text>
                {subSteps.map((title, idx) => (
                  <View
                    key={idx}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: C.accentBg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '700',
                          color: C.accent,
                        }}
                      >
                        {idx + 1}
                      </Text>
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 13,
                        lineHeight: 18,
                        color: C.labelDark,
                      }}
                    >
                      {title}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>

          {/* Footer actions */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              padding: 16,
              borderTopWidth: 1,
              borderTopColor: C.border,
            }}
          >
            <Pressable
              onPress={onDismiss}
              disabled={isActionLoading}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: C.dismissBg,
                opacity: isActionLoading ? 0.5 : 1,
              }}
            >
              <Ionicons name="close-circle-outline" size={16} color={C.dismiss} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.dismiss }}>
                Dismiss
              </Text>
            </Pressable>
            <Pressable
              onPress={onAdopt}
              disabled={isActionLoading}
              style={{
                flex: 1.4,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 12,
                borderRadius: 10,
                backgroundColor: C.accent,
                opacity: isActionLoading ? 0.6 : 1,
              }}
            >
              {isActionLoading ? (
                <ActivityIndicator size={14} color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={16} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                    Adopt to my timeline
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
