import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function LegacyHub() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Legacy Tools</Text>
      <Text style={styles.paragraph}>
        We are currently modernising the coach marketplace, 3D map, and advanced weather labs. These
        experiences are available in the legacy bundle while we migrate them to the new architecture.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>What moved?</Text>
        <Text style={styles.cardBody}>
          Coach dashboards, session booking, earnings reports, 3D bathymetry, advanced map overlays, and
          tactical weather services now live in the legacy package. Reach out in Slack if you need early
          access during the rebuild.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next steps</Text>
        <Text style={styles.cardBody}>
          The modern TypeScript surface (auth, race analysis, demo dashboards) is green. We will migrate the
          remaining modules incrementally and share a weekly status update.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#F8FAFC'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
    marginBottom: 24
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569'
  }
});
