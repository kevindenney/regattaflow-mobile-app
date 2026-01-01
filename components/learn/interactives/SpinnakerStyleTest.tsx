/**
 * Spinnaker Style Test Component
 * Shows different spinnaker design options for downwind sailing boats
 * The spinnaker is rendered FIRST so the boat hull overlaps it correctly
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { G, Circle, Line, Path, Ellipse, Polygon, Rect } from 'react-native-svg';
import { TopDownSailboatSVG } from './shared';

const BOAT_COLOR = '#3B82F6';
const SPINNAKER_COLOR = '#3B82F6';

// The boat SVG has:
// - Local center at (25, 40)
// - Local bow at (25, 0)
// - Gets scaled by 0.5 and rotated
// - After translate(20, 30) in the SVG

// For a boat heading at 160° (roughly south-southeast, downwind from north):
// - Bow should point toward heading direction
// - Spinnaker should be ahead of bow (in the direction of travel)

interface SpinnakerProps {
  heading: number; // degrees, 0=north, 90=east, etc.
}

/**
 * Renders a boat with spinnaker. The spinnaker is drawn BEHIND the boat
 * so the hull properly overlaps it.
 */
function BoatWithSpinnaker({
  heading,
  spinnaker
}: {
  heading: number;
  spinnaker: React.ReactNode;
}) {
  return (
    <G>
      {/* Spinnaker first (behind boat) */}
      {spinnaker}
      {/* Boat on top */}
      <TopDownSailboatSVG
        hullColor={BOAT_COLOR}
        rotation={heading}
        scale={0.5}
        showWake={false}
        windDirection={0}
      />
    </G>
  );
}

// Helper: Calculate position ahead of bow
function getSpinnakerPosition(heading: number, distance: number) {
  // Boat center after scale is at (25*0.5, 40*0.5) = (12.5, 20)
  // Bow in local coords is (25, 0), after scale (12.5, 0)
  // Distance from center to bow (scaled) = 40*0.5 = 20 units

  const radians = (heading * Math.PI) / 180;
  const centerX = 12.5;
  const centerY = 20;
  const bowDistFromCenter = 20;

  // Bow position
  const bowX = centerX + Math.sin(radians) * bowDistFromCenter;
  const bowY = centerY - Math.cos(radians) * bowDistFromCenter;

  // Spinnaker position (ahead of bow)
  const spinnX = bowX + Math.sin(radians) * distance;
  const spinnY = bowY - Math.cos(radians) * distance;

  // Forward and perpendicular vectors
  const fwdX = Math.sin(radians);
  const fwdY = -Math.cos(radians);
  const perpX = Math.cos(radians);
  const perpY = Math.sin(radians);

  return { bowX, bowY, spinnX, spinnY, fwdX, fwdY, perpX, perpY, centerX, centerY };
}

