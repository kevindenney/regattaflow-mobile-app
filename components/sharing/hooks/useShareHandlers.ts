/**
 * Share Handlers Hook
 * Provides handlers for various sharing channels (WhatsApp, Email, etc.)
 */

import { useCallback } from 'react';
import { Alert, Linking, Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as MailComposer from 'expo-mail-composer';
import { createLogger } from '@/lib/utils/logger';
import type { ShareChannel, ShareResult, ShareableContent } from '../types';
import { formatPreRaceContent, formatPostRaceContent, formatResultOnly } from '../formatters';

const logger = createLogger('useShareHandlers');

interface UseShareHandlersOptions {
  content: ShareableContent;
  onShareComplete?: (result: ShareResult) => void;
}

export function useShareHandlers({ content, onShareComplete }: UseShareHandlersOptions) {
  /**
   * Generate shareable text based on context
   */
  const generateShareableText = useCallback((): string => {
    switch (content.context) {
      case 'pre-race':
        return formatPreRaceContent(content);
      case 'post-race':
        return formatPostRaceContent(content);
      case 'result-only':
        return formatResultOnly(content);
      default:
        return formatPostRaceContent(content);
    }
  }, [content]);

  /**
   * Copy content to clipboard
   */
  const handleCopyToClipboard = useCallback(async (): Promise<ShareResult> => {
    try {
      const text = generateShareableText();
      await Clipboard.setStringAsync(text);

      if (Platform.OS !== 'web') {
        Alert.alert('Copied!', 'Content copied to clipboard');
      }

      const result: ShareResult = { success: true, channel: 'copy' };
      onShareComplete?.(result);
      return result;
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
      const result: ShareResult = {
        success: false,
        channel: 'copy',
        error: 'Failed to copy to clipboard'
      };
      onShareComplete?.(result);
      return result;
    }
  }, [generateShareableText, onShareComplete]);

  /**
   * Share via native share sheet
   */
  const handleNativeShare = useCallback(async (): Promise<ShareResult> => {
    try {
      const text = generateShareableText();
      const title = content.context === 'pre-race'
        ? `Race Strategy - ${content.raceName}`
        : `Race Analysis - ${content.raceName}`;

      await Share.share({
        message: text,
        title,
      });

      const result: ShareResult = { success: true, channel: 'native' };
      onShareComplete?.(result);
      return result;
    } catch (error) {
      logger.error('Failed to share:', error);
      const result: ShareResult = {
        success: false,
        channel: 'native',
        error: 'Failed to open share sheet'
      };
      onShareComplete?.(result);
      return result;
    }
  }, [generateShareableText, content.raceName, content.context, onShareComplete]);

  /**
   * Share via WhatsApp
   */
  const handleShareViaWhatsApp = useCallback(async (): Promise<ShareResult> => {
    try {
      const text = generateShareableText();
      const encoded = encodeURIComponent(text);
      const url = `whatsapp://send?text=${encoded}`;

      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        const result: ShareResult = {
          success: true,
          channel: 'whatsapp',
          recipientName: 'WhatsApp'
        };
        onShareComplete?.(result);
        return result;
      } else {
        if (Platform.OS !== 'web') {
          Alert.alert('WhatsApp Not Available', 'WhatsApp is not installed on this device.');
        }
        const result: ShareResult = {
          success: false,
          channel: 'whatsapp',
          error: 'WhatsApp not installed'
        };
        onShareComplete?.(result);
        return result;
      }
    } catch (error) {
      logger.error('Failed to share via WhatsApp:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to open WhatsApp');
      }
      const result: ShareResult = {
        success: false,
        channel: 'whatsapp',
        error: 'Failed to open WhatsApp'
      };
      onShareComplete?.(result);
      return result;
    }
  }, [generateShareableText, onShareComplete]);

  /**
   * Share via Email - uses native share sheet with email hint
   */
  const handleShareViaEmail = useCallback(async (): Promise<ShareResult> => {
    try {
      const text = generateShareableText();
      const subjectPrefix = content.context === 'pre-race' ? 'Race Strategy' : 'Race Analysis';
      const subject = `${subjectPrefix} - ${content.raceName}`;

      // Try expo-mail-composer first (works in dev builds)
      if (Platform.OS !== 'web') {
        try {
          const isAvailable = await MailComposer.isAvailableAsync();
          if (isAvailable) {
            await MailComposer.composeAsync({
              subject,
              body: text,
            });

            const result: ShareResult = {
              success: true,
              channel: 'email',
              recipientName: 'Email'
            };
            onShareComplete?.(result);
            return result;
          }
        } catch {
          // MailComposer not available (Expo Go), fall through to Share API
        }

        // Fallback: Use native share sheet (user can pick Mail from there)
        await Share.share({
          message: text,
          title: subject,
        });

        const result: ShareResult = {
          success: true,
          channel: 'email',
          recipientName: 'Email'
        };
        onShareComplete?.(result);
        return result;
      }

      // Web fallback: mailto link
      const encodedSubject = encodeURIComponent(subject);
      // Truncate body for mailto to avoid URL length limits
      const truncatedText = text.length > 1500 ? text.substring(0, 1500) + '...' : text;
      const encodedBody = encodeURIComponent(truncatedText);
      const url = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
      await Linking.openURL(url);

      const result: ShareResult = {
        success: true,
        channel: 'email',
        recipientName: 'Email'
      };
      onShareComplete?.(result);
      return result;
    } catch (error) {
      logger.error('Failed to share via email:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to open email app');
      }
      const result: ShareResult = {
        success: false,
        channel: 'email',
        error: 'Failed to open email app'
      };
      onShareComplete?.(result);
      return result;
    }
  }, [generateShareableText, content.raceName, content.context, onShareComplete]);

  /**
   * Handle share action by channel
   */
  const handleShare = useCallback(async (channel: ShareChannel): Promise<ShareResult> => {
    switch (channel) {
      case 'whatsapp':
        return handleShareViaWhatsApp();
      case 'email':
        return handleShareViaEmail();
      case 'copy':
        return handleCopyToClipboard();
      case 'native':
        return handleNativeShare();
      default:
        return { success: false, channel, error: 'Unknown channel' };
    }
  }, [handleShareViaWhatsApp, handleShareViaEmail, handleCopyToClipboard, handleNativeShare]);

  return {
    generateShareableText,
    handleCopyToClipboard,
    handleNativeShare,
    handleShareViaWhatsApp,
    handleShareViaEmail,
    handleShare,
  };
}
