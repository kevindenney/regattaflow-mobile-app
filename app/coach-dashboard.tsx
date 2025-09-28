import { View, StyleSheet } from 'react-native';
import CoachDashboard from '../src/components/coach/CoachDashboard';

export default function CoachDashboardScreen() {
  return (
    <View style={styles.container}>
      <CoachDashboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});