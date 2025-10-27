import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle, WifiOff, ServerCrash } from 'lucide-react-native';
import { Button, ButtonText } from '../button';

interface ErrorMessageProps {
  title?: string;
  message?: string;
  type?: 'general' | 'network' | 'server';
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message = 'Please try again',
  type = 'general',
  onRetry,
  retryText = 'Try Again'
}) => {
  const iconMap = {
    general: <AlertTriangle color="#EF4444" size={48} />,
    network: <WifiOff color="#EF4444" size={48} />,
    server: <ServerCrash color="#EF4444" size={48} />
  };

  return (
    <View className="items-center justify-center py-8 px-6">
      {iconMap[type]}
      <Text className="text-typography-900 text-lg font-bold mt-4 text-center">
        {title}
      </Text>
      <Text className="text-typography-600 text-center mt-2">
        {message}
      </Text>
      {onRetry && (
        <Button
          action="primary"
          variant="solid"
          size="md"
          className="mt-6"
          onPress={onRetry}
        >
          <ButtonText>{retryText}</ButtonText>
        </Button>
      )}
    </View>
  );
};
