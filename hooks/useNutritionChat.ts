/**
 * useNutritionChat — wraps useAIConversation with nutrition-specific logic.
 *
 * After each user message, extracts nutrition data.
 * When stepId is provided, writes to step metadata (primary path).
 * When stepId is absent, writes to nutrition_entries table (legacy/ambient).
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useAIConversation } from '@/hooks/useAIConversation';
import { useInvalidateNutrition } from '@/hooks/useNutrition';
import { getTodaySummary, getDailyTargets, formatNutritionForPrompt, getStepNutritionToday, formatStepNutritionForPrompt } from '@/services/NutritionService';
import { extractNutritionFromMessage, extractNutritionToStep, type ExtractionResult } from '@/services/ai/NutritionExtractionService';
import type { NutritionEntry } from '@/types/nutrition';
import type { StepNutritionEntry } from '@/types/step-nutrition';
import type { AIConversation } from '@/types/manifesto';

interface UseNutritionChatOptions {
  interestId: string;
  interestName: string;
  /** When provided, nutrition entries go to step metadata instead of nutrition_entries table */
  stepId?: string;
}

export function useNutritionChat(options: UseNutritionChatOptions) {
  const { user } = useAuth();
  const { invalidateToday } = useInvalidateNutrition();
  const [systemPrompt, setSystemPrompt] = useState('');
  const [openingMessage, setOpeningMessage] = useState<string | undefined>();
  const [lastExtraction, setLastExtraction] = useState<ExtractionResult | null>(null);
  const [extractedEntries, setExtractedEntries] = useState<NutritionEntry[]>([]);
  const [stepEntries, setStepEntries] = useState<StepNutritionEntry[]>([]);

  // Build system prompt with today's nutrition context
  useEffect(() => {
    if (!user?.id || !options.interestId) return;

    (async () => {
      let nutritionBlock = '';
      try {
        const [targets, stepNutrition, legacyNutrition] = await Promise.all([
          getDailyTargets(user.id, options.interestId),
          getStepNutritionToday(user.id, options.interestId).catch(() => null),
          getTodaySummary(user.id, options.interestId).catch(() => null),
        ]);

        // Prefer step-based nutrition
        if (stepNutrition && stepNutrition.meal_count > 0) {
          nutritionBlock = `\n\n${formatStepNutritionForPrompt(stepNutrition, targets)}`;
        } else if (legacyNutrition && legacyNutrition.meal_count > 0) {
          nutritionBlock = `\n\n${formatNutritionForPrompt(legacyNutrition, targets)}`;
        }

        const todayMeals = stepNutrition?.meal_count ?? legacyNutrition?.meal_count ?? 0;
        if (todayMeals === 0) {
          setOpeningMessage("What have you eaten today? I'll help you keep track.");
        } else {
          const cal = stepNutrition?.total_calories ?? legacyNutrition?.total_calories ?? 0;
          const pro = Math.round(stepNutrition?.total_protein ?? legacyNutrition?.total_protein ?? 0);
          setOpeningMessage(
            `So far today: ${cal} cal, ${pro}g protein from ${todayMeals} meal${todayMeals > 1 ? 's' : ''}. What else have you had?`,
          );
        }
      } catch {}

      const prompt = `You are a nutrition coach on BetterAt. Help the user log their meals through natural conversation. You extract what they ate and estimate macros.${nutritionBlock}

Guidelines:
- Be conversational and brief (under 80 words per response)
- When they describe food, acknowledge it and confirm what you logged
- If details are vague, ask a brief clarifying question ("Was that a large or small portion?")
- Reference their running totals ("That puts you at 1800 cal for the day")
- If they have daily targets, mention progress toward them
- Don't lecture about diet — just track what they tell you
- Do not use markdown formatting`;

      setSystemPrompt(prompt);
    })();
  }, [user?.id, options.interestId]);

  const conversation = useAIConversation({
    interestId: options.interestId,
    interestName: options.interestName,
    contextType: 'nutrition',
    contextId: options.stepId,
    systemPrompt: systemPrompt || `You are a nutrition coach helping track meals for ${options.interestName}.`,
    openingMessage,
  });

  // Wrap sendMessage to extract nutrition after each user message
  const sendMessageWithExtraction = useCallback(
    async (text: string): Promise<string | null> => {
      const response = await conversation.sendMessage(text);

      // Async extraction — don't block the chat
      if (user?.id && conversation.conversationId) {
        if (options.stepId) {
          // Step-bound: build a minimal conversation object and extract to step metadata
          const miniConv: AIConversation = {
            id: conversation.conversationId,
            user_id: user.id,
            interest_id: options.interestId,
            context_type: 'nutrition',
            context_id: options.stepId,
            messages: [{ role: 'user', content: text, timestamp: new Date().toISOString() }],
            summary: null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          extractNutritionToStep(user.id, options.interestId, options.stepId, miniConv)
            .then((entries) => {
              if (entries.length > 0) {
                setStepEntries((prev) => [...prev, ...entries]);
                invalidateToday(options.interestId);
              }
            })
            .catch(() => {});
        } else {
          // Legacy: write to nutrition_entries table
          extractNutritionFromMessage(
            user.id,
            options.interestId,
            conversation.conversationId,
            text,
          )
            .then((result) => {
              if (result.entries.length > 0) {
                setLastExtraction(result);
                setExtractedEntries((prev) => [...prev, ...result.entries]);
                invalidateToday(options.interestId);
              }
            })
            .catch(() => {});
        }
      }

      return response;
    },
    [conversation, user?.id, options.interestId, options.stepId, invalidateToday],
  );

  return {
    messages: conversation.messages,
    isLoading: conversation.isLoading,
    isInitializing: conversation.isInitializing,
    conversationId: conversation.conversationId,
    sendMessage: sendMessageWithExtraction,
    complete: conversation.complete,
    lastExtraction,
    extractedEntries,
    stepEntries,
  };
}
