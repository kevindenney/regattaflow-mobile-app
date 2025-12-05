/**
 * PowerboatSVG Component
 * React Native version ported from BetterAt Sail Racing
 * 
 * Race Committee (RC) boat with:
 * - Detailed hull shape
 * - Cabin structure
 * - Flag staff with orange flag
 * - Optional course information board
 */

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { G, Path, Rect, Line, Text as SvgText } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

interface PowerboatSVGProps {
  /** Rotation angle in degrees */
  rotation?: number;
  /** Orange flag state */
  orangeFlagState?: 'UP' | 'DOWN';
  /** Whether to show the course information board */
  hideInfoBoard?: boolean;
  /** Scale factor */
  scale?: number;
  /** Course info to display on the board */
  courseInfo?: {
    type?: string;
    direction?: string;
    distance?: string;
  };
}

export function PowerboatSVG({
  rotation = 0,
  orangeFlagState = 'DOWN',
  hideInfoBoard = false,
  scale = 1,
  courseInfo = {
    type: 'W/L 2',
    direction: '360°',
    distance: '1.0 NM',
  },
}: PowerboatSVGProps) {
  // Flag opacity animation
  const flagOpacity = useSharedValue(orangeFlagState === 'UP' ? 1 : 0);
  // Flag wave animation (slight rotation)
  const flagWave = useSharedValue(0);
  
  useEffect(() => {
    flagOpacity.value = withTiming(orangeFlagState === 'UP' ? 1 : 0, { duration: 500 });
    
    // Start wave animation when flag is up
    if (orangeFlagState === 'UP') {
      flagWave.value = withRepeat(
        withSequence(
          withTiming(3, { duration: 400, easing: Easing.inOut(Easing.sin) }),
          withTiming(-3, { duration: 400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, // Repeat indefinitely
        true // Reverse
      );
    } else {
      flagWave.value = withTiming(0, { duration: 300 });
    }
  }, [orangeFlagState]);

  const flagProps = useAnimatedProps(() => ({
    opacity: flagOpacity.value,
    transform: [{ rotate: `${flagWave.value}deg` }],
  }));

  // The boat pivots around its center (approximately 25px, 40px in the original)
  const transformOrigin = { x: 25, y: 40 };
  
  return (
    <G
      transform={`rotate(${rotation}, ${transformOrigin.x}, ${transformOrigin.y}) scale(${scale})`}
    >
      {/* Course Information Board - conditionally rendered */}
      {!hideInfoBoard && (
        <G>
          <Rect 
            x="-50" 
            y="20" 
            width="45" 
            height="35" 
            rx="2" 
            fill="white" 
            stroke="#4A5568" 
            strokeWidth="1" 
          />
          <SvgText 
            x="-27.5" 
            y="32" 
            textAnchor="middle" 
            fontSize="8" 
            fontWeight="bold" 
            fill="#000"
          >
            {courseInfo.type}
          </SvgText>
          <SvgText 
            x="-27.5" 
            y="43" 
            textAnchor="middle" 
            fontSize="8" 
            fontWeight="bold" 
            fill="#000"
          >
            {courseInfo.direction}
          </SvgText>
          <SvgText 
            x="-27.5" 
            y="54" 
            textAnchor="middle" 
            fontSize="8" 
            fontWeight="bold" 
            fill="#000"
          >
            {courseInfo.distance}
          </SvgText>
        </G>
      )}

      {/* Hull - realistic powerboat shape */}
      <Path
        d="M 25,0 C 10,15 10,60 20,80 L 30,80 C 40,60 40,15 25,0 Z"
        fill="#A9A9A9"
        stroke="#696969"
        strokeWidth="1.5"
      />

      {/* Cabin */}
      <Rect 
        x="18" 
        y="40" 
        width="14" 
        height="15" 
        rx="3" 
        fill="#D3D3D3" 
        stroke="#808080" 
        strokeWidth="1" 
      />
      
      {/* RC Label */}
      <SvgText 
        x="25" 
        y="30" 
        textAnchor="middle" 
        fontSize="12" 
        fontWeight="bold" 
        fill="#000"
      >
        RC
      </SvgText>

      {/* Flag Staff at Bow */}
      <Line 
        x1="25" 
        y1="5" 
        x2="25" 
        y2="25" 
        stroke="#4A5568" 
        strokeWidth="1.5" 
      />

      {/* Orange Flag on Staff - with waving animation */}
      {Platform.OS === 'web' ? (
        <G style={{ 
          transformOrigin: '26px 9px',
          transition: 'opacity 0.5s ease-out',
          opacity: orangeFlagState === 'UP' ? 1 : 0,
        } as any}>
          {/* Waving flag shape (wavy path instead of rectangle) */}
          <Path
            d="M 26,5 Q 30,6 34,5 Q 38,4 38,9 Q 38,14 34,13 Q 30,12 26,13 Z"
            fill="orange"
            stroke="black"
            strokeWidth="0.8"
          />
        </G>
      ) : (
        <AnimatedG animatedProps={flagProps}>
          {/* Waving flag shape */}
          <Path
            d="M 26,5 Q 30,6 34,5 Q 38,4 38,9 Q 38,14 34,13 Q 30,12 26,13 Z"
            fill="orange"
            stroke="black"
            strokeWidth="0.8"
          />
        </AnimatedG>
      )}
    </G>
  );
}

export default PowerboatSVG;

