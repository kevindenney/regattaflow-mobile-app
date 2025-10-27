import React, { ReactNode } from 'react';
import { StripeProvider as StripeReactNativeProvider } from '@stripe/stripe-react-native';

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.warn('Stripe publishable key not found. Payment features will be disabled.');
    return <>{children}</>;
  }

  return (
    <StripeReactNativeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.regattaflow" // For Apple Pay
      urlScheme="regattaflow" // For redirects
    >
      {children}
    </StripeReactNativeProvider>
  );
}