// Style 1: Small circle, close
function Style1({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY } =
    getSpinnakerPosition(heading, 12);
  const r = 7;

  return (
    <G>
      {/* Lines connecting to boat */}
      <Line x1={bowX} y1={bowY} x2={spinnX} y2={spinnY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={spinnX - perpX*r} y2={spinnY - perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={spinnX + perpX*r} y2={spinnY + perpY*r} stroke="#94A3B8" strokeWidth={1} />
      {/* Spinnaker */}
      <Circle cx={spinnX} cy={spinnY} r={r} fill={SPINNAKER_COLOR} opacity={0.9} stroke="#FFF" strokeWidth={1} />
    </G>
  );
}

// Style 2: Medium circle
function Style2({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY } =
    getSpinnakerPosition(heading, 15);
  const r = 10;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={spinnX} y2={spinnY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={spinnX - perpX*r} y2={spinnY - perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={spinnX + perpX*r} y2={spinnY + perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Circle cx={spinnX} cy={spinnY} r={r} fill={SPINNAKER_COLOR} opacity={0.9} stroke="#FFF" strokeWidth={1} />
    </G>
  );
}

// Style 3: Large circle, far
function Style3({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY } =
    getSpinnakerPosition(heading, 20);
  const r = 12;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={spinnX} y2={spinnY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={spinnX - perpX*r} y2={spinnY - perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={spinnX + perpX*r} y2={spinnY + perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Circle cx={spinnX} cy={spinnY} r={r} fill={SPINNAKER_COLOR} opacity={0.9} stroke="#FFF" strokeWidth={1} />
    </G>
  );
}

// Style 4: Wide ellipse
function Style4({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 14);
  const rx = 14;
  const ry = 7;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={spinnX} y2={spinnY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={spinnX - perpX*rx} y2={spinnY - perpY*rx} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={spinnX + perpX*rx} y2={spinnY + perpY*rx} stroke="#94A3B8" strokeWidth={1} />
      <Ellipse cx={spinnX} cy={spinnY} rx={rx} ry={ry} fill={SPINNAKER_COLOR} opacity={0.9} stroke="#FFF" strokeWidth={1} transform={`rotate(${heading}, ${spinnX}, ${spinnY})`} />
    </G>
  );
}

// Style 5: Tall ellipse
function Style5({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY } =
    getSpinnakerPosition(heading, 18);
  const rx = 7;
  const ry = 14;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={spinnX} y2={spinnY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={spinnX - perpX*rx} y2={spinnY - perpY*rx} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={spinnX + perpX*rx} y2={spinnY + perpY*rx} stroke="#94A3B8" strokeWidth={1} />
      <Ellipse cx={spinnX} cy={spinnY} rx={rx} ry={ry} fill={SPINNAKER_COLOR} opacity={0.9} stroke="#FFF" strokeWidth={1} transform={`rotate(${heading}, ${spinnX}, ${spinnY})`} />
    </G>
  );
}

// Style 6: Dome/parachute shape
function Style6({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 10);
  const width = 10;
  const depth = 12;

  // Attachment point (back of spinnaker, closest to boat)
  const attachX = spinnX;
  const attachY = spinnY;
  // Left and right edges
  const leftX = attachX - perpX * width;
  const leftY = attachY - perpY * width;
  const rightX = attachX + perpX * width;
  const rightY = attachY + perpY * width;
  // Front tip (furthest from boat)
  const tipX = attachX + fwdX * depth;
  const tipY = attachY + fwdY * depth;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={attachX} y2={attachY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={leftX} y2={leftY} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={rightX} y2={rightY} stroke="#94A3B8" strokeWidth={1} />
      <Path
        d={`M ${leftX} ${leftY} Q ${tipX} ${tipY} ${rightX} ${rightY} Z`}
        fill={SPINNAKER_COLOR}
        opacity={0.9}
        stroke="#FFF"
        strokeWidth={1}
      />
    </G>
  );
}

// Style 7: Wide dome
function Style7({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 10);
  const width = 16;
  const depth = 8;

  const attachX = spinnX;
  const attachY = spinnY;
  const leftX = attachX - perpX * width;
  const leftY = attachY - perpY * width;
  const rightX = attachX + perpX * width;
  const rightY = attachY + perpY * width;
  const tipX = attachX + fwdX * depth;
  const tipY = attachY + fwdY * depth;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={attachX} y2={attachY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={leftX} y2={leftY} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={rightX} y2={rightY} stroke="#94A3B8" strokeWidth={1} />
      <Path
        d={`M ${leftX} ${leftY} Q ${tipX} ${tipY} ${rightX} ${rightY} Z`}
        fill={SPINNAKER_COLOR}
        opacity={0.9}
        stroke="#FFF"
        strokeWidth={1}
      />
    </G>
  );
}

// Style 8: Tall narrow dome
function Style8({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 8);
  const width = 6;
  const depth = 16;

  const attachX = spinnX;
  const attachY = spinnY;
  const leftX = attachX - perpX * width;
  const leftY = attachY - perpY * width;
  const rightX = attachX + perpX * width;
  const rightY = attachY + perpY * width;
  const tipX = attachX + fwdX * depth;
  const tipY = attachY + fwdY * depth;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={attachX} y2={attachY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={leftX} y2={leftY} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={rightX} y2={rightY} stroke="#94A3B8" strokeWidth={1} />
      <Path
        d={`M ${leftX} ${leftY} Q ${tipX} ${tipY} ${rightX} ${rightY} Z`}
        fill={SPINNAKER_COLOR}
        opacity={0.9}
        stroke="#FFF"
        strokeWidth={1}
      />
    </G>
  );
}

// Style 9: Triangle
function Style9({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 10);
  const width = 10;
  const depth = 14;

  const attachX = spinnX;
  const attachY = spinnY;
  const leftX = attachX - perpX * width;
  const leftY = attachY - perpY * width;
  const rightX = attachX + perpX * width;
  const rightY = attachY + perpY * width;
  const tipX = attachX + fwdX * depth;
  const tipY = attachY + fwdY * depth;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={attachX} y2={attachY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={leftX} y2={leftY} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={rightX} y2={rightY} stroke="#94A3B8" strokeWidth={1} />
      <Polygon
        points={`${leftX},${leftY} ${tipX},${tipY} ${rightX},${rightY}`}
        fill={SPINNAKER_COLOR}
        opacity={0.9}
        stroke="#FFF"
        strokeWidth={1}
      />
    </G>
  );
}

// Style 10: Wide triangle
function Style10({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 10);
  const width = 16;
  const depth = 10;

  const attachX = spinnX;
  const attachY = spinnY;
  const leftX = attachX - perpX * width;
  const leftY = attachY - perpY * width;
  const rightX = attachX + perpX * width;
  const rightY = attachY + perpY * width;
  const tipX = attachX + fwdX * depth;
  const tipY = attachY + fwdY * depth;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={attachX} y2={attachY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={leftX} y2={leftY} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={rightX} y2={rightY} stroke="#94A3B8" strokeWidth={1} />
      <Polygon
        points={`${leftX},${leftY} ${tipX},${tipY} ${rightX},${rightY}`}
        fill={SPINNAKER_COLOR}
        opacity={0.9}
        stroke="#FFF"
        strokeWidth={1}
      />
    </G>
  );
}

// Style 11: Very far circle
function Style11({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY } =
    getSpinnakerPosition(heading, 25);
  const r = 9;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={spinnX} y2={spinnY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={spinnX - perpX*r} y2={spinnY - perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={spinnX + perpX*r} y2={spinnY + perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Circle cx={spinnX} cy={spinnY} r={r} fill={SPINNAKER_COLOR} opacity={0.9} stroke="#FFF" strokeWidth={1} />
    </G>
  );
}

// Style 12: Teardrop
function Style12({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 10);
  const width = 8;
  const length = 14;

  // Attachment point (narrow end)
  const attachX = spinnX;
  const attachY = spinnY;
  // Wide part
  const midX = attachX + fwdX * (length * 0.5);
  const midY = attachY + fwdY * (length * 0.5);
  const midLeftX = midX - perpX * width;
  const midLeftY = midY - perpY * width;
  const midRightX = midX + perpX * width;
  const midRightY = midY + perpY * width;
  // Front tip
  const tipX = attachX + fwdX * length;
  const tipY = attachY + fwdY * length;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={attachX} y2={attachY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={midLeftX} y2={midLeftY} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={midRightX} y2={midRightY} stroke="#94A3B8" strokeWidth={1} />
      <Path
        d={`M ${attachX} ${attachY} Q ${midLeftX} ${midLeftY} ${tipX} ${tipY} Q ${midRightX} ${midRightY} ${attachX} ${attachY} Z`}
        fill={SPINNAKER_COLOR}
        opacity={0.9}
        stroke="#FFF"
        strokeWidth={1}
      />
    </G>
  );
}

// Style 13: Crescent/half-moon
function Style13({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 12);
  const width = 12;
  const outerR = 10;
  const innerR = 4;

  const attachX = spinnX;
  const attachY = spinnY;
  const leftX = attachX - perpX * width;
  const leftY = attachY - perpY * width;
  const rightX = attachX + perpX * width;
  const rightY = attachY + perpY * width;
  const outerX = attachX + fwdX * outerR;
  const outerY = attachY + fwdY * outerR;
  const innerX = attachX + fwdX * innerR;
  const innerY = attachY + fwdY * innerR;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={attachX} y2={attachY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={leftX} y2={leftY} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={rightX} y2={rightY} stroke="#94A3B8" strokeWidth={1} />
      <Path
        d={`M ${leftX} ${leftY} Q ${outerX} ${outerY} ${rightX} ${rightY} Q ${innerX} ${innerY} ${leftX} ${leftY} Z`}
        fill={SPINNAKER_COLOR}
        opacity={0.9}
        stroke="#FFF"
        strokeWidth={1}
      />
    </G>
  );
}

// Style 14: Balloon (round but with distinct pole)
function Style14({ heading }: SpinnakerProps) {
  const { bowX, bowY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 0);
  const poleLength = 18;
  const r = 12;

  // Pole extends from bow
  const poleEndX = bowX + fwdX * poleLength;
  const poleEndY = bowY + fwdY * poleLength;
  // Spinnaker center is at end of pole + radius
  const spinnX = poleEndX + fwdX * r;
  const spinnY = poleEndY + fwdY * r;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={poleEndX} y2={poleEndY} stroke="#64748B" strokeWidth={2} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={spinnX - perpX*r} y2={spinnY - perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={spinnX + perpX*r} y2={spinnY + perpY*r} stroke="#94A3B8" strokeWidth={1} />
      <Circle cx={spinnX} cy={spinnY} r={r} fill={SPINNAKER_COLOR} opacity={0.9} stroke="#FFF" strokeWidth={1} />
    </G>
  );
}

// Style 15: Diamond/kite
function Style15({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY, fwdX, fwdY } =
    getSpinnakerPosition(heading, 14);
  const width = 10;
  const frontLen = 10;
  const backLen = 4;

  const midX = spinnX;
  const midY = spinnY;
  const leftX = midX - perpX * width;
  const leftY = midY - perpY * width;
  const rightX = midX + perpX * width;
  const rightY = midY + perpY * width;
  const frontX = midX + fwdX * frontLen;
  const frontY = midY + fwdY * frontLen;
  const backX = midX - fwdX * backLen;
  const backY = midY - fwdY * backLen;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={backX} y2={backY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={leftX} y2={leftY} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={rightX} y2={rightY} stroke="#94A3B8" strokeWidth={1} />
      <Polygon
        points={`${backX},${backY} ${leftX},${leftY} ${frontX},${frontY} ${rightX},${rightY}`}
        fill={SPINNAKER_COLOR}
        opacity={0.9}
        stroke="#FFF"
        strokeWidth={1}
      />
    </G>
  );
}

// Style 16: Pill/capsule shape
function Style16({ heading }: SpinnakerProps) {
  const { bowX, bowY, spinnX, spinnY, perpX, perpY, centerX, centerY } =
    getSpinnakerPosition(heading, 16);
  const rx = 12;
  const ry = 8;

  return (
    <G>
      <Line x1={bowX} y1={bowY} x2={spinnX} y2={spinnY} stroke="#64748B" strokeWidth={1.5} />
      <Line x1={centerX - perpX*3} y1={centerY - perpY*3} x2={spinnX - perpX*rx} y2={spinnY - perpY*rx} stroke="#94A3B8" strokeWidth={1} />
      <Line x1={centerX + perpX*3} y1={centerY + perpY*3} x2={spinnX + perpX*rx} y2={spinnY + perpY*rx} stroke="#94A3B8" strokeWidth={1} />
      <Ellipse cx={spinnX} cy={spinnY} rx={rx} ry={ry} fill={SPINNAKER_COLOR} opacity={0.9} stroke="#FFF" strokeWidth={1} transform={`rotate(${heading}, ${spinnX}, ${spinnY})`} />
    </G>
  );
}

const STYLES = [
  { name: 'S1: Small Circle', Component: Style1 },
  { name: 'S2: Medium Circle', Component: Style2 },
  { name: 'S3: Large Circle', Component: Style3 },
  { name: 'S4: Wide Ellipse', Component: Style4 },
  { name: 'S5: Tall Ellipse', Component: Style5 },
  { name: 'S6: Dome', Component: Style6 },
  { name: 'S7: Wide Dome', Component: Style7 },
  { name: 'S8: Tall Dome', Component: Style8 },
  { name: 'S9: Triangle', Component: Style9 },
  { name: 'S10: Wide Triangle', Component: Style10 },
  { name: 'S11: Far Circle', Component: Style11 },
  { name: 'S12: Teardrop', Component: Style12 },
  { name: 'S13: Crescent', Component: Style13 },
  { name: 'S14: Balloon+Pole', Component: Style14 },
  { name: 'S15: Diamond', Component: Style15 },
  { name: 'S16: Pill', Component: Style16 },
];

export function SpinnakerStyleTest() {
  const heading = 160; // Downwind heading

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Spinnaker Style Options</Text>
      <Text style={styles.subtitle}>Pick the style you prefer - spinnaker ahead of bow</Text>

      <View style={styles.grid}>
        {STYLES.map(({ name, Component }) => (
          <View key={name} style={styles.card}>
            <Svg width={100} height={120} viewBox="0 0 80 100">
              {/* Background */}
              <Rect x="0" y="0" width="80" height="100" fill="#BFDBFE" />
              {/* Boat and spinnaker */}
              <G transform="translate(25, 35)">
                <BoatWithSpinnaker
                  heading={heading}
                  spinnaker={<Component heading={heading} />}
                />
              </G>
            </Svg>
            <Text style={styles.label}>{name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 116,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
});

export default SpinnakerStyleTest;
