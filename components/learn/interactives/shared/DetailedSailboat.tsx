/**
 * DetailedSailboat Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Full-featured racing sailboat with:
 * - Realistic hull shape with shading
 * - Mainsail and jib with draft curves
 * - Mast and boom
 * - Forestay
 * - Bow wave detail
 * - Optional label
 */

import React from 'react';
import { Platform } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { G, Path, Line, Ellipse, Text as SvgText } from 'react-native-svg';

const AnimatedG = Animated.createAnimatedComponent(G);

interface DetailedSailboatProps {
  /** Unique identifier for the boat */
  id: string;
  /** X position on canvas */
  x?: number;
  /** Y position on canvas */
  y?: number;
  /** Rotation in degrees (0 = pointing right in SVG coordinates) */
  rotation?: number;
  /** Boat hull color */
  hullColor?: string;
  /** Sail color */
  sailColor?: string;
  /** Optional label to display */
  label?: string;
  /** Scale factor (1 = normal size) */
  scale?: number;
  /** Whether to animate position changes */
  animate?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
}

export function DetailedSailboat({
  id,
  x = 0,
  y = 0,
  rotation = 0,
  hullColor = '#1E40AF',
  sailColor = '#FFFFFF',
  label,
  scale = 1,
  animate = true,
  animationDuration = 500,
}: DetailedSailboatProps) {
  // Animation values
  const posX = useSharedValue(x);
  const posY = useSharedValue(y);
  const opacity = useSharedValue(animate ? 0 : 1);

  React.useEffect(() => {
    if (animate) {
      const duration = animationDuration;
      posX.value = withSpring(x, { damping: 20, stiffness: 60 });
      posY.value = withSpring(y, { damping: 20, stiffness: 60 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      posX.value = x;
      posY.value = y;
      opacity.value = 1;
    }
  }, [x, y, animate, animationDuration]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
    ],
  }));

  const boatContent = (
    <G
      transform={`rotate(${rotation}) scale(${scale})`}
      // Transform origin at center
    >
      {/* Hull - more realistic boat shape */}
      <Path
        d="M -45,0 Q -48,10 -40,12 L 35,12 Q 42,10 40,0 Q 42,-8 35,-10 L -40,-10 Q -48,-8 -45,0 Z"
        fill={hullColor}
        stroke="#0F172A"
        strokeWidth="2"
      />

      {/* Hull shading/depth */}
      <Path
        d="M -40,8 L 32,8 Q 38,6 36,0 Q 38,-6 32,-8 L -40,-8 Q -44,-6 -42,0 Q -44,6 -40,8 Z"
        fill="#000000"
        opacity={0.15}
      />

      {/* Deck */}
      <Ellipse
        cx="-5"
        cy="0"
        rx="32"
        ry="8"
        fill={hullColor}
        opacity={0.6}
      />

      {/* Cockpit detail */}
      <Ellipse
        cx="15"
        cy="0"
        rx="12"
        ry="5"
        fill="#1e293b"
        opacity={0.3}
      />

      {/* Mast */}
      <Line
        x1="-5"
        y1="0"
        x2="-5"
        y2="-55"
        stroke="#475569"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Boom */}
      <Line
        x1="-5"
        y1="-5"
        x2="30"
        y2="-8"
        stroke="#64748b"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Mainsail - more realistic curved shape */}
      <Path
        d="M -5,-55 Q 20,-35 30,-8 L -5,-5 Z"
        fill={sailColor}
        stroke="#0F172A"
        strokeWidth="1.5"
      />

      {/* Mainsail curve/draft */}
      <Path
        d="M -5,-55 Q 15,-38 25,-15"
        stroke="#cbd5e1"
        strokeWidth="1"
        fill="none"
        opacity={0.6}
      />

      {/* Jib (front sail) - more realistic */}
      <Path
        d="M -5,-48 Q -25,-28 -30,-5 L -5,-3 Z"
        fill={sailColor}
        stroke="#0F172A"
        strokeWidth="1.5"
        opacity={0.95}
      />

      {/* Jib curve/draft */}
      <Path
        d="M -5,-48 Q -20,-30 -25,-12"
        stroke="#cbd5e1"
        strokeWidth="1"
        fill="none"
        opacity={0.5}
      />

      {/* Sail shading on mainsail */}
      <Path
        d="M -5,-55 Q 18,-37 28,-10 L 22,-15 Q 12,-42 -5,-53 Z"
        fill="#000000"
        opacity={0.08}
      />

      {/* Forestay (wire from bow to mast) */}
      <Line
        x1="-40"
        y1="-2"
        x2="-5"
        y2="-48"
        stroke="#94a3b8"
        strokeWidth="0.8"
        opacity={0.7}
        strokeDasharray="2,2"
      />

      {/* Bow wave */}
      <Path
        d="M -45,0 Q -50,5 -48,8"
        stroke="#ffffff"
        strokeWidth="1.5"
        fill="none"
        opacity={0.6}
        strokeLinecap="round"
      />

      {/* Label */}
      {label && (
        <SvgText
          x="0"
          y="28"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="#0F172A"
          stroke="#FFFFFF"
          strokeWidth="4"
        >
          {label}
        </SvgText>
      )}
    </G>
  );

  // On web, use regular G with inline styles
  // On native, use AnimatedG with animatedProps
  if (Platform.OS === 'web') {
    return (
      <G
        style={{
          transform: `translate(${x}px, ${y}px)`,
          opacity: 1,
          transition: animate ? 'transform 0.5s ease-out' : 'none',
        } as any}
      >
        {boatContent}
      </G>
    );
  }

  return (
    <AnimatedG animatedProps={animatedProps}>
      {boatContent}
    </AnimatedG>
  );
}

export default DetailedSailboat;

