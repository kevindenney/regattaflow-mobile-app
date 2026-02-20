/**
 * Coach Pricing Editor
 *
 * Allows coaches to manage their pricing post-onboarding:
 * - Hourly rate and currency
 * - Session durations
 * - Per-session-type rates
 * - Custom charges (add-ons)
 * - Package pricing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCoachWorkspace } from '@/hooks/useCoachWorkspace';
import { coachingService } from '@/services/CoachingService';
import { showAlert, showConfirm } from '@/lib/utils/crossPlatformAlert';

const COLORS = {
  primary: '#007AFF',
  primaryLight: '#E5F1FF',
  background: '#F2F2F7',
  card: '#FFFFFF',
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#8E8E93',
  separator: '#C6C6C8',
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  border: '#D1D1D6',
};

const PLATFORM_FEE = 0.15;

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '\u20AC' },
  { code: 'GBP', symbol: '\u00A3' },
  { code: 'HKD', symbol: 'HK$' },
  { code: 'AUD', symbol: 'A$' },
];

const sessionDurations = [
  { value: 30, label: '30 min' },
  { value: 60, label: '60 min' },
  { value: 90, label: '90 min' },
  { value: 120, label: '2 hours' },
];

const sessionTypes = [
  { id: 'on_water', label: 'On-Water', icon: 'boat-outline' },
  { id: 'video_review', label: 'Video Review', icon: 'videocam-outline' },
  { id: 'strategy', label: 'Strategy', icon: 'analytics-outline' },
  { id: 'boat_setup', label: 'Boat Setup', icon: 'cog-outline' },
  { id: 'fitness', label: 'Fitness', icon: 'barbell-outline' },
  { id: 'mental_coaching', label: 'Mental', icon: 'sparkles-outline' },
];

interface CustomCharge {
  id: string;
  label: string;
  amount_cents: number;
  description?: string;
  is_active: boolean;
  session_types?: string[];
}

export default function CoachPricingEditor() {
  const router = useRouter();
  const { coachId, loading: workspaceLoading, refresh: refreshWorkspace } = useCoachWorkspace();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Pricing state
  const [hourlyRate, setHourlyRate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedDurations, setSelectedDurations] = useState<number[]>([60]);
  const [sessionTypeRates, setSessionTypeRates] = useState<Record<string, string>>({});
  const [usePerTypeRates, setUsePerTypeRates] = useState(false);
  const [customCharges, setCustomCharges] = useState<CustomCharge[]>([]);

  // New charge form
  const [showNewChargeForm, setShowNewChargeForm] = useState(false);
  const [newChargeLabel, setNewChargeLabel] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');
  const [newChargeDescription, setNewChargeDescription] = useState('');

  // Edit charge form
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
  const [editChargeLabel, setEditChargeLabel] = useState('');
  const [editChargeAmount, setEditChargeAmount] = useState('');
  const [editChargeDescription, setEditChargeDescription] = useState('');

  const getCurrencySymbol = () => {
    return currencies.find(c => c.code === currency)?.symbol || '$';
  };

  const getNetRate = (rate: string) => {
    const rateNum = parseFloat(rate) || 0;
    return (rateNum * (1 - PLATFORM_FEE)).toFixed(0);
  };

  const loadPricing = useCallback(async () => {
    if (!coachId) return;

    try {
      setLoading(true);
      const pricing = await coachingService.getCoachPricing(coachId);

      if (pricing) {
        setHourlyRate(pricing.hourly_rate ? (pricing.hourly_rate / 100).toString() : '');
        setCurrency(pricing.currency || 'USD');
        setSelectedDurations(pricing.session_durations || [60]);
        setCustomCharges(pricing.custom_charges || []);

        // Check if there are per-type rates
        const hasTypeRates = Object.keys(pricing.session_type_rates || {}).length > 0;
        setUsePerTypeRates(hasTypeRates);

        if (hasTypeRates) {
          const rateStrings: Record<string, string> = {};
          Object.entries(pricing.session_type_rates).forEach(([type, rate]) => {
            rateStrings[type] = ((rate as number) / 100).toString();
          });
          setSessionTypeRates(rateStrings);
        }
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
      showAlert('Error', 'Unable to load pricing settings.');
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPricing();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!coachId) return;

    setSaving(true);
    try {
      const updates: any = {
        hourly_rate: Math.round(parseFloat(hourlyRate || '0') * 100),
        currency,
        session_durations: selectedDurations,
        custom_charges: customCharges,
      };

      if (usePerTypeRates) {
        const rates: Record<string, number> = {};
        Object.entries(sessionTypeRates).forEach(([type, rate]) => {
          if (rate) {
            rates[type] = Math.round(parseFloat(rate) * 100);
          }
        });
        updates.session_type_rates = rates;
      } else {
        updates.session_type_rates = {};
      }

      const result = await coachingService.updateCoachPricing(coachId, updates);

      if (result.success) {
        setHasChanges(false);
        showAlert('Saved', 'Your pricing has been updated. Changes apply to new bookings only.');
      } else {
        showAlert('Error', result.error || 'Unable to save pricing.');
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      showAlert('Error', 'Unable to save pricing settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      showConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Discard them?',
        () => router.back(),
        { destructive: true }
      );
    } else {
      router.back();
    }
  };

  const toggleDuration = (duration: number) => {
    setHasChanges(true);
    if (selectedDurations.includes(duration)) {
      if (selectedDurations.length > 1) {
        setSelectedDurations(selectedDurations.filter(d => d !== duration));
      }
    } else {
      setSelectedDurations([...selectedDurations, duration].sort((a, b) => a - b));
    }
  };

  const addCustomCharge = () => {
    if (!newChargeLabel || !newChargeAmount) {
      showAlert('Missing Info', 'Please enter a label and amount for the charge.');
      return;
    }

    const newCharge: CustomCharge = {
      id: crypto.randomUUID(),
      label: newChargeLabel,
      amount_cents: Math.round(parseFloat(newChargeAmount) * 100),
      description: newChargeDescription || undefined,
      is_active: true,
    };

    setCustomCharges([...customCharges, newCharge]);
    setNewChargeLabel('');
    setNewChargeAmount('');
    setNewChargeDescription('');
    setShowNewChargeForm(false);
    setHasChanges(true);
  };

  const toggleChargeActive = (chargeId: string) => {
    setCustomCharges(
      customCharges.map(charge =>
        charge.id === chargeId ? { ...charge, is_active: !charge.is_active } : charge
      )
    );
    setHasChanges(true);
  };

  const deleteCharge = (chargeId: string) => {
    showConfirm(
      'Delete Charge',
      'Remove this custom charge?',
      () => {
        setCustomCharges(customCharges.filter(c => c.id !== chargeId));
        setHasChanges(true);
      },
      { destructive: true }
    );
  };

  const openEditCharge = (charge: CustomCharge) => {
    setEditingChargeId(charge.id);
    setEditChargeLabel(charge.label);
    setEditChargeAmount((charge.amount_cents / 100).toString());
    setEditChargeDescription(charge.description || '');
  };

  const saveEditedCharge = () => {
    if (!editingChargeId || !editChargeLabel || !editChargeAmount) {
      showAlert('Missing Info', 'Please enter a label and amount for the charge.');
      return;
    }

    setCustomCharges(
      customCharges.map(charge =>
        charge.id === editingChargeId
          ? {
              ...charge,
              label: editChargeLabel,
              amount_cents: Math.round(parseFloat(editChargeAmount) * 100),
              description: editChargeDescription || undefined,
            }
          : charge
      )
    );
    setEditingChargeId(null);
    setEditChargeLabel('');
    setEditChargeAmount('');
    setEditChargeDescription('');
    setHasChanges(true);
  };

  const cancelEditCharge = () => {
    setEditingChargeId(null);
    setEditChargeLabel('');
    setEditChargeAmount('');
    setEditChargeDescription('');
  };

  if (workspaceLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading pricing...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Manage Pricing</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
          disabled={!hasChanges || saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.saveButtonText, !hasChanges && styles.saveButtonTextDisabled]}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          <Text style={styles.infoBannerText}>
            Changes apply to new bookings only. Existing sessions keep their original rate.
          </Text>
        </View>

        {/* Base Rate Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASE HOURLY RATE</Text>

          <View style={styles.card}>
            <View style={styles.rateInputRow}>
              <Text style={styles.currencySymbol}>{getCurrencySymbol()}</Text>
              <TextInput
                style={styles.rateInput}
                placeholder="100"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={hourlyRate}
                onChangeText={(text) => {
                  setHourlyRate(text);
                  setHasChanges(true);
                }}
                keyboardType="numeric"
              />
              <Text style={styles.perHour}>/hour</Text>
            </View>
          </View>

          {/* Currency Selection */}
          <View style={styles.chipGrid}>
            {currencies.map((curr) => {
              const isSelected = currency === curr.code;
              return (
                <TouchableOpacity
                  key={curr.code}
                  style={[styles.currencyChip, isSelected && styles.currencyChipSelected]}
                  onPress={() => {
                    setCurrency(curr.code);
                    setHasChanges(true);
                  }}
                >
                  <Text style={[styles.currencyChipText, isSelected && styles.currencyChipTextSelected]}>
                    {curr.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Net Earnings */}
          {hourlyRate && (
            <View style={styles.earningsCard}>
              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>After 15% platform fee</Text>
                <Text style={styles.earningsValue}>
                  {getCurrencySymbol()}{getNetRate(hourlyRate)}/hr net
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Session Durations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SESSION LENGTHS OFFERED</Text>

          <View style={styles.chipGrid}>
            {sessionDurations.map((duration) => {
              const isSelected = selectedDurations.includes(duration.value);
              return (
                <TouchableOpacity
                  key={duration.value}
                  style={[styles.durationChip, isSelected && styles.durationChipSelected]}
                  onPress={() => toggleDuration(duration.value)}
                >
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" style={styles.chipIcon} />
                  )}
                  <Text style={[styles.durationChipText, isSelected && styles.durationChipTextSelected]}>
                    {duration.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Per-Type Rates Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Different rates per session type</Text>
              <Text style={styles.toggleDescription}>
                Set custom rates for each coaching type
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleSwitch, usePerTypeRates && styles.toggleSwitchOn]}
              onPress={() => {
                setUsePerTypeRates(!usePerTypeRates);
                setHasChanges(true);
              }}
            >
              <View style={[styles.toggleKnob, usePerTypeRates && styles.toggleKnobOn]} />
            </TouchableOpacity>
          </View>

          {usePerTypeRates && (
            <View style={styles.card}>
              {sessionTypes.map((type, index) => (
                <React.Fragment key={type.id}>
                  {index > 0 && <View style={styles.inputSeparator} />}
                  <View style={styles.typeRateRow}>
                    <View style={styles.typeRateInfo}>
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={COLORS.secondaryLabel}
                      />
                      <Text style={styles.typeRateLabel}>{type.label}</Text>
                    </View>
                    <View style={styles.typeRateInput}>
                      <Text style={styles.typeRateCurrency}>{getCurrencySymbol()}</Text>
                      <TextInput
                        style={styles.typeRateValue}
                        placeholder={hourlyRate || '—'}
                        placeholderTextColor={COLORS.tertiaryLabel}
                        value={sessionTypeRates[type.id] || ''}
                        onChangeText={(text) => {
                          setSessionTypeRates({ ...sessionTypeRates, [type.id]: text });
                          setHasChanges(true);
                        }}
                        keyboardType="numeric"
                      />
                      <Text style={styles.typeRateUnit}>/hr</Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Custom Charges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CUSTOM CHARGES</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowNewChargeForm(true)}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Add-on fees like boat rental, travel surcharge, or materials
          </Text>

          {customCharges.length === 0 && !showNewChargeForm && (
            <View style={styles.emptyState}>
              <Ionicons name="pricetag-outline" size={32} color={COLORS.tertiaryLabel} />
              <Text style={styles.emptyStateText}>No custom charges yet</Text>
            </View>
          )}

          {customCharges.map((charge) => (
            <View key={charge.id} style={styles.chargeCard}>
              <TouchableOpacity
                style={styles.chargeToggle}
                onPress={() => toggleChargeActive(charge.id)}
              >
                <Ionicons
                  name={charge.is_active ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={charge.is_active ? COLORS.primary : COLORS.tertiaryLabel}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.chargeInfo}
                onPress={() => openEditCharge(charge)}
              >
                <Text style={[styles.chargeLabel, !charge.is_active && styles.chargeLabelInactive]}>
                  {charge.label}
                </Text>
                {charge.description && (
                  <Text style={styles.chargeDescription}>{charge.description}</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.chargeAmount}>
                {getCurrencySymbol()}{(charge.amount_cents / 100).toFixed(0)}
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteCharge(charge.id)}
              >
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}

          {showNewChargeForm && (
            <View style={styles.newChargeForm}>
              <Text style={styles.newChargeFormTitle}>New Custom Charge</Text>
              <TextInput
                style={styles.newChargeInput}
                placeholder="Label (e.g., Boat Rental)"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={newChargeLabel}
                onChangeText={setNewChargeLabel}
              />
              <View style={styles.newChargeAmountRow}>
                <Text style={styles.newChargeCurrency}>{getCurrencySymbol()}</Text>
                <TextInput
                  style={styles.newChargeAmountInput}
                  placeholder="Amount"
                  placeholderTextColor={COLORS.tertiaryLabel}
                  value={newChargeAmount}
                  onChangeText={setNewChargeAmount}
                  keyboardType="numeric"
                />
              </View>
              <TextInput
                style={[styles.newChargeInput, styles.newChargeDescInput]}
                placeholder="Description (optional)"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={newChargeDescription}
                onChangeText={setNewChargeDescription}
                multiline
              />
              <View style={styles.newChargeActions}>
                <TouchableOpacity
                  style={styles.newChargeCancelButton}
                  onPress={() => {
                    setShowNewChargeForm(false);
                    setNewChargeLabel('');
                    setNewChargeAmount('');
                    setNewChargeDescription('');
                  }}
                >
                  <Text style={styles.newChargeCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.newChargeAddButton}
                  onPress={addCustomCharge}
                >
                  <Text style={styles.newChargeAddText}>Add Charge</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Edit Charge Form */}
          {editingChargeId && (
            <View style={styles.newChargeForm}>
              <Text style={styles.newChargeFormTitle}>Edit Custom Charge</Text>
              <TextInput
                style={styles.newChargeInput}
                placeholder="Label (e.g., Boat Rental)"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={editChargeLabel}
                onChangeText={setEditChargeLabel}
              />
              <View style={styles.newChargeAmountRow}>
                <Text style={styles.newChargeCurrency}>{getCurrencySymbol()}</Text>
                <TextInput
                  style={styles.newChargeAmountInput}
                  placeholder="Amount"
                  placeholderTextColor={COLORS.tertiaryLabel}
                  value={editChargeAmount}
                  onChangeText={setEditChargeAmount}
                  keyboardType="numeric"
                />
              </View>
              <TextInput
                style={[styles.newChargeInput, styles.newChargeDescInput]}
                placeholder="Description (optional)"
                placeholderTextColor={COLORS.tertiaryLabel}
                value={editChargeDescription}
                onChangeText={setEditChargeDescription}
                multiline
              />
              <View style={styles.newChargeActions}>
                <TouchableOpacity
                  style={styles.newChargeCancelButton}
                  onPress={cancelEditCharge}
                >
                  <Text style={styles.newChargeCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.newChargeAddButton}
                  onPress={saveEditedCharge}
                >
                  <Text style={styles.newChargeAddText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Pricing Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT SAILORS SEE</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="eye-outline" size={20} color={COLORS.secondaryLabel} />
              <Text style={styles.previewTitle}>Pricing Preview</Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewRate}>
                From {getCurrencySymbol()}{hourlyRate || '—'}/hr
              </Text>
              <Text style={styles.previewDurations}>
                Sessions: {selectedDurations.map(d => d === 120 ? '2hr' : `${d}min`).join(', ')}
              </Text>
              {customCharges.filter(c => c.is_active).length > 0 && (
                <Text style={styles.previewCharges}>
                  + {customCharges.filter(c => c.is_active).length} optional add-ons available
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: COLORS.tertiaryLabel,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondaryLabel,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondaryLabel,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginBottom: 12,
    marginTop: -8,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Rate Input
  rateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.label,
    marginRight: 4,
  },
  rateInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.label,
    padding: 0,
    minHeight: 40,
  },
  perHour: {
    fontSize: 17,
    color: COLORS.secondaryLabel,
    marginLeft: 4,
  },

  // Chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  chipIcon: {
    marginRight: 6,
  },

  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currencyChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  currencyChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.label,
  },
  currencyChipTextSelected: {
    color: '#FFFFFF',
  },

  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationChipText: {
    fontSize: 15,
    color: COLORS.label,
  },
  durationChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Earnings Card
  earningsCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },
  earningsValue: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
  },
  toggleDescription: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  toggleSwitchOn: {
    backgroundColor: COLORS.success,
  },
  toggleKnob: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobOn: {
    marginLeft: 20,
  },

  // Type Rate Rows
  typeRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typeRateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeRateLabel: {
    fontSize: 15,
    color: COLORS.label,
  },
  typeRateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
  },
  typeRateCurrency: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginRight: 4,
  },
  typeRateValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
    minWidth: 40,
    textAlign: 'right',
    padding: 0,
  },
  typeRateUnit: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginLeft: 4,
  },

  inputSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.separator,
    marginLeft: 16,
  },

  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
    marginTop: 8,
  },

  // Charge Card
  chargeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  chargeToggle: {
    marginRight: 12,
  },
  chargeInfo: {
    flex: 1,
  },
  chargeLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.label,
  },
  chargeLabelInactive: {
    color: COLORS.tertiaryLabel,
  },
  chargeDescription: {
    fontSize: 13,
    color: COLORS.tertiaryLabel,
    marginTop: 2,
  },
  chargeAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },

  // New Charge Form
  newChargeForm: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  newChargeFormTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
    marginBottom: 12,
  },
  newChargeInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.label,
    marginBottom: 10,
  },
  newChargeDescInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  newChargeAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  newChargeCurrency: {
    fontSize: 17,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
    marginRight: 4,
  },
  newChargeAmountInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
    padding: 12,
  },
  newChargeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  newChargeCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  newChargeCancelText: {
    fontSize: 15,
    color: COLORS.tertiaryLabel,
  },
  newChargeAddButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  newChargeAddText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Preview
  previewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondaryLabel,
  },
  previewContent: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 10,
  },
  previewRate: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.label,
    marginBottom: 4,
  },
  previewDurations: {
    fontSize: 14,
    color: COLORS.secondaryLabel,
    marginBottom: 4,
  },
  previewCharges: {
    fontSize: 14,
    color: COLORS.primary,
  },
});
