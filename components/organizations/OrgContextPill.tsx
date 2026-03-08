import { orgInterestPillText } from '@/lib/organizations/orgInterest';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type OrgContextPillProps = {
  interestSlug: string | null;
};

export function OrgContextPill({ interestSlug }: OrgContextPillProps) {
  const isUnset = !interestSlug;

  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.pillText}>{orgInterestPillText(interestSlug)}</Text>
      </View>
      {isUnset ? <Text style={styles.note}>Organization interest not set.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    gap: 4,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  note: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
