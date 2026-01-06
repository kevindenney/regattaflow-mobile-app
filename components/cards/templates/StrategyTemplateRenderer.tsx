/**
 * StrategyTemplateRenderer
 *
 * Renders strategy templates with:
 * - Static content displayed directly
 * - Dynamic content pulled from race data
 * - AI-enhanced content with "Enhance" button
 * - User notes/intentions for each section (auto-save on blur)
 *
 * Follows the template-hybrid approach for cost optimization.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/Colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import {
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  ArrowLeftRight,
  Flag,
  Timer,
  Users,
  LogOut,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Gauge,
  Navigation,
  Target,
  Waves,
  ChartLine,
  Zap,
  CornerUpRight,
  CornerDownRight,
  Circle,
  Scale,
  ClipboardCheck,
  Swords,
  Clock,
  BookOpen,
  Cloud,
  Anchor,
  Route,
  MapPin,
  AlertTriangle,
  FileText,
  Wrench,
  Compass,
  Wind,
  Utensils,
  Moon,
  Radio,
} from 'lucide-react-native';

import {
  StrategyTemplate,
  TemplateSection,
  TemplateSectionAction,
  EnhancedStrategyData,
  CardRaceData,
} from '../types';

// =============================================================================
// TYPES
// =============================================================================

interface StrategyTemplateRendererProps {
  /** The template to render */
  template: StrategyTemplate;
  /** Race data for dynamic sections */
  race: CardRaceData;
  /** Enhanced data (if AI enhancement has been run) */
  enhancedData?: EnhancedStrategyData | null;
  /** Whether enhancement is in progress */
  isEnhancing?: boolean;
  /** Callback to trigger AI enhancement */
  onEnhance?: () => void;
  /** Whether to show the enhance button */
  showEnhanceButton?: boolean;
  /** Callback when a section action is triggered */
  onSectionAction?: (action: TemplateSectionAction, sectionId: string) => void;
  /** User notes/plans for each section (keyed by section ID) */
  userNotes?: Record<string, string>;
  /** Callback when user note changes (auto-saves on blur) */
  onUserNoteChange?: (sectionId: string, note: string) => void;
}

// =============================================================================
// ICON MAPPING
// =============================================================================

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'arrow-left-right': ArrowLeftRight,
  'flag-checkered': Flag,
  'timer-outline': Timer,
  'account-group': Users,
  'exit-run': LogOut,
  'arrow-up-bold': ArrowUp,
  'arrow-down-bold': ArrowDown,
  'vector-line': TrendingUp,
  'swap-horizontal': ArrowLeftRight,
  'gauge': Gauge,
  'speedometer': Navigation,
  'wave': Waves,
  'chart-line': ChartLine,
  'chess-knight': Target,
  'arrow-top-right': CornerUpRight,
  'arrow-bottom-right': CornerDownRight,
  'gate': CornerDownRight,
  'circle-outline': Circle,
  'alert-circle': AlertCircle,
  'arrow-right-bold': ChevronRight,
  'sword-cross': Swords,
  'scale-balance': Scale,
  'clipboard-check': ClipboardCheck,
  // Distance racing icons
  'clock-outline': Clock,
  'book-open': BookOpen,
  'weather-cloudy': Cloud,
  'anchor': Anchor,
  'routes': Route,
  'map-marker': MapPin,
  'alert-triangle': AlertTriangle,
  'file-document': FileText,
  'wrench': Wrench,
  'compass': Compass,
  'wind': Wind,
  'food': Utensils,
  'moon': Moon,
  'radio': Radio,
};

function getIcon(iconName?: string) {
  if (!iconName) return AlertCircle;
  return ICON_MAP[iconName] || AlertCircle;
}

// =============================================================================
// USER NOTES INPUT COMPONENT
// =============================================================================

interface UserNotesInputProps {
  sectionId: string;
  initialValue: string;
  onNoteChange?: (sectionId: string, note: string) => void;
}

/**
 * Self-contained user notes input with local state and auto-save on blur.
 * This handles its own state to prevent unnecessary re-renders of parent.
 */
