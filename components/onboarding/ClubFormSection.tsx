/**
 * Club Form Section Component
 * Individual form sections with auto-complete and suggestions
 */

import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native';
import { SuggestionChip } from './SuggestionChip';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  required = false,
  multiline = false,
  keyboardType = 'default',
}: FormFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

interface AutocompleteFieldProps<T> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  suggestions: T[];
  renderSuggestion: (item: T) => React.ReactNode;
  onSelectSuggestion: (item: T) => void;
  loading?: boolean;
  placeholder?: string;
  required?: boolean;
}

export function AutocompleteField<T>({
  label,
  value,
  onChangeText,
  suggestions,
  renderSuggestion,
  onSelectSuggestion,
  loading = false,
  placeholder,
  required = false,
}: AutocompleteFieldProps<T>) {
  const [isFocused, setIsFocused] = React.useState(false);
  const showSuggestions = isFocused && (suggestions.length > 0 || loading);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
      />

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6B7280" />
              <Text style={styles.loadingText}>Loading suggestions...</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    onSelectSuggestion(item);
                    setIsFocused(false);
                  }}
                >
                  {renderSuggestion(item)}
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              nestedScrollEnabled
            />
          )}
        </View>
      )}
    </View>
  );
}

interface ChipListFieldProps {
  label: string;
  chips: string[];
  onAddChip: (chip: string) => void;
  onRemoveChip: (index: number) => void;
  placeholder?: string;
  suggestions?: string[];
  required?: boolean;
}

export function ChipListField({
  label,
  chips,
  onAddChip,
  onRemoveChip,
  placeholder,
  suggestions = [],
  required = false,
}: ChipListFieldProps) {
  const [inputValue, setInputValue] = React.useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAddChip(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Existing chips */}
      {chips.length > 0 && (
        <View style={styles.chipContainer}>
          {chips.map((chip, index) => (
            <View key={index} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
              <TouchableOpacity
                style={styles.chipRemove}
                onPress={() => onRemoveChip(index)}
              >
                <X size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Suggested chips */}
      {suggestions.length > 0 && (
        <View style={styles.suggestedChipsContainer}>
          <Text style={styles.suggestedLabel}>Suggested:</Text>
          <View style={styles.chipContainer}>
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.chip, styles.suggestedChip]}
                onPress={() => onAddChip(suggestion)}
              >
                <Plus size={12} color="#3B82F6" />
                <Text style={[styles.chipText, styles.suggestedChipText]}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Add new chip */}
      <View style={styles.addChipContainer}>
        <TextInput
          style={[styles.input, styles.chipInput]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  defaultExpanded = true,
  children,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        {isExpanded ? (
          <ChevronUp size={20} color="#6B7280" />
        ) : (
          <ChevronDown size={20} color="#6B7280" />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sectionContent}>
          {React.Children.map(children, (child, index) => {
            if (typeof child === 'string' || typeof child === 'number') {
              return (
                <Text key={`section-text-${index}`} style={styles.sectionTextFallback}>
                  {child}
                </Text>
              );
            }
            return child;
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionContent: {
    padding: 16,
  },
  sectionTextFallback: {
    fontSize: 14,
    color: '#374151',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  chipRemove: {
    padding: 2,
  },
  suggestedChipsContainer: {
    marginBottom: 12,
  },
  suggestedLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  suggestedChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suggestedChipText: {
    color: '#3B82F6',
  },
  addChipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  chipInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
