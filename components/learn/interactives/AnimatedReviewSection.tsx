/**
 * Animated Review Section for Right-of-Way Rules
 *
 * Cycles through three scenarios (Port/Starboard, Windward/Leeward, Overtaking)
 * with animated boats and highlighted rule boxes.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolate,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { G, Rect, Text as SvgText, Path, Circle, Line, Defs, Marker, Polygon } from 'react-native-svg';
import { TopDownSailboatSVG } from './shared';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Scenario definitions
interface ScenarioConfig {
  id: 'port-starboard' | 'windward-leeward' | 'overtaking';
  ruleIndex: number; // 0, 1, or 2 for which rule box to highlight
  boat1: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    giveWayEndX: number;
    giveWayEndY: number;
    rotation: number;
    color: string;
    label: string;
    isGiveWay: boolean;
  };
  boat2: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    rotation: number;
    color: string;
    label: string;
    isGiveWay: boolean;
  };
}

const SCENARIOS: ScenarioConfig[] = [
  // Scenario 1: Port/Starboard
  {
    id: 'port-starboard',
    ruleIndex: 0,
    boat1: {
      startX: 200,
      startY: 320,
      endX: 400,
      endY: 200,
      giveWayEndX: 280,
      giveWayEndY: 330,
      rotation: 45,
      color: '#EF4444', // Red for Port
      label: 'Port',
      isGiveWay: true,
    },
    boat2: {
      startX: 550,
      startY: 320,
      endX: 350,
      endY: 200,
      rotation: 315,
      color: '#10B981', // Green for Starboard
      label: 'Starboard',
      isGiveWay: false,
    },
  },
  // Scenario 2: Windward/Leeward
  {
    id: 'windward-leeward',
    ruleIndex: 1,
    boat1: {
      startX: 450,
      startY: 350,
      endX: 500,
      endY: 150,
      giveWayEndX: 550,
      giveWayEndY: 200,
      rotation: 25,
      color: '#EF4444', // Red for Windward (give way)
      label: 'Windward',
      isGiveWay: true,
    },
    boat2: {
      startX: 350,
      startY: 380,
      endX: 400,
      endY: 180,
      rotation: 25,
      color: '#10B981', // Green for Leeward
      label: 'Leeward',
      isGiveWay: false,
    },
  },
  // Scenario 3: Overtaking
  {
    id: 'overtaking',
    ruleIndex: 2,
    boat1: {
      startX: 400,
      startY: 400,
      endX: 400,
      endY: 150,
      giveWayEndX: 300,
      giveWayEndY: 200,
      rotation: 0,
      color: '#EF4444', // Red for Overtaking (give way)
      label: 'Overtaking',
      isGiveWay: true,
    },
    boat2: {
      startX: 400,
      startY: 280,
      endX: 400,
      endY: 150,
      rotation: 0,
      color: '#10B981', // Green for Clear Ahead
      label: 'Clear Ahead',
      isGiveWay: false,
    },
  },
];

const RULE_BOXES = [
  {
    title: 'Rule 1: Port/Starboard',
    text: ['Opposite tacks:', 'Port gives way'],
    color: '#3B82F6',
    position: { x: 150, y: 420 },
  },
  {
    title: 'Rule 2: Windward/Leeward',
    text: ['Same tack:', 'Windward gives way'],
    color: '#10B981',
    position: { x: 400, y: 420 },
  },
  {
    title: 'Rule 3: Overtaking',
    text: ['Overtaking boat', 'keeps clear'],
    color: '#F59E0B',
    position: { x: 650, y: 420 },
  },
];

const SCENARIO_DURATION = 4000; // 4 seconds per scenario
const PAUSE_DURATION = 1500; // 1.5 second pause between scenarios
const GIVE_WAY_START = 0.5; // Start give-way at 50% through animation

interface AnimatedReviewSectionProps {
  width?: number;
  height?: number;
}

export function AnimatedReviewSection({ width = 800, height = 520 }: AnimatedReviewSectionProps) {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0);
  const [phase, setPhase] = useState<'approaching' | 'give-way' | 'paused'>('approaching');
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Animation progress (0 to 1)
  const progress = useSharedValue(0);
  const ruleBoxGlow = useSharedValue(0);
  const boat1Bob = useSharedValue(0);
  const boat2Bob = useSharedValue(0);

  const scenario = SCENARIOS[activeScenarioIndex];

  // Update scenario state safely
  const updateScenario = useCallback((nextIndex: number) => {
    if (isMounted.current) {
      setActiveScenarioIndex(nextIndex);
      setPhase('approaching');
    }
  }, []);

  // Animation cycle
  useEffect(() => {
    isMounted.current = true;

    // Start bobbing animations
    boat1Bob.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(-2, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    boat2Bob.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Rule box glow pulsing
    ruleBoxGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    return () => {
      isMounted.current = false;
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      cancelAnimation(boat1Bob);
      cancelAnimation(boat2Bob);
      cancelAnimation(ruleBoxGlow);
      cancelAnimation(progress);
    };
  }, []);

  // Run animation cycle
  useEffect(() => {
    const runCycle = () => {
      if (!isMounted.current) return;

      // Reset progress
      progress.value = 0;
      setPhase('approaching');

      // Animate progress from 0 to 1
      progress.value = withTiming(1, {
        duration: SCENARIO_DURATION,
        easing: Easing.linear,
      });

      // After approaching phase, switch to give-way
      animationRef.current = setTimeout(() => {
        if (!isMounted.current) return;
        setPhase('give-way');

        // After give-way, pause and move to next scenario
        animationRef.current = setTimeout(() => {
          if (!isMounted.current) return;
          setPhase('paused');

          // Move to next scenario
          animationRef.current = setTimeout(() => {
            if (!isMounted.current) return;
            const nextIndex = (activeScenarioIndex + 1) % SCENARIOS.length;
            updateScenario(nextIndex);
          }, PAUSE_DURATION);
        }, SCENARIO_DURATION * 0.5);
      }, SCENARIO_DURATION * GIVE_WAY_START);
    };

    runCycle();

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [activeScenarioIndex, updateScenario]);

  // Boat 1 animated props (give-way boat)
  const boat1Props = useAnimatedProps(() => {
    const { boat1 } = scenario;
    const t = progress.value;

    let x: number;
    let y: number;
    let rotation = boat1.rotation;

    if (t < GIVE_WAY_START) {
      // Approaching phase - linear movement toward intersection
      const approachT = t / GIVE_WAY_START;
      x = interpolate(approachT, [0, 1], [boat1.startX, (boat1.startX + boat1.endX) / 2], Extrapolate.CLAMP);
      y = interpolate(approachT, [0, 1], [boat1.startY, (boat1.startY + boat1.endY) / 2], Extrapolate.CLAMP);
    } else {
      // Give-way phase - curve away
      const giveWayT = (t - GIVE_WAY_START) / (1 - GIVE_WAY_START);
      const midX = (boat1.startX + boat1.endX) / 2;
      const midY = (boat1.startY + boat1.endY) / 2;

      // Quadratic bezier for smooth give-way
      const oneMinusT = 1 - giveWayT;
      const ctrlX = midX + (boat1.giveWayEndX - midX) * 0.5 - 30;
      const ctrlY = midY + (boat1.giveWayEndY - midY) * 0.3;

      x = oneMinusT * oneMinusT * midX + 2 * oneMinusT * giveWayT * ctrlX + giveWayT * giveWayT * boat1.giveWayEndX;
      y = oneMinusT * oneMinusT * midY + 2 * oneMinusT * giveWayT * ctrlY + giveWayT * giveWayT * boat1.giveWayEndY;

      // Adjust rotation during give-way
      if (scenario.id === 'port-starboard') {
        rotation = interpolate(giveWayT, [0, 1], [45, 90], Extrapolate.CLAMP); // Bear away
      } else if (scenario.id === 'windward-leeward') {
        rotation = interpolate(giveWayT, [0, 1], [25, 60], Extrapolate.CLAMP); // Head up
      } else if (scenario.id === 'overtaking') {
        rotation = interpolate(giveWayT, [0, 1], [0, -30], Extrapolate.CLAMP); // Turn to leeward
      }
    }

    return {
      transform: `translate(${x}, ${y}) rotate(${rotation + boat1Bob.value}, 25, 40)`,
    };
  });

  // Boat 2 animated props (stand-on boat)
  const boat2Props = useAnimatedProps(() => {
    const { boat2 } = scenario;
    const t = progress.value;

    // Stand-on boat maintains course throughout
    const x = interpolate(t, [0, 1], [boat2.startX, boat2.endX], Extrapolate.CLAMP);
    const y = interpolate(t, [0, 1], [boat2.startY, boat2.endY], Extrapolate.CLAMP);

    return {
      transform: `translate(${x}, ${y}) rotate(${boat2.rotation + boat2Bob.value}, 25, 40)`,
    };
  });

  // Rule box highlight props
  const createRuleBoxProps = (index: number) => {
    return useAnimatedProps(() => {
      const isActive = index === scenario.ruleIndex;
      const glowIntensity = isActive ? interpolate(ruleBoxGlow.value, [0.5, 1], [4, 8], Extrapolate.CLAMP) : 0;
      const scale = isActive ? 1.05 : 1;

      return {
        opacity: isActive ? 1 : 0.4,
        transform: `scale(${scale})`,
      };
    });
  };

  const ruleBox0Props = createRuleBoxProps(0);
  const ruleBox1Props = createRuleBoxProps(1);
  const ruleBox2Props = createRuleBoxProps(2);
  const ruleBoxPropsArray = [ruleBox0Props, ruleBox1Props, ruleBox2Props];

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background gradient */}
        <Defs>
          <Marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <Polygon points="0 0, 10 3.5, 0 7" fill="#1E3A5F" />
          </Marker>
        </Defs>

        {/* Water background */}
        <Rect x="0" y="0" width={width} height={height - 100} rx="12" fill="#B8D4E8" />

        {/* Wind indicator */}
        <G transform="translate(400, 50)">
          <SvgText x="0" y="-20" textAnchor="middle" fontSize="14" fontWeight="600" fill="#1E3A5F">
            wind
          </SvgText>
          <Line x1="0" y1="0" x2="0" y2="40" stroke="#1E3A5F" strokeWidth="2" markerEnd="url(#arrowhead)" />
        </G>

        {/* Boats */}
        <AnimatedG animatedProps={boat1Props}>
          <TopDownSailboatSVG
            rotation={scenario.boat1.rotation}
            color={scenario.boat1.color}
            size={50}
          />
          {/* Label */}
          <G transform="translate(25, -25)">
            <Rect x="-35" y="-12" width="70" height="22" rx="4" fill="white" stroke={scenario.boat1.color} strokeWidth="1.5" />
            <SvgText x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="600" fill={scenario.boat1.color}>
              {scenario.boat1.label}
            </SvgText>
          </G>
        </AnimatedG>

        <AnimatedG animatedProps={boat2Props}>
          <TopDownSailboatSVG
            rotation={scenario.boat2.rotation}
            color={scenario.boat2.color}
            size={50}
          />
          {/* Label */}
          <G transform="translate(25, -25)">
            <Rect x="-40" y="-12" width="80" height="22" rx="4" fill="white" stroke={scenario.boat2.color} strokeWidth="1.5" />
            <SvgText x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="600" fill={scenario.boat2.color}>
              {scenario.boat2.label}
            </SvgText>
          </G>
        </AnimatedG>

        {/* Give Way / Stand On badges */}
        {phase === 'give-way' && (
          <>
            {/* Give Way badge for boat1 */}
            <G transform={`translate(${scenario.boat1.giveWayEndX - 30}, ${scenario.boat1.giveWayEndY + 60})`}>
              <Rect x="-40" y="-14" width="80" height="28" rx="6" fill="#EF4444" />
              <SvgText x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                GIVE WAY
              </SvgText>
            </G>

            {/* Stand On badge for boat2 */}
            <G transform={`translate(${scenario.boat2.endX + 30}, ${scenario.boat2.endY + 60})`}>
              <Rect x="-40" y="-14" width="80" height="28" rx="6" fill="#10B981" />
              <SvgText x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fill="white">
                STAND ON
              </SvgText>
            </G>
          </>
        )}

        {/* Rule summary text */}
        <SvgText x={width / 2} y={height - 80} textAnchor="middle" fontSize="16" fontWeight="600" fill="#1E293B">
          Master these three rules and you master right-of-way
        </SvgText>

        {/* Rule boxes at bottom */}
        {RULE_BOXES.map((rule, idx) => {
          const isActive = idx === scenario.ruleIndex;
          return (
            <G key={rule.title} transform={`translate(${rule.position.x}, ${rule.position.y})`}>
              {/* Glow effect for active rule */}
              {isActive && (
                <Rect
                  x="-90"
                  y="-35"
                  width="180"
                  height="70"
                  rx="10"
                  fill="none"
                  stroke={rule.color}
                  strokeWidth="3"
                  opacity={0.6}
                />
              )}
              {/* Rule box background */}
              <Rect
                x="-85"
                y="-30"
                width="170"
                height="60"
                rx="8"
                fill={isActive ? 'white' : '#F1F5F9'}
                stroke={rule.color}
                strokeWidth={isActive ? 3 : 1.5}
                opacity={isActive ? 1 : 0.5}
              />
              {/* Rule title */}
              <SvgText
                x="0"
                y="-10"
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={rule.color}
                opacity={isActive ? 1 : 0.6}
              >
                {rule.title}
              </SvgText>
              {/* Rule text line 1 */}
              <SvgText
                x="0"
                y="8"
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#1E293B"
                opacity={isActive ? 1 : 0.5}
              >
                {rule.text[0]}
              </SvgText>
              {/* Rule text line 2 */}
              <SvgText
                x="0"
                y="22"
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#1E293B"
                opacity={isActive ? 1 : 0.5}
              >
                {rule.text[1]}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedReviewSection;