function UserNotesInput({ sectionId, initialValue, onNoteChange }: UserNotesInputProps) {
  const [localNote, setLocalNote] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const initialRef = useRef(initialValue);

  // Sync with external changes
  useEffect(() => {
    if (initialValue !== initialRef.current) {
      setLocalNote(initialValue);
      initialRef.current = initialValue;
    }
  }, [initialValue]);

  const handleBlur = useCallback(async () => {
    if (localNote !== initialRef.current && onNoteChange) {
      setIsSaving(true);
      try {
        await onNoteChange(sectionId, localNote);
        initialRef.current = localNote;
      } finally {
        setIsSaving(false);
      }
    }
  }, [localNote, sectionId, onNoteChange]);

  return (
    <View style={styles.userNotesSection}>
      <View style={styles.userNotesHeader}>
        <Ionicons name="pencil" size={14} color={colors.primary.dark} />
        <Text style={styles.userNotesLabel}>Your plan</Text>
        {isSaving && (
          <View style={styles.savingIndicator}>
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </View>
      <TextInput
        style={styles.userNotesInput}
        placeholder="What's your strategy for this section?"
        placeholderTextColor="#9CA3AF"
        value={localNote}
        onChangeText={setLocalNote}
        onBlur={handleBlur}
        multiline
        textAlignVertical="top"
        returnKeyType="done"
        blurOnSubmit
      />
    </View>
  );
}

// =============================================================================
// SECTION RENDERERS
// =============================================================================

/**
 * Render a static section (can be interactive if it has an action)
 * Includes collapsible user notes functionality
 */
function StaticSection({
  section,
  onAction,
  userNote,
  onUserNoteChange,
  isCollapsed,
  onToggleCollapse,
}: {
  section: TemplateSection;
  onAction?: (action: TemplateSectionAction, sectionId: string) => void;
  userNote?: string;
  onUserNoteChange?: (sectionId: string, note: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const Icon = getIcon(section.icon);
  const hasAction = !!section.action;
  const hasNote = !!userNote && userNote.trim().length > 0;

  const handleActionPress = useCallback(() => {
    if (section.action && onAction) {
      onAction(section.action, section.id);
    }
  }, [section.action, section.id, onAction]);

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleCollapse?.();
  }, [onToggleCollapse]);

  return (
    <View style={[styles.section, hasNote && styles.sectionWithNote]}>
      {/* Section Header (tappable for collapse) */}
      <Pressable onPress={handleToggle}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, hasAction && styles.iconContainerInteractive]}>
            <Icon size={18} color={hasAction ? '#7C3AED' : '#6B7280'} />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          {/* Plan status badge (when collapsed) */}
          {isCollapsed && (
            hasNote ? (
              <View style={styles.hasPlanBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success.default} />
                <Text style={styles.hasPlanBadgeText}>Plan set</Text>
              </View>
            ) : (
              <View style={styles.addPlanBadge}>
                <Ionicons name="add-circle-outline" size={12} color={colors.primary.default} />
                <Text style={styles.addPlanBadgeText}>Add plan</Text>
              </View>
            )
          )}

          {hasAction && (
            <View style={styles.actionIndicator}>
              <ChevronRight size={16} color="#7C3AED" />
            </View>
          )}

          {/* Collapse chevron */}
          <Ionicons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={18}
            color="#9CA3AF"
          />
        </View>
      </Pressable>

      {/* Collapsed preview of user note */}
      {isCollapsed && hasNote && (
        <Pressable onPress={handleToggle}>
          <View style={styles.collapsedPreview}>
            <Ionicons name="document-text-outline" size={12} color="#9CA3AF" />
            <Text style={styles.collapsedPreviewText} numberOfLines={1}>
              {userNote}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Expanded content */}
      {!isCollapsed && (
        <>
          <Text style={styles.sectionContent}>{section.staticContent}</Text>

          {hasAction && section.action?.label && (
            <Pressable onPress={handleActionPress}>
              <View style={styles.actionHint}>
                <Text style={styles.actionHintText}>Tap to {section.action.label}</Text>
              </View>
            </Pressable>
          )}

          {/* User notes input */}
          {onUserNoteChange && (
            <UserNotesInput
              sectionId={section.id}
              initialValue={userNote || ''}
              onNoteChange={onUserNoteChange}
            />
          )}
        </>
      )}
    </View>
  );
}

/**
 * Render a dynamic section (data from race)
 * Includes collapsible user notes functionality
 */
function DynamicSection({
  section,
  race,
  userNote,
  onUserNoteChange,
  isCollapsed,
  onToggleCollapse,
}: {
  section: TemplateSection;
  race: CardRaceData;
  userNote?: string;
  onUserNoteChange?: (sectionId: string, note: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const Icon = getIcon(section.icon);
  const hasNote = !!userNote && userNote.trim().length > 0;

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleCollapse?.();
  }, [onToggleCollapse]);

  // Get dynamic value from race data
  const getValue = (): string => {
    if (!section.dataKey) return 'No data available';

    // Navigate the data path
    const keys = section.dataKey.split('.');
    let value: any = race;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }

    if (value === undefined || value === null) {
      return 'Data not available';
    }

    return String(value);
  };

  return (
    <View style={[styles.section, hasNote && styles.sectionWithNote]}>
      {/* Section Header (tappable for collapse) */}
      <Pressable onPress={handleToggle}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconContainer}>
            <Icon size={18} color="#3B82F6" />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.dynamicBadge}>
            <Text style={styles.dynamicBadgeText}>Live</Text>
          </View>

          {/* Plan status badge (when collapsed) */}
          {isCollapsed && (
            hasNote ? (
              <View style={styles.hasPlanBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success.default} />
                <Text style={styles.hasPlanBadgeText}>Plan set</Text>
              </View>
            ) : (
              <View style={styles.addPlanBadge}>
                <Ionicons name="add-circle-outline" size={12} color={colors.primary.default} />
                <Text style={styles.addPlanBadgeText}>Add plan</Text>
              </View>
            )
          )}

          {/* Collapse chevron */}
          <Ionicons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={18}
            color="#9CA3AF"
          />
        </View>
      </Pressable>

      {/* Collapsed preview of user note */}
      {isCollapsed && hasNote && (
        <Pressable onPress={handleToggle}>
          <View style={styles.collapsedPreview}>
            <Ionicons name="document-text-outline" size={12} color="#9CA3AF" />
            <Text style={styles.collapsedPreviewText} numberOfLines={1}>
              {userNote}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Expanded content */}
      {!isCollapsed && (
        <>
          <Text style={styles.sectionContent}>{getValue()}</Text>

          {/* User notes input */}
          {onUserNoteChange && (
            <UserNotesInput
              sectionId={section.id}
              initialValue={userNote || ''}
              onNoteChange={onUserNoteChange}
            />
          )}
        </>
      )}
    </View>
  );
}

