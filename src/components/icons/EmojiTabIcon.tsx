/**
 * EmojiTabIcon Component
 * Renders emoji as a tab bar icon with proper sizing and color
 */

import { Text } from 'react-native';

interface EmojiTabIconProps {
  emoji: string;
  focused?: boolean;
  color?: string;
  size?: number;
}

export function EmojiTabIcon({ emoji, focused = false, color, size = 24 }: EmojiTabIconProps) {
  return (
    <Text
      style={{
        fontSize: size,
        opacity: focused ? 1 : 0.6,
        // Emojis don't support color changes, so we use opacity for focus state
      }}
    >
      {emoji}
    </Text>
  );
}
