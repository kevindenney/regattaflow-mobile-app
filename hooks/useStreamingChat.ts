/**
 * useStreamingChat Hook
 * Manages real-time streaming conversation with ConversationalOnboardingAgent
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { ConversationalOnboardingAgent, ConversationalContext, StreamMessage } from '@/services/agents/ConversationalOnboardingAgent';

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

export function useStreamingChat(sailorId: string) {
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

    // Parse venue from context AND from messages
    if (context.detectedVenue) {
      newData.venue = context.detectedVenue.name;
      chronologicalItems.push({
        type: 'venue',
        label: 'Home Venue',
        value: context.detectedVenue.name,
        timestamp: Date.now(),
      });
    } else {
      // Try to extract venue name from AI messages mentioning "Hong Kong - Victoria Harbor" or similar
      const assistantMessages = messages.filter(m => m.role === 'assistant');
      assistantMessages.forEach(msg => {
        const venueMatch = msg.content.match(/found you near \*\*([^*]+)\*\*/i);
        if (venueMatch && !newData.venue) {
          newData.venue = venueMatch[1];
          chronologicalItems.push({
            type: 'venue',
            label: 'Home Venue',
            value: venueMatch[1],
            timestamp: msg.timestamp.getTime(),
          });
        }
      });
    }

    // Parse user messages for data
    const userMessagesWithMeta = messages.filter(m => m.role === 'user');
    const userMessages = userMessagesWithMeta.map(m => m.content.toLowerCase());
    const allText = userMessages.join(' ');

    // Extract role (owner, crew, both)
    userMessagesWithMeta.forEach((msg, idx) => {
      const content = msg.content.toLowerCase();
      if (content.includes('owner') && !newData.role) {
        newData.role = 'Owner';
        chronologicalItems.push({
          type: 'role',
          label: 'Sailor Role',
          value: 'Owner',
          timestamp: msg.timestamp.getTime(),
        });
      } else if (content.includes('crew') && !newData.role) {
        newData.role = 'Crew';
        chronologicalItems.push({
          type: 'role',
          label: 'Sailor Role',
          value: 'Crew',
          timestamp: msg.timestamp.getTime(),
        });
      } else if (content.includes('both') && !newData.role) {
        newData.role = 'Owner & Crew';
        chronologicalItems.push({
          type: 'role',
          label: 'Sailor Role',
          value: 'Owner & Crew',
          timestamp: msg.timestamp.getTime(),
        });
      }
    });

    // Extract boat classes from user messages
    const boats: Array<{ class: string; sailNumber?: string }> = [];
    userMessagesWithMeta.forEach(msg => {
      const content = msg.content.toLowerCase();
      // Common boat classes (keelboats, dinghies, sportboats)
      // Only detect from USER messages (not AI responses)
      const boatClasses = [
        'dragon', 'j/70', 'j70', 'j/105', 'j105', 'j/111', 'j111', 'j/122', 'j122',
        'etchells', 'irc', 'melges 24', 'melges 32', 'melges', 'farr 40', 'farr',
        'swan 42', 'swan 45', 'swan', 'tp52', 'tp 52', 'rc44', 'rc 44',
        'laser', 'ilca', '420', '470', '49er', '505', 'finn', 'snipe',
        'lightning', 'thistle', 'viper', 'x-boat', 'x boat', 'xboat'
      ];

      // Important: Use word boundaries to avoid false matches
      // "start" should not match "star", "melges" in "Melges 24" should work
      boatClasses.forEach(boatClass => {
        // Use regex with word boundaries to ensure exact matches
        const regex = new RegExp(`\\b${boatClass.toLowerCase().replace(/[/]/g, '\\/')}\\b`);
        if (regex.test(content)) {
          const className = boatClass.split(' ').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          if (!boats.find(b => b.class.toLowerCase() === boatClass.toLowerCase())) {
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

      // Extract sail numbers (e.g., "#123", "sail 123", "number 123", "d59")
      // Only match if we haven't already set a sail number for this boat
      const sailNumberMatch = content.match(/(?:sail\s*number|#|sail\s+|[a-z])(\d+)/i);
      if (sailNumberMatch && boats.length > 0 && !boats[boats.length - 1].sailNumber) {
        boats[boats.length - 1].sailNumber = sailNumberMatch[1];
        // Update the chronological item with sail number
        const lastBoatItem = chronologicalItems.filter(item => item.type === 'boat').pop();
        if (lastBoatItem && !lastBoatItem.value.includes('#')) {
          lastBoatItem.value = `${lastBoatItem.value} #${sailNumberMatch[1]}`;
        }
      }
    });

    // Extract boat names from user messages
    // Look for patterns like "boat name is...", "called...", "named..."
    userMessagesWithMeta.forEach(msg => {
      const content = msg.content;
      const boatNamePatterns = [
        /(?:boat(?:'s)?\s+name\s+is|called|named)\s+["']?([A-Z][a-zA-Z\s'-]+)["']?/i,
        /(?:my\s+boat\s+is\s+called)\s+["']?([A-Z][a-zA-Z\s'-]+)["']?/i,
      ];

      for (const pattern of boatNamePatterns) {
        const match = content.match(pattern);
        if (match && boats.length > 0) {
          const boatName = match[1].trim();
          boats[boats.length - 1].name = boatName;

          // Add to chronological items
          chronologicalItems.push({
            type: 'boat',
            label: 'Boat Name',
            value: boatName,
            timestamp: msg.timestamp.getTime(),
          });
          break;
        }
      }
    });
    if (boats.length > 0) newData.boats = boats;

    // Extract clubs from context or messages
    if (context.selectedClubs && context.selectedClubs.length > 0) {
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
      // Try to extract club names from user messages
      const clubs: string[] = [];
      userMessagesWithMeta.forEach(msg => {
        const content = msg.content;
        // Common yacht club patterns:
        // - Abbreviations: "RHKYC", "ABC", "RBYC", etc. (2-6 caps letters)
        // - Full names with "Yacht Club" or "YC": "Hebe Haven Yacht Club"
        // - Sailing club variants: "Hong Kong Sailing Club"

        // Pattern 1: Abbreviations (2-6 capital letters)
        const abbrevMatch = content.match(/\b([A-Z]{2,6})\b/g);
        if (abbrevMatch) {
          abbrevMatch.forEach(abbrev => {
            // Filter out common non-club abbreviations
            if (!['GPS', 'AI', 'OK', 'YES', 'NO', 'USA', 'UK'].includes(abbrev)) {
              if (!clubs.includes(abbrev)) {
                clubs.push(abbrev);
                chronologicalItems.push({
                  type: 'club',
                  label: 'Yacht Club',
                  value: abbrev,
                  timestamp: msg.timestamp.getTime(),
                });
              }
            }
          });
        }

        // Pattern 2: Full club names (with "yacht club", "sailing club", "YC")
        const fullNameMatch = content.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Yacht|Sailing)\s+Club)\b/gi);
        if (fullNameMatch) {
          fullNameMatch.forEach(name => {
            const formatted = name.split(' ').map(w =>
              w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            ).join(' ');
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

    // Extract fleets from context
    if (context.selectedFleets && context.selectedFleets.length > 0) {
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

    // Extract URLs from user messages (club and class websites)
    userMessagesWithMeta.forEach(msg => {
      const content = msg.content;
      // URL pattern matching
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urls = content.match(urlRegex);

      if (urls) {
        urls.forEach(url => {
          // Determine if it's a club or class URL based on context
          const lowerContent = content.toLowerCase();
          const lowerUrl = url.toLowerCase();

          let type: 'club' | 'fleet' = 'club';
          let label = 'Website';

          // Check if it's a class/association URL
          if (lowerContent.includes('class') || lowerContent.includes('association') ||
              lowerUrl.includes('dragon') || lowerUrl.includes('j70') ||
              lowerUrl.includes('etchells') || lowerUrl.includes('sailing')) {
            label = 'Class Website';
          } else if (lowerContent.includes('club') || lowerUrl.includes('yacht') ||
                     lowerUrl.includes('club')) {
            label = 'Club Website';
          }

          chronologicalItems.push({
            type: type,
            label: label,
            value: url,
            timestamp: msg.timestamp.getTime(),
          });
        });
      }
    });

    // Sort chronological items by timestamp
    chronologicalItems.sort((a, b) => a.timestamp - b.timestamp);
    newData.items = chronologicalItems;

    setCollectedData(newData);

    console.log('📊 [useStreamingChat] Collected data updated:', newData);
    console.log('🕐 [useStreamingChat] Chronological items:', chronologicalItems);
  }, [messages, context]);

  // DEBUG: Log context changes
  useEffect(() => {
    console.log('🔍 [useStreamingChat] Context updated:', {
      sailorId: context.sailorId,
      hasVenue: !!context.detectedVenue,
      venueName: context.detectedVenue?.name,
      boatClass: context.selectedBoatClass,
      clubs: context.selectedClubs,
      fleets: context.selectedFleets,
    });
  }, [context]);

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
    async (userMessage: string) => {
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
      } catch (error: any) {
        console.error('❌ Chat error:', error);

        // Add error message
        setMessages(prev => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `I apologize, but I encountered an error: ${error.message}`,
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
