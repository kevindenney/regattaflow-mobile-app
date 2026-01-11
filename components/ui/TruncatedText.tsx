import React, { useState, useCallback, useRef } from 'react';
import { Text, Pressable, Platform, StyleProp, TextStyle, NativeSyntheticEvent, TextLayoutEventData, GestureResponderEvent } from 'react-native';
import { Tooltip, TooltipContent, TooltipText } from '@/components/ui/tooltip';
import * as Haptics from 'expo-haptics';

interface TruncatedTextProps {
  /** The full text to display */
  text: string;
  /** Maximum number of lines before truncation */
  numberOfLines: number;
  /** Text styles to apply */
  style?: StyleProp<TextStyle>;
  /** Tooltip placement relative to text */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Duration to show tooltip (ms) - 0 for manual dismiss */
  tooltipDuration?: number;
  /** Custom className for the text */
  className?: string;
}

/**
 * TruncatedText - A text component that shows a tooltip on long-press when truncated
 *
 * Usage:
 * <TruncatedText
 *   text="Very long race name that will be truncated..."
 *   numberOfLines={2}
 *   style={styles.raceName}
 * />
 */
export function TruncatedText({
  text,
  numberOfLines,
  style,
  placement = 'top',
  tooltipDuration = 3000,
  className,
}: TruncatedTextProps) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect if text is actually truncated
  const handleTextLayout = useCallback((event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const { lines } = event.nativeEvent;
    // Text is truncated if lines exceed numberOfLines or last line has ellipsis
    if (lines.length >= numberOfLines) {
      // Check if the text was cut off (rough heuristic)
      const displayedText = lines.map(line => line.text).join('');
      setIsTruncated(displayedText.length < text.length);
    } else {
      setIsTruncated(false);
    }
  }, [numberOfLines, text]);

  const handleLongPress = useCallback(() => {
    // TODO: Re-enable truncation check after testing
    // Only show tooltip if text is actually truncated
    // if (!isTruncated) return;

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsTooltipOpen(true);

    // Auto-dismiss after duration
    if (tooltipDuration > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsTooltipOpen(false);
      }, tooltipDuration);
    }
  }, [isTruncated, tooltipDuration]);

  const handlePressOut = useCallback(() => {
    // Dismiss tooltip when finger lifts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Small delay to allow reading
    timeoutRef.current = setTimeout(() => {
      setIsTooltipOpen(false);
    }, 500);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Tooltip
      isOpen={isTooltipOpen}
      placement={placement}
      onClose={() => setIsTooltipOpen(false)}
      trigger={(triggerProps: Record<string, unknown>) => (
        <Pressable
          {...triggerProps}
          onLongPress={handleLongPress}
          onPressOut={handlePressOut}
          delayLongPress={400}
        >
          <Text
            style={style}
            className={className}
            numberOfLines={numberOfLines}
            onTextLayout={handleTextLayout}
          >
            {text}
          </Text>
        </Pressable>
      )}
    >
      <TooltipContent className="max-w-[280px]">
        <TooltipText className="text-sm">{text}</TooltipText>
      </TooltipContent>
    </Tooltip>
  );
}

export default TruncatedText;
