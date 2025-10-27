/**
 * CardMenu Component
 * Reusable three-dot menu for card actions
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
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

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowMenu(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="ellipsis-vertical" size={iconSize} color={iconColor} />
      </TouchableOpacity>

      {showMenu && (
        <>
          <Modal
            visible={showMenu}
            transparent
            animationType="none"
            onRequestClose={() => setShowMenu(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
          </Modal>

          <View style={styles.menuContainer}>
            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index === items.length - 1 && styles.menuItemLast,
                ]}
                onPress={() => {
                  setShowMenu(false);
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
        </>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  menuContainer: {
    position: 'absolute',
    top: 40,
    right: 0,
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