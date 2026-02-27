/**
 * Watch Schedule Agent
 * Conversational AI agent for setting up watch schedules in distance races.
 * Uses natural language to gather crew info, duration estimates, and watch preferences.
 */

import { z } from 'zod';
import { createLogger } from '@/lib/utils/logger';
import type { WatchSchedule, WatchSystem, WatchGroup, CrewMember, WatchBlock } from '@/types/watchSchedule';
import { supabase } from '@/services/supabase';

const logger = createLogger('WatchScheduleAgent');

// Schema for the save_schedule tool
const WatchScheduleInputSchema = z.object({
  system: z.enum(['4on4off', '3on3off']).describe('Watch rotation system'),
  crew: z.array(z.object({
    id: z.string(),
    name: z.string(),
    watch: z.enum(['A', 'B']),
  })).describe('Crew members assigned to watches'),
  estimatedDuration: z.number().describe('Estimated race duration in hours'),
  notes: z.string().optional().describe('Optional notes about the schedule'),
});

export interface WatchScheduleAgentContext {
  raceName: string;
  raceDistance?: number;
  raceStartTime?: string;
  raceDate?: string;
  crewMembers: Array<{ id: string; name: string; role?: string }>;
  existingSchedule?: WatchSchedule;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class WatchScheduleAgent {
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  private context: WatchScheduleAgentContext;
  private systemPrompt: string;
  private pendingSchedule: WatchSchedule | null = null;

  constructor(context: WatchScheduleAgentContext) {
    this.context = context;
    this.systemPrompt = this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    const { raceName, raceDistance, raceStartTime, crewMembers, existingSchedule } = this.context;

    const crewList = crewMembers.length > 0
      ? crewMembers.map(c => `- ${c.name}${c.role ? ` (${c.role})` : ''}`).join('\n')
      : 'No crew members saved yet';

    const existingInfo = existingSchedule
      ? `\nEXISTING SCHEDULE: ${existingSchedule.system} system, ${existingSchedule.estimatedDuration}h duration`
      : '';

    return `You are a helpful sailing assistant setting up a watch schedule for a distance race.

RACE DETAILS:
- Race: ${raceName}
${raceDistance ? `- Distance: ${raceDistance}nm` : ''}
${raceStartTime ? `- Start: ${raceStartTime}` : ''}
${existingInfo}

AVAILABLE CREW:
${crewList}

YOUR GOAL:
Help the sailor create a watch rotation schedule through natural conversation. Be concise (2-3 sentences max per response).

CONVERSATION FLOW:
1. Greet briefly, estimate race duration based on distance (typically 5-6 knots average speed)
2. Confirm crew participating (show the list above)
3. Suggest watch system:
   - 4 on/4 off for 4-6 crew (traditional)
   - 3 on/3 off for 6+ crew (less fatigue)
4. Suggest watch assignments (try to balance experience/roles)
5. Show the schedule preview and ask to confirm
6. When user confirms, call the save_schedule tool

IMPORTANT RULES:
- Be conversational and helpful, not robotic
- Use sailing terminology naturally
- If user mentions new crew names not in the list, note them
- Always show a clear schedule preview before saving
- For duration estimates: 45nm race in 8-10kt winds ≈ 8-10 hours

When ready to save, call save_schedule with:
- system: '4on4off' or '3on3off'
- crew: array of {id, name, watch: 'A' or 'B'}
- estimatedDuration: number of hours
- notes: any special notes`;
  }

  /**
   * Get the initial greeting message
   */
  getInitialMessage(): string {
    const { raceName, raceDistance, crewMembers } = this.context;

    let greeting = `Let's set up your watch schedule for ${raceName}! 🏁\n\n`;

    if (raceDistance) {
      const estimatedHours = Math.round(raceDistance / 5.5); // ~5.5 knots average
      greeting += `It's ${raceDistance}nm - I'd estimate around ${estimatedHours}-${estimatedHours + 2} hours. Does that sound right?`;
    } else {
      greeting += `How long do you expect the race to take?`;
    }

    return greeting;
  }

  /**
   * Process a user message and get the AI response
   */
  async processMessage(userMessage: string): Promise<{
    response: string;
    schedule?: WatchSchedule;
    isComplete: boolean;
  }> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const prompt = `${this.systemPrompt}

Conversation history:
${this.conversationHistory.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Return ONLY valid JSON with this structure:
{
  "response": "assistant reply text",
  "isComplete": false,
  "scheduleInput": {
    "system": "4on4off|3on3off",
    "crew": [{"id":"string","name":"string","watch":"A|B"}],
    "estimatedDuration": 8,
    "notes": "optional"
  }
}

Rules:
- If user has not confirmed a final schedule, set isComplete=false and omit scheduleInput.
- If user confirms schedule, set isComplete=true and provide complete scheduleInput.
- Keep response concise (2-3 sentences).`;

      const { data, error } = await supabase.functions.invoke('race-coaching-chat', {
        body: {
          prompt,
          max_tokens: 1024,
        },
      });

      if (error) {
        throw new Error(error.message || 'Watch schedule AI invocation failed');
      }

      const rawText = typeof data?.text === 'string' ? data.text : '';
      if (!rawText) {
        throw new Error('Watch schedule AI returned empty response');
      }

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      const textResponse = typeof parsed?.response === 'string'
        ? parsed.response
        : "I'm ready to help with your watch schedule!";
      const isComplete = Boolean(parsed?.isComplete);

      let schedule: WatchSchedule | undefined;
      if (isComplete && parsed?.scheduleInput) {
        const validated = WatchScheduleInputSchema.parse(parsed.scheduleInput);
        schedule = this.buildWatchSchedule(validated);
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: textResponse,
      });

