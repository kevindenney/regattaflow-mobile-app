import React, { ReactNode } from 'react';

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  // On web, Stripe.js should be loaded via script tag in HTML
  // No provider wrapper needed
  return <>{children}</>;
}
