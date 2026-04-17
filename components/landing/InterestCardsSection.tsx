import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

const INTERESTS = [
  {
    slug: 'nursing',
    name: 'Nursing',
    description: 'Clinical skills & professional development',
    color: '#0097A7',
    icon: '\uD83E\uDE7A',
  },
  {
    slug: 'lac-craft-business',
    name: 'Lac Craft Business',
    description: 'Micro-enterprise, government loans & SHG support',
    color: '#E67E22',
    icon: '\uD83D\uDC5C',
  },
  {
    slug: 'sail-racing',
    name: 'Sail Racing',
    description: 'Tactics, strategy & boat speed for club racers',
    color: '#003DA5',
    icon: '\u26F5',
  },
  {
    slug: 'food-processing',
    name: 'Food Processing',
    description: 'Puffed rice, pickles, FSSAI & cottage food business',
    color: '#D35400',
    icon: '\uD83C\uDF36\uFE0F',
  },
  {
    slug: 'drawing',
    name: 'Drawing',
    description: 'Foundational to advanced techniques',
    color: '#E64A19',
    icon: '\u270F\uFE0F',
  },
  {
    slug: 'health-and-fitness',
    name: 'Health & Fitness',
    description: 'Food, exercise, social & spiritual wellness',
    color: '#2E7D32',
    icon: '\uD83C\uDFCB',
  },
];

export function InterestCardsSection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>— GET STARTED</Text>
        <Text style={[styles.heading, isDesktop && styles.headingDesktop]}>
          Which interest are you improving?
        </Text>

        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {INTERESTS.map((interest) => (
            <TouchableOpacity
              key={interest.slug}
              style={[styles.card, { backgroundColor: interest.color }]}
              onPress={() => router.push(`/${interest.slug}` as any)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardIcon}>{interest.icon}</Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.cardName}>{interest.name}</Text>
                <Text style={styles.cardDescription}>
                  {interest.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  inner: {
    maxWidth: 800,
    width: '100%',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    color: '#9B9B9B',
    marginBottom: 16,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 40,
  },
  headingDesktop: {
    fontSize: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    width: '100%',
  },
  gridDesktop: {
    gap: 20,
  },
  card: {
    width: 160,
    aspectRatio: 1,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
        transition: 'transform 0.2s, box-shadow 0.2s' as any,
      },
    }),
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardIcon: {
    fontSize: 28,
  },
  cardBottom: {},
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 16,
  },
});
