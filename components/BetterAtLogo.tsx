import * as React from 'react';
import Svg, { Circle, Text, Rect } from 'react-native-svg';

interface BetterAtLogoProps {
  size?: number;
  variant?: 'white' | 'dark' | 'filled';
}

export const BetterAtLogo: React.FC<BetterAtLogoProps> = ({
  size = 100,
  variant = 'filled',
}) => {
  const colors = {
    white: { stroke: '#FFFFFF', text: '#FFFFFF', bg: 'none' },
    dark: { stroke: '#1A1A1A', text: '#1A1A1A', bg: 'none' },
    filled: { stroke: '#FFFFFF', text: '#FFFFFF', bg: '#0a1832' },
  };

  const { stroke, text, bg } = colors[variant];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {bg !== 'none' && <Circle cx="50" cy="50" r="48" fill={bg} />}
      <Circle cx="50" cy="50" r="46" stroke={stroke} strokeWidth="2" fill="none" />
      <Text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="Manrope_700Bold, System"
        fontSize="42"
        fontWeight="700"
        fill={text}
      >
        b
      </Text>
      <Rect x="30" y="66" width="40" height="3" rx="1.5" fill={text} />
    </Svg>
  );
};

export default BetterAtLogo;
