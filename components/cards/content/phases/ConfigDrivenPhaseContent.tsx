/**
 * ConfigDrivenPhaseContent - Renders phase tiles from InterestEventConfig
 *
 * For non-sailing interests (nursing, drawing, fitness, golf, etc.),
 * this component reads tileSections from the config and renders a
 * generic tile grid using PrepTile. Sailing retains its rich,
 * hardcoded DaysBeforeContent / OnWaterContent / AfterRaceContent.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import * as LucideIcons from 'lucide-react-native';

import { TileGrid } from '../TileGrid';
import { PrepTile } from '@/components/races/prep/PrepTile';
import type { InterestEventConfig, TileSectionConfig } from '@/types/interestEventConfig';
import type { RacePhase } from '@/components/cards/types';
import type { CardRaceData } from '@/components/cards/types';
import type { ModuleContentSummary } from '@/components/races/ModuleDetailBottomSheet';

// =============================================================================
// ICON MAPPING
// =============================================================================

/**
 * Maps config icon strings (MaterialCommunityIcons / Ionicons names)
 * to lucide-react-native components. Falls back to CircleDot for unknowns.
 */
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  // Common
  'checkbox-marked-outline': LucideIcons.ListChecks,
  'lightbulb-outline': LucideIcons.Lightbulb,
  'share-variant': LucideIcons.Share2,
  'message-text': LucideIcons.MessageSquare,
  'clock-outline': LucideIcons.Clock,
  'clipboard-text': LucideIcons.ClipboardList,

  // Sailing
  'weather-partly-cloudy': LucideIcons.CloudSun,
  'compass-outline': LucideIcons.Compass,
  'tune-vertical': LucideIcons.SlidersHorizontal,
  'map-marker-path': LucideIcons.MapPin,
  'sail-boat': LucideIcons.Sailboat,
  'file-document-outline': LucideIcons.FileText,
  'flag-checkered': LucideIcons.Flag,
  waves: LucideIcons.Waves,
  'account-group-outline': LucideIcons.Users,
  'account-multiple': LucideIcons.Users,
  'sword-cross': LucideIcons.Swords,
  'map-marker-multiple': LucideIcons.MapPin,
  podium: LucideIcons.Trophy,

  // Nursing
  people: LucideIcons.Users,
  'people-outline': LucideIcons.Users,
  medkit: LucideIcons.Heart,
  bandage: LucideIcons.Activity,
  ribbon: LucideIcons.Award,
  flask: LucideIcons.FlaskConical,
  'shield-check': LucideIcons.ShieldCheck,
  school: LucideIcons.GraduationCap,
  pill: LucideIcons.Pill,
  trophy: LucideIcons.Trophy,
  timer: LucideIcons.Timer,
  time: LucideIcons.Clock,
  // Nursing: What/Why/Who/How plan + media + reflect
  'help-circle-outline': LucideIcons.HelpCircle,
  'bulb-outline': LucideIcons.Lightbulb,
  'map-outline': LucideIcons.Map,
  mic: LucideIcons.Mic,
  videocam: LucideIcons.Video,
  create: LucideIcons.Pencil,
  'sync-circle': LucideIcons.RefreshCw,
  'git-network': LucideIcons.GitBranch,
  library: LucideIcons.BookOpen,
  analytics: LucideIcons.BarChart3,

  // Drawing
  images: LucideIcons.Image,
  grid: LucideIcons.Grid3x3,
  'color-wand': LucideIcons.Wand2,
  construct: LucideIcons.Hammer,
  'color-palette': LucideIcons.Palette,
  contrast: LucideIcons.Contrast,
  person: LucideIcons.User,
  stopwatch: LucideIcons.Timer,
  camera: LucideIcons.Camera,
  bookmark: LucideIcons.Bookmark,

  // Fitness
  flash: LucideIcons.Zap,
  restaurant: LucideIcons.UtensilsCrossed,
  body: LucideIcons.User,
  calendar: LucideIcons.Calendar,
  settings: LucideIcons.Settings,
  'heart-pulse': LucideIcons.HeartPulse,
};

function resolveIcon(iconName: string): React.ComponentType<any> {
  return ICON_MAP[iconName] || LucideIcons.CircleDot;
}

// =============================================================================
// ACCENT COLORS (rotating palette for visual variety)
// =============================================================================

const ACCENT_COLORS = [
  '#007AFF', // blue
  '#FF9500', // orange
  '#5856D6', // purple
  '#FF2D55', // pink
  '#0D9488', // teal
  '#34C759', // green
  '#AF52DE', // violet
  '#FF3B30', // red
];

// =============================================================================
// TILE SECTION (matches DaysBeforeContent visual pattern)
// =============================================================================

function TileSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <View style={tileSectionStyles.section}>
      <View style={tileSectionStyles.sectionHeader}>
        <View style={tileSectionStyles.sectionTitleRow}>
          <Text style={tileSectionStyles.sectionTitle}>{title}</Text>
        </View>
        <Text style={tileSectionStyles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {children}
    </View>
  );
}

const tileSectionStyles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionHeader: {
    gap: 2,
    paddingBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3C3C43',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
});

// =============================================================================
// GENERIC MODULE TILE
// =============================================================================

