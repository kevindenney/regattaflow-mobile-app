/**
 * Toast - Lightweight non-blocking notification system
 *
 * Usage:
 *   import { useToast } from '@/components/ui/Toast';
 *   const toast = useToast();
 *   toast.show('Post saved!', 'success');
 */

import React, { createContext, useContext, useCallback, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  /** Label for the action button (e.g. "Undo") */
  label: string;
  /** Called when the user taps the action button */
  onPress: () => void;
}

interface ToastOptions {
  /** Duration in ms before auto-dismiss. Defaults to 2500. */
  duration?: number;
  /** Optional inline action button (e.g. Undo) */
  action?: ToastAction;
  /** Called when the toast dismisses without the action being tapped */
  onDismiss?: () => void;
}

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (text: string, type?: ToastType, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: '#059669',
  error: '#DC2626',
  info: '#2563EB',
};

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const animValues = useRef<Map<number, Animated.Value>>(new Map());
  // Track per-toast action-state so onDismiss only fires when the user did
  // *not* tap the action button.
  const actionTakenRef = useRef<Map<number, boolean>>(new Map());

  const dismiss = useCallback((id: number) => {
    const anim = animValues.current.get(id);
    if (!anim) return;
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      animValues.current.delete(id);
      actionTakenRef.current.delete(id);
    });
  }, []);

  const show = useCallback(
    (text: string, type: ToastType = 'success', options?: ToastOptions) => {
      const id = nextId++;
      const anim = new Animated.Value(0);
      animValues.current.set(id, anim);
      actionTakenRef.current.set(id, false);

      const action: ToastAction | undefined = options?.action
        ? {
            label: options.action.label,
            onPress: () => {
              actionTakenRef.current.set(id, true);
              try {
                options.action!.onPress();
              } finally {
                dismiss(id);
              }
            },
          }
        : undefined;

      setToasts(prev => [...prev, { id, text, type, action }]);

      Animated.spring(anim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();

      const duration = options?.duration ?? 2500;
      setTimeout(() => {
        // If the user already tapped the action, dismiss() has already run
        // and onDismiss should not fire.
        const tookAction = actionTakenRef.current.get(id) === true;
        if (animValues.current.has(id)) {
          dismiss(id);
        }
        if (!tookAction) {
          options?.onDismiss?.();
        }
      }, duration);
    },
    [dismiss],
  );

  // Stabilize context value so consumers can safely declare `toast` as a hook
  // dependency without losing referential equality on every provider re-render.
  const contextValue = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="box-none">
        {toasts.map(toast => {
          const anim = animValues.current.get(toast.id);
          if (!anim) return null;
          return (
            <Animated.View
              key={toast.id}
              style={[
                styles.toast,
                {
                  opacity: anim,
                  transform: [{
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  }],
                },
              ]}
            >
              <Ionicons
                name={TOAST_ICONS[toast.type] as any}
                size={16}
                color={TOAST_COLORS[toast.type]}
              />
              <Text style={styles.toastText}>{toast.text}</Text>
              {toast.action ? (
                <Pressable
                  onPress={toast.action.onPress}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.actionButtonPressed,
                  ]}
                  hitSlop={8}
                >
                  <Text style={styles.actionLabel}>{toast.action.label}</Text>
                </Pressable>
              ) : null}
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
    ...Platform.select({
      web: { pointerEvents: 'none' } as any,
      default: {},
    }),
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      } as any,
    }),
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flexShrink: 1,
  },
  actionButton: {
    marginLeft: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionButtonPressed: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});
