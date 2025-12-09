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
        boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.08)',
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
        boxShadow: '0px 2px 4px rgba(15, 23, 42, 0.12)',
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
        boxShadow: '0px 4px 6px rgba(15, 23, 42, 0.16)',
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
        boxShadow: '0px 6px 12px rgba(15, 23, 42, 0.2)',
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
