/**
 * SmallMultiples Component
 *
 * Tufte principle: "At the heart of quantitative reasoning is a single question: Compared to what?"
 *
 * Display multiple small charts in identical formats for easy comparison
 * Perfect for comparing races, weather patterns, performance across time, etc.
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Sparkline } from './Sparkline';

interface SmallMultipleItem {
  id: string;
  title: string;
  subtitle?: string;
  data: number[];
  value?: number;
  unit?: string;
  highlight?: boolean;
}

interface SmallMultiplesProps {
  items: SmallMultipleItem[];
  columns?: number;
  sparklineHeight?: number;
  sparklineWidth?: number;
  showValues?: boolean;
  style?: ViewStyle;
}

/**
 * SmallMultiples
 *
 * Displays multiple datasets in identical small charts for comparison
 */
export function SmallMultiples({
  items,
  columns = 2,
  sparklineHeight = 30,
  sparklineWidth = 80,
  showValues = true,
  style,
}: SmallMultiplesProps) {
  return (
    <View style={[styles.container, style]}>
      {items.map((item) => (
        <View
          key={item.id}
          style={[
            styles.item,
            { width: `${100 / columns}%` },
            item.highlight && styles.itemHighlight,
          ]}
        >
          {/* Title */}
          <Text style={[styles.title, item.highlight && styles.titleHighlight]} numberOfLines={1}>
            {item.title}
          </Text>

          {/* Subtitle */}
          {item.subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}

          {/* Sparkline */}
          <Sparkline
            data={item.data}
            width={sparklineWidth}
            height={sparklineHeight}
            strokeWidth={item.highlight ? 2 : 1.5}
            color={item.highlight ? '#0284C7' : '#6B7280'}
            showDot={true}
          />

          {/* Value */}
          {showValues && item.value !== undefined && (
            <View style={styles.valueRow}>
              <Text style={[styles.value, item.highlight && styles.valueHighlight]}>
                {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
              </Text>
              {item.unit && <Text style={styles.unit}>{item.unit}</Text>}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0, // No gap - Tufte prefers tight spacing
  },
  item: {
    padding: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHighlight: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  titleHighlight: {
    color: '#0284C7',
  },
  subtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 3,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  valueHighlight: {
    color: '#0284C7',
    fontWeight: '700',
  },
  unit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
});

/**
 * ComparisonTable
 *
 * Tufte-style comparison using small multiples with tabular layout
 * Perfect for race comparisons, performance metrics, etc.
 */
interface ComparisonRow {
  id: string;
  label: string;
  values: Array<{ value: string | number; highlight?: boolean }>;
  sparklines?: number[][];
}

interface ComparisonTableProps {
  headers: string[];
  rows: ComparisonRow[];
  showSparklines?: boolean;
}

export function ComparisonTable({
  headers,
  rows,
  showSparklines = false,
}: ComparisonTableProps) {
  return (
    <View style={tableStyles.container}>
      {/* Header Row */}
      <View style={tableStyles.headerRow}>
        <View style={tableStyles.labelCell}>
          <Text style={tableStyles.headerText}> </Text>
        </View>
        {headers.map((header, index) => (
          <View key={index} style={tableStyles.valueCell}>
            <Text style={tableStyles.headerText}>{header}</Text>
          </View>
        ))}
      </View>

      {/* Data Rows */}
      {rows.map((row) => (
        <View key={row.id} style={tableStyles.dataRow}>
          <View style={tableStyles.labelCell}>
            <Text style={tableStyles.label}>{row.label}</Text>
          </View>
          {row.values.map((cell, index) => (
            <View key={index} style={tableStyles.valueCell}>
              {showSparklines && row.sparklines && row.sparklines[index] ? (
                <Sparkline
                  data={row.sparklines[index]}
                  width={40}
                  height={12}
                  strokeWidth={1}
                  color={cell.highlight ? '#0284C7' : '#6B7280'}
                  showDot={false}
                />
              ) : null}
              <Text
                style={[tableStyles.value, cell.highlight && tableStyles.valueHighlight]}
              >
                {typeof cell.value === 'number' ? cell.value.toFixed(1) : cell.value}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const tableStyles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#D1D5DB',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  labelCell: {
    flex: 1,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    justifyContent: 'center',
  },
  valueCell: {
    width: 80,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  valueHighlight: {
    color: '#0284C7',
    fontWeight: '700',
  },
});
