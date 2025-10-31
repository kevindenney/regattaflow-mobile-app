/**
 * useStreamingChat Hook
 * Manages real-time streaming conversation with ConversationalOnboardingAgent
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ConversationalOnboardingAgent, ConversationalContext, StreamMessage } from '@/services/agents/ConversationalOnboardingAgent';

type AssistantRole = 'assistant';
type UserRole = 'user';

type UserChatMessage = ChatMessage & { role: UserRole };
type AssistantChatMessage = ChatMessage & { role: AssistantRole };

type SavedBoat = NonNullable<CollectedData['boats']>[number];

const VENUE_DETECTION_REGEX = /found you near \*\*([^*]+)\*\*/i;
const SAIL_NUMBER_REGEX = /(?:sail\s*number|#|sail\s+|[a-z])(\d+)/i;
const ABBREVIATION_REGEX = /\b([A-Z]{2,6})\b/g;
const CLUB_FULL_NAME_REGEX = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Yacht|Sailing)\s+Club)\b/gi;
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

const CLUB_ABBREVIATION_EXCLUSIONS = new Set(['GPS', 'AI', 'OK', 'YES', 'NO', 'USA', 'UK']);

const BOAT_CLASSES = [
  'dragon',
  'j/70',
  'j70',
  'j/105',
  'j105',
  'j/111',
  'j111',
  'j/122',
  'j122',
  'etchells',
  'irc',
  'melges 24',
  'melges 32',
  'melges',
  'farr 40',
  'farr',
  'swan 42',
  'swan 45',
  'swan',
  'tp52',
  'tp 52',
  'rc44',
  'rc 44',
  'laser',
  'ilca',
  '420',
  '470',
  '49er',
  '505',
  'finn',
  'snipe',
  'lightning',
  'thistle',
  'viper',
  'x-boat',
  'x boat',
  'xboat',
] as const;

const BOAT_CLASS_REGEX_CACHE = new Map<string, RegExp>();

