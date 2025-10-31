import React, { forwardRef, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  View,
  type ViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  skeletonStyle,
  skeletonTextStyle,
  type SkeletonVariants,
  type SkeletonTextVariants,
} from './styles';

type BaseViewProps = ViewProps & { className?: string };

const BaseView = View as unknown as React.ComponentType<BaseViewProps>;

const AnimatedSkeletonView = Animated.createAnimatedComponent(BaseView);

type AnimatedSkeletonRef = React.ComponentRef<typeof AnimatedSkeletonView>;

type SkeletonProps = Omit<ViewProps, 'className'> & {
  className?: string;
  variant?: SkeletonVariants['variant'];
  speed?: SkeletonVariants['speed'];
  startColor?: string;
  isLoaded?: boolean;
  children?: React.ReactNode;
};

type SkeletonTextProps = Omit<ViewProps, 'className'> & {
  className?: string;
  _lines?: number;
  isLoaded?: boolean;
  startColor?: string;
  gap?: SkeletonTextVariants['gap'];
  speed?: SkeletonTextVariants['speed'];
  children?: React.ReactNode;
};

const Skeleton = forwardRef<AnimatedSkeletonRef, SkeletonProps>(
  (
    {
      className,
      variant = 'rounded',
      speed = 2,
      startColor = 'bg-background-200',
      isLoaded = false,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (isLoaded) {
        opacity.setValue(1);
        return;
      }

      const easing = Easing.bezier(0.4, 0, 0.6, 1);
      const duration = (0.6 * 1000 * 10) / Math.max(speed ?? 1, 1);

      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: duration / 2,
            easing,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacity, {
            toValue: 0.75,
            duration: duration / 2,
            easing,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: duration / 2,
            easing,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );

      animation.start();
      return () => {
        animation.stop();
      };
    }, [isLoaded, opacity, speed]);

    if (isLoaded) {
      return <>{children}</>;
    }

    return (
      <AnimatedSkeletonView
        ref={ref}
        {...props}
        style={
          (style
            ? ([{ opacity }, style] as StyleProp<ViewStyle>)
            : ([{ opacity }] as StyleProp<ViewStyle>))
        }
        className={`${startColor} ${skeletonStyle({ variant, speed, class: className })}`}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

const SkeletonText = forwardRef<View, SkeletonTextProps>(
  (
    {
      className,
      _lines,
      isLoaded = false,
      startColor = 'bg-background-200',
      gap = 2,
      speed = 2,
      children,
      ...props
    },
    ref
  ) => {
    if (isLoaded) {
      return <>{children}</>;
    }

    if (_lines && _lines > 0) {
      return (
        <View
          ref={ref}
          {...props}
          className={skeletonTextStyle({ gap, speed, class: className })}
        >
          {Array.from({ length: _lines }).map((_, index) => (
            <Skeleton
              key={index}
              startColor={startColor}
              speed={speed}
              className={skeletonTextStyle({ class: className })}
              variant="rounded"
            />
          ))}
        </View>
      );
    }

    return (
      <Skeleton
        startColor={startColor}
        speed={speed}
        className={skeletonTextStyle({ class: className })}
        variant="rounded"
        {...props}
      >
        {children}
      </Skeleton>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';

export { Skeleton, SkeletonText };
