/**
 * WindArrow - Tiny inline compass
 *
 * Shows wind direction as a rotated arrow
 * Compact enough to be inline with text
 */

import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface WindArrowProps {
  /** Wind direction in degrees (0 = North, 90 = East, etc.) */
  direction: number;
  /** Size in pixels */
  size?: number;
  /** Arrow color */
  color?: string;
}

export function WindArrow({
  direction,
  size = 12,
  color = '#64748B',
}: WindArrowProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2L12 22M12 2L8 8M12 2L16 8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform={`rotate(${(direction + 180) % 360}, 12, 12)`}
      />
    </Svg>
  );
}

export default WindArrow;
