import { View, StyleSheet } from 'react-native';
import AdvancedAnalytics from '../src/components/coach/AdvancedAnalytics';

export default function AdvancedAnalyticsScreen() {
  return (
    <View style={styles.container}>
      <AdvancedAnalytics />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});