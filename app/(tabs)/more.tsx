import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';

type MoreLink = '/settings' | '/legacy';

const sections: Array<{ title: string; description: string; href: MoreLink }> = [
  {
    title: 'Settings',
    description: 'Manage account preferences, notifications, and billing.',
    href: '/settings'
  },
  {
    title: 'Legacy Tools',
    description: 'Access experimental dashboards and coach tooling moved out of the core app.',
    href: '/legacy'
  }
];

export default function MoreScreen() {
  const items = useMemo(() => sections, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>
          Quick links to supporting tools and legacy experiences while we modernise the dashboard.
        </Text>
      </View>

      {items.map((item) => (
        <Link key={item.title} href={item.href} asChild>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
            <Text style={styles.cardLink}>Open</Text>
          </View>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#F8FAFC'
  },
  hero: {
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A'
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22
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
    color: '#0F172A'
  },
  cardDescription: {
    marginTop: 6,
    fontSize: 14,
    color: '#475569'
  },
  cardLink: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB'
  }
});
