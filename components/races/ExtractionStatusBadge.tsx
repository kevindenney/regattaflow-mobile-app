/**
 * ExtractionStatusBadge Component
 * Visual indicator for document extraction status
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ExtractionStatusBadgeProps {
  status: ExtractionStatus;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export function ExtractionStatusBadge({
  status,
  size = 'medium',
  showText = true,
}: ExtractionStatusBadgeProps) {
  const sizeConfig = {
    small: { icon: 16, text: 10, padding: 4 },
    medium: { icon: 20, text: 12, padding: 6 },
    large: { icon: 24, text: 14, padding: 8 },
  };

  const config = sizeConfig[size];

  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: 'clock-outline',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          text: 'Pending',
        };
      case 'processing':
        return {
          icon: 'loading',
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          text: 'Processing',
        };
      case 'completed':
        return {
          icon: 'check-circle',
          color: '#10B981',
          bgColor: '#D1FAE5',
          text: 'Extracted',
        };
      case 'failed':
        return {
          icon: 'alert-circle',
          color: '#EF4444',
          bgColor: '#FEE2E2',
          text: 'Failed',
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: statusConfig.bgColor, padding: config.padding },
      ]}
    >
      {status === 'processing' ? (
        <ActivityIndicator size="small" color={statusConfig.color} />
      ) : (
        <MaterialCommunityIcons
          name={statusConfig.icon as any}
          size={config.icon}
          color={statusConfig.color}
        />
      )}
      {showText && (
        <Text
          style={[
            styles.text,
            { color: statusConfig.color, fontSize: config.text, marginLeft: 4 },
          ]}
        >
          {statusConfig.text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});
