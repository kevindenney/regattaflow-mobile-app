/**
 * TufteBoatDetail - Edward Tufte-inspired boat detail page
 *
 * Design Principles Applied:
 * - High data-ink ratio: Every pixel conveys information
 * - No chartjunk: Removed gradients, shadows, decorative icons
 * - Small multiples: Consistent row format for equipment/sails
 * - Typography hierarchy: Size and weight separate content levels
 * - Marginalia: Side annotations provide context
 * - Single scroll: No hidden tabs, all information visible
 * - Hairline rules: Thin separators instead of boxes
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, ChevronRight, X } from 'lucide-react-native';

import { supabase } from '@/services/supabase';
import { equipmentService } from '@/services/EquipmentService';
import { SailInspectionService, type SailWithHealth, type SailInspection } from '@/services/SailInspectionService';
import { createLogger } from '@/lib/utils/logger';
import { CrewManagement } from '@/components/sailor';
import { SailInspectionWizard } from '@/components/sail-inspection';
import {
  useSailProducts,
  formatWindRange,
  getWeightCategoryLabel,
  COMMON_SAILMAKERS,
  type SailProduct,
} from '@/hooks/useSailProducts';

const logger = createLogger('TufteBoatDetail');

// =============================================================================
// TUFTE COLOR PALETTE - Minimal, functional colors
// =============================================================================

const TUFTE = {
  // Typography
  ink: '#1a1a1a',           // Primary text - near black
  inkLight: '#4a4a4a',      // Secondary text
  inkMuted: '#8a8a8a',      // Tertiary/marginalia

  // Background
  paper: '#fefefe',         // Pure background
  paperWarm: '#faf8f5',     // Warm tint for sections

  // Functional accents (used sparingly)
  accent: '#c41e3a',        // Carmine red - attention/action
  accentMuted: '#8b0000',   // Dark red for text
  success: '#228b22',       // Forest green - good condition
  warning: '#b8860b',       // Dark goldenrod - needs attention

  // Rules
  rule: '#e0e0e0',          // Hairline separators
  ruleStrong: '#c0c0c0',    // Stronger dividers
};

// =============================================================================
// TYPES
// =============================================================================

interface BoatData {
  id: string;
  sailor_id: string;
  class_id: string;
  name: string | null;
  sail_number: string | null;
  is_primary: boolean;
  ownership_type: string | null;
  manufacturer: string | null;
  year_built: number | null;
  hull_material: string | null;
  storage_location: string | null;
  boat_class?: {
    id: string;
    name: string;
  };
}

interface EquipmentItem {
  id: string;
  custom_name: string;
  category: string;
  status: string;
  condition: string | null;
  total_races_used: number | null;
  last_used_date: string | null;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const getConditionIndicator = (score: number | null | undefined): { label: string; color: string } => {
  if (score == null) return { label: 'Not inspected', color: TUFTE.inkMuted };
  if (score >= 85) return { label: 'Excellent', color: TUFTE.success };
  if (score >= 70) return { label: 'Good', color: TUFTE.ink };
  if (score >= 50) return { label: 'Fair', color: TUFTE.warning };
  return { label: 'Needs attention', color: TUFTE.accent };
};

// =============================================================================
// MARGINALIA COMPONENT - Side annotations in Tufte style
// =============================================================================

interface MarginaliaProps {
  children: React.ReactNode;
}

function Marginalia({ children }: MarginaliaProps) {
  return (
    <Text style={styles.marginalia}>{children}</Text>
  );
}

// =============================================================================
// SECTION HEADER - Typography-driven hierarchy
// =============================================================================

interface SectionHeaderProps {
  title: string;
  count?: number;
  action?: { label: string; onPress: () => void };
}

function SectionHeader({ title, count, action }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && (
          <Text style={styles.sectionCount}>{count}</Text>
        )}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// DATA ROW - Consistent format for key-value pairs
// =============================================================================

interface DataRowProps {
  label: string;
  value: string | number | null;
  marginalia?: string;
  highlight?: boolean;
}

function DataRow({ label, value, marginalia, highlight }: DataRowProps) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <View style={styles.dataValueContainer}>
        <Text style={[styles.dataValue, highlight && styles.dataValueHighlight]}>
          {value ?? '—'}
        </Text>
        {marginalia && <Marginalia>{marginalia}</Marginalia>}
      </View>
    </View>
  );
}

// =============================================================================
// SAIL ROW - Small multiple for sail inventory
// =============================================================================

interface SailRowProps {
  sail: SailWithHealth;
  onPress: () => void;
}

function SailRow({ sail, onPress }: SailRowProps) {
  const condition = getConditionIndicator(sail.condition_score);
  const sailName = sail.name || `${sail.sail_type || 'Sail'} ${sail.sail_number ? `#${sail.sail_number}` : ''}`.trim();

  return (
    <TouchableOpacity style={styles.sailRow} onPress={onPress}>
      <View style={styles.sailRowMain}>
        <Text style={styles.sailName}>{sailName}</Text>
        <Text style={styles.sailMeta}>
          {sail.sailmaker || 'Unknown maker'}
          {sail.total_usage_hours ? ` · ${sail.total_usage_hours}h` : ''}
        </Text>
      </View>
      <View style={styles.sailRowRight}>
        <Text style={[styles.sailCondition, { color: condition.color }]}>
          {sail.condition_score != null ? `${sail.condition_score}%` : '—'}
        </Text>
        <Text style={styles.sailConditionLabel}>{condition.label}</Text>
      </View>
      <ChevronRight size={16} color={TUFTE.inkMuted} />
    </TouchableOpacity>
  );
}

// =============================================================================
// EQUIPMENT ROW - Small multiple for equipment
// =============================================================================

interface EquipmentRowProps {
  item: EquipmentItem;
  onPress: () => void;
}

function EquipmentRow({ item, onPress }: EquipmentRowProps) {
  const statusColor = item.status === 'active' ? TUFTE.success : TUFTE.inkMuted;

  return (
    <TouchableOpacity style={styles.equipmentRow} onPress={onPress}>
      <View style={styles.equipmentRowMain}>
        <Text style={styles.equipmentName}>{item.custom_name}</Text>
        <Text style={styles.equipmentMeta}>
          {item.category}
          {item.total_races_used ? ` · ${item.total_races_used} races` : ''}
        </Text>
      </View>
      <View style={styles.equipmentRowRight}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.equipmentStatus, { color: statusColor }]}>
          {item.condition || item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// =============================================================================
// EMPTY STATE - Minimal, action-oriented
// =============================================================================

interface EmptyStateProps {
  message: string;
  action?: { label: string; onPress: () => void };
}

function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{message}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={styles.emptyStateAction}>
          <Plus size={14} color={TUFTE.accent} />
          <Text style={styles.emptyStateActionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// =============================================================================
// ADD SAIL MODAL - Minimal Tufte-style form
// =============================================================================

type SailType = 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero';

const SAIL_TYPES: Array<{ key: SailType; label: string }> = [
  { key: 'mainsail', label: 'Mainsail' },
  { key: 'jib', label: 'Jib' },
  { key: 'genoa', label: 'Genoa' },
  { key: 'spinnaker', label: 'Spinnaker' },
  { key: 'code_zero', label: 'Code Zero' },
];

interface AddSailModalProps {
  visible: boolean;
  boatId: string;
  sailorId: string;
  classId: string;
  className: string | null;
  onClose: () => void;
  onSailAdded: () => void;
}

function AddSailModal({ visible, boatId, sailorId, classId, className, onClose, onSailAdded }: AddSailModalProps) {
  const [sailType, setSailType] = useState<SailType>('mainsail');
  const [name, setName] = useState('');
  const [sailmaker, setSailmaker] = useState('');
  const [customSailmaker, setCustomSailmaker] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<SailProduct | null>(null);
  const [customModel, setCustomModel] = useState('');
  const [sailNumber, setSailNumber] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch sail products for this class and type
  const { products, isLoading: productsLoading } = useSailProducts(className, sailType);

  // Get products for selected sailmaker
  const sailmakerProducts = products.filter((p) => p.sailmaker === sailmaker);

  // Get unique sailmakers from products, or fall back to common ones
  const availableSailmakers = products.length > 0
    ? [...new Set(products.map((p) => p.sailmaker))]
    : [...COMMON_SAILMAKERS];

  // Reset model when sailmaker changes
  const handleSailmakerChange = (maker: string) => {
    setSailmaker(maker);
    setSelectedProduct(null);
    setCustomModel('');
    // Auto-set name based on sailmaker selection
    if (maker && maker !== 'Other') {
      setName('');
    }
  };

  // Handle product selection
  const handleProductSelect = (product: SailProduct | null) => {
    setSelectedProduct(product);
    if (product) {
      // Auto-fill name from product
      setName(`${product.model_name} - ${getWeightCategoryLabel(product.weight_category)}`);
      setCustomModel('');
    } else {
      setName('');
    }
  };

  // Handle sail type change - reset sailmaker and model
  const handleSailTypeChange = (type: SailType) => {
    setSailType(type);
    setSailmaker('');
    setSelectedProduct(null);
    setCustomModel('');
    setName('');
  };

  const handleSave = async () => {
    const effectiveSailmaker = sailmaker === 'Other' ? customSailmaker : sailmaker;
    const effectiveName = name.trim() ||
      (selectedProduct ? selectedProduct.model_name : null) ||
      customModel ||
      `${sailType} ${sailNumber}`.trim();

    if (!effectiveName && !sailNumber.trim()) {
      Alert.alert('Required', 'Enter a sail name or number');
      return;
    }

    setSaving(true);
    try {
      // Create boat_equipment entry
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('boat_equipment')
        .insert({
          boat_id: boatId,
          sailor_id: sailorId,
          class_id: classId,
          category: sailType,
          custom_name: effectiveName,
          status: 'active',
          condition: 'good',
        })
        .select('id')
        .single();

      if (equipmentError) throw equipmentError;

      // Create sail_equipment_details entry with sailmaker info
      if (equipmentData?.id && (effectiveSailmaker || selectedProduct)) {
        const { error: detailsError } = await supabase
          .from('sail_equipment_details')
          .insert({
            equipment_id: equipmentData.id,
            sailmaker: effectiveSailmaker || null,
            design_name: selectedProduct?.model_name || customModel || null,
            sail_number: sailNumber || null,
            material: selectedProduct?.material || null,
            construction_type: selectedProduct?.construction_type || null,
            optimal_wind_range_min: selectedProduct?.optimal_wind_range_min || null,
            optimal_wind_range_max: selectedProduct?.optimal_wind_range_max || null,
          });

        if (detailsError) {
          logger.warn('Failed to save sail details:', detailsError);
          // Don't fail the whole operation, equipment was created
        }
      }

      // Reset form
      setName('');
      setSailmaker('');
      setCustomSailmaker('');
      setSelectedProduct(null);
      setCustomModel('');
      setSailNumber('');
      setSailType('mainsail');

      onSailAdded();
      onClose();
    } catch (err) {
      logger.error('Failed to add sail:', err);
      Alert.alert('Error', 'Failed to add sail. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={modalStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeButton}>
            <X size={24} color={TUFTE.ink} />
          </TouchableOpacity>
          <Text style={modalStyles.title}>Add Sail</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={modalStyles.saveButton}
          >
            {saving ? (
              <ActivityIndicator size="small" color={TUFTE.accent} />
            ) : (
              <Text style={modalStyles.saveText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={modalStyles.content} keyboardShouldPersistTaps="handled">
          {/* Sail Type */}
          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>Type</Text>
            <View style={modalStyles.typeGrid}>
              {SAIL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    modalStyles.typeOption,
                    sailType === type.key && modalStyles.typeOptionActive,
                  ]}
                  onPress={() => handleSailTypeChange(type.key)}
                >
                  <Text
                    style={[
                      modalStyles.typeText,
                      sailType === type.key && modalStyles.typeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sailmaker */}
          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>Sailmaker</Text>
            {productsLoading ? (
              <ActivityIndicator size="small" color={TUFTE.inkMuted} style={{ marginVertical: 10 }} />
            ) : (
              <View style={modalStyles.typeGrid}>
                {availableSailmakers.slice(0, 5).map((maker) => (
                  <TouchableOpacity
                    key={maker}
                    style={[
                      modalStyles.typeOption,
                      sailmaker === maker && modalStyles.typeOptionActive,
                    ]}
                    onPress={() => handleSailmakerChange(maker)}
                  >
                    <Text
                      style={[
                        modalStyles.typeText,
                        sailmaker === maker && modalStyles.typeTextActive,
                      ]}
                    >
                      {maker}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    modalStyles.typeOption,
                    sailmaker === 'Other' && modalStyles.typeOptionActive,
                  ]}
                  onPress={() => handleSailmakerChange('Other')}
                >
                  <Text
                    style={[
                      modalStyles.typeText,
                      sailmaker === 'Other' && modalStyles.typeTextActive,
                    ]}
                  >
                    Other...
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {sailmaker === 'Other' && (
              <TextInput
                style={[modalStyles.input, { marginTop: 12 }]}
                value={customSailmaker}
                onChangeText={setCustomSailmaker}
                placeholder="Enter sailmaker name"
                placeholderTextColor={TUFTE.inkMuted}
                autoFocus
              />
            )}
          </View>

          {/* Model Selection - Only show if sailmaker has products */}
          {sailmaker && sailmaker !== 'Other' && sailmakerProducts.length > 0 && (
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Model</Text>
              <View style={modalStyles.modelList}>
                {sailmakerProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={[
                      modalStyles.modelOption,
                      selectedProduct?.id === product.id && modalStyles.modelOptionActive,
                    ]}
                    onPress={() => handleProductSelect(product)}
                  >
                    <View style={modalStyles.modelMain}>
                      <Text style={[
                        modalStyles.modelName,
                        selectedProduct?.id === product.id && modalStyles.modelNameActive,
                      ]}>
                        {product.model_name}
                      </Text>
                      <Text style={modalStyles.modelMeta}>
                        {getWeightCategoryLabel(product.weight_category)}
                        {' · '}
                        {formatWindRange(product.optimal_wind_range_min, product.optimal_wind_range_max)}
                      </Text>
                    </View>
                    {/* Wind range indicator */}
                    <View style={modalStyles.windRangeBar}>
                      <WindRangeIndicator
                        min={product.optimal_wind_range_min}
                        max={product.optimal_wind_range_max}
                        isActive={selectedProduct?.id === product.id}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                {/* Custom model option */}
                <TouchableOpacity
                  style={[
                    modalStyles.modelOption,
                    selectedProduct === null && customModel && modalStyles.modelOptionActive,
                  ]}
                  onPress={() => handleProductSelect(null)}
                >
                  <Text style={modalStyles.modelName}>Custom model...</Text>
                </TouchableOpacity>
              </View>
              {selectedProduct === null && sailmaker && (
                <TextInput
                  style={[modalStyles.input, { marginTop: 12 }]}
                  value={customModel}
                  onChangeText={(text) => {
                    setCustomModel(text);
                    setName(text);
                  }}
                  placeholder="Enter model name"
                  placeholderTextColor={TUFTE.inkMuted}
                />
              )}
            </View>
          )}

          {/* Custom model for "Other" sailmaker or sailmakers without products */}
          {sailmaker && (sailmaker === 'Other' || sailmakerProducts.length === 0) && (
            <View style={modalStyles.field}>
              <Text style={modalStyles.label}>Model / Design</Text>
              <TextInput
                style={modalStyles.input}
                value={customModel}
                onChangeText={(text) => {
                  setCustomModel(text);
                  setName(text);
                }}
                placeholder="e.g., A-7+, MG-15"
                placeholderTextColor={TUFTE.inkMuted}
              />
            </View>
          )}

          {/* Name */}
          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>Display Name</Text>
            <TextInput
              style={modalStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Auto-filled from selection, or enter custom"
              placeholderTextColor={TUFTE.inkMuted}
            />
            <Text style={modalStyles.hint}>
              Used to identify this sail in your inventory
            </Text>
          </View>

          {/* Sail Number */}
          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>Sail Number</Text>
            <TextInput
              style={modalStyles.input}
              value={sailNumber}
              onChangeText={setSailNumber}
              placeholder="e.g., HK1234"
              placeholderTextColor={TUFTE.inkMuted}
              autoCapitalize="characters"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Wind range indicator sparkline component
function WindRangeIndicator({
  min,
  max,
  isActive,
}: {
  min: number | null;
  max: number | null;
  isActive: boolean;
}) {
  const totalRange = 25; // 0-25 knots scale
  const startPercent = ((min || 0) / totalRange) * 100;
  const widthPercent = (((max || totalRange) - (min || 0)) / totalRange) * 100;

  return (
    <View style={modalStyles.windRangeContainer}>
      <View style={modalStyles.windRangeTrack}>
        <View
          style={[
            modalStyles.windRangeFill,
            {
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
              backgroundColor: isActive ? TUFTE.accent : TUFTE.inkMuted,
            },
          ]}
        />
      </View>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE.rule,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    color: TUFTE.ink,
  },
  saveButton: {
    padding: 4,
  },
  saveText: {
    fontSize: 16,
    color: TUFTE.accent,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: TUFTE.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
    color: TUFTE.ink,
    borderBottomWidth: 1,
    borderBottomColor: TUFTE.rule,
    paddingVertical: 10,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: TUFTE.rule,
  },
  typeOptionActive: {
    borderColor: TUFTE.accent,
    backgroundColor: '#fff5f5',
  },
  typeText: {
    fontSize: 14,
    color: TUFTE.inkLight,
  },
  typeTextActive: {
    color: TUFTE.accent,
    fontWeight: '500',
  },
  // Model list styles
  modelList: {
    borderWidth: 1,
    borderColor: TUFTE.rule,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE.rule,
  },
  modelOptionActive: {
    backgroundColor: '#fff5f5',
  },
  modelMain: {
    flex: 1,
  },
  modelName: {
    fontSize: 15,
    fontWeight: '500',
    color: TUFTE.ink,
    marginBottom: 2,
  },
  modelNameActive: {
    color: TUFTE.accent,
  },
  modelMeta: {
    fontSize: 12,
    color: TUFTE.inkMuted,
  },
  // Wind range indicator
  windRangeBar: {
    width: 60,
    marginLeft: 12,
  },
  windRangeContainer: {
    height: 20,
    justifyContent: 'center',
  },
  windRangeTrack: {
    height: 4,
    backgroundColor: TUFTE.rule,
    borderRadius: 2,
    overflow: 'hidden',
  },
  windRangeFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 2,
  },
  // Hint text
  hint: {
    fontSize: 11,
    color: TUFTE.inkMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function TufteBoatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // State
  const [boat, setBoat] = useState<BoatData | null>(null);
  const [sails, setSails] = useState<SailWithHealth[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddSailModal, setShowAddSailModal] = useState(false);
  const [showInspectionWizard, setShowInspectionWizard] = useState(false);
  const [inspectingSail, setInspectingSail] = useState<SailWithHealth | null>(null);

  // ==========================================================================
  // DATA LOADING
  // ==========================================================================

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      // Load boat details
      const { data: boatData, error: boatError } = await supabase
        .from('sailor_boats')
        .select(`
          *,
          boat_class:boat_classes(id, name)
        `)
        .eq('id', id)
        .single();

      if (boatError) throw boatError;
      setBoat(boatData);

      // Load sails
      const sailsData = await SailInspectionService.getSailInventory(id);
      setSails(sailsData);

      // Load equipment (non-sail)
      const equipData = await equipmentService.getEquipmentForBoat(id);
      const nonSailEquipment = equipData.filter(e =>
        !['mainsail', 'jib', 'genoa', 'spinnaker', 'code_zero', 'sail'].includes(e.category)
      );
      setEquipment(nonSailEquipment);

    } catch (err) {
      logger.error('Failed to load boat data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const boatTitle = useMemo(() => {
    if (!boat) return '';
    if (boat.name) return boat.name;
    const className = boat.boat_class?.name || 'Boat';
    return boat.sail_number ? `${className} #${boat.sail_number}` : className;
  }, [boat]);

  const sailStats = useMemo(() => {
    const total = sails.length;
    const needsAttention = sails.filter(s =>
      s.needs_inspection || s.condition_score == null || (s.condition_score ?? 100) < 70
    ).length;
    return { total, needsAttention };
  }, [sails]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={TUFTE.ink} />
        </View>
      </SafeAreaView>
    );
  }

  if (!boat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Boat not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.errorAction}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Minimal, functional */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={TUFTE.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/boat/edit/${id}`)}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Title Block */}
        <View style={styles.titleBlock}>
          {boat.is_primary && (
            <Text style={styles.primaryBadge}>PRIMARY BOAT</Text>
          )}
          <Text style={styles.boatTitle}>{boatTitle}</Text>
          <Text style={styles.boatSubtitle}>
            {boat.boat_class?.name || 'Unknown class'}
            {boat.sail_number && ` · Sail #${boat.sail_number}`}
          </Text>
        </View>

        {/* Vessel Details */}
        <View style={styles.section}>
          <SectionHeader title="Vessel Details" />
          <View style={styles.dataGrid}>
            <DataRow
              label="Class"
              value={boat.boat_class?.name}
            />
            <DataRow
              label="Sail Number"
              value={boat.sail_number}
            />
            <DataRow
              label="Ownership"
              value={boat.ownership_type?.replace(/_/g, ' ')}
            />
            {boat.manufacturer && (
              <DataRow
                label="Builder"
                value={boat.manufacturer}
                marginalia={boat.year_built ? `Built ${boat.year_built}` : undefined}
              />
            )}
            {boat.hull_material && (
              <DataRow
                label="Hull"
                value={boat.hull_material}
              />
            )}
            {boat.storage_location && (
              <DataRow
                label="Location"
                value={boat.storage_location}
              />
            )}
          </View>
        </View>

        {/* Sail Inventory - Key section, always visible */}
        <View style={styles.section}>
          <SectionHeader
            title="Sails"
            count={sailStats.total}
            action={{
              label: 'Add sail',
              onPress: () => setShowAddSailModal(true)
            }}
          />

          {sailStats.needsAttention > 0 && (
            <View style={styles.alertBanner}>
              <Text style={styles.alertText}>
                {sailStats.needsAttention} sail{sailStats.needsAttention > 1 ? 's' : ''} need attention
              </Text>
            </View>
          )}

          {sails.length === 0 ? (
            <EmptyState
              message="No sails in inventory"
              action={{
                label: 'Add your first sail',
                onPress: () => setShowAddSailModal(true)
              }}
            />
          ) : (
            <View style={styles.listContainer}>
              {sails.map((sail, index) => (
                <React.Fragment key={sail.equipment_id || `sail-${index}`}>
                  <SailRow
                    sail={sail}
                    onPress={() => {
                      const details = [
                        sail.sailmaker && `Sailmaker: ${sail.sailmaker}`,
                        sail.design_name && `Model: ${sail.design_name}`,
                        sail.material && `Material: ${sail.material}`,
                        sail.condition_score != null && `Condition: ${sail.condition_score}%`,
                        sail.total_usage_hours && `Hours: ${sail.total_usage_hours}h`,
                        sail.needs_inspection && '⚠️ Needs inspection',
                      ].filter(Boolean).join('\n');

                      Alert.alert(
                        sail.name || sail.sail_type || 'Sail',
                        details || 'No details available',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Inspect',
                            onPress: () => {
                              setInspectingSail(sail);
                              setShowInspectionWizard(true);
                            },
                          },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                // Delete sail_equipment_details first (if exists)
                                await supabase
                                  .from('sail_equipment_details')
                                  .delete()
                                  .eq('equipment_id', sail.equipment_id);

                                // Delete boat_equipment
                                const { error } = await supabase
                                  .from('boat_equipment')
                                  .delete()
                                  .eq('id', sail.equipment_id);

                                if (error) throw error;
                                loadData(); // Refresh the list
                              } catch (err) {
                                logger.error('Failed to delete sail:', err);
                                Alert.alert('Error', 'Failed to delete sail');
                              }
                            },
                          },
                        ]
                      );
                    }}
                  />
                  {index < sails.length - 1 && <View style={styles.listDivider} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <SectionHeader
            title="Equipment"
            count={equipment.length}
            action={{
              label: 'Add',
              onPress: () => logger.debug('Add equipment pressed')
            }}
          />

          {equipment.length === 0 ? (
            <EmptyState
              message="No equipment logged"
              action={{
                label: 'Add equipment',
                onPress: () => logger.debug('Add equipment pressed')
              }}
            />
          ) : (
            <View style={styles.listContainer}>
              {equipment.map((item, index) => (
                <React.Fragment key={item.id}>
                  <EquipmentRow
                    item={item}
                    onPress={() => logger.debug('Equipment pressed:', item.id)}
                  />
                  {index < equipment.length - 1 && <View style={styles.listDivider} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Crew */}
        <CrewManagement
          sailorId={boat.sailor_id}
          classId={boat.class_id}
          className={boat.boat_class?.name || 'Crew'}
          sailNumber={boat.sail_number}
        />

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Sail Modal */}
      {boat && (
        <AddSailModal
          visible={showAddSailModal}
          boatId={boat.id}
          sailorId={boat.sailor_id}
          classId={boat.class_id}
          className={boat.boat_class?.name || null}
          onClose={() => setShowAddSailModal(false)}
          onSailAdded={loadData}
        />
      )}

      {/* Sail Inspection Wizard */}
      {showInspectionWizard && inspectingSail && (
        <Modal
          visible={showInspectionWizard}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <SailInspectionWizard
            equipmentId={inspectingSail.equipment_id}
            boatId={boat?.id}
            sailName={inspectingSail.name || inspectingSail.sail_type || 'Sail'}
            sailType={inspectingSail.sail_type as 'mainsail' | 'jib' | 'genoa' | 'spinnaker' | 'code_zero' | undefined}
            onComplete={(inspection: SailInspection) => {
              logger.info('Inspection complete:', inspection);
              setShowInspectionWizard(false);
              setInspectingSail(null);
              loadData(); // Refresh to show updated condition
            }}
            onCancel={() => {
              setShowInspectionWizard(false);
              setInspectingSail(null);
            }}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

// =============================================================================
// STYLES - Tufte-inspired: typography-driven, minimal decoration
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TUFTE.paper,
  },

  // Loading/Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    color: TUFTE.ink,
    marginBottom: 16,
  },
  errorAction: {
    fontSize: 16,
    color: TUFTE.accent,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE.rule,
  },
  backButton: {
    padding: 4,
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
    color: TUFTE.accent,
    fontWeight: '500',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Title Block
  titleBlock: {
    marginBottom: 32,
  },
  primaryBadge: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: TUFTE.accent,
    marginBottom: 8,
  },
  boatTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 32,
    fontWeight: '400',
    color: TUFTE.ink,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  boatSubtitle: {
    fontSize: 15,
    color: TUFTE.inkLight,
  },

  // Section
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: TUFTE.ink,
    paddingBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '400',
    color: TUFTE.ink,
  },
  sectionCount: {
    fontSize: 14,
    color: TUFTE.inkMuted,
  },
  sectionAction: {
    padding: 4,
  },
  sectionActionText: {
    fontSize: 14,
    color: TUFTE.accent,
  },

  // Data Grid
  dataGrid: {
    gap: 0,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TUFTE.rule,
  },
  dataLabel: {
    fontSize: 14,
    color: TUFTE.inkMuted,
    flex: 1,
  },
  dataValueContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  dataValue: {
    fontSize: 14,
    color: TUFTE.ink,
    textAlign: 'right',
  },
  dataValueHighlight: {
    color: TUFTE.accent,
    fontWeight: '500',
  },

  // Marginalia
  marginalia: {
    fontSize: 11,
    fontStyle: 'italic',
    color: TUFTE.inkMuted,
    marginTop: 2,
  },

  // List Container
  listContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: TUFTE.rule,
  },
  listDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: TUFTE.rule,
  },

  // Sail Row
  sailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  sailRowMain: {
    flex: 1,
  },
  sailName: {
    fontSize: 15,
    fontWeight: '500',
    color: TUFTE.ink,
    marginBottom: 2,
  },
  sailMeta: {
    fontSize: 13,
    color: TUFTE.inkMuted,
  },
  sailRowRight: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  sailCondition: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sailConditionLabel: {
    fontSize: 11,
    color: TUFTE.inkMuted,
    marginTop: 1,
  },

  // Equipment Row
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  equipmentRowMain: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: TUFTE.ink,
    marginBottom: 2,
  },
  equipmentMeta: {
    fontSize: 12,
    color: TUFTE.inkMuted,
    textTransform: 'capitalize',
  },
  equipmentRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  equipmentStatus: {
    fontSize: 12,
    textTransform: 'capitalize',
  },

  // Empty State
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: TUFTE.inkMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  emptyStateAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  emptyStateActionText: {
    fontSize: 14,
    color: TUFTE.accent,
    fontWeight: '500',
  },

  // Alert Banner
  alertBanner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff8e6',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: TUFTE.warning,
  },
  alertText: {
    fontSize: 13,
    color: TUFTE.warning,
    fontWeight: '500',
  },

  // Sparkline
  sparkline: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom spacing
  bottomSpacer: {
    height: 40,
  },
});

export default TufteBoatDetail;
