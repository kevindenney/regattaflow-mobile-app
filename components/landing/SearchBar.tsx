/**
 * SearchBar
 *
 * Search input for the landing page that queries across interests, organizations, and people.
 * Results are grouped into "Interests", "Organizations", and "People" sections.
 */

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SAMPLE_INTERESTS } from '@/lib/landing/sampleData';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/providers/AuthProvider';

interface SearchResult {
  type: 'interest' | 'organization' | 'person';
  slug: string;
  name: string;
  parentSlug?: string;
  parentName?: string;
  color: string;
  icon?: string;
  /** For person results */
  userId?: string;
  subtitle?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [dbPeople, setDbPeople] = useState<SearchResult[]>([]);
  const [dbOrgs, setDbOrgs] = useState<SearchResult[]>([]);
  const { user, isGuest } = useAuth();
  const isLoggedIn = !!user && !isGuest;
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local sample data search (instant)
  const localResults = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const matches: SearchResult[] = [];

    for (const interest of SAMPLE_INTERESTS) {
      if (interest.name.toLowerCase().includes(q)) {
        matches.push({
          type: 'interest',
          slug: interest.slug,
          name: interest.name,
          color: interest.color,
          icon: interest.icon,
        });
      }

      for (const org of interest.organizations) {
        if (org.name.toLowerCase().includes(q)) {
          matches.push({
            type: 'organization',
            slug: org.slug,
            name: org.name,
            parentSlug: interest.slug,
            parentName: interest.name,
            color: interest.color,
          });
        }
      }
    }

    return matches.slice(0, 8);
  }, [query]);

  // Debounced DB search for people and real organizations
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setDbPeople([]);
      setDbOrgs([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Search users table (requires authenticated user due to RLS)
      if (isLoggedIn) {
        const isEmail = q.includes('@');
        const pattern = `%${q}%`;

        // Run parallel searches to avoid .or() encoding issues with PostgREST
        const searches = isEmail
          ? [supabase.from('users').select('id, full_name, username, email, user_type').ilike('email', pattern).limit(5)]
          : [
              supabase.from('users').select('id, full_name, username, email, user_type').ilike('full_name', pattern).limit(5),
              supabase.from('users').select('id, full_name, username, email, user_type').ilike('username', pattern).limit(5),
            ];

        const results = await Promise.all(searches.map((s) => (s as unknown as Promise<any>).then((r: any) => r).catch(() => ({ data: null }))));
        const allUsers = results.flatMap((r: any) => r.data ?? []);

        // Deduplicate by id
        const seen = new Set<string>();
        const uniqueUsers = allUsers.filter((u: any) => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return u.id !== user?.id; // exclude self
        });

        if (uniqueUsers.length > 0) {
          setDbPeople(
            uniqueUsers.slice(0, 6).map((u: any) => ({
              type: 'person' as const,
              slug: u.id,
              name: u.full_name || u.username || 'Unknown',
              userId: u.id,
              subtitle: u.username ? `@${u.username}` : u.user_type || undefined,
              color: '#6366F1',
            })),
          );
        } else {
          setDbPeople([]);
        }
      } else {
        setDbPeople([]);
      }

      // Search real DB organizations
      const { data: orgs, error: orgErr } = await supabase
        .from('organizations')
        .select('id, name, slug, interest_slug')
        .ilike('name', `%${q}%`)
        .eq('is_active', true)
        .limit(5);

      if (orgs && orgs.length > 0) {
        // Deduplicate against sample data orgs already shown
        const sampleOrgSlugs = new Set(
          localResults.filter((r) => r.type === 'organization').map((r) => r.slug),
        );
        setDbOrgs(
          orgs
            .filter((o) => !sampleOrgSlugs.has(o.slug))
            .map((o) => ({
              type: 'organization' as const,
              slug: o.slug,
              name: o.name,
              parentSlug: o.interest_slug || undefined,
              color: '#3E92CC',
            })),
        );
      } else {
        setDbOrgs([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const interestResults = localResults.filter((r) => r.type === 'interest');
  const orgResults = [
    ...localResults.filter((r) => r.type === 'organization'),
    ...dbOrgs,
  ];
  const peopleResults = dbPeople;

  const hasResults = interestResults.length > 0 || orgResults.length > 0 || peopleResults.length > 0;
  const showResults = focused && hasResults;

  const handleSelect = useCallback((result: SearchResult) => {
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
    if (result.type === 'interest') {
      router.push(`/${result.slug}` as any);
    } else if (result.type === 'person' && result.userId) {
      router.push(`/person/${result.userId}` as any);
    } else if (result.parentSlug) {
      router.push(`/${result.parentSlug}/${result.slug}` as any);
    } else {
      // DB org without a known interest — go to org public page
      router.push(`/org/${result.slug}` as any);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search organizations, interests, people..."
          placeholderTextColor="#94A3B8"
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {showResults && (
        <View style={styles.dropdown}>
          {interestResults.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Interests</Text>
              {interestResults.map((result) => (
                <TouchableOpacity
                  key={`interest-${result.slug}`}
                  style={styles.resultRow}
                  onPress={() => handleSelect(result)}
                >
                  <View style={[styles.resultIcon, { backgroundColor: result.color + '18' }]}>
                    <Ionicons
                      name={((result.icon || 'folder') + '-outline') as any}
                      size={16}
                      color={result.color}
                    />
                  </View>
                  <Text style={styles.resultName}>{result.name}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {orgResults.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Organizations</Text>
              {orgResults.map((result) => (
                <TouchableOpacity
                  key={`org-${result.parentSlug || 'db'}-${result.slug}`}
                  style={styles.resultRow}
                  onPress={() => handleSelect(result)}
                >
                  <View style={[styles.resultIcon, { backgroundColor: result.color + '18' }]}>
                    <Ionicons name="business-outline" size={16} color={result.color} />
                  </View>
                  <View style={styles.resultTextCol}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    {result.parentName && (
                      <Text style={styles.resultParent}>{result.parentName}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {peopleResults.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>People</Text>
              {peopleResults.map((result) => (
                <TouchableOpacity
                  key={`person-${result.userId}`}
                  style={styles.resultRow}
                  onPress={() => handleSelect(result)}
                >
                  <View style={[styles.resultIcon, styles.resultIconRound, { backgroundColor: result.color + '18' }]}>
                    <Ionicons name="person-outline" size={16} color={result.color} />
                  </View>
                  <View style={styles.resultTextCol}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    {result.subtitle && (
                      <Text style={styles.resultParent}>{result.subtitle}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    zIndex: 50,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any,
    }),
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    maxHeight: 400,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        overflowY: 'auto',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      },
    }),
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  resultIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconRound: {
    borderRadius: 16,
  },
  resultTextCol: {
    flex: 1,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  resultParent: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
});
