/**
 * @deprecated Use AIClient.ts instead. This file re-exports for backward compatibility.
 */
export {
  AIClient as ClaudeClient,
  type AIModelId as ClaudeModel,
  type AIRequest as ClaudeRequest,
  type AIMessage as ClaudeMessage,
  type AIResponse as ClaudeResponse,
  type AIRawResponse as ClaudeRawResponse,
} from './AIClient';
