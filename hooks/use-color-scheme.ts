import { useColorScheme as useRNColorScheme } from 'react-native';
import { useEffect, useRef } from 'react';

export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const changeCount = useRef(0);
  const previousScheme = useRef(colorScheme);

  useEffect(() => {
    if (previousScheme.current !== colorScheme) {
      changeCount.current += 1;
      console.log('🎨 [COLOR_SCHEME DEBUG] ===== THEME CHANGE =====');
      console.log('🎨 [COLOR_SCHEME DEBUG] Change count:', changeCount.current);
      console.log('🎨 [COLOR_SCHEME DEBUG] Previous:', previousScheme.current);
      console.log('🎨 [COLOR_SCHEME DEBUG] Current:', colorScheme);
      console.log('🎨 [COLOR_SCHEME DEBUG] Timestamp:', new Date().toISOString());
      console.log('🎨 [COLOR_SCHEME DEBUG] ==============================');

      if (changeCount.current > 3) {
        console.error('🚨 [COLOR_SCHEME DEBUG] EXCESSIVE THEME CHANGES:', changeCount.current);
      }

      previousScheme.current = colorScheme;
    }
  }, [colorScheme]);

  return colorScheme;
}
