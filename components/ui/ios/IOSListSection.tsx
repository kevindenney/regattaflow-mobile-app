import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING, IOS_RADIUS, IOS_LIST_INSETS } from '@/lib/design-tokens-ios';

interface IOSListSectionProps {
  /** Section header text (displayed uppercase) */
  header?: string;
  /** Section footer text */
  footer?: string;
  /** Whether to use inset grouped style (default: true) */
  insetGrouped?: boolean;
  /** Children list items */
  children: React.ReactNode;
  /** Additional container style */
  style?: ViewStyle;
  /** Custom header style */
  headerStyle?: TextStyle;
  /** Custom footer style */
  footerStyle?: TextStyle;
}

/**
 * iOS-style list section with inset grouped styling
 * Following Apple Human Interface Guidelines
 */
export function IOSListSection({
  header,
  footer,
  insetGrouped = true,
  children,
  style,
  headerStyle,
  footerStyle,
}: IOSListSectionProps) {
  const listInsets = insetGrouped ? IOS_LIST_INSETS.insetGrouped : IOS_LIST_INSETS.plain;
  const childArray = React.Children.toArray(children);

  return (
    <View style={[styles.container, style]}>
      {header && (
        <Text
          style={[
            styles.header,
            { marginHorizontal: listInsets.marginHorizontal },
            headerStyle,
          ]}
        >
          {header.toUpperCase()}
        </Text>
      )}
      <View
        style={[
          styles.listContainer,
          {
            marginHorizontal: listInsets.marginHorizontal,
            borderRadius: listInsets.borderRadius,
          },
        ]}
      >
        {childArray.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < childArray.length - 1 && (
              <View style={styles.separatorContainer}>
                <View style={styles.separator} />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
      {footer && (
        <Text
          style={[
            styles.footer,
            { marginHorizontal: listInsets.marginHorizontal + IOS_SPACING.lg },
            footerStyle,
          ]}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: IOS_SPACING.sm,
  },
  header: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: IOS_TYPOGRAPHY.footnote.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.footnote.lineHeight,
    color: IOS_COLORS.secondaryLabel,
    marginBottom: IOS_SPACING.sm,
    paddingHorizontal: IOS_SPACING.lg,
    letterSpacing: 0.5,
  },
  listContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    overflow: 'hidden',
  },
  separatorContainer: {
    backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
    paddingLeft: IOS_SPACING.lg + IOS_SPACING.xxxl, // Inset to align with text after icon
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: IOS_COLORS.separator,
  },
  footer: {
    fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
    fontWeight: IOS_TYPOGRAPHY.footnote.fontWeight,
    lineHeight: IOS_TYPOGRAPHY.footnote.lineHeight,
    color: IOS_COLORS.secondaryLabel,
    marginTop: IOS_SPACING.sm,
  },
});

export default IOSListSection;
