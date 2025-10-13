import React, { Component, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Button, ButtonText } from '../button';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Ignore font loading timeout errors (non-critical)
    if (error.message && error.message.includes('timeout exceeded')) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Ignore font loading timeout errors (non-critical)
    if (error.message && error.message.includes('timeout exceeded')) {
      return;
    }
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetError);
      }

      return (
        <View className="flex-1 bg-background-0 items-center justify-center px-6">
          <AlertTriangle color="#EF4444" size={64} />
          <Text className="text-typography-900 text-xl font-bold mt-6 text-center">
            Something went wrong
          </Text>
          <Text className="text-typography-600 text-center mt-3">
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Button
            action="primary"
            variant="solid"
            size="md"
            className="mt-8"
            onPress={this.resetError}
          >
            <ButtonText>Try Again</ButtonText>
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}
