import React from 'react';
import { View, Text, ViewProps } from 'react-native';

interface StatCardProps extends ViewProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatCard = React.forwardRef<React.ElementRef<typeof View>, StatCardProps>(
  ({ label, value, variant = 'default', size = 'md', className = '', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-background-50',
      primary: 'bg-primary-50',
      success: 'bg-success-50',
      warning: 'bg-warning-50',
      error: 'bg-error-50',
    };

    const textVariantStyles = {
      default: 'text-typography-900',
      primary: 'text-primary-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
      error: 'text-error-600',
    };

    const sizeStyles = {
      sm: { container: 'p-3', value: 'text-lg', label: 'text-xs' },
      md: { container: 'p-4', value: 'text-2xl', label: 'text-sm' },
      lg: { container: 'p-5', value: 'text-3xl', label: 'text-base' },
    };

    return (
      <View
        ref={ref}
        className={`rounded-xl items-center ${variantStyles[variant]} ${sizeStyles[size].container} ${className}`}
        {...props}
      >
        <Text className={`font-bold ${textVariantStyles[variant]} ${sizeStyles[size].value}`}>
          {value}
        </Text>
        <Text className={`text-typography-500 ${sizeStyles[size].label} mt-1`}>
          {label}
        </Text>
      </View>
    );
  }
);

StatCard.displayName = 'StatCard';
