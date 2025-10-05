// Mock for @stripe/stripe-react-native on web platform
// This prevents bundling errors and provides stub implementations

export const StripeProvider = ({ children }: { children: React.ReactNode }) => children;

export const initPaymentSheet = async () => ({
  error: { message: 'Not supported on web', code: 'Unsupported' },
});

export const presentPaymentSheet = async () => ({
  error: { message: 'Not supported on web', code: 'Unsupported' },
});

export const initStripe = async () => {
  console.warn('Stripe React Native is not supported on web');
};

// Export empty implementations for any other functions
export default {
  StripeProvider,
  initPaymentSheet,
  presentPaymentSheet,
  initStripe,
};
