import React, { useEffect } from 'react';
import { config } from './config';
import { View, ViewProps } from 'react-native';
import { OverlayProvider } from '@gluestack-ui/overlay';
import { ToastProvider } from '@gluestack-ui/toast';
import { useColorScheme } from 'nativewind';
import { ModeType } from './types';

export function GluestackUIProvider({
  mode = 'light',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const resolvedScheme = (
    mode === 'system' ? colorScheme ?? 'light' : mode
  ) as Exclude<ModeType, 'system'>;

  useEffect(() => {
    if (mode === 'system') return;
    try {
      setColorScheme(mode);
    } catch (error) {
      if (__DEV__) {
        console.warn(
          '[GluestackUIProvider]',
          'Falling back to system color scheme because Tailwind darkMode is not class-based.',
          error
        );
      }
    }
  }, [mode, setColorScheme]);

  return (
    <View
      style={[
        config[resolvedScheme],
        // eslint-disable-next-line react-native/no-inline-styles
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
    >
      <OverlayProvider>
        <ToastProvider>{props.children}</ToastProvider>
      </OverlayProvider>
    </View>
  );
}
