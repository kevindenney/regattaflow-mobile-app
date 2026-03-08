import { orgInterestPillText, resolveOrgInterestSlugFromOrganization } from '@/lib/organizations/orgInterest';
import { isMissingSupabaseColumn } from '@/lib/utils/supabaseSchemaFallback';
import { supabase } from '@/services/supabase';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type OrgContextPillProps = {
  interestSlug: string | null;
};

let didWarnMissingInterestSlugColumn = false;

export async function fetchOrganizationInterestSlug(activeOrgId: string): Promise<string | null> {
  const first = await supabase
    .from('organizations')
    .select('id,name,interest_slug,metadata')
    .eq('id', activeOrgId)
    .maybeSingle();

  if (!first.error) {
    return resolveOrgInterestSlugFromOrganization(first.data);
  }

  if (!isMissingSupabaseColumn(first.error, 'organizations.interest_slug')) {
    throw first.error;
  }

  if (__DEV__ && !didWarnMissingInterestSlugColumn) {
    didWarnMissingInterestSlugColumn = true;
    console.warn('[OrgContextPill] organizations.interest_slug missing, falling back to organizations.metadata');
  }

  const fallback = await supabase
    .from('organizations')
    .select('id,name,metadata')
    .eq('id', activeOrgId)
    .maybeSingle();

  if (fallback.error) {
    throw fallback.error;
  }
  return resolveOrgInterestSlugFromOrganization(fallback.data);
}

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
