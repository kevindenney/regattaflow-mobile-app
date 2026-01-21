/**
 * useSectionAction Hook
 *
 * Handles navigation and actions when tapping interactive strategy template sections.
 * Supports three action types:
 * - 'tool': Opens a tool (watch schedule creator, pace calculator, etc.)
 * - 'learn': Navigates to a learning module
 * - 'navigate': Navigates to a specific route
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { TemplateSectionAction } from '@/components/cards/types';

/**
 * Tool definitions with their routes and availability
 * Tools can be:
 * - route-based: opens a new screen
 * - modal-based: triggers a callback to open a modal in the parent component
 */
const TOOL_ROUTES: Record<string, {
  route?: string;
  available: boolean;
  name: string;
  modalBased?: boolean;
}> = {
  'watch-schedule-creator': {
    available: true,
    name: 'Watch Schedule Creator',
    modalBased: true, // Opens as a modal in the parent component
  },
  'pace-calculator': {
    route: '/tools/pace-calculator',
    available: false, // Not yet built
    name: 'Pace Calculator',
  },
  'routing-optimizer': {
    route: '/tools/routing',
    available: false,
    name: 'Routing Optimizer',
  },
};

/**
 * Learning module mappings to course IDs
 * Maps semantic module IDs to actual course routes
 */
const LEARN_MODULE_ROUTES: Record<string, { courseId: string; name: string }> = {
  'watch-schedules': {
    courseId: 'offshore-watch-keeping',
    name: 'Watch Systems & Crew Management',
  },
  'vhf-radio-procedures': {
    courseId: 'marine-communications',
    name: 'VHF Radio & Communications',
  },
  'grib-weather-routing': {
    courseId: 'weather-routing-fundamentals',
    name: 'Weather Routing Fundamentals',
  },
  'tidal-currents': {
    courseId: 'tides-currents',
    name: 'Tides & Currents',
  },
  'night-sailing-safety': {
    courseId: 'night-sailing',
    name: 'Night Sailing Safety',
  },
  'heavy-weather': {
    courseId: 'heavy-weather-tactics',
    name: 'Heavy Weather Tactics',
  },
  'crew-overboard': {
    courseId: 'mob-procedures',
    name: 'Crew Overboard Procedures',
  },
  'passage-planning': {
    courseId: 'passage-planning-essentials',
    name: 'Passage Planning Essentials',
  },
};

/**
 * Callback for modal-based tools
 */
export type ToolOpenCallback = (toolId: string, toolName: string) => void;

interface UseSectionActionOptions {
  /** Race ID for context-aware tool launches */
  raceId?: string;
  /** Callback after successful navigation */
  onNavigated?: (action: TemplateSectionAction) => void;
  /** Callback for opening modal-based tools */
  onOpenTool?: ToolOpenCallback;
}

export function useSectionAction(options: UseSectionActionOptions = {}) {
  const { raceId, onNavigated, onOpenTool } = options;

  const handleSectionAction = useCallback(
    (action: TemplateSectionAction, sectionId: string) => {
      switch (action.type) {
        case 'tool': {
          const toolConfig = action.toolId ? TOOL_ROUTES[action.toolId] : null;

          if (!toolConfig) {
            Alert.alert('Tool Not Found', `The tool "${action.toolId}" is not available.`);
            return;
          }

          if (!toolConfig.available) {
            // Tool not yet built - show coming soon
            Alert.alert(
              `${toolConfig.name}`,
              'This tool is coming soon! Would you like to be notified when it\'s ready?',
              [
                { text: 'Not now', style: 'cancel' },
                {
                  text: 'Notify me',
                  onPress: () => {
                    // TODO: Add to notification list
                    Alert.alert('Got it!', "We'll let you know when this tool is ready.");
                  },
                },
              ]
            );
            return;
          }

          // Modal-based tools - call the callback to open modal
          if (toolConfig.modalBased) {
            if (onOpenTool) {
              onOpenTool(action.toolId!, toolConfig.name);
              onNavigated?.(action);
            } else {
              // Fallback: show alert if no callback provided
              Alert.alert(
                toolConfig.name,
                'This tool requires a parent component to handle modal display.',
              );
            }
            return;
          }

          // Route-based tools - navigate to tool with race context
          if (toolConfig.route) {
            const params = raceId ? { raceId } : {};
            router.push({ pathname: toolConfig.route as any, params });
            onNavigated?.(action);
          }
          break;
        }

        case 'learn': {
          const moduleConfig = action.moduleId ? LEARN_MODULE_ROUTES[action.moduleId] : null;

          if (!moduleConfig) {
            // Direct navigation if no mapping exists - might be a course ID directly
            const courseId = action.moduleId || 'fundamentals';
            router.push(`/learn/${courseId}` as any);
            onNavigated?.(action);
            return;
          }

          // Navigate to learning module
          router.push(`/learn/${moduleConfig.courseId}` as any);
          onNavigated?.(action);
          break;
        }

        case 'navigate': {
          if (!action.route) {
            console.warn('[useSectionAction] Navigate action missing route');
            return;
          }

          // Navigate to specified route with params
          router.push({
            pathname: action.route as any,
            params: action.params || {},
          });
          onNavigated?.(action);
          break;
        }

        default:
          console.warn('[useSectionAction] Unknown action type:', (action as any).type);
      }
    },
    [raceId, onNavigated, onOpenTool]
  );

  return { handleSectionAction };
}

/**
 * Get display info for a tool
 */
export function getToolInfo(toolId: string) {
  return TOOL_ROUTES[toolId] || null;
}

/**
 * Get display info for a learning module
 */
export function getLearnModuleInfo(moduleId: string) {
  return LEARN_MODULE_ROUTES[moduleId] || null;
}

export default useSectionAction;
