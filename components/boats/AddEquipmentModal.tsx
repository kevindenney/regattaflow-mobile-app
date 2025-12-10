/**
 * Add Equipment Modal
 * Modal for adding new equipment with template suggestions
 * and custom item entry
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { equipmentService, type EquipmentTemplate, type EquipmentCategory, type BoatEquipment, type CreateEquipmentInput } from '@/services/EquipmentService';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('AddEquipmentModal');

interface AddEquipmentModalProps {
  visible: boolean;
  boatId: string;
  classId?: string;
  onClose: () => void;
  onEquipmentAdded: (equipment: BoatEquipment) => void;
}

type Step = 'category' | 'template' | 'custom';

// Category icons mapping
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  mast: 'git-network-outline',
  boom: 'remove-outline',
  spinnaker_pole: 'remove-outline',
  forestay: 'trending-up-outline',
  backstay: 'trending-down-outline',
  shrouds: 'git-branch-outline',
  spreaders: 'expand-outline',
  halyards: 'arrow-up-outline',
  sheets: 'swap-horizontal-outline',
  control_lines: 'options-outline',
  mainsail: 'flag-outline',
  jib: 'flag-outline',
  genoa: 'flag-outline',
  spinnaker: 'balloon-outline',
  code_zero: 'flag-outline',
  winches: 'sync-circle-outline',
  blocks: 'ellipse-outline',
  cleats: 'remove-outline',
  tracks: 'reorder-four-outline',
  tiller: 'resize-outline',
  wheel: 'radio-button-on-outline',
  rudder: 'navigate-outline',
  keel: 'caret-down-outline',
  centerboard: 'chevron-down-outline',
  instruments: 'speedometer-outline',
  gps: 'location-outline',
  vhf: 'radio-outline',
  compass: 'compass-outline',
  life_jackets: 'shield-checkmark-outline',
  safety_gear: 'medkit-outline',
  anchor: 'boat-outline',
  covers: 'umbrella-outline',
  trailer: 'car-outline',
  other: 'ellipsis-horizontal-outline',
};

export function AddEquipmentModal({
  visible,
  boatId,
  classId,
  onClose,
  onEquipmentAdded,
}: AddEquipmentModalProps) {
  const [step, setStep] = useState<Step>('category');
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for custom entry
  const [formData, setFormData] = useState<CreateEquipmentInput>({
    boat_id: boatId,
    custom_name: '',
    category: '',
  });

  // Load categories
  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  // Load templates when category is selected
  useEffect(() => {
    if (selectedCategory && step === 'template') {
      loadTemplates(selectedCategory);
    }
  }, [selectedCategory, step]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const cats = await equipmentService.getCategories();
      setCategories(cats);
    } catch (error) {
      logger.error('Error loading categories', { error });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (category: string) => {
    try {
      setLoading(true);
      const tmpls = await equipmentService.getTemplates({ category, classId });
      setTemplates(tmpls);
    } catch (error) {
      logger.error('Error loading templates', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setFormData(prev => ({ ...prev, category }));
    setStep('template');
  };

  const handleTemplateSelect = async (template: EquipmentTemplate) => {
    try {
      setSaving(true);
      const equipment = await equipmentService.createFromTemplate(template.id, boatId);
      onEquipmentAdded(equipment);
      handleClose();
    } catch (error) {
      logger.error('Error creating from template', { error });
      // Fall back to custom form with template data
      setFormData(prev => ({
        ...prev,
        custom_name: template.name,
        manufacturer: template.default_manufacturer,
        model: template.default_model,
        expected_lifespan_years: template.default_expected_lifespan_years,
        expected_lifespan_hours: template.default_expected_lifespan_hours,
        maintenance_interval_days: template.default_maintenance_interval_days,
        lubrication_type: template.default_lubrication_type,
        care_instructions: template.default_care_instructions,
      }));
      setStep('custom');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomEntry = () => {
    setStep('custom');
  };

  const handleSaveCustom = async () => {
    if (!formData.custom_name.trim()) {
      return;
    }

    try {
      setSaving(true);
      const equipment = await equipmentService.createEquipment(formData);
      onEquipmentAdded(equipment);
      handleClose();
    } catch (error) {
      logger.error('Error creating equipment', { error });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = useCallback(() => {
    setStep('category');
    setSelectedCategory(null);
    setTemplates([]);
    setFormData({
      boat_id: boatId,
      custom_name: '',
      category: '',
    });
    onClose();
  }, [boatId, onClose]);

  const handleBack = () => {
    if (step === 'custom') {
      setStep('template');
    } else if (step === 'template') {
      setStep('category');
      setSelectedCategory(null);
    }
  };

  const updateFormData = (field: keyof CreateEquipmentInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    return CATEGORY_ICONS[category] || 'cube-outline';
  };

  const selectedCategoryInfo = categories.find(c => c.id === selectedCategory);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={step === 'category' ? handleClose : handleBack} style={styles.headerButton}>
            <Ionicons name={step === 'category' ? 'close' : 'arrow-back'} size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 'category' && 'Add Equipment'}
            {step === 'template' && selectedCategoryInfo?.name}
            {step === 'custom' && 'Custom Entry'}
          </Text>
          <View style={styles.headerButton} />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <>
            {/* Step: Category Selection */}
            {step === 'category' && (
              <ScrollView style={styles.content} contentContainerStyle={styles.categoryGrid}>
                {categories.filter(c => !c.parent_category).map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => handleCategorySelect(category.id)}
                  >
                    <View style={styles.categoryIcon}>
                      <Ionicons
                        name={getCategoryIcon(category.id)}
                        size={28}
                        color="#3B82F6"
                      />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    {category.description && (
                      <Text style={styles.categoryDescription} numberOfLines={2}>
                        {category.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Step: Template Selection */}
            {step === 'template' && (
              <ScrollView style={styles.content} contentContainerStyle={styles.templateList}>
                {/* Custom entry option */}
                <TouchableOpacity
                  style={styles.customEntryCard}
                  onPress={handleCustomEntry}
                >
                  <View style={styles.customEntryIcon}>
                    <Ionicons name="add-circle" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.customEntryInfo}>
                    <Text style={styles.customEntryTitle}>Custom Entry</Text>
                    <Text style={styles.customEntryDescription}>
                      Enter details manually for equipment not in our templates
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>

                {templates.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Popular Templates</Text>
                    {templates.map(template => (
                      <TouchableOpacity
                        key={template.id}
                        style={styles.templateCard}
                        onPress={() => handleTemplateSelect(template)}
                        disabled={saving}
                      >
                        <View style={styles.templateInfo}>
                          <Text style={styles.templateName}>{template.name}</Text>
                          {template.default_manufacturer && (
                            <Text style={styles.templateMeta}>
                              {template.default_manufacturer}
                              {template.default_model ? ` • ${template.default_model}` : ''}
                            </Text>
                          )}
                          <View style={styles.templateDetails}>
                            {template.default_maintenance_interval_days && (
                              <View style={styles.templateDetail}>
                                <Ionicons name="build-outline" size={12} color="#64748B" />
                                <Text style={styles.templateDetailText}>
                                  Service every {template.default_maintenance_interval_days}d
                                </Text>
                              </View>
                            )}
                            {template.default_expected_lifespan_years && (
                              <View style={styles.templateDetail}>
                                <Ionicons name="time-outline" size={12} color="#64748B" />
                                <Text style={styles.templateDetailText}>
                                  ~{template.default_expected_lifespan_years}yr lifespan
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="add-circle-outline" size={24} color="#3B82F6" />
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>
            )}

            {/* Step: Custom Entry Form */}
            {step === 'custom' && (
              <ScrollView style={styles.content} contentContainerStyle={styles.formContainer}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.custom_name}
                    onChangeText={(v) => updateFormData('custom_name', v)}
                    placeholder="e.g., Main Halyard, Primary Winch"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Manufacturer</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.manufacturer || ''}
                    onChangeText={(v) => updateFormData('manufacturer', v)}
                    placeholder="e.g., Harken, North Sails, Selden"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Model</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.model || ''}
                    onChangeText={(v) => updateFormData('model', v)}
                    placeholder="e.g., B40.2, 3DL+"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Serial Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.serial_number || ''}
                    onChangeText={(v) => updateFormData('serial_number', v)}
                    placeholder="Optional"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Purchase Date</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.purchase_date || ''}
                      onChangeText={(v) => updateFormData('purchase_date', v)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.formLabel}>Price</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.purchase_price?.toString() || ''}
                      onChangeText={(v) => updateFormData('purchase_price', parseFloat(v) || undefined)}
                      placeholder="$0.00"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Maintenance Interval (days)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.maintenance_interval_days?.toString() || ''}
                    onChangeText={(v) => updateFormData('maintenance_interval_days', parseInt(v) || undefined)}
                    placeholder="e.g., 90 for quarterly service"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Lubrication Type</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.lubrication_type || ''}
                    onChangeText={(v) => updateFormData('lubrication_type', v)}
                    placeholder="e.g., Harken winch grease, McLube"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Care Instructions</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={formData.care_instructions || ''}
                    onChangeText={(v) => updateFormData('care_instructions', v)}
                    placeholder="Any specific care or maintenance notes..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Manufacturer Documentation URL</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.manufacturer_doc_url || ''}
                    onChangeText={(v) => updateFormData('manufacturer_doc_url', v)}
                    placeholder="Link to manual or specs"
                    placeholderTextColor="#94A3B8"
                    keyboardType="url"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Notes</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={formData.notes || ''}
                    onChangeText={(v) => updateFormData('notes', v)}
                    placeholder="Additional notes..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 100 }} />
              </ScrollView>
            )}
          </>
        )}

        {/* Save Button (Custom step only) */}
        {step === 'custom' && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, (!formData.custom_name.trim() || saving) && styles.saveButtonDisabled]}
              onPress={handleSaveCustom}
              disabled={!formData.custom_name.trim() || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Add Equipment</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  templateList: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  customEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    borderStyle: 'dashed',
  },
  customEntryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customEntryInfo: {
    flex: 1,
    gap: 2,
  },
  customEntryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  customEntryDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  templateInfo: {
    flex: 1,
    gap: 4,
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  templateMeta: {
    fontSize: 13,
    color: '#64748B',
  },
  templateDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  templateDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateDetailText: {
    fontSize: 11,
    color: '#64748B',
  },
  formContainer: {
    padding: 16,
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1E293B',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AddEquipmentModal;

