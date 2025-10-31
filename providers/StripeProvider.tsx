import React, { ReactNode } from 'react';
import StripeProviderNative from './StripeProvider.native';
import StripeProviderWeb from './StripeProvider.web';
import { Platform } from 'react-native';

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  if (Platform.OS === 'web') {
    return <StripeProviderWeb>{children}</StripeProviderWeb>;
  }

  return <StripeProviderNative>{children}</StripeProviderNative>;
}
