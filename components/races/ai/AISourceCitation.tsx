import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

export interface AISourceItem {
  id: string;
  label: string;
  url?: string;
  note?: string;
}

interface AISourceCitationProps {
  sources: AISourceItem[];
  title?: string;
}

export function AISourceCitation({
  sources,
  title = 'Sources',
}: AISourceCitationProps) {
  if (!sources.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {sources.map((source) => (
        <Pressable
          key={source.id}
          style={styles.item}
          onPress={() => {
            if (source.url) {
              void Linking.openURL(source.url);
            }
          }}
          disabled={!source.url}
        >
          <Text style={styles.label}>{source.label}</Text>
          {source.note ? <Text style={styles.note}>{source.note}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  item: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  note: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
