/**
 * Voice Note Service - AI-Powered Voice Recording and Analysis
 * Captures racing observations, converts to tactical insights, and integrates with strategy engine
 * Optimized for race day use with noise handling and sailing terminology recognition
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
// import Anthropic from '@anthropic-ai/sdk';
import { Platform } from 'react-native';
import type { RaceStrategy, RaceConditions } from './RaceStrategyEngine';

export interface VoiceNote {
  id: string;
  timestamp: Date;
  duration: number; // seconds
  fileUri: string;
  transcription?: string;
  tacticalInsights?: TacticalInsight[];
  raceContext?: RaceContext;
  analysis?: VoiceAnalysis;
  isProcessing: boolean;
}

export interface TacticalInsight {
  type: 'wind_shift' | 'current_observation' | 'fleet_position' | 'mark_approach' | 'equipment_change' | 'weather_change';
  confidence: number; // 0-1
  description: string;
  recommendation?: string;
  timestamp: Date;
  importance: 'critical' | 'important' | 'informational';
}

export interface RaceContext {
  racePhase: 'pre_start' | 'start_sequence' | 'upwind' | 'downwind' | 'finish' | 'post_race';
  currentLeg?: string;
  markName?: string;
  fleetPosition?: number;
  conditions?: RaceConditions;
}

export interface VoiceAnalysis {
  transcription: string;
  sailingTermsDetected: string[];
  tacticalInsights: TacticalInsight[];
  strategyUpdate?: Partial<RaceStrategy>;
  confidenceScore: number;
  processingTime: number;
}

export interface VoiceRecordingOptions {
  maxDuration?: number; // seconds (default: 60)
  quality?: 'high' | 'medium' | 'low';
  enableNoiseReduction?: boolean;
  raceContext?: RaceContext;
}

class VoiceNoteService {
  private recording: Audio.Recording | null = null;
  private genAI: Anthropic;
  private isInitialized = false;

  constructor() {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is required for voice note processing');
    }
    this.genAI = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request audio permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Audio permission required for voice notes');
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log('🎤 VoiceNoteService initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize VoiceNoteService:', error);
      throw error;
    }
  }

  async startRecording(options: VoiceRecordingOptions = {}): Promise<string> {
    await this.initialize();

    if (this.recording) {
      throw new Error('Recording already in progress');
    }

    try {
      const {
        maxDuration = 60,
        quality = 'high',
        enableNoiseReduction = true
      } = options;

      // Configure recording options optimized for marine environment
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: quality === 'high' ? 44100 : 22050,
          numberOfChannels: 1,
          bitRate: quality === 'high' ? 128000 : 64000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: quality === 'high'
            ? Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH
            : Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
          sampleRate: quality === 'high' ? 44100 : 22050,
          numberOfChannels: 1,
          bitRate: quality === 'high' ? 128000 : 64000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: quality === 'high' ? 128000 : 64000,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(recordingOptions);

      const startTime = Date.now();
      await this.recording.startAsync();

      // Auto-stop recording after maxDuration
      setTimeout(async () => {
        if (this.recording) {
          await this.stopRecording();
        }
      }, maxDuration * 1000);

      const recordingId = `voice_note_${startTime}`;
      console.log(`🎤 Started recording voice note: ${recordingId}`);

      return recordingId;
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.recording = null;
      throw error;
    }
  }

  async stopRecording(): Promise<VoiceNote | null> {
    if (!this.recording) {
      console.warn('⚠️ No recording in progress');
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      const duration = this.recording._finalDurationMillis
        ? this.recording._finalDurationMillis / 1000
        : 0;

      const voiceNote: VoiceNote = {
        id: `voice_note_${Date.now()}`,
        timestamp: new Date(),
        duration,
        fileUri: uri,
        isProcessing: true,
      };

      this.recording = null;

      console.log(`🎤 Recording completed: ${voiceNote.id} (${duration.toFixed(1)}s)`);

      // Start background processing
      this.processVoiceNote(voiceNote);

      return voiceNote;
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      this.recording = null;
      throw error;
    }
  }

  async cancelRecording(): Promise<void> {
    if (!this.recording) return;

    try {
      await this.recording.stopAndUnloadAsync();
      this.recording = null;
      console.log('🎤 Recording cancelled');
    } catch (error) {
      console.error('❌ Failed to cancel recording:', error);
      this.recording = null;
    }
  }

  private async processVoiceNote(voiceNote: VoiceNote): Promise<VoiceNote> {
    try {
      console.log(`🤖 Processing voice note: ${voiceNote.id}`);
      const startTime = Date.now();

      // Convert audio to text using Google AI Speech-to-Text
      const transcription = await this.transcribeAudio(voiceNote.fileUri);

      // Analyze sailing terminology and extract tactical insights
      const analysis = await this.analyzeTranscription(transcription, voiceNote.raceContext);

      const processingTime = (Date.now() - startTime) / 1000;

      const processedNote: VoiceNote = {
        ...voiceNote,
        transcription: analysis.transcription,
        tacticalInsights: analysis.tacticalInsights,
        analysis: {
          ...analysis,
          processingTime,
        },
        isProcessing: false,
      };

      console.log(`✅ Voice note processed in ${processingTime.toFixed(1)}s: ${processedNote.id}`);
      return processedNote;

    } catch (error) {
      console.error('❌ Failed to process voice note:', error);
      return {
        ...voiceNote,
        isProcessing: false,
      };
    }
  }

  private async transcribeAudio(fileUri: string): Promise<string> {
    // For now, return a simulated transcription
    // In production, this would integrate with Google Speech-to-Text API
    // or use the device's built-in speech recognition

    console.log('🎯 Transcribing audio...');

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return sample transcription for demo
    return "Wind is shifting right, about 10 degrees. Current seems stronger near the shore. Fleet is bunched up at the weather mark. Considering a port tack approach.";
  }

  private async analyzeTranscription(
    transcription: string,
    raceContext?: RaceContext
  ): Promise<VoiceAnalysis> {
    try {

      const analysisPrompt = `
Analyze this sailing voice note and extract tactical insights:

Transcription: "${transcription}"

Race Context: ${raceContext ? JSON.stringify(raceContext, null, 2) : 'Not provided'}

Extract the following:
1. Sailing terminology used
2. Tactical observations (wind, current, fleet position, marks, equipment)
3. Strategic implications and recommendations
4. Confidence score (0-1) for the analysis

Return as JSON with this structure:
{
  "transcription": "cleaned up transcription",
  "sailingTermsDetected": ["term1", "term2"],
  "tacticalInsights": [
    {
      "type": "wind_shift|current_observation|fleet_position|mark_approach|equipment_change|weather_change",
      "confidence": 0.9,
      "description": "What was observed",
      "recommendation": "What to do about it",
      "importance": "critical|important|informational"
    }
  ],
  "strategyUpdate": {
    "startStrategy": "Updated start approach if relevant",
    "tacticalPlan": "Updated tactical recommendations"
  },
  "confidenceScore": 0.85
}
`;

      const message = await this.genAI.messages.create({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: analysisPrompt
        }]
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';

      try {
        const analysis = JSON.parse(text);

        // Add timestamps to insights
        analysis.tacticalInsights = analysis.tacticalInsights.map((insight: any) => ({
          ...insight,
          timestamp: new Date(),
        }));

        return analysis;
      } catch (parseError) {
        console.error('❌ Failed to parse AI analysis:', parseError);

        // Fallback analysis
        return {
          transcription,
          sailingTermsDetected: this.extractSailingTerms(transcription),
          tacticalInsights: this.extractBasicInsights(transcription),
          confidenceScore: 0.5,
          processingTime: 0,
        };
      }
    } catch (error) {
      console.error('❌ AI analysis failed:', error);

      // Fallback to basic analysis
      return {
        transcription,
        sailingTermsDetected: this.extractSailingTerms(transcription),
        tacticalInsights: this.extractBasicInsights(transcription),
        confidenceScore: 0.3,
        processingTime: 0,
      };
    }
  }

  private extractSailingTerms(text: string): string[] {
    const sailingTerms = [
      'wind', 'shift', 'tack', 'gybe', 'mark', 'current', 'tide',
      'port', 'starboard', 'windward', 'leeward', 'upwind', 'downwind',
      'fleet', 'layline', 'header', 'lift', 'pressure', 'velocity',
      'bearing', 'course', 'boat speed', 'vmg', 'angle'
    ];

    const detectedTerms: string[] = [];
    const lowerText = text.toLowerCase();

    sailingTerms.forEach(term => {
      if (lowerText.includes(term)) {
        detectedTerms.push(term);
      }
    });

    return detectedTerms;
  }

  private extractBasicInsights(text: string): TacticalInsight[] {
    const insights: TacticalInsight[] = [];
    const lowerText = text.toLowerCase();

    // Basic pattern detection
    if (lowerText.includes('wind') && (lowerText.includes('shift') || lowerText.includes('change'))) {
      insights.push({
        type: 'wind_shift',
        confidence: 0.7,
        description: 'Wind shift detected in voice note',
        recommendation: 'Monitor wind direction and adjust strategy accordingly',
        timestamp: new Date(),
        importance: 'important'
      });
    }

    if (lowerText.includes('current') || lowerText.includes('tide')) {
      insights.push({
        type: 'current_observation',
        confidence: 0.6,
        description: 'Current/tide observation noted',
        recommendation: 'Factor current into tactical decisions',
        timestamp: new Date(),
        importance: 'important'
      });
    }

    if (lowerText.includes('fleet') || lowerText.includes('boat')) {
      insights.push({
        type: 'fleet_position',
        confidence: 0.5,
        description: 'Fleet position observation',
        recommendation: 'Consider fleet position in strategy',
        timestamp: new Date(),
        importance: 'informational'
      });
    }

    return insights;
  }

  async deleteVoiceNote(voiceNote: VoiceNote): Promise<void> {
    try {
      // Delete the audio file
      const fileInfo = await FileSystem.getInfoAsync(voiceNote.fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(voiceNote.fileUri);
      }

      console.log(`🗑️ Deleted voice note: ${voiceNote.id}`);
    } catch (error) {
      console.error('❌ Failed to delete voice note:', error);
      throw error;
    }
  }

  isRecording(): boolean {
    return this.recording !== null;
  }

  async getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
    if (!this.recording) return null;

    try {
      return await this.recording.getStatusAsync();
    } catch (error) {
      console.error('❌ Failed to get recording status:', error);
      return null;
    }
  }
}

export const voiceNoteService = new VoiceNoteService();