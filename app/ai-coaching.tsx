import { View, StyleSheet } from 'react-native';
import LiveCoachingAssistant from '../src/components/coach/LiveCoachingAssistant';

export default function AICoachingScreen() {
  return (
    <View style={styles.container}>
      <LiveCoachingAssistant />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});