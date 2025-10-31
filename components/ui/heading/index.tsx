import React, { forwardRef, memo } from 'react';
import { Text, type TextProps } from 'react-native';
import { headingStyle, type HeadingSize } from './styles';

type HeadingProps = TextProps & {
  size?: HeadingSize;
  className?: string;
  isTruncated?: boolean;
  bold?: boolean;
  underline?: boolean;
  strikeThrough?: boolean;
  sub?: boolean;
  italic?: boolean;
  highlight?: boolean;
};

const Heading = memo(
  forwardRef<Text, HeadingProps>(
    (
      {
        size = 'lg',
        className,
        isTruncated,
        bold,
        underline,
        strikeThrough,
        sub,
        italic,
        highlight,
        accessibilityRole,
        ...props
      },
      ref
    ) => {
      const composedClassName = headingStyle({
        size,
        isTruncated,
        bold,
        underline,
        strikeThrough,
        sub,
        italic,
        highlight,
        class: className,
      });

      return (
        <Text
          ref={ref}
          accessibilityRole={accessibilityRole ?? 'header'}
          {...props}
          className={composedClassName}
        />
      );
    }
  )
);

Heading.displayName = 'Heading';

export { Heading };
