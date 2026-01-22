/**
 * ReviewForm
 *
 * Form component for post-race review with:
 * - 5-star rating input
 * - Dynamic prompts based on review type
 * - Text and select inputs
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { Star } from 'lucide-react-native';
import type { ReviewPrompt } from './reviewConfigs';

// iOS System Colors
const IOS_COLORS = {
  blue: '#007AFF',
  green: '#34C759',
  orange: '#FF9500',
  yellow: '#FFCC00',
  gray: '#8E8E93',
  gray3: '#C7C7CC',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C4399',
  separator: '#3C3C4349',
  secondaryBackground: '#FFFFFF',
};

interface ReviewFormProps {
  prompts: ReviewPrompt[];
  rating?: number;
  onRatingChange: (rating: number) => void;
  responses: Record<string, string>;
  onResponseChange: (promptId: string, value: string) => void;
  accentColor: string;
  showRating?: boolean;
}

/**
 * Star rating component
 */
function StarRating({
  rating,
  onRatingChange,
  accentColor,
}: {
  rating?: number;
  onRatingChange: (rating: number) => void;
  accentColor: string;
}) {
  return (
    <View style={styles.ratingSection}>
      <Text style={styles.ratingLabel}>Overall Rating</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onRatingChange(star)}
            style={styles.starButton}
          >
            <Star
              size={32}
              color={rating && star <= rating ? accentColor : IOS_COLORS.gray3}
              fill={rating && star <= rating ? accentColor : 'transparent'}
            />
          </Pressable>
        ))}
      </View>
      <Text style={styles.ratingHint}>
        {rating === 1 && 'Poor - Major issues'}
        {rating === 2 && 'Below Average - Some problems'}
        {rating === 3 && 'Average - Acceptable'}
        {rating === 4 && 'Good - Minor improvements possible'}
        {rating === 5 && 'Excellent - Executed well'}
        {!rating && 'Tap to rate your performance'}
      </Text>
    </View>
  );
}

/**
 * Select input component
 */
function SelectInput({
  prompt,
  value,
  onChange,
  accentColor,
}: {
  prompt: ReviewPrompt;
  value?: string;
  onChange: (value: string) => void;
  accentColor: string;
}) {
  return (
    <View style={styles.selectContainer}>
      {prompt.options?.map((option) => (
        <Pressable
          key={option}
          style={[
            styles.selectOption,
            value === option && { backgroundColor: `${accentColor}15`, borderColor: accentColor },
          ]}
          onPress={() => onChange(option)}
        >
          <Text
            style={[
              styles.selectOptionText,
              value === option && { color: accentColor, fontWeight: '600' },
            ]}
          >
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Text input component
 */
function TextPromptInput({
  prompt,
  value,
  onChange,
}: {
  prompt: ReviewPrompt;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextInput
      style={styles.textInput}
      value={value}
      onChangeText={onChange}
      placeholder={prompt.placeholder || 'Enter your response...'}
      placeholderTextColor={IOS_COLORS.tertiaryLabel}
      multiline
      numberOfLines={3}
      textAlignVertical="top"
    />
  );
}

export function ReviewForm({
  prompts,
  rating,
  onRatingChange,
  responses,
  onResponseChange,
  accentColor,
  showRating = true,
}: ReviewFormProps) {
  return (
    <View style={styles.container}>
      {/* Rating section */}
      {showRating && (
        <StarRating
          rating={rating}
          onRatingChange={onRatingChange}
          accentColor={accentColor}
        />
      )}

      {/* Prompts */}
      <View style={styles.promptsContainer}>
        {prompts.map((prompt, index) => (
          <View key={prompt.id} style={styles.promptSection}>
            <Text style={styles.promptQuestion}>{prompt.question}</Text>

            {prompt.type === 'select' && prompt.options ? (
              <SelectInput
                prompt={prompt}
                value={responses[prompt.id]}
                onChange={(value) => onResponseChange(prompt.id, value)}
                accentColor={accentColor}
              />
            ) : (
              <TextPromptInput
                prompt={prompt}
                value={responses[prompt.id]}
                onChange={(value) => onResponseChange(prompt.id, value)}
              />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  ratingSection: {
    alignItems: 'center',
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 12,
    padding: 20,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: IOS_COLORS.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingHint: {
    fontSize: 13,
    color: IOS_COLORS.tertiaryLabel,
    textAlign: 'center',
  },
  promptsContainer: {
    gap: 20,
  },
  promptSection: {
    gap: 10,
  },
  promptQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: IOS_COLORS.label,
    lineHeight: 20,
  },
  selectContainer: {
    gap: 8,
  },
  selectOption: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: IOS_COLORS.separator,
  },
  selectOptionText: {
    fontSize: 15,
    color: IOS_COLORS.label,
  },
  textInput: {
    backgroundColor: IOS_COLORS.secondaryBackground,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: IOS_COLORS.label,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default ReviewForm;
