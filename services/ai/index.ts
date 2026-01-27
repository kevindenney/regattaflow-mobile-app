/**
 * AI Services - Main Export
 * Centralized export for all Claude Skills integration modules
 */

// Type definitions
export * from './types';

// Core modules
export { ClaudeClient } from './ClaudeClient';
export type { ClaudeModel, ClaudeRequest, ClaudeMessage, ClaudeResponse } from './ClaudeClient';

export { EnhancedClaudeClient, enhancedClaudeClient } from './EnhancedClaudeClient';
export type { SkillConfig, MCPResource, MCPTool, EnhancedClaudeRequest, EnhancedClaudeResponse } from './EnhancedClaudeClient';

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
