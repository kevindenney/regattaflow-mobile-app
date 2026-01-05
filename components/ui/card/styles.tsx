import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { isWeb } from '@gluestack-ui/nativewind-utils/IsWeb';
const baseStyle = isWeb ? 'flex flex-col relative z-0' : '';

export const cardStyle = tva({
  base: baseStyle,
  variants: {
    size: {
      sm: 'p-3 rounded',
      md: 'p-4 rounded-md',
      lg: 'p-6 rounded-xl',
    },
    variant: {
      elevated: 'bg-background-0',
      outline: 'border border-outline-200 ',
      ghost: 'rounded-none',
      filled: 'bg-background-50',
      // Tufte variant: minimal decoration, maximum data-ink ratio
      tufte: 'bg-white rounded-sm border-[0.5px] border-outline-200 shadow-none',
    },
  },
  compoundVariants: [
    // Tufte uses tighter padding for information density
    {
      variant: 'tufte',
      size: 'sm',
      class: 'p-2',
    },
    {
      variant: 'tufte',
      size: 'md',
      class: 'p-3',
    },
    {
      variant: 'tufte',
      size: 'lg',
      class: 'p-4',
    },
  ],
});
