/**
 * AI Services - Main Export
 * Centralized export for AI integration modules
 */

// Type definitions
export * from './types';

// Core modules (new names)
export { AIClient } from './AIClient';
export type { AIModelId, AIRequest, AIMessage, AIResponse, AIRawResponse } from './AIClient';

export { EnhancedAIClient, enhancedAIClient } from './EnhancedAIClient';
export type { SkillConfig, MCPResource, MCPTool, EnhancedAIRequest, EnhancedAIResponse } from './EnhancedAIClient';

// Backward-compatible aliases (deprecated)
export { ClaudeClient, type ClaudeModel, type ClaudeRequest, type ClaudeMessage, type ClaudeResponse } from './AIClient';
export { EnhancedClaudeClient, enhancedClaudeClient, type EnhancedClaudeRequest, type EnhancedClaudeResponse } from './EnhancedAIClient';

export { raceTuningEngine } from './RaceTuningEngine';
export type { RaceTuningCandidate } from './RaceTuningEngine';

// MCP Client Service - commented out as MCP SDK is not installed in React Native app
// The MCP server runs separately. Uncomment if needed for server-side integration.
// export { MCPClientService, mcpClientService } from './MCPClientService';
// export type { MCPServerConfig } from './MCPClientService';

export { AIActivityLogger } from './AIActivityLogger';
export type { ActivityLogOptions, DocumentLogOptions } from './AIActivityLogger';

// Context resolvers
export {
  resolveEventContext,
  resolveRaceContext,
  resolveClubSummary,
} from './ContextResolvers';
// Note: EventContext and RaceContext are already exported from './types'.
// ClubSummary is unique to ContextResolvers so we export it here.
export type { ClubSummary } from './ContextResolvers';

// Prompt builders
export {
  buildEventDocumentPrompt,
  buildRaceCommsPrompt,
  buildSupportPrompt,
  buildDailySummaryPrompt,
} from './PromptBuilder';

// Output validators
export {
  parseDocumentDraft,
  parseRaceComms,
  parseSupportReply,
  parseDailySummary,
} from './OutputValidator';
