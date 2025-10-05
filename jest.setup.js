// Load environment variables from .env file
require('dotenv').config();

// Set up test environment variables
process.env.EXPO_PUBLIC_SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'test-anthropic-key';

// Mock Expo modules
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 22.2793,
        longitude: 114.1628,
        accuracy: 10,
      },
    })
  ),
  watchPositionAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  usePathname: () => '/',
}));

// Extend expect with custom matchers
expect.extend({
  toBeOneOf(received, array) {
    const pass = array.includes(received);
    return {
      pass,
      message: () => `expected ${received} to be one of ${array.join(', ')}`,
    };
  },
});

// Suppress console errors during tests (optional)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
