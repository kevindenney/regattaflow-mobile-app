/**
 * Voice Command Service
 *
 * Provides hands-free voice commands for race day operations.
 * Supports wake phrase detection and offline command queueing.
 */

import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechRecognizedEvent,
  SpeechStartEvent,
  SpeechEndEvent
} from '@react-native-voice/voice';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('VoiceCommand');

// ============================================================================
// Types
// ============================================================================

export interface VoiceCommand {
  command: string;
  transcription: string;
  timestamp: Date;
  executed: boolean;
  offline?: boolean;
}

export interface VoiceCommandResult {
  success: boolean;
  action: string;
  message: string;
  data?: any;
}

export type VoiceCommandHandler = (params?: any) => Promise<VoiceCommandResult>;

interface CommandPattern {
  pattern: RegExp;
  handler: string;
  extractParams?: (match: RegExpMatchArray) => any;
  offlineSupported: boolean;
  description: string;
}

// ============================================================================
// Voice Command Service
// ============================================================================

class VoiceCommandService {
  private isListening = false;
  private isWakeListening = false;
  private commandHandlers: Map<string, VoiceCommandHandler> = new Map();
  private commandQueue: VoiceCommand[] = [];
  private audioFeedbackEnabled = true;
  private lastCommand: string | null = null;

  // Wake phrase for activating commands
  private readonly WAKE_PHRASE = 'hey regattaflow';

