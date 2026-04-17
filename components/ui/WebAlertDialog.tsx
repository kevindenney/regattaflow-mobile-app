/**
 * WebAlertDialog — Custom styled dialog for web platform
 *
 * Replaces browser-native window.alert/confirm/prompt with a polished in-app dialog.
 * Uses a global event emitter so imperative code (crossPlatformAlert) can trigger it.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';

// ── Types ──────────────────────────────────────────────────────────────────────

interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface DialogRequest {
  title: string;
  message?: string;
  buttons: DialogButton[];
  /** For prompt dialogs */
  prompt?: { defaultValue?: string; onSubmit: (value: string | null) => void };
}

type DialogListener = (req: DialogRequest) => void;

// ── Global emitter (singleton) ─────────────────────────────────────────────────

const listeners = new Set<DialogListener>();

export function emitDialog(req: DialogRequest) {
  if (listeners.size === 0) {
    // Fallback if provider not mounted yet
    if (req.prompt) {
      const result = window.prompt(
        req.message ? `${req.title}\n\n${req.message}` : req.title,
        req.prompt.defaultValue
      );
      req.prompt.onSubmit(result);
    } else if (req.buttons.length > 1) {
      const confirmed = window.confirm(
        req.message ? `${req.title}\n\n${req.message}` : req.title
      );
      const btn = confirmed
        ? req.buttons.find((b) => b.style !== 'cancel')
        : req.buttons.find((b) => b.style === 'cancel');
      btn?.onPress?.();
    } else {
      window.alert(req.message ? `${req.title}\n\n${req.message}` : req.title);
      req.buttons[0]?.onPress?.();
    }
    return;
  }
  listeners.forEach((fn) => fn(req));
}

// ── React component ────────────────────────────────────────────────────────────

export function WebAlertProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    const handler: DialogListener = (req) => {
      setDialog(req);
      setPromptValue(req.prompt?.defaultValue ?? '');
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const dismiss = useCallback(() => setDialog(null), []);

  const handleButton = useCallback(
    (btn: DialogButton) => {
      dismiss();
      btn.onPress?.();
    },
    [dismiss]
  );

  const handlePromptSubmit = useCallback(() => {
    dialog?.prompt?.onSubmit(promptValue);
    dismiss();
  }, [dialog, promptValue, dismiss]);

  const handlePromptCancel = useCallback(() => {
    dialog?.prompt?.onSubmit(null);
    dismiss();
  }, [dialog, dismiss]);

  // Escape key dismisses dialog on web
  useEffect(() => {
    if (!dialog || Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const cancelBtn = dialog.buttons.find((b) => b.style === 'cancel');
        if (cancelBtn) handleButton(cancelBtn);
        else if (dialog.prompt) handlePromptCancel();
        else dismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dialog, handleButton, handlePromptCancel, dismiss]);

  // Don't render overlay on native
  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <>
      {children}
      {dialog && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Backdrop */}
          <Pressable
            onPress={() => {
              // Treat backdrop tap like cancel
              const cancelBtn = dialog.buttons.find((b) => b.style === 'cancel');
              if (cancelBtn) handleButton(cancelBtn);
              else if (dialog.prompt) handlePromptCancel();
              else dismiss();
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          />

          {/* Dialog card */}
          <View
            accessibilityRole="alert"
            accessibilityLabel={dialog.title}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              minWidth: 340,
              maxWidth: 420,
              width: '90%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#1a1a1a',
                marginBottom: dialog.message || dialog.prompt ? 8 : 20,
              }}
            >
              {dialog.title}
            </Text>

            {/* Message */}
            {dialog.message ? (
              <Text
                style={{
                  fontSize: 14,
                  color: '#555',
                  lineHeight: 20,
                  marginBottom: dialog.prompt ? 16 : 20,
                }}
              >
                {dialog.message}
              </Text>
            ) : null}

            {/* Prompt input */}
            {dialog.prompt ? (
              <TextInput
                value={promptValue}
                onChangeText={setPromptValue}
                onSubmitEditing={handlePromptSubmit}
                autoFocus
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 14,
                  marginBottom: 20,
                  color: '#1a1a1a',
                }}
              />
            ) : null}

            {/* Buttons */}
            <View
              style={{
                flexDirection: dialog.prompt || dialog.buttons.length <= 2 ? 'row' : 'column',
                justifyContent: dialog.prompt || dialog.buttons.length <= 2 ? 'flex-end' : 'flex-start',
                gap: 10,
              }}
            >
              {dialog.prompt ? (
                <>
                  <DialogBtn
                    text="Cancel"
                    style="cancel"
                    onPress={handlePromptCancel}
                  />
                  <DialogBtn
                    text="OK"
                    style="default"
                    onPress={handlePromptSubmit}
                  />
                </>
              ) : (
                dialog.buttons.map((btn, i) => (
                  <DialogBtn
                    key={i}
                    text={btn.text}
                    style={btn.style}
                    onPress={() => handleButton(btn)}
                    fullWidth={dialog.buttons.length > 2}
                  />
                ))
              )}
            </View>
          </View>
        </View>
      )}
    </>
  );
}

// ── Button sub-component ───────────────────────────────────────────────────────

function DialogBtn({
  text,
  style,
  onPress,
  fullWidth,
}: {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress: () => void;
  fullWidth?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const isCancel = style === 'cancel';
  const isDestructive = style === 'destructive';

  const bgColor = isCancel
    ? hovered ? '#f0f0f0' : 'transparent'
    : isDestructive
      ? hovered ? '#dc2626' : '#ef4444'
      : hovered ? '#2563eb' : '#3b82f6';

  const textColor = isCancel ? '#555' : '#fff';
  const borderColor = isCancel ? '#ddd' : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{
        paddingHorizontal: 18,
        paddingVertical: 9,
        borderRadius: 8,
        backgroundColor: bgColor,
        borderWidth: isCancel ? 1 : 0,
        borderColor,
        minWidth: 72,
        alignItems: fullWidth ? 'flex-start' : 'center',
        ...(fullWidth ? { width: '100%' } : {}),
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: textColor,
        }}
        numberOfLines={fullWidth ? 2 : undefined}
      >
        {text}
      </Text>
    </Pressable>
  );
}
