import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'caption';
};

export function ThemedText({ style, lightColor, darkColor, type = 'default', ...otherProps }: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return { fontSize: 24, fontWeight: '600' as const };
      case 'subtitle':
        return { fontSize: 18, fontWeight: '500' as const };
      case 'caption':
        return { fontSize: 12, fontWeight: '400' as const };
      default:
        return { fontSize: 16, fontWeight: '400' as const };
    }
  };

  return <Text style={[{ color }, getTextStyle(), style]} {...otherProps} />;
}