function GenericModuleTile({
  moduleId,
  label,
  shortLabel,
  icon,
  description,
  accentColor,
  onPress,
  content,
}: {
  moduleId: string;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
  accentColor: string;
  onPress: () => void;
  content?: ModuleContentSummary;
}) {
  const IconComponent = resolveIcon(icon);
  const hasContent = content && (content.notes.trim().length > 0 || content.attachmentCount > 0);

  // Build hint text: show content preview when available, otherwise description
  let hintText: string;
  if (hasContent) {
    const parts: string[] = [];
    if (content.notes.trim()) {
      const preview = content.notes.trim().replace(/\n/g, ' ');
      parts.push(preview.length > 24 ? preview.slice(0, 22) + '...' : preview);
    }
    if (content.attachmentCount > 0) {
      parts.push(`${content.attachmentCount} file${content.attachmentCount > 1 ? 's' : ''}`);
    }
    hintText = parts.join(' · ');
  } else {
    hintText = description.length > 30 ? description.slice(0, 28) + '...' : description;
  }

  return (
    <PrepTile
      label={shortLabel}
      icon={IconComponent}
      iconColor={accentColor}
      isComplete={!!hasContent}
      onPress={onPress}
      hint={hintText}
    >
      {hasContent ? (
        <View style={genericTileStyles.contentPreview}>
          {content.notes.trim() ? (
            <Text style={genericTileStyles.previewText} numberOfLines={2}>
              {content.notes.trim()}
            </Text>
          ) : (
            <Text style={genericTileStyles.previewAttachment} numberOfLines={1}>
              {content.firstAttachmentLabel || `${content.attachmentCount} attachment${content.attachmentCount > 1 ? 's' : ''}`}
            </Text>
          )}
        </View>
      ) : (
        <Text style={genericTileStyles.label} numberOfLines={2}>
          {label}
        </Text>
      )}
    </PrepTile>
  );
}

const genericTileStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  contentPreview: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#3C3C43',
    lineHeight: 16,
    textAlign: 'left',
  },
  previewAttachment: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    textAlign: 'center',
  },
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface ConfigDrivenPhaseContentProps {
  /** Current phase to render */
  phase: RacePhase;
  /** The interest's event config */
  config: InterestEventConfig;
  /** The race/event data (optional, for future use) */
  race?: CardRaceData;
  /** Callback when a module tile is pressed */
  onModulePress?: (moduleId: string) => void;
  /** User-entered content per module (keyed by moduleId) */
  moduleContent?: Record<string, ModuleContentSummary>;
}

export function ConfigDrivenPhaseContent({
  phase,
  config,
  race,
  onModulePress,
  moduleContent,
}: ConfigDrivenPhaseContentProps) {
  // Determine the event subtype from race data (e.g., 'blank_activity', 'clinical_shift')
  // Prefer metadata.event_subtype (explicit) over race_type (may be constrained to sailing values)
  const eventSubtype = (race as any)?.metadata?.event_subtype ?? (race as any)?.race_type;
  const subtypeOverride = eventSubtype ? config.subtypeOverrides?.[eventSubtype] : undefined;
  const phaseOverrideModules = subtypeOverride?.phaseDefaultOverrides?.[phase];

  // If this subtype has specific phase overrides, build sections from those modules
  // instead of the static tileSections (e.g., blank_activity → What/Why/Who/How)
  let sections = config.tileSections?.[phase];

  if (phaseOverrideModules && phaseOverrideModules.length > 0) {
    // Build a dynamic section from the subtype's overridden modules
    const subtypeLabel = config.eventSubtypes?.find(s => s.id === eventSubtype)?.label ?? 'Your Plan';
    sections = [
      {
        id: `${eventSubtype}-override`,
        label: subtypeLabel === 'Blank Activity' ? 'Your Plan' : subtypeLabel,
        subtitle: subtypeLabel === 'Blank Activity'
          ? 'Define what, why, who, and how'
          : `${config.phaseLabels[phase]?.short ?? 'Phase'} modules`,
        moduleIds: phaseOverrideModules,
      },
    ];
  }

  // Fallback: if no tileSections defined, create a single section from defaultModules
  const effectiveSections: TileSectionConfig[] = sections ?? [
    {
      id: 'default',
      label: config.phaseLabels[phase]?.short ?? 'Modules',
      subtitle: `${config.eventNoun} preparation`,
      moduleIds: config.phaseModuleConfig[phase]?.defaultModules ?? [],
    },
  ];

  let colorIndex = 0;

  return (
    <View style={styles.container}>
      {effectiveSections.map((section) => {
        // Filter to only modules that exist in moduleInfo
        const validModuleIds = section.moduleIds.filter(
          (id) => config.moduleInfo[id]
        );

        if (validModuleIds.length === 0) return null;

        return (
          <TileSection
            key={section.id}
            title={section.label}
            subtitle={section.subtitle}
          >
            <TileGrid>
              {validModuleIds.map((moduleId) => {
                const mod = config.moduleInfo[moduleId];
                const color = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];
                colorIndex++;

                return (
                  <GenericModuleTile
                    key={moduleId}
                    moduleId={moduleId}
                    label={mod.label}
                    shortLabel={mod.shortLabel}
                    icon={mod.icon}
                    description={mod.description}
                    accentColor={color}
                    onPress={() => onModulePress?.(moduleId)}
                    content={moduleContent?.[moduleId]}
                  />
                );
              })}
            </TileGrid>
          </TileSection>
        );
      })}

      {effectiveSections.every(
        (s) => s.moduleIds.filter((id) => config.moduleInfo[id]).length === 0
      ) && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No modules configured for this phase.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
