import { View, StyleSheet } from 'react-native';
import OnXMapsInterface from '../src/components/race-strategy/OnXMapsInterface';

export default function RaceStrategyScreen() {
  return (
    <View style={styles.container}>
      <OnXMapsInterface
        competitionLevel="regional"
        onStrategyGenerated={(strategy) => {
          console.log('Race strategy generated:', strategy);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});