import React from 'react';
import { View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Button, ButtonText, ButtonIcon } from '../button';

type EmptyStateVariant = 'zero' | 'no-results' | 'error';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'zero',
  icon: Icon,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  // Variant-specific styling
  const iconColor = variant === 'error'
    ? 'rgb(239, 68, 68)' // red-500
    : 'rgb(107, 114, 128)'; // gray-500

  const titleColor = variant === 'error'
    ? 'text-error-500'
    : 'text-typography-900';

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Icon color={iconColor} size={64} />
      <Text className={`text-lg font-bold ${titleColor} mt-6 text-center`}>
        {title}
      </Text>
      <Text className="text-typography-500 text-center mt-2 mb-6">
        {message}
      </Text>

      {actionLabel && onAction && (
        <Button
          action={variant === 'error' ? 'negative' : 'primary'}
          variant="solid"
          size="md"
          className="w-full max-w-xs"
          onPress={onAction}
          accessibilityLabel={actionLabel}
        >
          <ButtonText>{actionLabel}</ButtonText>
        </Button>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <Button
          action="default"
          variant="outline"
          size="md"
          className="w-full max-w-xs mt-3"
          onPress={onSecondaryAction}
          accessibilityLabel={secondaryActionLabel}
        >
          <ButtonText>{secondaryActionLabel}</ButtonText>
        </Button>
      )}
    </View>
  );
};
