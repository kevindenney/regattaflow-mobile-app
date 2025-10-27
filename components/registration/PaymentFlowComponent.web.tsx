import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface PaymentFlowProps {
  entryId: string;
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PaymentFlowComponent({ onSuccess, onCancel }: PaymentFlowProps) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
        Payment on Web
      </Text>
      <Text style={{ color: '#374151', marginBottom: 16 }}>
        Mobile Stripe SDK is not available on web. Please use the mobile app or
        contact the organizer to complete payment.
      </Text>
      <Pressable
        onPress={onSuccess}
        style={{ backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '600' }}>Continue</Text>
      </Pressable>
      {onCancel && (
        <Pressable onPress={onCancel} style={{ padding: 12, alignItems: 'center' }}>
          <Text>Cancel</Text>
        </Pressable>
      )}
    </View>
  );
}


