import { View, StyleSheet } from 'react-native';
import SessionManagement from '../src/components/coach/SessionManagement';

export default function SessionsScreen() {
  return (
    <View style={styles.container}>
      <SessionManagement />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});