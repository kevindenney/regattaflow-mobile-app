/**
 * Toast - Lightweight non-blocking notification system
 *
 * Usage:
 *   import { useToast } from '@/components/ui/Toast';
 *   const toast = useToast();
 *   toast.show('Post saved!', 'success');
 */

import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (text: string, type?: ToastType) => void;
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

  const show = useCallback((text: string, type: ToastType = 'success') => {
    const id = nextId++;
    const anim = new Animated.Value(0);
    animValues.current.set(id, anim);

    setToasts(prev => [...prev, { id, text, type }]);

    // Animate in
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();

    // Auto dismiss after 2.5s
    setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
        animValues.current.delete(id);
      });
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View style={[styles.container, { top: insets.top + 8 }]} pointerEvents="none">
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
});
