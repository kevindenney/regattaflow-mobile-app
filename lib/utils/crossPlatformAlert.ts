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

// Lazy-import the emitter to avoid pulling React into native Alert paths
let _emitDialog: typeof import('@/components/ui/WebAlertDialog').emitDialog | null = null;
function getEmitDialog() {
  if (!_emitDialog) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _emitDialog = require('@/components/ui/WebAlertDialog').emitDialog;
  }
  return _emitDialog!;
}

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
    getEmitDialog()({
      title,
      message,
      buttons: [{ text: 'OK', style: 'default' }],
    });
  } else {
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
      const cancelText = options?.cancelText || 'Cancel';
      const confirmText = options?.confirmText || 'OK';
      getEmitDialog()({
        title,
        message,
        buttons: [
          { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
          {
            text: confirmText,
            style: options?.destructive ? 'destructive' : 'default',
            onPress: () => resolve(true),
          },
        ],
      });
    } else {
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
    const cancelText = options?.cancelText || 'Cancel';
    const confirmText = options?.confirmText || 'OK';
    getEmitDialog()({
      title,
      message,
      buttons: [
        { text: cancelText, style: 'cancel' },
        {
          text: confirmText,
          style: options?.destructive ? 'destructive' : 'default',
          onPress: () => { onConfirm(); },
        },
      ],
    });
  } else {
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
 * On web, renders all buttons in the custom dialog (no longer limited to 2)
 */
export function showAlertWithButtons(
  title: string,
  message: string | undefined,
  buttons: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    getEmitDialog()({
      title,
      message,
      buttons: buttons.map((b) => ({
        text: b.text,
        style: b.style,
        onPress: () => { b.onPress?.(); },
      })),
    });
  } else {
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
 * On web, uses custom styled dialog. On native iOS, uses Alert.prompt.
 */
export function showPrompt(
  title: string,
  message?: string,
  defaultValue?: string
): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      getEmitDialog()({
        title,
        message,
        buttons: [],
        prompt: { defaultValue, onSubmit: resolve },
      });
    } else if (Platform.OS === 'ios') {
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
      console.warn('[crossPlatformAlert] Alert.prompt not supported on Android');
      resolve(null);
    }
  });
}
