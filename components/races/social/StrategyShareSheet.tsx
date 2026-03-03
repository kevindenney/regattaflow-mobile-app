import React, { useMemo, useState } from 'react';
import { Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

interface StrategyShareSheetProps {
  visible: boolean;
  raceName?: string;
  strategyText?: string;
  onClose: () => void;
}

export function StrategyShareSheet({
  visible,
  raceName,
  strategyText,
  onClose,
}: StrategyShareSheetProps) {
  const [recipient, setRecipient] = useState('');
  const [privateShare, setPrivateShare] = useState(true);

  const digest = useMemo(() => {
    const header = raceName ? `Strategy Digest: ${raceName}` : 'Strategy Digest';
    const body = strategyText?.trim() || 'No strategy notes provided yet.';
    const privacy = privateShare ? 'Privacy: Crew only' : 'Privacy: Fleet-visible';
    return `${header}\n\n${body}\n\n${privacy}`;
  }, [raceName, strategyText, privateShare]);

  const handleShare = async () => {
    await Share.share({
      title: raceName ? `${raceName} Strategy` : 'Race Strategy',
      message: recipient ? `${digest}\n\nShared with: ${recipient}` : digest,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Share Strategy</Text>
          <Text style={styles.subtitle}>Send a digest to crew or fleet.</Text>

          <TextInput
            value={recipient}
            onChangeText={setRecipient}
            placeholder="Email or contact (optional)"
            style={styles.input}
            autoCapitalize="none"
          />

          <Pressable style={styles.privacyRow} onPress={() => setPrivateShare((prev) => !prev)}>
            <Text style={styles.privacyLabel}>Private share</Text>
            <Text style={styles.privacyValue}>{privateShare ? 'On' : 'Off'}</Text>
          </Pressable>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.secondary]} onPress={onClose}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.primary]} onPress={handleShare}>
              <Text style={styles.primaryText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  privacyRow: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  privacyValue: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: '#E2E8F0',
  },
  primary: {
    backgroundColor: '#2563EB',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
