import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

interface TufteFiltersBarProps {
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  locationOptions?: FilterOption[];
  specialtyOptions?: FilterOption[];
  rateOptions?: FilterOption[];
  boatClassOptions?: FilterOption[];
}

/**
 * TufteFiltersBar - Compact horizontal filter bar
 *
 * Design principles:
 * - Single line of filters (minimal vertical space)
 * - Dropdown selectors (not pills)
 * - Immediate filtering on change
 * - Quiet typography until active
 */
export function TufteFiltersBar({
  filters,
  onFilterChange,
  locationOptions = [
    { value: '', label: 'Any Location' },
    { value: 'Hong Kong', label: 'Hong Kong' },
    { value: 'Singapore', label: 'Singapore' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'USA', label: 'United States' },
    { value: 'Australia', label: 'Australia' },
  ],
  specialtyOptions = [
    { value: '', label: 'Any Specialty' },
    { value: 'race_tactics', label: 'Race Tactics' },
    { value: 'boat_speed', label: 'Boat Speed' },
    { value: 'starts', label: 'Starts' },
    { value: 'boat_handling', label: 'Boat Handling' },
    { value: 'weather_strategy', label: 'Weather Strategy' },
    { value: 'mental_coaching', label: 'Mental Coaching' },
  ],
  rateOptions = [
    { value: '', label: 'Any Rate' },
    { value: '5000', label: 'Under $50/hr' },
    { value: '10000', label: 'Under $100/hr' },
    { value: '15000', label: 'Under $150/hr' },
    { value: '20000', label: 'Under $200/hr' },
  ],
  boatClassOptions = [
    { value: '', label: 'Any Boat' },
    { value: 'dragon', label: 'Dragon' },
    { value: 'j70', label: 'J70' },
    { value: 'j80', label: 'J80' },
    { value: 'etchells', label: 'Etchells' },
    { value: 'melges_24', label: 'Melges 24' },
  ],
}: TufteFiltersBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const filterConfigs: FilterConfig[] = [
    { key: 'location', label: 'Location', options: locationOptions },
    { key: 'specialty', label: 'Specialty', options: specialtyOptions },
    { key: 'maxRate', label: 'Rate', options: rateOptions },
  ];

  const getDisplayLabel = (config: FilterConfig) => {
    const currentValue = filters[config.key] || '';
    const option = config.options.find(o => o.value === currentValue);
    return option?.label || config.label;
  };

  const handleSelect = (key: string, value: string) => {
    onFilterChange(key, value);
    setActiveDropdown(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filterConfigs.map((config, index) => (
          <React.Fragment key={config.key}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filters[config.key] && styles.filterButtonActive,
              ]}
              onPress={() => setActiveDropdown(config.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filters[config.key] && styles.filterTextActive,
                ]}
                numberOfLines={1}
              >
                {getDisplayLabel(config)}
              </Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
            {index < filterConfigs.length - 1 && (
              <View style={styles.divider} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Dropdown Modal */}
      {activeDropdown && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveDropdown(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setActiveDropdown(null)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {filterConfigs.find(c => c.key === activeDropdown)?.label}
                </Text>
              </View>
              <ScrollView style={styles.optionsList}>
                {filterConfigs
                  .find(c => c.key === activeDropdown)
                  ?.options.map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionItem,
                        filters[activeDropdown] === option.value &&
                          styles.optionItemActive,
                      ]}
                      onPress={() => handleSelect(activeDropdown, option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          filters[activeDropdown] === option.value &&
                            styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {filters[activeDropdown] === option.value && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const colors = {
  text: '#1a1a1a',
  textMuted: '#666666',
  textLight: '#999999',
  border: '#e5e5e5',
  background: '#ffffff',
  accent: '#2563eb',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  filterButtonActive: {
    // Active state - could add subtle background
  },
  filterText: {
    fontSize: 13,
    color: colors.textMuted,
    flex: 1,
  },
  filterTextActive: {
    color: colors.text,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 8,
    color: colors.textLight,
    marginLeft: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    backgroundColor: colors.border,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '60%',
    ...(Platform.OS === 'web' && {
      maxWidth: 400,
      marginHorizontal: 'auto',
      borderRadius: 12,
      marginBottom: 40,
    }),
  } as any,
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  optionsList: {
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  optionItemActive: {
    backgroundColor: '#f5f5f5',
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
  },
  optionTextActive: {
    fontWeight: '500',
    color: colors.accent,
  },
  checkmark: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
});

export default TufteFiltersBar;
