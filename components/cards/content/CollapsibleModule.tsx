/**
 * CollapsibleModule Component
 *
 * A wrapper component that provides collapse/expand functionality
 * for content modules in the expanded race card.
 */

import React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChevronDown, ChevronRight, EyeOff } from 'lucide-react-native';

import { IOS_COLORS } from '@/components/cards/constants';
import { CONTENT_MODULE_INFO, ContentModuleId } from '@/types/raceCardContent';

interface CollapsibleModuleProps {
  /** Module title */
  title: string;
  /** Module ID for icon lookup */
  moduleId: ContentModuleId;
  /** Whether the module is collapsed */
  isCollapsed: boolean;
  /** Callback when collapse is toggled */
  onToggle: () => void;
  /** Callback to hide this module (optional) */
  onHide?: () => void;
  /** Module content */
  children: React.ReactNode;
}

/**
 * Get icon for a module
 */
function getModuleIcon(moduleId: ContentModuleId): string {
  return CONTENT_MODULE_INFO[moduleId]?.icon || 'document-outline';
}

/**
 * Collapsible wrapper for content modules
 */
export function CollapsibleModule({
  title,
  moduleId,
  isCollapsed,
  onToggle,
  onHide,
  children,
}: CollapsibleModuleProps) {
  return (
    <View style={styles.container}>
      {/* Header (always visible) */}
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
        onPress={onToggle}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <View style={styles.headerLeft}>
          {isCollapsed ? (
            <ChevronRight size={16} color={IOS_COLORS.gray} />
          ) : (
            <ChevronDown size={16} color={IOS_COLORS.gray} />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Hide button */}
        {onHide && (
          <Pressable
            style={styles.hideButton}
            onPress={(e) => {
              e.stopPropagation();
              onHide();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <EyeOff size={14} color={IOS_COLORS.gray2} />
          </Pressable>
        )}
      </Pressable>

      {/* Content (hidden when collapsed) */}
      {!isCollapsed && (
        <View style={styles.content}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: IOS_COLORS.systemBackground,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: IOS_COLORS.gray5,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: IOS_COLORS.systemBackground,
  },
  headerPressed: {
    backgroundColor: IOS_COLORS.gray6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: IOS_COLORS.label,
  },
  hideButton: {
    padding: 4,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: IOS_COLORS.gray5,
  },
});

export default CollapsibleModule;
