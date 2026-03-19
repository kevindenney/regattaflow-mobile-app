/**
 * TileGrid - Responsive tile container
 *
 * Mobile: 2 small tiles per row, filling available width
 * Web/Tablet: Fixed 155x155px tiles (Apple Weather style), 1-4 per row
 * Uses flexWrap to naturally reflow tiles.
 */

import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Platform, LayoutChangeEvent } from 'react-native';

// Layout constants
const TILE_SIZE_FIXED = 155;
const TILE_GAP = 12;
const MOBILE_BREAKPOINT = 500;

interface TileGridProps {
  /** Tile components to render */
  children: React.ReactNode;
  /** Optional custom gap between tiles (default: 12) */
  gap?: number;
}

export function TileGrid({ children, gap = TILE_GAP }: TileGridProps) {
  const childArray = React.Children.toArray(children);
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  // Calculate tile size based on platform and container width
  let tileSize = TILE_SIZE_FIXED;
  if (containerWidth > 0) {
    if (Platform.OS !== 'web' && containerWidth < MOBILE_BREAKPOINT) {
      // Mobile native: fit 2 per row
      tileSize = Math.floor((containerWidth - gap) / 2);
    } else if (Platform.OS === 'web' && containerWidth > 0) {
      // Web: fit tiles to fill available width (target ~4 per row, min 2)
      const count = childArray.length;
      const cols = Math.min(count, containerWidth > 700 ? 4 : containerWidth > 450 ? 3 : 2);
      tileSize = Math.floor((containerWidth - gap * (cols - 1)) / cols);
    }
  }

  return (
    <View style={[styles.container, { gap }]} onLayout={onLayout}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={{ width: tileSize, height: tileSize }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default TileGrid;