const getBoatClassRegex = (boatClass: string): RegExp => {
  const cached = BOAT_CLASS_REGEX_CACHE.get(boatClass);
  if (cached) return cached;

  const normalized = boatClass.toLowerCase().replace(/\//g, '\\/');
  const regex = new RegExp(`\\b${normalized}\\b`);
  BOAT_CLASS_REGEX_CACHE.set(boatClass, regex);
  return regex;
};

const BOAT_NAME_PATTERNS = [
  /(?:boat(?:'s)?\s+name\s+is|called|named)\s+["']?([A-Z][a-zA-Z\s'-]+)["']?/i,
  /(?:my\s+boat\s+is\s+called)\s+["']?([A-Z][a-zA-Z\s'-]+)["']?/i,
] as const;

const toTitleCase = (value: string): string =>
  value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && typeof error.message === 'string') {
    return error.message;
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface CollectedDataItem {
  type: 'venue' | 'club' | 'boat' | 'role' | 'fleet' | 'equipment' | 'coach' | 'crew' | 'racingArea' | 'series';
  label: string;
  value: string;
  timestamp: number;
}

export interface CollectedData {
  venue?: string;
  role?: string;
  boats?: Array<{ class: string; name?: string; sailNumber?: string }>;
  clubs?: string[];
  fleets?: string[];
  equipment?: Array<{ boat: string; makers: string[] }>;
  coaches?: string[];
  crew?: string[];
  racingAreas?: string[];
  series?: string[];
  // Chronological order tracking
  items?: CollectedDataItem[];
}

type UseStreamingChatReturn = {
  messages: ChatMessage[];
  isLoading: boolean;
  context: ConversationalContext;
  collectedData: CollectedData;
  sendMessage: (userMessage: string) => Promise<void>;
  updateContext: (updates: Partial<ConversationalContext>) => void;
  resetConversation: () => void;
  startOnboarding: (gpsCoordinates?: { lat: number; lng: number }) => Promise<void>;
};

export function useStreamingChat(sailorId: string): UseStreamingChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collectedData, setCollectedData] = useState<CollectedData>({});
  const [context, setContext] = useState<ConversationalContext>({
    sailorId,
    conversationHistory: [],
  });

  const agentRef = useRef<ConversationalOnboardingAgent | null>(null);

  // Extract collected data from messages
  useEffect(() => {
    const newData: CollectedData = {};
    const chronologicalItems: CollectedDataItem[] = [];

    if (context.detectedVenue?.name) {
      newData.venue = context.detectedVenue.name;
      chronologicalItems.push({
        type: 'venue',
        label: 'Home Venue',
        value: context.detectedVenue.name,
        timestamp: Date.now(),
      });
    } else {
      const assistantMessages = messages.filter(
        (m): m is AssistantChatMessage => m.role === 'assistant'
      );
      assistantMessages.forEach(msg => {
        const venueMatch = msg.content.match(VENUE_DETECTION_REGEX);
        if (venueMatch && !newData.venue) {
          const venueName = venueMatch[1];
          newData.venue = venueName;
          chronologicalItems.push({
            type: 'venue',
            label: 'Home Venue',
            value: venueName,
            timestamp: msg.timestamp.getTime(),
          });
        }
      });
    }

    const userMessages = messages.filter(
      (m): m is UserChatMessage => m.role === 'user'
    );

    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      if (!newData.role && content.includes('owner')) {
        newData.role = 'Owner';
        chronologicalItems.push({
          type: 'role',
          label: 'Sailor Role',
          value: 'Owner',
          timestamp: msg.timestamp.getTime(),
        });
      } else if (!newData.role && content.includes('crew')) {
        newData.role = 'Crew';
        chronologicalItems.push({
          type: 'role',
          label: 'Sailor Role',
          value: 'Crew',
          timestamp: msg.timestamp.getTime(),
        });
      } else if (!newData.role && content.includes('both')) {
        newData.role = 'Owner & Crew';
        chronologicalItems.push({
          type: 'role',
          label: 'Sailor Role',
          value: 'Owner & Crew',
          timestamp: msg.timestamp.getTime(),
        });
      }
    });

    const boats: SavedBoat[] = [];
    userMessages.forEach(msg => {
      const content = msg.content.toLowerCase();

      BOAT_CLASSES.forEach(boatClass => {
        const regex = getBoatClassRegex(boatClass);
        if (regex.test(content)) {
          const className = boatClass
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const existing = boats.find(
            boat => boat.class.toLowerCase() === boatClass.toLowerCase()
          );

          if (!existing) {
            boats.push({ class: className });
            chronologicalItems.push({
              type: 'boat',
              label: 'Boat',
              value: className,
              timestamp: msg.timestamp.getTime(),
            });
          }
        }
      });

      const sailNumberMatch = content.match(SAIL_NUMBER_REGEX);
      if (sailNumberMatch && boats.length > 0) {
        const [_, sailNumber] = sailNumberMatch;
        const lastBoat = boats[boats.length - 1];
        if (lastBoat && !lastBoat.sailNumber) {
          lastBoat.sailNumber = sailNumber;
          const lastBoatItem = [...chronologicalItems]
            .reverse()
            .find(item => item.type === 'boat');
          if (lastBoatItem && !lastBoatItem.value.includes('#')) {
            lastBoatItem.value = `${lastBoatItem.value} #${sailNumber}`;
          }
        }
      }
    });

    userMessages.forEach(msg => {
      const content = msg.content;
      for (const pattern of BOAT_NAME_PATTERNS) {
        const match = content.match(pattern);
        if (match && boats.length > 0) {
          const boatName = match[1].trim();
          const lastBoat = boats[boats.length - 1];
          if (lastBoat) {
            lastBoat.name = boatName;
            chronologicalItems.push({
              type: 'boat',
              label: 'Boat Name',
              value: boatName,
              timestamp: msg.timestamp.getTime(),
            });
          }
          break;
        }
      }
    });

    if (boats.length > 0) {
      newData.boats = boats;
    }

    if (Array.isArray(context.selectedClubs) && context.selectedClubs.length > 0) {
      newData.clubs = context.selectedClubs;
      context.selectedClubs.forEach(club => {
        chronologicalItems.push({
          type: 'club',
          label: 'Yacht Club',
          value: club,
          timestamp: Date.now(),
        });
      });
    } else {
      const clubs: string[] = [];
      userMessages.forEach(msg => {
        const abbrevMatch = msg.content.match(ABBREVIATION_REGEX);
        if (abbrevMatch) {
          abbrevMatch.forEach(abbrev => {
            if (CLUB_ABBREVIATION_EXCLUSIONS.has(abbrev)) {
              return;
            }
            if (!clubs.includes(abbrev)) {
              clubs.push(abbrev);
              chronologicalItems.push({
                type: 'club',
                label: 'Yacht Club',
                value: abbrev,
                timestamp: msg.timestamp.getTime(),
              });
            }
          });
        }

        const fullNameMatch = msg.content.match(CLUB_FULL_NAME_REGEX);
        if (fullNameMatch) {
          fullNameMatch.forEach(name => {
            const formatted = toTitleCase(name);
            if (!clubs.includes(formatted)) {
              clubs.push(formatted);
              chronologicalItems.push({
                type: 'club',
                label: 'Yacht Club',
                value: formatted,
                timestamp: msg.timestamp.getTime(),
              });
            }
          });
        }
      });

      if (clubs.length > 0) {
        newData.clubs = clubs;
      }
    }

    if (Array.isArray(context.selectedFleets) && context.selectedFleets.length > 0) {
      newData.fleets = context.selectedFleets;
      context.selectedFleets.forEach(fleet => {
        chronologicalItems.push({
          type: 'fleet',
          label: 'Racing Fleet',
          value: fleet,
          timestamp: Date.now(),
        });
      });
    }

    userMessages.forEach(msg => {
      const urls = msg.content.match(URL_REGEX);
      if (!urls) {
        return;
      }

      urls.forEach(url => {
        const lowerContent = msg.content.toLowerCase();
        const lowerUrl = url.toLowerCase();

        let label: string = 'Website';
        let itemType: Extract<CollectedDataItem['type'], 'club' | 'fleet'> = 'club';

        const isClassLink =
          lowerContent.includes('class') ||
          lowerContent.includes('association') ||
          lowerUrl.includes('dragon') ||
          lowerUrl.includes('j70') ||
          lowerUrl.includes('etchells') ||
          lowerUrl.includes('sailing');

        if (isClassLink) {
          label = 'Class Website';
          itemType = 'fleet';
        } else if (lowerContent.includes('club') || lowerUrl.includes('yacht') || lowerUrl.includes('club')) {
          label = 'Club Website';
        }

        chronologicalItems.push({
          type: itemType,
          label,
          value: url,
          timestamp: msg.timestamp.getTime(),
        });
      });
    });

    chronologicalItems.sort((a, b) => a.timestamp - b.timestamp);
    newData.items = chronologicalItems;

    setCollectedData(newData);
  }, [messages, context]);

  // Initialize agent
  const getAgent = useCallback(() => {
    if (!agentRef.current) {
      agentRef.current = new ConversationalOnboardingAgent();
    }
    return agentRef.current;
  }, []);

  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(
    async (userMessage: string): Promise<void> => {
      if (!userMessage.trim()) return;

      const agent = getAgent();

      // Add user message
      const userChatMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userChatMessage]);
      setIsLoading(true);

      try {
        // Create assistant message placeholder
        const assistantMessageId = `assistant-${Date.now()}`;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Stream response
        const stream = agent.streamResponse(userMessage, context);

        for await (const chunk of stream) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }

        // Mark streaming complete
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, isStreaming: false }
              : msg
          )
        );

        // Update context with conversation summary
        const summary = agent.getConversationSummary();
        setContext(prev => ({
          ...prev,
          conversationHistory: summary.messages,
        }));
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error);
        // Add error message
        setMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `I apologize, but I encountered an error: ${errorMessage}`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [context, getAgent]
  );

  /**
   * Update context (e.g., GPS coordinates, selected items)
   */
  const updateContext = useCallback((updates: Partial<ConversationalContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset conversation
   */
  const resetConversation = useCallback(() => {
    const agent = getAgent();
    agent.resetConversation();
    setMessages([]);
    setContext({
      sailorId,
      conversationHistory: [],
    });
  }, [sailorId, getAgent]);

  /**
   * Start onboarding with welcome message
   */
  const startOnboarding = useCallback(
    async (gpsCoordinates?: { lat: number; lng: number }) => {
      if (gpsCoordinates) {
        setContext(prev => ({ ...prev, gpsCoordinates }));
      }

      await sendMessage(
        "I'm ready to set up my RegattaFlow profile! Let's get started."
      );
    },
    [sendMessage]
  );

  return {
    messages,
    isLoading,
    context,
    collectedData,
    sendMessage,
    updateContext,
    resetConversation,
    startOnboarding,
  };
}
