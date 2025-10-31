import { tva } from '@gluestack-ui/nativewind-utils/tva';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';

export const skeletonStyle = tva({
  base: 'w-full h-full',
  variants: {
    variant: {
      sharp: 'rounded-none',
      circular: 'rounded-full',
      rounded: 'rounded-md',
    },
    speed: {
      1: 'duration-75',
      2: 'duration-100',
      3: 'duration-150',
      4: 'duration-200',
    },
  },
});
export const skeletonTextStyle = tva({
  base: 'rounded-sm w-full',
  variants: {
    speed: {
      1: 'duration-75',
      2: 'duration-100',
      3: 'duration-150',
      4: 'duration-200',
    },
    gap: {
      1: 'gap-1',
      2: 'gap-2',
      3: 'gap-3',
      4: 'gap-4',
    },
  },
});

export type SkeletonVariants = VariantProps<typeof skeletonStyle>;
export type SkeletonTextVariants = VariantProps<typeof skeletonTextStyle>;