  // Command patterns with natural language variations
  private readonly COMMAND_PATTERNS: CommandPattern[] = [
    // Tactical maneuvers
    {
      pattern: /\b(mark|log|record)\s+(a\s+)?tack\b/i,
      handler: 'markTack',
      offlineSupported: true,
      description: 'Log a tack maneuver'
    },
    {
      pattern: /\b(mark|log|record)\s+(a\s+)?gybe\b/i,
      handler: 'markGybe',
      offlineSupported: true,
      description: 'Log a gybe maneuver'
    },
    {
      pattern: /\b(mark|log|record)\s+(a\s+)?jibe\b/i,
      handler: 'markGybe',
      offlineSupported: true,
      description: 'Log a jibe maneuver (alternate spelling)'
    },

    // Voice notes
    {
      pattern: /\b(note|record|save)\s+(.+)/i,
      handler: 'saveNote',
      extractParams: (match) => ({ note: match[2] }),
      offlineSupported: true,
      description: 'Save a voice note'
    },

    // Information display
    {
      pattern: /\b(show|display|what'?s?\s+the)\s+(current\s+)?wind\b/i,
      handler: 'showWind',
      offlineSupported: true,
      description: 'Display wind forecast'
    },
    {
      pattern: /\b(show|display|open)\s+(the\s+)?strategy\b/i,
      handler: 'showStrategy',
      offlineSupported: true,
      description: 'Expand strategy card'
    },
    {
      pattern: /\b(show|display|what'?s?\s+the)\s+(current\s+)?tide\b/i,
      handler: 'showTide',
      offlineSupported: true,
      description: 'Display tide information'
    },
    {
      pattern: /\b(show|display|what'?s?\s+the)\s+(current\s+)?position\b/i,
      handler: 'showPosition',
      offlineSupported: true,
      description: 'Display current position'
    },

    // Timer controls
    {
      pattern: /\b(start|begin)\s+(the\s+)?timer\b/i,
      handler: 'startTimer',
      offlineSupported: true,
      description: 'Start countdown timer'
    },
    {
      pattern: /\b(stop|pause|halt)\s+(the\s+)?timer\b/i,
      handler: 'stopTimer',
      offlineSupported: true,
      description: 'Stop countdown timer'
    },
    {
      pattern: /\b(reset)\s+(the\s+)?timer\b/i,
      handler: 'resetTimer',
      offlineSupported: true,
      description: 'Reset countdown timer'
    },

    // Race incidents
    {
      pattern: /\b(protest|flag)\s+(the\s+)?(red|blue|green|yellow|white|black)\s+(boat|sail)\b/i,
      handler: 'flagProtest',
      extractParams: (match) => ({ color: match[3] }),
      offlineSupported: true,
      description: 'Flag a protest incident'
    },
    {
      pattern: /\b(mark|log|record)\s+(a\s+)?foul\b/i,
      handler: 'markFoul',
      offlineSupported: true,
      description: 'Log a foul incident'
    },

    // Mark roundings
    {
      pattern: /\b(rounding|rounded|at)\s+(mark\s+)?(\d+|one|two|three|four|five|windward|leeward|start|finish)\b/i,
      handler: 'markRounding',
      extractParams: (match) => ({ mark: match[3] }),
      offlineSupported: true,
      description: 'Log mark rounding'
    },

    // Equipment
    {
      pattern: /\b(change|switch|set)\s+(to\s+)?(jib|spinnaker|genoa|code\s*zero)\b/i,
      handler: 'changeSail',
      extractParams: (match) => ({ sail: match[3] }),
      offlineSupported: true,
      description: 'Log sail change'
    },

    // Help
    {
      pattern: /\b(help|what\s+can\s+(you|i)|commands)\b/i,
      handler: 'showHelp',
      offlineSupported: true,
      description: 'Show available commands'
    },

    // Cancel
    {
      pattern: /\b(cancel|nevermind|stop|exit)\b/i,
      handler: 'cancel',
      offlineSupported: true,
      description: 'Cancel current operation'
    }
  ];

  constructor() {
    this.initializeVoice();
    this.loadQueuedCommands();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeVoice() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
  }

  private async loadQueuedCommands() {
    try {
      const stored = await AsyncStorage.getItem('voice_command_queue');
      if (stored) {
        this.commandQueue = JSON.parse(stored);
      }
    } catch (error) {
      logger.error('Failed to load queued commands:', error);
    }
  }

  private async saveQueuedCommands() {
    try {
      await AsyncStorage.setItem('voice_command_queue', JSON.stringify(this.commandQueue));
    } catch (error) {
      logger.error('Failed to save queued commands:', error);
    }
  }

  // ============================================================================
  // Voice Event Handlers
  // ============================================================================

  private onSpeechStart = (e: SpeechStartEvent) => {
    logger.debug('Speech started');
  };

  private onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    logger.debug('Speech recognized');
  };

  private onSpeechEnd = (e: SpeechEndEvent) => {
    logger.debug('Speech ended');
    this.isListening = false;
  };

  private onSpeechError = (e: SpeechErrorEvent) => {
    logger.error('Speech error:', e.error);
    this.isListening = false;
    this.isWakeListening = false;
  };

  private onSpeechResults = async (e: SpeechResultsEvent) => {
    if (!e.value || e.value.length === 0) return;

    const transcription = e.value[0].toLowerCase();
    logger.debug('Transcription received');

    // Check for wake phrase
    if (this.isWakeListening) {
      if (transcription.includes(this.WAKE_PHRASE)) {
        await this.playFeedback('activated');
        this.isWakeListening = false;
        await this.startCommandListening();
      }
      return;
    }

    // Process command
    if (this.isListening) {
      await this.processCommand(transcription);
      this.isListening = false;
    }
  };

  // ============================================================================
  // Voice Recognition Control
  // ============================================================================

  async startWakeListening(): Promise<boolean> {
    try {
      if (this.isWakeListening || this.isListening) {
        return false;
      }

      // Request microphone permission
      const hasPermission = await this.checkMicrophonePermission();
      if (!hasPermission) {
        return false;
      }

      await Voice.start(Platform.OS === 'ios' ? 'en-US' : 'en-US');
      this.isWakeListening = true;
      return true;
    } catch (error) {
      logger.error('Failed to start wake listening:', error);
      return false;
    }
  }

  async startCommandListening(): Promise<boolean> {
    try {
      if (this.isListening) {
        return false;
      }

      await Voice.start(Platform.OS === 'ios' ? 'en-US' : 'en-US');
      this.isListening = true;
      return true;
    } catch (error) {
      logger.error('Failed to start command listening:', error);
      return false;
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      this.isListening = false;
      this.isWakeListening = false;
    } catch (error) {
      logger.error('Failed to stop listening:', error);
    }
  }

  async destroy(): Promise<void> {
    try {
      await Voice.destroy();
      this.isListening = false;
      this.isWakeListening = false;
    } catch (error) {
      logger.error('Failed to destroy voice:', error);
    }
  }

  // ============================================================================
  // Permissions
  // ============================================================================

  private async checkMicrophonePermission(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone access to use voice commands.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Failed to check microphone permission:', error);
      return false;
    }
  }

  // ============================================================================
  // Command Processing
  // ============================================================================

  private async processCommand(transcription: string): Promise<void> {
    logger.debug('Processing command');

    // Find matching command pattern
    for (const pattern of this.COMMAND_PATTERNS) {
      const match = transcription.match(pattern.pattern);
      if (match) {
        const params = pattern.extractParams ? pattern.extractParams(match) : undefined;
        await this.executeCommand(pattern.handler, params, transcription, pattern.offlineSupported);
        return;
      }
    }

    // No match found
    await this.playFeedback('error');
    logger.debug('No matching command found');
  }

  private async executeCommand(
    handlerName: string,
    params: any,
    transcription: string,
    offlineSupported: boolean
  ): Promise<void> {
    const handler = this.commandHandlers.get(handlerName);
    if (!handler) {
      logger.error('No handler registered for:', handlerName);
      await this.playFeedback('error');
      return;
    }

    try {
      const result = await handler(params);

      if (result.success) {
        await this.playFeedback('success');
        this.lastCommand = transcription;

        // Log command
        const command: VoiceCommand = {
          command: handlerName,
          transcription,
          timestamp: new Date(),
          executed: true
        };
        await this.logCommand(command);
      } else {
        await this.playFeedback('error');

        // Queue for retry if offline supported
        if (offlineSupported) {
          const command: VoiceCommand = {
            command: handlerName,
            transcription,
            timestamp: new Date(),
            executed: false,
            offline: true
          };
          this.commandQueue.push(command);
          await this.saveQueuedCommands();
        }
      }
    } catch (error) {
      logger.error('Command execution failed:', error);
      await this.playFeedback('error');
    }
  }

  // ============================================================================
  // Command Registration
  // ============================================================================

  registerHandler(commandName: string, handler: VoiceCommandHandler): void {
    this.commandHandlers.set(commandName, handler);
  }

  unregisterHandler(commandName: string): void {
    this.commandHandlers.delete(commandName);
  }

  // ============================================================================
  // Audio Feedback
  // ============================================================================

  private async playFeedback(type: 'activated' | 'success' | 'error'): Promise<void> {
    if (!this.audioFeedbackEnabled) return;

    try {
      // TODO: Add actual audio files to assets/sounds/
      // For now, use system sounds via Audio.Sound
      // Files needed:
      // - voice-activated.mp3
      // - voice-success.mp3
      // - voice-error.mp3

      // Temporary: Use haptic feedback instead
      logger.debug(`Voice feedback: ${type}`);
    } catch (error) {
      logger.error('Failed to play audio feedback:', error);
    }
  }

  setAudioFeedbackEnabled(enabled: boolean): void {
    this.audioFeedbackEnabled = enabled;
  }

  // ============================================================================
  // Command Queue Management
  // ============================================================================

  async processQueuedCommands(): Promise<void> {
    if (this.commandQueue.length === 0) return;

    const queue = [...this.commandQueue];
    this.commandQueue = [];

    for (const command of queue) {
      if (command.executed) continue;

      const handler = this.commandHandlers.get(command.command);
      if (handler) {
        try {
          const result = await handler();
          if (result.success) {
            command.executed = true;
          } else {
            this.commandQueue.push(command);
          }
        } catch (error) {
          this.commandQueue.push(command);
        }
      }
    }

    await this.saveQueuedCommands();
  }

  getQueuedCommandCount(): number {
    return this.commandQueue.filter(c => !c.executed).length;
  }

  async clearQueue(): Promise<void> {
    this.commandQueue = [];
    await this.saveQueuedCommands();
  }

  // ============================================================================
  // Command Logging
  // ============================================================================

  private async logCommand(command: VoiceCommand): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('voice_command_history');
      const history = stored ? JSON.parse(stored) : [];
      history.unshift(command);

      // Keep last 100 commands
      if (history.length > 100) {
        history.splice(100);
      }

      await AsyncStorage.setItem('voice_command_history', JSON.stringify(history));
    } catch (error) {
      logger.error('Failed to log command:', error);
    }
  }

  async getCommandHistory(): Promise<VoiceCommand[]> {
    try {
      const stored = await AsyncStorage.getItem('voice_command_history');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Failed to get command history:', error);
      return [];
    }
  }

  // ============================================================================
  // State
  // ============================================================================

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  isWaitingForWake(): boolean {
    return this.isWakeListening;
  }

  getLastCommand(): string | null {
    return this.lastCommand;
  }

  getAvailableCommands(): CommandPattern[] {
    return this.COMMAND_PATTERNS;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const voiceCommandService = new VoiceCommandService();
export default voiceCommandService;
