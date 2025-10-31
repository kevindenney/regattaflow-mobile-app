import { Platform } from 'react-native';

export type ShadowLevel = 'xs' | 'sm' | 'md' | 'lg';

const SHADOWS: Record<ShadowLevel, Record<string, unknown>> = {
  xs:
    Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 1,
      },
      web: {
        shadowColor: 'rgba(15, 23, 42, 0.08)',
        shadowOpacity: 0.08,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
      },
    }) ?? {},
  sm:
    Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: 'rgba(15, 23, 42, 0.12)',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
    }) ?? {},
  md:
    Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.16,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
      web: {
        shadowColor: 'rgba(15, 23, 42, 0.16)',
        shadowOpacity: 0.16,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.16,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      },
    }) ?? {},
  lg:
    Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: 'rgba(15, 23, 42, 0.2)',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      default: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
    }) ?? {},
};

export const getShadowStyle = (level: ShadowLevel = 'sm') => ({
  ...SHADOWS[level],
});
