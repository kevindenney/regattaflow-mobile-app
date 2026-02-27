/**
 * MediaCapture — Interest-aware media capture for the Plan Card "Capture" phase.
 *
 * Reads EvidenceCaptureConfig from the current interest to determine:
 *  - Which capture methods are available (photo, video, audio, text, etc.)
 *  - Privacy constraints (e.g., HIPAA for nursing — no photos)
 *  - Primary vs secondary capture methods
 */

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
} from 'react-native';
import {
  Camera,
  Video,
  Mic,
  MapPin,
  FileText,
  Clock,
  Heart,
  Activity,
  Plus,
  X,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react-native';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import type { EvidenceCaptureMethod } from '@/types/interestEventConfig';
import type { PlanCaptureData, PlanCaptureMedia, PlanActivityLogEntry } from '@/types/planCard';

const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#C7C7CC',
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
};

function getCaptureIcon(type: EvidenceCaptureMethod['type']): React.ComponentType<any> {
  switch (type) {
    case 'photo': return Camera;
    case 'video': return Video;
    case 'audio': return Mic;
    case 'gps': return MapPin;
    case 'text': return FileText;
    case 'timer': return Clock;
    case 'health_data': return Heart;
    case 'activity_log': return Activity;
    default: return FileText;
  }
}

interface MediaCaptureProps {
  data: PlanCaptureData;
  onChange: (data: PlanCaptureData) => void;
  readOnly?: boolean;
}

export function MediaCapture({ data, onChange, readOnly = false }: MediaCaptureProps) {
  const eventConfig = useInterestEventConfig();
  const { evidenceCapture } = eventConfig;
  const [noteText, setNoteText] = useState('');

  const allMethods = [evidenceCapture.primaryCapture, ...evidenceCapture.secondaryCapture];

  const handleCapturePress = useCallback(
    (method: EvidenceCaptureMethod) => {
      if (method.type === 'text') {
        // Text capture just adds a text note entry
        return; // Handled by the note input below
      }
      // For other types, placeholder — real implementation connects to device APIs
      const media: PlanCaptureMedia = {
        id: Date.now().toString(),
        type: method.type === 'gps' || method.type === 'timer' || method.type === 'health_data' || method.type === 'activity_log'
          ? 'text'
          : method.type as 'photo' | 'video' | 'audio' | 'text',
        uri: '',
        timestamp: new Date().toISOString(),
        caption: `${method.label} capture`,
      };
      onChange({ ...data, media: [...data.media, media] });
    },
    [data, onChange],
  );

  const addTextNote = useCallback(() => {
    if (!noteText.trim()) return;
    const entry: PlanActivityLogEntry = {
      id: Date.now().toString(),
      action: noteText.trim(),
      timestamp: new Date().toISOString(),
    };
    onChange({ ...data, activityLog: [...data.activityLog, entry] });
    setNoteText('');
  }, [data, onChange, noteText]);

  const removeLogEntry = useCallback(
    (id: string) => {
      onChange({
        ...data,
        activityLog: data.activityLog.filter((e) => e.id !== id),
      });
    },
    [data, onChange],
  );

  const removeMedia = useCallback(
    (id: string) => {
      onChange({
        ...data,
        media: data.media.filter((m) => m.id !== id),
      });
    },
    [data, onChange],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Privacy warning */}
      {evidenceCapture.privacyNote && (
        <View style={styles.privacyBanner}>
          <AlertTriangle size={14} color={COLORS.orange} />
          <Text style={styles.privacyText}>{evidenceCapture.privacyNote}</Text>
        </View>
      )}

      {/* Capture buttons */}
      {!readOnly && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CAPTURE METHODS</Text>
          <View style={styles.captureGrid}>
            {allMethods.map((method) => {
              const IconComponent = getCaptureIcon(method.type);
              const isPrimary = method.id === evidenceCapture.primaryCapture.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.captureButton, isPrimary && styles.captureButtonPrimary]}
                  onPress={() => handleCapturePress(method)}
                  activeOpacity={0.7}
                >
                  <IconComponent
                    size={isPrimary ? 20 : 16}
                    color={isPrimary ? COLORS.blue : COLORS.secondaryLabel}
                  />
                  <Text style={[styles.captureLabel, isPrimary && styles.captureLabelPrimary]}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Text note input */}
      {!readOnly && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK NOTE</Text>
          <View style={styles.noteRow}>
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Log an observation..."
              placeholderTextColor={COLORS.tertiaryLabel}
              onSubmitEditing={addTextNote}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.noteAddBtn, !noteText.trim() && styles.noteAddBtnDisabled]}
              onPress={addTextNote}
              disabled={!noteText.trim()}
            >
              <Plus size={16} color={COLORS.systemBackground} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Media gallery */}
      {data.media.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CAPTURED MEDIA ({data.media.length})</Text>
          {data.media.map((item) => (
            <View key={item.id} style={styles.mediaItem}>
              <ImageIcon size={16} color={COLORS.secondaryLabel} />
              <Text style={styles.mediaCaption} numberOfLines={1}>
                {item.caption || item.type}
              </Text>
              <Text style={styles.mediaTime}>
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {!readOnly && (
                <TouchableOpacity
                  onPress={() => removeMedia(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={COLORS.red} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Activity log */}
      {data.activityLog.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTIVITY LOG ({data.activityLog.length})</Text>
          {data.activityLog.map((entry) => (
            <View key={entry.id} style={styles.logEntry}>
              <View style={styles.logDot} />
              <View style={styles.logContent}>
                <Text style={styles.logAction}>{entry.action}</Text>
                <Text style={styles.logTime}>
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {!readOnly && (
                <TouchableOpacity
                  onPress={() => removeLogEntry(entry.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={COLORS.red} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {data.media.length === 0 && data.activityLog.length === 0 && readOnly && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No captures yet</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.orange,
    fontWeight: '500',
    lineHeight: 16,
  },
  captureGrid: { gap: 8 },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  captureButtonPrimary: {
    backgroundColor: `${COLORS.blue}12`,
    borderWidth: 1,
    borderColor: `${COLORS.blue}30`,
    padding: 14,
  },
  captureLabel: { fontSize: 14, fontWeight: '500', color: COLORS.secondaryLabel },
  captureLabelPrimary: { fontSize: 15, fontWeight: '600', color: COLORS.blue },
  noteRow: { flexDirection: 'row', gap: 8 },
  noteInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.label,
    padding: 12,
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  noteAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteAddBtnDisabled: { opacity: 0.4 },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
  },
  mediaCaption: { flex: 1, fontSize: 14, color: COLORS.label },
  mediaTime: { fontSize: 11, color: COLORS.tertiaryLabel },
  logEntry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    backgroundColor: COLORS.gray6,
    borderRadius: 8,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.blue,
    marginTop: 5,
  },
  logContent: { flex: 1 },
  logAction: { fontSize: 14, color: COLORS.label, lineHeight: 20 },
  logTime: { fontSize: 11, color: COLORS.tertiaryLabel, marginTop: 2 },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: COLORS.gray6,
    borderRadius: 10,
  },
  emptyText: { fontSize: 14, color: COLORS.tertiaryLabel },
});

export default MediaCapture;
