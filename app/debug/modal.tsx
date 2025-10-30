import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';

export default function ModalDebugPage() {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal Press Test</Text>

      <Pressable
        style={styles.openButton}
        onPress={() => {

          setVisible(true);
        }}
      >
        <Text style={styles.buttonText}>Open Modal</Text>
      </Pressable>

      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.backdrop}
            onPress={() => {

              setVisible(false);
            }}
          />

          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Test Modal</Text>

            <Pressable
              onPress={() => {

              }}
              style={({ pressed }) => ({
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 8,
                backgroundColor: pressed ? 'rgba(0,0,0,0.06)' : 'transparent'
              })}
            >
              <Text>Test Press</Text>
            </Pressable>

            <Pressable
              style={styles.closeButton}
              onPress={() => {

                setVisible(false);
              }}
            >
              <Text style={styles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  openButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalContent: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -100 }],
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    minWidth: 200,
    zIndex: 1000,
    boxShadow: '0px 4px',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 15,
  },
});