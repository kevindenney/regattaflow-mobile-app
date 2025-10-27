'use client';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { tva } from '@gluestack-ui/nativewind-utils/tva';

const imageBackgroundStyle = tva({});

type ImageBackgroundProps = React.ComponentProps<typeof ExpoImage> & {
  children?: React.ReactNode;
  className?: string;
  imageStyle?: object;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
};

export const ImageBackground = React.forwardRef<
  React.ElementRef<typeof ExpoImage>,
  ImageBackgroundProps
>(({ className, children, imageStyle, contentFit = 'cover', cachePolicy = 'memory-disk', style, ...props }, ref) => {
  return (
    <View style={[styles.container, style]} className={imageBackgroundStyle({ class: className })}>
      <ExpoImage
        {...props}
        ref={ref}
        style={[StyleSheet.absoluteFillObject, imageStyle]}
        contentFit={contentFit}
        cachePolicy={cachePolicy}
      />
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