/**
 * Render an AI-enhanceable section
 * Includes collapsible user notes functionality
 */
function AISection({
  section,
  enhancedContent,
  isEnhancing,
  userNote,
  onUserNoteChange,
  isCollapsed,
  onToggleCollapse,
}: {
  section: TemplateSection;
  enhancedContent?: string;
  isEnhancing?: boolean;
  userNote?: string;
  onUserNoteChange?: (sectionId: string, note: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const Icon = getIcon(section.icon);
  const hasEnhancement = !!enhancedContent;
  const hasNote = !!userNote && userNote.trim().length > 0;

  const handleToggle = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleCollapse?.();
  }, [onToggleCollapse]);

  return (
    <View style={[styles.section, hasEnhancement && styles.sectionEnhanced, hasNote && styles.sectionWithNote]}>
      {/* Section Header (tappable for collapse) */}
      <Pressable onPress={handleToggle}>
        <View style={styles.sectionHeader}>
          <View style={[styles.iconContainer, hasEnhancement && styles.iconContainerEnhanced]}>
            <Icon size={18} color={hasEnhancement ? '#8B5CF6' : '#9CA3AF'} />
          </View>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {hasEnhancement && (
            <View style={styles.enhancedBadge}>
              <Sparkles size={12} color="#8B5CF6" />
              <Text style={styles.enhancedBadgeText}>AI</Text>
            </View>
          )}

          {/* Plan status badge (when collapsed) */}
          {isCollapsed && (
            hasNote ? (
              <View style={styles.hasPlanBadge}>
                <Ionicons name="checkmark-circle" size={12} color={colors.success.default} />
                <Text style={styles.hasPlanBadgeText}>Plan set</Text>
              </View>
            ) : (
              <View style={styles.addPlanBadge}>
                <Ionicons name="add-circle-outline" size={12} color={colors.primary.default} />
                <Text style={styles.addPlanBadgeText}>Add plan</Text>
              </View>
            )
          )}

          {/* Collapse chevron */}
          <Ionicons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={18}
            color="#9CA3AF"
          />
        </View>
      </Pressable>

      {/* Collapsed preview of user note */}
      {isCollapsed && hasNote && (
        <Pressable onPress={handleToggle}>
          <View style={styles.collapsedPreview}>
            <Ionicons name="document-text-outline" size={12} color="#9CA3AF" />
            <Text style={styles.collapsedPreviewText} numberOfLines={1}>
              {userNote}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Expanded content */}
      {!isCollapsed && (
        <>
          {isEnhancing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#8B5CF6" />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          ) : hasEnhancement ? (
            <Text style={styles.sectionContent}>{enhancedContent}</Text>
          ) : (
            <Text style={styles.sectionPlaceholder}>
              {section.aiPromptHint || 'Tap "Enhance with AI" for personalized insights'}
            </Text>
          )}

          {/* User notes input */}
          {onUserNoteChange && (
            <UserNotesInput
              sectionId={section.id}
              initialValue={userNote || ''}
              onNoteChange={onUserNoteChange}
            />
          )}
        </>
      )}
    </View>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StrategyTemplateRenderer({
  template,
  race,
  enhancedData,
  isEnhancing = false,
  onEnhance,
  showEnhanceButton = true,
  onSectionAction,
  userNotes = {},
  onUserNoteChange,
}: StrategyTemplateRendererProps) {
  // Track collapsed state for each section (first section starts expanded)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    // Start with all sections collapsed EXCEPT the first one
    const sortedIds = [...template.sections]
      .sort((a, b) => a.priority - b.priority)
      .map((s) => s.id);
    return new Set(sortedIds.slice(1)); // Collapse all except first
  });

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Sort sections by priority
  const sortedSections = [...template.sections].sort((a, b) => a.priority - b.priority);

  // Check if any sections can be enhanced
  const hasEnhanceableSections = template.sections.some((s) => s.type === 'ai_enhanced');
  const allEnhanced = template.sections
    .filter((s) => s.type === 'ai_enhanced')
    .every((s) => enhancedData?.enhancedSections[s.id]);

  return (
    <View style={styles.container}>
      {/* Sections */}
      {sortedSections.map((section) => {
        const isCollapsed = collapsedSections.has(section.id);
        const userNote = userNotes[section.id];

        switch (section.type) {
          case 'static':
            return (
              <StaticSection
                key={section.id}
                section={section}
                onAction={onSectionAction}
                userNote={userNote}
                onUserNoteChange={onUserNoteChange}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => toggleSection(section.id)}
              />
            );
          case 'dynamic':
            return (
              <DynamicSection
                key={section.id}
                section={section}
                race={race}
                userNote={userNote}
                onUserNoteChange={onUserNoteChange}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => toggleSection(section.id)}
              />
            );
          case 'ai_enhanced':
            return (
              <AISection
                key={section.id}
                section={section}
                enhancedContent={enhancedData?.enhancedSections[section.id]}
                isEnhancing={isEnhancing}
                userNote={userNote}
                onUserNoteChange={onUserNoteChange}
                isCollapsed={isCollapsed}
                onToggleCollapse={() => toggleSection(section.id)}
              />
            );
          default:
            return null;
        }
      })}

      {/* Enhance Button */}
      {showEnhanceButton && hasEnhanceableSections && onEnhance && !allEnhanced && (
        <Pressable
          style={({ pressed }) => [
            styles.enhanceButton,
            pressed && styles.enhanceButtonPressed,
            isEnhancing && styles.enhanceButtonDisabled,
          ]}
          onPress={onEnhance}
          disabled={isEnhancing}
        >
          {isEnhancing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Sparkles size={18} color="#FFFFFF" />
          )}
          <Text style={styles.enhanceButtonText}>
            {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
          </Text>
        </Pressable>
      )}

      {/* Enhanced indicator */}
      {allEnhanced && enhancedData && (
        <View style={styles.enhancedIndicator}>
          <CheckCircle size={16} color="#22C55E" />
          <Text style={styles.enhancedIndicatorText}>
            Enhanced {new Date(enhancedData.metadata.enhancedAt).toLocaleTimeString()}
          </Text>
        </View>
      )}
    </View>
  );
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Section
  section: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  sectionInteractive: {
    borderWidth: 1,
    borderColor: '#E9D5FF',
    backgroundColor: '#FDFCFF',
  },
  sectionPressed: {
    backgroundColor: '#F5F3FF',
    transform: [{ scale: 0.98 }],
  },
  sectionEnhanced: {
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconContainerInteractive: {
    backgroundColor: '#EDE9FE',
  },
  iconContainerEnhanced: {
    backgroundColor: '#EDE9FE',
  },
  actionIndicator: {
    marginLeft: 4,
  },
  actionHint: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9D5FF',
  },
  actionHintText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '500',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  sectionPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Badges
  dynamicBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dynamicBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  enhancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  enhancedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7C3AED',
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#8B5CF6',
  },

  // Enhance button
  enhanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  enhanceButtonPressed: {
    backgroundColor: '#7C3AED',
  },
  enhanceButtonDisabled: {
    backgroundColor: '#C4B5FD',
  },
  enhanceButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Enhanced indicator
  enhancedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  enhancedIndicatorText: {
    fontSize: 12,
    color: '#22C55E',
  },

  // Section with note highlight
  sectionWithNote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success.default,
  },

  // Collapsed preview
  collapsedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  collapsedPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Plan status badges
  hasPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  hasPlanBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success.default,
  },
  addPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  addPlanBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary.default,
  },

  // User notes section
  userNotesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  userNotesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userNotesLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userNotesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.default,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    minHeight: 60,
    maxHeight: 120,
  },
  savingIndicator: {
    backgroundColor: colors.primary.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  savingText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary.default,
  },
});

export default StrategyTemplateRenderer;
