/**
 * Cross-Platform Alert Utility
 *
 * Provides a unified API for showing alerts that works on both web and native platforms.
 * On native (iOS/Android), uses React Native's Alert.alert.
 * On web, uses window.confirm/alert which are the only reliable dialog methods.
 *
 * Usage:
 * ```
 * import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';
 *
 * // Simple alert (no user choice needed)
 * showAlert('Error', 'Something went wrong');
 *
 * // Confirmation dialog with callback
 * showConfirm(
 *   'Delete Item',
 *   'Are you sure you want to delete this?',
 *   async () => { await deleteItem(); },
 *   { destructive: true }
 * );
 * ```
 */

import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ConfirmOptions {
  /** Style for the confirm button (native only) */
  destructive?: boolean;
  /** Text for the cancel button */
  cancelText?: string;
  /** Text for the confirm button */
  confirmText?: string;
}

/**
 * Show a simple informational alert
 * Works on both web and native platforms
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    // On web, use window.alert
    const fullMessage = message ? `${title}\n\n${message}` : title;
    window.alert(fullMessage);
  } else {
    // On native, use Alert.alert
    Alert.alert(title, message);
  }
}

/**
 * Show a confirmation dialog with OK/Cancel options
 * Returns a Promise that resolves to true if confirmed, false if cancelled
 */
export function showConfirmAsync(
  title: string,
  message?: string,
  options?: ConfirmOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      // On web, use window.confirm
      const fullMessage = message ? `${title}\n\n${message}` : title;
      const confirmed = window.confirm(fullMessage);
      resolve(confirmed);
    } else {
      // On native, use Alert.alert
      const cancelText = options?.cancelText || 'Cancel';
      const confirmText = options?.confirmText || 'OK';

      Alert.alert(title, message, [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: confirmText,
          style: options?.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ]);
    }
  });
}

/**
 * Show a confirmation dialog with a callback for the confirm action
 * This is the most common pattern - do something if user confirms
 */
export function showConfirm(
  title: string,
  message: string | undefined,
  onConfirm: () => void | Promise<void>,
  options?: ConfirmOptions
): void {
  if (Platform.OS === 'web') {
    // On web, use window.confirm
    const fullMessage = message ? `${title}\n\n${message}` : title;
    const confirmed = window.confirm(fullMessage);
    if (confirmed) {
      onConfirm();
    }
  } else {
    // On native, use Alert.alert
    const cancelText = options?.cancelText || 'Cancel';
    const confirmText = options?.confirmText || 'OK';

    Alert.alert(title, message, [
      {
        text: cancelText,
        style: 'cancel',
      },
      {
        text: confirmText,
        style: options?.destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ]);
  }
}

/**
 * Show a custom alert with multiple button options
 * Note: On web, only the first two buttons are supported (cancel + confirm)
 * For more complex dialogs on web, use a modal component instead
 */
export function showAlertWithButtons(
  title: string,
  message: string | undefined,
  buttons: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    // On web, we can only support confirm/cancel pattern
    // If there's only one button, use alert
    if (buttons.length === 1) {
      const fullMessage = message ? `${title}\n\n${message}` : title;
      window.alert(fullMessage);
      buttons[0].onPress?.();
      return;
    }

    // If there are multiple buttons, use confirm for the first non-cancel button
    const fullMessage = message ? `${title}\n\n${message}` : title;
    const cancelButton = buttons.find((b) => b.style === 'cancel');
    const confirmButton = buttons.find((b) => b.style !== 'cancel') || buttons[0];

    const confirmed = window.confirm(fullMessage);
    if (confirmed) {
      confirmButton.onPress?.();
    } else {
      cancelButton?.onPress?.();
    }
  } else {
    // On native, use Alert.alert with all buttons
    Alert.alert(
      title,
      message,
      buttons.map((b) => ({
        text: b.text,
        style: b.style,
        onPress: b.onPress,
      }))
    );
  }
}

/**
 * Show a prompt dialog for text input
 * Note: On web, uses window.prompt. On native iOS, uses Alert.prompt
 * Android doesn't support Alert.prompt natively
 */
export function showPrompt(
  title: string,
  message?: string,
  defaultValue?: string
): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const fullMessage = message ? `${title}\n\n${message}` : title;
      const result = window.prompt(fullMessage, defaultValue);
      resolve(result);
    } else if (Platform.OS === 'ios') {
      // iOS supports Alert.prompt
      Alert.prompt(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
          {
            text: 'OK',
            onPress: (value: string | undefined) => resolve(value || null),
          },
        ],
        'plain-text',
        defaultValue
      );
    } else {
      // Android doesn't support Alert.prompt
      // Return null - caller should use a custom modal for Android
      console.warn('[crossPlatformAlert] Alert.prompt not supported on Android');
      resolve(null);
    }
  });
}
