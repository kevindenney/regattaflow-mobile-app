/**
 * ToolPopupModal - Bottom sheet on native, centered modal on web
 *
 * Native: Uses RN Modal with custom slide-up bottom sheet layout
 * Web: Uses Gluestack Modal (centered popup, max-width 720px)
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Modal as RNModal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@/components/ui/modal';

interface ToolPopupModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Use full-screen height on native for complex wizards */
  fullScreen?: boolean;
  /** Hide the modal header when the child wizard provides its own */
  hideHeader?: boolean;
}

/**
 * Native bottom sheet using RN Modal for reliable height control
 */
function NativeToolSheet({
  visible,
  title,
  onClose,
  children,
  fullScreen,
  hideHeader,
}: ToolPopupModalProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetHeight = fullScreen
    ? screenHeight - insets.top - 10
    : screenHeight * 0.85;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.backdropInner} />
      </Pressable>

      {/* Sheet content anchored to bottom */}
      <View style={styles.sheetAnchor} pointerEvents="box-none">
        <View style={[styles.sheetContainer, { height: sheetHeight }]}>
          {/* Drag indicator (native only — no drag affordance on web) */}
          {Platform.OS !== 'web' && (
            <View style={styles.dragIndicatorWrapper}>
              <View style={styles.dragIndicator} />
            </View>
          )}

          {/* Header with title and close button */}
          {!hideHeader && (
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <X size={16} color="#3C3C43" strokeWidth={2.5} />
              </Pressable>
            </View>
          )}

          {/* Body: when hideHeader, wizard manages its own scroll — render directly */}
          {hideHeader ? (
            <View style={styles.sheetBody}>
              {children}
            </View>
          ) : (
            <ScrollView
              style={styles.sheetBody}
              contentContainerStyle={[
                styles.sheetBodyContent,
                { paddingBottom: Math.max(insets.bottom, 20) + 14 },
              ]}
              showsVerticalScrollIndicator={true}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          )}
        </View>
      </View>
    </RNModal>
  );
}

/**
 * Web modal implementation
 */
function WebToolModal({
  visible,
  title,
  onClose,
  children,
  fullScreen,
  hideHeader,
}: ToolPopupModalProps) {
  return (
    <Modal isOpen={visible} onClose={onClose} size={fullScreen ? 'full' : 'xl'}>
      <ModalBackdrop />
      <ModalContent
        style={[
          fullScreen ? styles.webContentFullScreen : styles.webContent,
          hideHeader && styles.webContentNoHeader,
        ]}
        className={fullScreen ? 'web:max-h-[95vh]' : 'web:max-h-[85vh]'}
      >
        {!hideHeader && (
          <ModalHeader style={styles.webHeader}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {title}
            </Text>
            <ModalCloseButton onPress={onClose}>
              <View style={styles.closeButton}>
                <X size={16} color="#3C3C43" strokeWidth={2.5} />
              </View>
            </ModalCloseButton>
          </ModalHeader>
        )}
        <ModalBody
          style={[styles.webBody, hideHeader && styles.sheetBodyNoHeader]}
          contentContainerStyle={styles.sheetBodyContent}
        >
          {children}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/**
 * Platform-adaptive ToolPopupModal
 */
export function ToolPopupModal(props: ToolPopupModalProps) {
  if (Platform.OS === 'web') {
    return <WebToolModal {...props} />;
  }
  return <NativeToolSheet {...props} />;
}

const styles = StyleSheet.create({
  // ─── Native bottom sheet (RN Modal) ────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropInner: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetAnchor: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  dragIndicatorWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1D1D6',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginRight: 12,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    flex: 1,
  },
  sheetBodyNoHeader: {
    marginTop: 0,
  },
  sheetBodyContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetBodyContentNoHeader: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },

  // ─── Web modal ───────────────────────────────────────────────────
  webContent: {
    borderRadius: 16,
    maxHeight: '85vh' as any,
  },
  webContentFullScreen: {
    maxHeight: '95vh' as any,
    borderRadius: 16,
  },
  webHeader: {
    paddingBottom: 10,
    paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    alignItems: 'center',
  },
  webContentNoHeader: {
    padding: 0,
  },
  webBody: {
    marginBottom: 0,
  },
});
