'use client';

import React from 'react';
import { Text, View, type TextProps, type ViewProps } from 'react-native';
import { PrimitiveIcon, UIIcon } from '@gluestack-ui/icon';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import {
  withStyleContext,
  useStyleContext,
} from '@gluestack-ui/nativewind-utils/withStyleContext';
import { cssInterop } from 'nativewind';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';

const SCOPE = 'BADGE';

type BadgeStyleVariants = VariantProps<typeof badgeStyle>;
type BadgeTextVariants = VariantProps<typeof badgeTextStyle>;
type BadgeIconVariants = VariantProps<typeof badgeIconStyle>;

type BadgeContext = {
  action: NonNullable<BadgeStyleVariants['action']>;
  variant: NonNullable<BadgeStyleVariants['variant']>;
  size: NonNullable<BadgeStyleVariants['size']>;
};

const badgeStyle = tva({
  base: 'flex-row items-center rounded-sm data-[disabled=true]:opacity-50 px-2 py-1',
  variants: {
    action: {
      error: 'bg-background-error border-error-300',
      warning: 'bg-background-warning border-warning-300',
      success: 'bg-background-success border-success-300',
      info: 'bg-background-info border-info-300',
      muted: 'bg-background-muted border-background-300',
    },
    variant: {
      solid: '',
      outline: 'border',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
});

const badgeTextStyle = tva({
  base: 'text-typography-700 font-body font-normal tracking-normal uppercase',
  parentVariants: {
    action: {
      error: 'text-error-600',
      warning: 'text-warning-600',
      success: 'text-success-600',
      info: 'text-info-600',
      muted: 'text-background-800',
    },
    size: {
      sm: 'text-2xs',
      md: 'text-xs',
      lg: 'text-sm',
    },
  },
  variants: {
    isTruncated: {
      true: 'web:truncate',
    },
    bold: {
      true: 'font-bold',
    },
    underline: {
      true: 'underline',
    },
    strikeThrough: {
      true: 'line-through',
    },
    sub: {
      true: 'text-xs',
    },
    italic: {
      true: 'italic',
    },
    highlight: {
      true: 'bg-yellow-500',
    },
  },
});

const badgeIconStyle = tva({
  base: 'fill-none',
  parentVariants: {
    action: {
      error: 'text-error-600',
      warning: 'text-warning-600',
      success: 'text-success-600',
      info: 'text-info-600',
      muted: 'text-background-800',
    },
    size: {
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
    },
  },
});

const ContextView = withStyleContext(View, SCOPE);

cssInterop(PrimitiveIcon, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: 'classNameColor',
      stroke: true,
    },
  },
});

type BadgeProps = Omit<React.ComponentPropsWithoutRef<typeof ContextView>, 'className' | 'context'> & {
  className?: string;
  action?: NonNullable<BadgeStyleVariants['action']>;
  variant?: NonNullable<BadgeStyleVariants['variant']>;
  size?: NonNullable<BadgeStyleVariants['size']>;
  children?: React.ReactNode;
};

type BadgeTextProps = Omit<React.ComponentPropsWithoutRef<typeof Text>, 'className'> & {
  className?: string;
} & BadgeTextVariants;

type BadgeIconProps = Omit<React.ComponentPropsWithoutRef<typeof UIIcon>, 'className' | 'size'> &
  BadgeIconVariants & {
    className?: string;
    size?: number | NonNullable<BadgeIconVariants['size']>;
  };

type StyleContextValue = BadgeContext | undefined;

const getStyleContext = (): StyleContextValue => {
  const context = useStyleContext(SCOPE) as StyleContextValue;
  return context;
};

const Badge: React.FC<BadgeProps> = ({
  children,
  action = 'muted',
  variant = 'solid',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <ContextView
      {...props}
      className={badgeStyle({ action, variant, size, class: className })}
      context={{ action, variant, size }}
    >
      {children}
    </ContextView>
  );
};

Badge.displayName = 'Badge';

const BadgeText = React.forwardRef<Text, BadgeTextProps>(
  ({ className, size, children, ...props }, ref) => {
    const context = getStyleContext();
    const computedClassName = badgeTextStyle({
      parentVariants: {
        size: context?.size,
        action: context?.action,
      },
      size,
      class: className,
    });

    return (
      <Text ref={ref} className={computedClassName} {...props}>
        {children}
      </Text>
    );
  }
);

BadgeText.displayName = 'BadgeText';

const BadgeIcon: React.FC<BadgeIconProps> = ({ className, size, ...props }) => {
  const context = getStyleContext();

  const computedClassName = badgeIconStyle({
    parentVariants: {
      size: context?.size,
      action: context?.action,
    },
    size: typeof size === 'string' ? size : undefined,
    class: className,
  });

  if (typeof size === 'number') {
    return <UIIcon className={computedClassName} size={size} {...props} />;
  }

  return <UIIcon className={computedClassName} {...props} />;
};

BadgeIcon.displayName = 'BadgeIcon';

export { Badge, BadgeText, BadgeIcon };
