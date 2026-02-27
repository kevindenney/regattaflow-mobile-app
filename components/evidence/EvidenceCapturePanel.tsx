/**
 * EvidenceCapturePanel Component
 *
 * Interest-aware evidence capture UI for the "Do" phase.
 * Reads the current interest's EvidenceCaptureConfig and renders
 * the appropriate capture controls (GPS, activity log, photos, etc.).
 *
 * Each interest defines:
 * - primaryCapture: the main evidence method (always visible)
 * - secondaryCapture: additional methods (shown as action buttons)
 * - privacyNote: e.g., HIPAA restrictions for nursing
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Camera,
  Clock,
  FileText,
  MapPin,
  Mic,
  Activity,
  Heart,
  Video,
  Pen,
  AlertTriangle,
} from 'lucide-react-native';
import { useInterestEventConfig } from '@/hooks/useInterestEventConfig';
import type { EvidenceCaptureMethod } from '@/types/interestEventConfig';

// iOS System Colors
const COLORS = {
  label: '#000000',
  secondaryLabel: '#3C3C43',
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  red: '#FF3B30',
  gray: '#8E8E93',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  systemBackground: '#FFFFFF',
};

interface EvidenceCapturePanelProps {
  /** Event / race ID for tracking */
  eventId: string;
  /** Callback when a capture method is activated */
  onActivateCapture?: (methodId: string, methodType: string) => void;
  /** Active capture methods (currently recording) */
  activeCaptures?: Set<string>;
  /** Compact mode (less padding, smaller icons) */
  compact?: boolean;
}

/**
 * Get icon component for a capture method type.
 */
function getCaptureIcon(type: EvidenceCaptureMethod['type']): React.ComponentType<any> {
  switch (type) {
    case 'photo': return Camera;
    case 'video': return Video;
    case 'audio': return Mic;
    case 'gps': return MapPin;
    case 'text': return Pen;
    case 'timer': return Clock;
    case 'health_data': return Heart;
    case 'activity_log': return Activity;
    default: return FileText;
  }
}

/**
 * Single capture method button.
 */
function CaptureMethodButton({
  method,
  isActive,
  isPrimary,
  onPress,
}: {
  method: EvidenceCaptureMethod;
  isActive: boolean;
  isPrimary: boolean;
  onPress: () => void;
}) {
  const IconComponent = getCaptureIcon(method.type);

  return (
    <TouchableOpacity
      style={[
        styles.methodButton,
        isPrimary && styles.methodButtonPrimary,
        isActive && styles.methodButtonActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconComponent
        size={isPrimary ? 20 : 16}
        color={isActive ? COLORS.systemBackground : isPrimary ? COLORS.blue : COLORS.gray}
      />
      <Text
        style={[
          styles.methodLabel,
          isPrimary && styles.methodLabelPrimary,
          isActive && styles.methodLabelActive,
        ]}
        numberOfLines={1}
      >
        {method.label}
      </Text>
      {isActive && (
        <View style={styles.activeIndicator}>
          <View style={styles.activeIndicatorDot} />
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Interest-aware evidence capture panel.
 */
export function EvidenceCapturePanel({
  eventId,
  onActivateCapture,
  activeCaptures = new Set(),
  compact = false,
}: EvidenceCapturePanelProps) {
  const eventConfig = useInterestEventConfig();
  const { evidenceCapture } = eventConfig;

  const allMethods = useMemo(() => {
    return [evidenceCapture.primaryCapture, ...evidenceCapture.secondaryCapture];
  }, [evidenceCapture]);

  const handlePress = (method: EvidenceCaptureMethod) => {
    onActivateCapture?.(method.id, method.type);
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Privacy warning (e.g., HIPAA for nursing) */}
      {evidenceCapture.privacyNote && (
        <View style={styles.privacyBanner}>
          <AlertTriangle size={14} color={COLORS.orange} />
          <Text style={styles.privacyText}>{evidenceCapture.privacyNote}</Text>
        </View>
      )}

      {/* Primary capture method */}
      <CaptureMethodButton
        method={evidenceCapture.primaryCapture}
        isActive={activeCaptures.has(evidenceCapture.primaryCapture.id)}
        isPrimary
        onPress={() => handlePress(evidenceCapture.primaryCapture)}
      />

      {/* Secondary methods row */}
      {evidenceCapture.secondaryCapture.length > 0 && (
        <View style={styles.secondaryRow}>
          {evidenceCapture.secondaryCapture.map((method) => (
            <CaptureMethodButton
              key={method.id}
              method={method}
              isActive={activeCaptures.has(method.id)}
              isPrimary={false}
              onPress={() => handlePress(method)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    padding: 16,
  },
  containerCompact: {
    padding: 12,
    gap: 8,
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
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: COLORS.gray6,
  },
  methodButtonPrimary: {
    backgroundColor: `${COLORS.blue}12`,
    borderWidth: 1,
    borderColor: `${COLORS.blue}30`,
    padding: 14,
  },
  methodButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  methodLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondaryLabel,
    fontWeight: '500',
  },
  methodLabelPrimary: {
    fontSize: 15,
    color: COLORS.blue,
    fontWeight: '600',
  },
  methodLabelActive: {
    color: COLORS.systemBackground,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.systemBackground,
  },
  secondaryRow: {
    gap: 8,
  },
});

export default EvidenceCapturePanel;
