import * as React from 'react';
import Svg, { Circle, Text, Path } from 'react-native-svg';

interface RegattaFlowLogoProps {
  size?: number;
  variant?: 'white' | 'navy' | 'filled';
}

export const RegattaFlowLogo: React.FC<RegattaFlowLogoProps> = ({ 
  size = 100, 
  variant = 'filled' 
}) => {
  const colors = {
    white: { stroke: '#FFFFFF', fill: 'none', text: '#FFFFFF', bg: 'none' },
    navy: { stroke: '#0a1832', fill: 'none', text: '#0a1832', bg: 'none' },
    filled: { stroke: '#FFFFFF', fill: 'none', text: '#FFFFFF', bg: '#0a1832' },
  };

  const { stroke, fill, text, bg } = colors[variant];

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {bg !== 'none' && <Circle cx="50" cy="50" r="48" fill={bg} />}
      <Circle cx="50" cy="50" r="46" stroke={stroke} strokeWidth="2" fill={fill} />
      <Text
        x="50"
        y="58"
        textAnchor="middle"
        fontFamily="Manrope-Bold, System"
        fontSize="38"
        fontWeight="700"
        fill={text}
      >
        R
      </Text>
      <Path
        d="M25 72 Q35 68 45 72 Q55 76 65 72 Q72 69 78 72"
        stroke={stroke}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export default RegattaFlowLogo;
