'use client';
import React from 'react';
import { createImage } from '@gluestack-ui/image';
import { Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';

const imageStyle = tva({
  base: 'max-w-full',
  variants: {
    size: {
      '2xs': 'h-6 w-6',
      'xs': 'h-10 w-10',
      'sm': 'h-16 w-16',
      'md': 'h-20 w-20',
      'lg': 'h-24 w-24',
      'xl': 'h-32 w-32',
      '2xl': 'h-64 w-64',
      'full': 'h-full w-full',
      'none': '',
    },
  },
});

const UIImage = createImage({ Root: ExpoImage });

type ImageProps = VariantProps<typeof imageStyle> &
  React.ComponentProps<typeof UIImage> & {
    // Expo Image specific props
    contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    contentPosition?: string;
    placeholder?: string | number | { uri: string } | { blurhash: string };
    placeholderContentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    transition?: number | { duration?: number; timing?: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' };
    cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  };

const Image = React.forwardRef<
  React.ElementRef<typeof UIImage>,
  ImageProps & { className?: string }
>(({
  size = 'md',
  className,
  contentFit = 'cover',
  cachePolicy = 'memory-disk',
  transition = 300,
  ...props
}, ref) => {
  return (
    <UIImage
      className={imageStyle({ size, class: className })}
      contentFit={contentFit}
      cachePolicy={cachePolicy}
      transition={transition}
      {...props}
      ref={ref}
      // @ts-expect-error
      style={
        Platform.OS === 'web'
          ? // eslint-disable-next-line react-native/no-inline-styles
            { height: 'revert-layer', width: 'revert-layer' }
          : undefined
      }
    />
  );
});

Image.displayName = 'Image';
export { Image };
