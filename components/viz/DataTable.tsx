/**
 * DataTable Component
 *
 * Tufte-inspired dense tabular data display
 * Principles:
 * - High data-ink ratio (minimal borders)
 * - Tabular numbers for easy comparison
 * - Subtle visual hierarchy
 * - Maximum information density
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Sparkline } from './Sparkline';

type CellValue = string | number | { value: string | number; sparkline?: number[] };

interface Column {
  id: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: number | string;
  precision?: number; // For numeric formatting
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, CellValue>[];
  striped?: boolean; // Alternating row background
  dense?: boolean; // Tighter spacing
  showBorders?: 'none' | 'horizontal' | 'vertical' | 'all';
  highlightRow?: (row: Record<string, CellValue>) => boolean;
  style?: ViewStyle;
}

/**
 * DataTable
 *
 * Minimal, high-density data table following Tufte principles
 */
export function DataTable({
  columns,
  data,
  striped = false,
  dense = false,
  showBorders = 'horizontal',
  highlightRow,
  style,
}: DataTableProps) {
  const formatValue = (value: CellValue, column: Column): string => {
    if (typeof value === 'object' && 'value' in value) {
      value = value.value;
    }

    if (typeof value === 'number' && column.precision !== undefined) {
      return value.toFixed(column.precision);
    }

    return String(value);
  };

  const getSparkline = (value: CellValue): number[] | undefined => {
    if (typeof value === 'object' && 'sparkline' in value) {
      return value.sparkline;
    }
    return undefined;
  };

  const getCellAlign = (column: Column): 'flex-start' | 'center' | 'flex-end' => {
    if (column.align === 'center') return 'center';
    if (column.align === 'right') return 'flex-end';
    return 'flex-start';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View
        style={[
          styles.headerRow,
          (showBorders === 'horizontal' || showBorders === 'all') && styles.borderBottom,
        ]}
      >
        {columns.map((column) => (
          <View
            key={column.id}
            style={[
              styles.headerCell,
              { width: column.width, alignItems: getCellAlign(column) },
              (showBorders === 'vertical' || showBorders === 'all') && styles.borderRight,
            ]}
          >
            <Text style={styles.headerText}>{column.header}</Text>
          </View>
        ))}
      </View>

      {/* Data Rows */}
      {data.map((row, rowIndex) => {
        const isHighlighted = highlightRow ? highlightRow(row) : false;
        const isStriped = striped && rowIndex % 2 === 1;

        return (
          <View
            key={rowIndex}
            style={[
              styles.dataRow,
              dense && styles.dataRowDense,
              isStriped && styles.dataRowStriped,
              isHighlighted && styles.dataRowHighlight,
              (showBorders === 'horizontal' || showBorders === 'all') && styles.borderBottom,
            ]}
          >
            {columns.map((column) => {
              const cellValue = row[column.id];
              const sparkline = getSparkline(cellValue);

              return (
                <View
                  key={column.id}
                  style={[
                    styles.dataCell,
                    { width: column.width, alignItems: getCellAlign(column) },
                    (showBorders === 'vertical' || showBorders === 'all') && styles.borderRight,
                  ]}
                >
                  {sparkline && (
                    <Sparkline
                      data={sparkline}
                      width={50}
                      height={16}
                      strokeWidth={1}
                      color={isHighlighted ? '#0284C7' : '#6B7280'}
                      showDot={true}
                    />
                  )}
                  <Text
                    style={[
                      styles.dataText,
                      column.align === 'right' && styles.dataTextRight,
                      isHighlighted && styles.dataTextHighlight,
                    ]}
                  >
                    {formatValue(cellValue, column)}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
  },
  headerCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  dataRowDense: {
    paddingVertical: 6,
  },
  dataRowStriped: {
    backgroundColor: '#F9FAFB',
  },
  dataRowHighlight: {
    backgroundColor: '#F0F9FF',
  },
  dataCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    gap: 4,
  },
  dataText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
    fontVariant: ['tabular-nums'], // Monospaced numbers for alignment
  },
  dataTextRight: {
    textAlign: 'right',
  },
  dataTextHighlight: {
    fontWeight: '600',
    color: '#0284C7',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
});

/**
 * CompactDataGrid
 *
 * Ultra-dense grid for maximum information per square inch
 * Perfect for race statistics, weather data, etc.
 */
interface GridItem {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  sparkline?: number[];
}

interface CompactDataGridProps {
  items: GridItem[];
  columns?: number;
  showTrends?: boolean;
  style?: ViewStyle;
}

export function CompactDataGrid({
  items,
  columns = 3,
  showTrends = true,
  style,
}: CompactDataGridProps) {
  const getTrendSymbol = (trend?: 'up' | 'down' | 'neutral'): string => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '';
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral'): string => {
    if (trend === 'up') return '#10B981';
    if (trend === 'down') return '#EF4444';
    return '#6B7280';
  };

  return (
    <View style={[gridStyles.container, style]}>
      {items.map((item, index) => (
        <View
          key={index}
          style={[gridStyles.item, { width: `${100 / columns}%` }]}
        >
          {/* Label */}
          <Text style={gridStyles.label} numberOfLines={1}>
            {item.label}
          </Text>

          {/* Sparkline (if provided) */}
          {item.sparkline && (
            <Sparkline
              data={item.sparkline}
              width={40}
              height={12}
              strokeWidth={1}
              color="#6B7280"
              showDot={false}
            />
          )}

          {/* Value with trend */}
          <View style={gridStyles.valueRow}>
            <Text style={gridStyles.value}>
              {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
            </Text>
            {item.unit && <Text style={gridStyles.unit}>{item.unit}</Text>}
            {showTrends && item.trend && (
              <Text style={[gridStyles.trend, { color: getTrendColor(item.trend) }]}>
                {getTrendSymbol(item.trend)}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const gridStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  item: {
    padding: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  trend: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
});
