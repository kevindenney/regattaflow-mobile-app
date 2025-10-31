// @ts-nocheck

import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface QuickAction {
  id: string;
  title: string;
  icon: string;
  gradientColors: string[];
  onPress: () => void;
  iconSet?: 'ion' | 'mci';
}

interface QuickActionGridProps {
  actions: QuickAction[];
  columns?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function QuickActionCard({ action }: { action: QuickAction }) {
  const scale = useRef(new Animated.Value(1)).current;
  const [isHovered, setIsHovered] = useState(false);

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      friction: 7,
      tension: 120
    }).start();
  };

  const handleHoverIn = () => {
    setIsHovered(true);
    animateScale(1.05);
  };

  const handleHoverOut = () => {
    setIsHovered(false);
    animateScale(1);
  };

  const handlePressIn = () => {
    animateScale(0.96);
  };

  const handlePressOut = () => {
    animateScale(isHovered ? 1.05 : 1);
  };

  const IconComponent = action.iconSet === 'mci' ? MaterialCommunityIcons : Ionicons;

  return (
    <AnimatedPressable
      onPress={action.onPress}
      onHoverIn={handleHoverIn}
      onHoverOut={handleHoverOut}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.actionCard,
        { transform: [{ scale }] },
        isHovered && styles.actionCardHovered
      ]}
    >
      <LinearGradient
        colors={action.gradientColors}
        style={[styles.actionGradient, isHovered && styles.actionGradientHovered]}
      >
        <IconComponent
          name={action.icon as any}
          size={28}
          color="white"
        />
        <Text style={styles.actionText}>{action.title}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

export function QuickActionGrid({ actions, columns = 3 }: QuickActionGridProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.grid, { gridTemplateColumns: `repeat(${columns}, 1fr)` } as any]}>
        {actions.map(action => (
          <QuickActionCard key={action.id} action={action} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    minWidth: '30%',
    maxWidth: '32%',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0px 6px',
    elevation: 6,
  },
  actionCardHovered: {elevation: 10, boxShadow: '0px 0px 14px rgba(0, 0, 0, 0.25)'},
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    gap: 8,
    borderRadius: 16,
  },
  actionGradientHovered: {
    opacity: 0.95,
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
});
