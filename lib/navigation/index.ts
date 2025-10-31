/**
 * Type-safe navigation helpers for Expo Router
 *
 * @example
 * import { navigateTo } from '@/lib/navigation';
 *
 * navigateTo(router, '/(auth)/login');
 * navigateTo(router, '/boat/[id]', { id: '123' });
 */

export {
  navigateTo,
  buildHref,
  isDynamicRoute,
  type AppRoute,
  type StaticRoute,
  type DynamicRoute,
  type RouteParams,
} from './routes';
