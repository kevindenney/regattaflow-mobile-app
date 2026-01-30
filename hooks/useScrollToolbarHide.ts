/**
 * useScrollToolbarHide
 *
 * Tracks scroll direction and returns:
 * - `toolbarHidden`: boolean to pass to TabScreenToolbar's `hidden` prop
 * - `handleScroll`: onScroll handler for ScrollView / FlatList / SectionList
 *
 * Behaviour:
 * - Scroll down (finger up) past threshold → hide toolbar
 * - Scroll up (finger down) past threshold → show toolbar
 * - At the top of content (scrollY ≤ 0) → always show
 */

import { useCallback, useRef, useState } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

const DIRECTION_THRESHOLD = 10; // px of movement before we toggle

export function useScrollToolbarHide() {
  const [toolbarHidden, setToolbarHidden] = useState(false);
  const anchorY = useRef(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - anchorY.current;

      if (currentY <= 0) {
        // At the top — always show
        setToolbarHidden(false);
        anchorY.current = currentY;
      } else if (diff > DIRECTION_THRESHOLD) {
        // Scrolling down — hide
        setToolbarHidden(true);
        anchorY.current = currentY;
      } else if (diff < -DIRECTION_THRESHOLD) {
        // Scrolling up — show
        setToolbarHidden(false);
        anchorY.current = currentY;
      }
      // Don't update anchorY when threshold isn't crossed —
      // this lets the diff accumulate across multiple small scroll events
    },
    [],
  );

  return { toolbarHidden, handleScroll } as const;
}
