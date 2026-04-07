/**
 * FeatureErrorBoundary
 *
 * Reusable React error boundary that catches errors in its child tree and
 * renders a simple fallback UI with an optional retry action.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { hasError: true, errorMessage };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[FeatureErrorBoundary] Caught error:', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { fallbackMessage = 'Something went wrong.' } = this.props;

    return (
      <View style={styles.container}>
        <Text style={styles.message}>{fallbackMessage}</Text>
        <Text style={styles.detail}>{this.state.errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={this.handleRetry}>
          <Text style={styles.retryText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    textAlign: 'center',
  },
  detail: {
    fontSize: 13,
    color: '#8e8e93',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#007aff',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default FeatureErrorBoundary;
