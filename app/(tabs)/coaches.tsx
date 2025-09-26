import { View, Text, StyleSheet } from 'react-native';
import CoachDiscovery from '../../src/components/coach/CoachDiscovery';

export default function CoachesTab() {
  return (
    <View style={styles.container}>
      <CoachDiscovery />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});