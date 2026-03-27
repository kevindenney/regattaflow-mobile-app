/**
 * AIConversationService — CRUD for persistent AI conversation threads.
 */

import { supabase } from '@/services/supabase';
import { createLogger } from '@/lib/utils/logger';
import type {
  AIConversation,
  ConversationMessage,
  CreateConversationInput,
  ConversationContextType,
} from '@/types/manifesto';

const logger = createLogger('AIConversationService');

/**
 * Create a new conversation thread.
 */
export async function createConversation(
  input: CreateConversationInput,
): Promise<AIConversation> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      user_id: input.user_id,
      interest_id: input.interest_id,
      context_type: input.context_type,
      context_id: input.context_id ?? null,
      messages: [],
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data as AIConversation;
}

/**
 * Get a conversation by ID.
 */
export async function getConversation(id: string): Promise<AIConversation | null> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error('getConversation failed', error);
    return null;
  }
  return (data as AIConversation) ?? null;
}

/**
 * Get the most recent active conversation for a given context.
 */
export async function getActiveConversation(
  userId: string,
  interestId: string,
  contextType: ConversationContextType,
  contextId?: string,
): Promise<AIConversation | null> {
  let query = supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('interest_id', interestId)
    .eq('context_type', contextType)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1);

  if (contextId) {
    query = query.eq('context_id', contextId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    logger.error('getActiveConversation failed', error);
    return null;
  }
  return (data as AIConversation) ?? null;
}

/**
 * Append a message to an existing conversation.
 */
export async function appendMessage(
  conversationId: string,
  message: ConversationMessage,
): Promise<AIConversation> {
  // Fetch current messages, append, then update
  const conversation = await getConversation(conversationId);
  if (!conversation) throw new Error('Conversation not found');

  const updatedMessages = [...conversation.messages, message];

  const { data, error } = await supabase
    .from('ai_conversations')
    .update({
      messages: updatedMessages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw error;
  return data as AIConversation;
}

/**
 * Complete a conversation (marks it done, optionally with summary).
 */
export async function completeConversation(
  conversationId: string,
  summary?: string,
): Promise<void> {
  const { error } = await supabase
    .from('ai_conversations')
    .update({
      status: 'completed',
      summary: summary ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  if (error) throw error;
}

/**
 * Get completed conversations for insight extraction.
 */
export async function getRecentCompletedConversations(
  userId: string,
  interestId: string,
  limit = 5,
): Promise<AIConversation[]> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('interest_id', interestId)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('getRecentCompletedConversations failed', error);
    return [];
  }
  return (data ?? []) as AIConversation[];
}
