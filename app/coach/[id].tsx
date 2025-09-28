import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import CoachProfile from '../../src/components/coach/CoachProfile';

export default function CoachProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return (
    <View style={styles.container}>
      <CoachProfile coachId={id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});