import { View, StyleSheet } from 'react-native';
import CoachRegistration from '../src/components/coach/CoachRegistration';

export default function CoachRegistrationScreen() {
  return (
    <View style={styles.container}>
      <CoachRegistration />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});