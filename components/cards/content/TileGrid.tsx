/**
 * TileGrid - Responsive fixed-size tile container
 *
 * Tiles are FIXED at 155x155px (Apple Weather style).
 * Number of tiles per row adjusts based on available width (1-4 tiles).
 * Uses flexWrap to naturally reflow tiles.
 */

import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';

// Layout constants - Apple Weather widget sizes
const TILE_SIZE = 155;
const TILE_GAP = 12;

// DEBUG: Set to true to see tile wrapper boundaries (web only)
const DEBUG_TILE_BOUNDS = false;

interface TileGridProps {
  /** Tile components to render */
  children: React.ReactNode;
  /** Optional custom gap between tiles (default: 12) */
  gap?: number;
}

export function TileGrid({ children, gap = TILE_GAP }: TileGridProps) {
  const childArray = React.Children.toArray(children);

  // DEBUG styles (applied inline on web)
  const debugContainerStyle = DEBUG_TILE_BOUNDS && Platform.OS === 'web'
    ? { borderWidth: 2, borderColor: 'blue', borderStyle: 'dashed' as const }
    : {};
  const debugTileStyle = DEBUG_TILE_BOUNDS && Platform.OS === 'web'
    ? { borderWidth: 1, borderColor: 'red', borderStyle: 'solid' as const }
    : {};

  return (
    <View style={[styles.container, { gap }, debugContainerStyle]}>
      {childArray.map((child, index) => (
        <View
          key={index}
          style={[styles.tile, debugTileStyle]}
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
    // Left-aligned, tiles wrap naturally based on container width
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
});

export default TileGrid;