      return {
        response: textResponse,
        schedule,
        isComplete: Boolean(schedule && isComplete),
      };
    } catch (error: any) {
      logger.error('Error processing message:', error);
      return {
        response: `Sorry, I encountered an error: ${error.message}. Let's try again.`,
        isComplete: false,
      };
    }
  }

  /**
   * Build a WatchSchedule object from the tool input
   */
  private buildWatchSchedule(input: z.infer<typeof WatchScheduleInputSchema>): WatchSchedule {
    const { system, crew, estimatedDuration, notes } = input;
    const watchDuration = system === '4on4off' ? 4 : 3;

    // Build crew members array
    const crewMembers: CrewMember[] = crew.map(c => ({
      id: c.id,
      name: c.name,
      watch: c.watch as WatchGroup,
    }));

    // Calculate race start time
    const raceStart = this.context.raceStartTime
      ? new Date(`${this.context.raceDate || new Date().toISOString().split('T')[0]}T${this.context.raceStartTime}`)
      : new Date();

    // Generate watch blocks
    const blocks: WatchBlock[] = [];
    let currentTime = new Date(raceStart);
    let watchIndex = 0;
    let totalHours = 0;

    while (totalHours < estimatedDuration) {
      const currentWatch: WatchGroup = watchIndex % 2 === 0 ? 'A' : 'B';
      const blockDuration = Math.min(watchDuration, estimatedDuration - totalHours);
      const endTime = new Date(currentTime.getTime() + blockDuration * 60 * 60 * 1000);

      const crewOnWatch = crewMembers.filter(c => c.watch === currentWatch);

      blocks.push({
        watch: currentWatch,
        startTime: currentTime.toISOString(),
        endTime: endTime.toISOString(),
        durationHours: blockDuration,
        crew: crewOnWatch.map(c => c.name),
      });

      currentTime = endTime;
      totalHours += blockDuration;
      watchIndex++;
    }

    const now = new Date().toISOString();

    return {
      system,
      crew: crewMembers,
      raceStart: raceStart.toISOString(),
      estimatedDuration,
      blocks,
      notes,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Reset the conversation
   */
  resetConversation(): void {
    this.conversationHistory = [];
    this.pendingSchedule = null;
  }
}

export default WatchScheduleAgent;
