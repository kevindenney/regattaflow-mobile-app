/**
 * CardMenu Component
 * Reusable three-dot menu for card actions
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  type GestureResponderEvent,
} from 'react-native';

export interface CardMenuItem {
  label: string;
  icon: string;
  onPress: () => void;
  variant?: 'default' | 'destructive';
}

interface CardMenuProps {
  items: CardMenuItem[];
  iconSize?: number;
  iconColor?: string;
}

export function CardMenu({ items, iconSize = 20, iconColor = '#64748B' }: CardMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const buttonRef = useRef<TouchableOpacity | null>(null);
  const { width: screenWidth } = Dimensions.get('window');
  const menuWidth = 220;
  const horizontalPadding = 16;

  const placementStyle = useMemo(() => {
    if (!menuPosition) {
      return {};
    }

    const top = Math.max(16, menuPosition.y + menuPosition.height + 8);
    let left = menuPosition.x + menuPosition.width - menuWidth;
    if (left < horizontalPadding) {
      left = horizontalPadding;
    }
    const maxLeft = screenWidth - menuWidth - horizontalPadding;
    if (left > maxLeft) {
      left = maxLeft;
    }

    return {
      top,
      left,
      width: menuWidth,
    };
  }, [menuPosition, screenWidth]);

  const openMenu = (event: GestureResponderEvent) => {
    event.stopPropagation();

    if (buttonRef.current?.measureInWindow) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setMenuPosition({ x, y, width, height });
        setShowMenu(true);
      });
      return;
    }

    const { pageX = 0, pageY = 0 } = event.nativeEvent as any;
    setMenuPosition({ x: pageX, y: pageY, width: 0, height: 0 });
    setShowMenu(true);
  };

  const closeMenu = () => {
    setShowMenu(false);
    setMenuPosition(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        ref={buttonRef}
        style={styles.menuButton}
        onPress={openMenu}
        activeOpacity={0.7}
      >
        <Ionicons name="ellipsis-vertical" size={iconSize} color={iconColor} />
      </TouchableOpacity>

      {showMenu && (
        <Modal
          visible={showMenu}
          transparent
          animationType="none"
          onRequestClose={closeMenu}
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.modalOverlay}
              onPress={(event: GestureResponderEvent) => {
                event.stopPropagation();
                closeMenu();
              }}
            />
            <View style={[styles.menuContainer, placementStyle]}>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index === items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={(event: GestureResponderEvent) => {
                    event.stopPropagation();
                    closeMenu();
                    item.onPress();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.variant === 'destructive' ? '#EF4444' : '#3B82F6'}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      item.variant === 'destructive' && styles.menuItemTextDestructive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  modalRoot: {
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 200,
    zIndex: 10000,
    ...Platform.select({
      ios: {
        boxShadow: '0px 4px',
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
  },
  menuItemTextDestructive: {
    color: '#EF4444',
  },
});
