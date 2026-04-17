import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';

const INTERESTS = [
  { slug: 'sail-racing', name: 'Sailing', color: '#003DA5' },
  { slug: 'nursing', name: 'Nursing', color: '#0097A7' },
  { slug: 'lac-craft-business', name: 'Lac Craft', color: '#E67E22' },
  { slug: 'drawing', name: 'Drawing', color: '#E64A19' },
  { slug: 'health-and-fitness', name: 'Health & Fitness', color: '#2E7D32' },
];

const VOCAB: Record<string, Record<string, string>> = {
  'Learning Event': { 'sail-racing': 'Race', nursing: 'Clinical Shift', 'lac-craft-business': 'Activity', drawing: 'Drawing Session', 'health-and-fitness': 'Workout' },
  'Plan Phase': { 'sail-racing': 'Race Prep', nursing: 'Pre-Shift Prep', 'lac-craft-business': 'Gather Documents', drawing: 'Sketch Planning', 'health-and-fitness': 'Warm-up Plan' },
  'Do Phase': { 'sail-racing': 'On the Water', nursing: 'On-Unit Care', 'lac-craft-business': 'Bank Visit / Filing', drawing: 'Active Drawing', 'health-and-fitness': 'Training' },
  'Review Phase': { 'sail-racing': 'Debrief', nursing: 'Post-Shift Reflection', 'lac-craft-business': 'Progress Check', drawing: 'Critique', 'health-and-fitness': 'Cool-down Review' },
  Practice: { 'sail-racing': 'Drill Session', nursing: 'Skills Lab', 'lac-craft-business': 'SHG Meeting', drawing: 'Study Sketch', 'health-and-fitness': 'Practice Set' },
  Institution: { 'sail-racing': 'Yacht Club', nursing: 'Hospital / School', 'lac-craft-business': 'NGO / SHG', drawing: 'Art Studio', 'health-and-fitness': 'Gym / Club' },
  Coach: { 'sail-racing': 'Sailing Coach', nursing: 'Clinical Instructor', 'lac-craft-business': 'Field Coordinator', drawing: 'Drawing Teacher', 'health-and-fitness': 'Personal Trainer' },
  Passport: { 'sail-racing': 'Sailor Record', nursing: 'Competency Passport', 'lac-craft-business': 'Business Diary', drawing: 'Portfolio', 'health-and-fitness': 'Training Log' },
  Period: { 'sail-racing': 'Season', nursing: 'Semester / Rotation', 'lac-craft-business': 'Loan Cycle', drawing: 'Project Series', 'health-and-fitness': 'Training Block' },
  Milestone: { 'sail-racing': 'First Win', nursing: 'First IV Start', 'lac-craft-business': 'First Loan Approved', drawing: 'First Exhibition', 'health-and-fitness': 'First PR' },
  Skill: { 'sail-racing': 'Tactical Skill', nursing: 'Clinical Competency', 'lac-craft-business': 'Business Skill', drawing: 'Technique', 'health-and-fitness': 'Movement Pattern' },
  Equipment: { 'sail-racing': 'Boat / Sails', nursing: 'Stethoscope / Scrubs', 'lac-craft-business': 'Tools / Materials', drawing: 'Pencils / Tablet', 'health-and-fitness': 'Shoes / Watch' },
};

const UNIVERSAL_TERMS = Object.keys(VOCAB);

export function VocabularySection() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(false);
  const [active, setActive] = useState<string[]>(INTERESTS.map((i) => i.slug));

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDesktop = mounted && width > 768;

  const toggle = (slug: string) => {
    setActive((prev) => {
      if (prev.includes(slug)) {
        return prev.length > 1 ? prev.filter((s) => s !== slug) : prev;
      }
      return [...prev, slug];
    });
  };

  const activeInterests = INTERESTS.filter((i) => active.includes(i.slug));

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>— THE LANGUAGE</Text>
        <Text style={[styles.heading, isDesktop && styles.headingDesktop]}>
          Same structure.{'\n'}Different words.
        </Text>
        <Text style={styles.subheading}>
          Every discipline has its own vocabulary. BetterAt adapts to speak your
          language while keeping the universal model underneath.
        </Text>

        {/* Interest filter pills */}
        <View style={styles.pills}>
          {INTERESTS.map((interest) => {
            const isActive = active.includes(interest.slug);
            return (
              <TouchableOpacity
                key={interest.slug}
                style={[
                  styles.pill,
                  isActive
                    ? { backgroundColor: interest.color }
                    : styles.pillInactive,
                ]}
                onPress={() => toggle(interest.slug)}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive
                      ? styles.pillTextActive
                      : styles.pillTextInactive,
                  ]}
                >
                  {interest.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Table */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tableScroll}
        >
          <View style={styles.table}>
            {/* Header row */}
            <View style={[styles.row, styles.headerRow]}>
              <View style={[styles.cell, styles.universalCell]}>
                <Text style={styles.headerLabel}>UNIVERSAL</Text>
              </View>
              {activeInterests.map((i) => (
                <View key={i.slug} style={[styles.cell, styles.interestCell]}>
                  <Text style={[styles.headerInterest, { color: i.color }]}>
                    {i.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Data rows */}
            {UNIVERSAL_TERMS.map((term, idx) => (
              <View
                key={term}
                style={[
                  styles.row,
                  idx % 2 === 0 ? styles.rowEven : styles.rowOdd,
                ]}
              >
                <View style={[styles.cell, styles.universalCell]}>
                  <Text style={styles.universalText}>{term}</Text>
                </View>
                {activeInterests.map((i) => (
                  <View
                    key={i.slug}
                    style={[styles.cell, styles.interestCell]}
                  >
                    <Text style={styles.vocabText}>
                      {VOCAB[term][i.slug]}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 80,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.5,
    color: '#9B9B9B',
    marginBottom: 12,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 40,
  },
  headingDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  subheading: {
    fontSize: 15,
    color: '#6B6B6B',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 520,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 18,
    ...Platform.select({
      web: { cursor: 'pointer' as any },
    }),
  },
  pillInactive: {
    backgroundColor: '#F3F0EB',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: '#9B9B9B',
  },
  tableScroll: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  table: {
    minWidth: 500,
  },
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  headerRow: {
    backgroundColor: '#F3F0EB',
    borderTopWidth: 0,
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#FAF8F5',
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  universalCell: {
    width: 160,
    flexShrink: 0,
  },
  interestCell: {
    width: 170,
    flexShrink: 0,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    color: '#9B9B9B',
  },
  headerInterest: {
    fontSize: 14,
    fontWeight: '600',
  },
  universalText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B6B6B',
  },
  vocabText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
});
