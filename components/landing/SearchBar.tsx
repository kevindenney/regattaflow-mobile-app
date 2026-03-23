/**
 * SearchBar
 *
 * Search input for the landing page that queries across interests and organizations.
 * Results are grouped into "Interests" and "Organizations" sections.
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
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

interface SearchResult {
  type: 'interest' | 'organization';
  slug: string;
  name: string;
  parentSlug?: string;
  parentName?: string;
  color: string;
  icon?: string;
}

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const matches: SearchResult[] = [];

    for (const interest of SAMPLE_INTERESTS) {
      // Match interests
      if (interest.name.toLowerCase().includes(q)) {
        matches.push({
          type: 'interest',
          slug: interest.slug,
          name: interest.name,
          color: interest.color,
          icon: interest.icon,
        });
      }

      // Match organizations within interests
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

    return matches.slice(0, 10);
  }, [query]);

  const showResults = focused && results.length > 0;

  const handleSelect = useCallback((result: SearchResult) => {
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
    if (result.type === 'interest') {
      router.push(`/${result.slug}` as any);
    } else if (result.parentSlug) {
      router.push(`/${result.parentSlug}/${result.slug}` as any);
    }
  }, []);

  const interestResults = results.filter((r) => r.type === 'interest');
  const orgResults = results.filter((r) => r.type === 'organization');

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
                  key={`org-${result.parentSlug}-${result.slug}`}
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
    maxHeight: 360,
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
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
