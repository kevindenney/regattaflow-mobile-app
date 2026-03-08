import { NURSING_CORE_V1_CAPABILITIES } from '@/configs/competencies/nursing-core-v1';
import { SAILING_CORE_V1_SKILLS } from '@/configs/competencies/sailing-core-v1';
import { NURSING_EVENT_CONFIG } from '@/configs/nursing';
import { SAILING_EVENT_CONFIG } from '@/configs/sailing';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type OrgStepTemplateRow = {
  id: string;
  org_id: string;
  interest_slug: string;
  title: string;
  description: string | null;
  step_type: string;
  module_ids: string[];
  suggested_competency_ids: string[];
  is_published: boolean;
  created_at: string;
};

type InterestOption = {
  slug: string;
  label: string;
};

type Option = {
  value: string;
  label: string;
};
type ModuleOption = {
  id: string;
  label: string;
};

const INTEREST_OPTIONS: InterestOption[] = [
  { slug: 'nursing', label: 'Nursing' },
  { slug: SAILING_EVENT_CONFIG.interestSlug, label: 'Sail Racing' },
];

const NURSING_STEP_TYPE_OPTIONS: Option[] = NURSING_EVENT_CONFIG.eventSubtypes.map((entry) => ({
  value: entry.id,
  label: entry.label,
}));

const SAILING_STEP_TYPE_OPTIONS: Option[] = [
  { value: 'race_day', label: 'Race Day' },
  { value: 'practice', label: 'Practice' },
  { value: 'drill_session', label: 'Drill Session' },
  { value: 'tuning', label: 'Tuning' },
  { value: 'video_review', label: 'Video Review' },
];

const NURSING_MODULE_OPTIONS: ModuleOption[] = Object.values(NURSING_EVENT_CONFIG.moduleInfo)
  .map((item) => ({ id: item.id, label: item.label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const SAILING_MODULE_OPTIONS: ModuleOption[] = Object.values(SAILING_EVENT_CONFIG.moduleInfo)
  .map((item) => ({ id: item.id, label: item.label }))
  .sort((a, b) => a.label.localeCompare(b.label));

const NURSING_COMPETENCY_OPTIONS: ModuleOption[] = NURSING_CORE_V1_CAPABILITIES.map((item) => ({
  id: item.id,
  label: item.title,
}));

const SAILING_COMPETENCY_OPTIONS: ModuleOption[] = SAILING_CORE_V1_SKILLS.map((item) => ({
  id: item.id,
  label: item.title,
}));

function toggleArrayValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

export default function OrganizationTemplatesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeOrganization, canManageActiveOrganization } = useOrganization();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<OrgStepTemplateRow[]>([]);
  const [selectedInterestSlug, setSelectedInterestSlug] = useState<string>(INTEREST_OPTIONS[0].slug);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepType, setStepType] = useState(NURSING_STEP_TYPE_OPTIONS[0]?.value || 'clinical_shift');
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [suggestedCompetencyIds, setSuggestedCompetencyIds] = useState<string[]>([]);

  const isSailing = selectedInterestSlug === SAILING_EVENT_CONFIG.interestSlug;
  const stepTypeOptions = isSailing ? SAILING_STEP_TYPE_OPTIONS : NURSING_STEP_TYPE_OPTIONS;
  const moduleOptions = isSailing ? SAILING_MODULE_OPTIONS : NURSING_MODULE_OPTIONS;
  const competencyOptions = isSailing ? SAILING_COMPETENCY_OPTIONS : NURSING_COMPETENCY_OPTIONS;

  useEffect(() => {
    setStepType(stepTypeOptions[0]?.value || '');
    setModuleIds([]);
    setSuggestedCompetencyIds([]);
  }, [selectedInterestSlug]);

  const loadTemplates = useCallback(async () => {
    if (!activeOrganization?.id) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('betterat_org_step_templates')
        .select('id,org_id,interest_slug,title,description,step_type,module_ids,suggested_competency_ids,is_published,created_at')
        .eq('org_id', activeOrganization.id)
        .eq('interest_slug', selectedInterestSlug)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as OrgStepTemplateRow[]);
    } catch (error: any) {
      Alert.alert('Unable to load templates', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization?.id, selectedInterestSlug]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const canSubmit = useMemo(() => {
    return Boolean(
      canManageActiveOrganization
      && activeOrganization?.id
      && user?.id
      && title.trim().length > 0
      && stepType.trim().length > 0
    );
  }, [activeOrganization?.id, canManageActiveOrganization, stepType, title, user?.id]);

  const handleCreateTemplate = useCallback(async () => {
    if (!canSubmit || !activeOrganization?.id || !user?.id) {
      Alert.alert('Missing fields', 'Add a title and step type first.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        org_id: activeOrganization.id,
        interest_slug: selectedInterestSlug,
        title: title.trim(),
        description: description.trim() || null,
        step_type: stepType,
        module_ids: moduleIds,
        suggested_competency_ids: suggestedCompetencyIds,
        created_by: user.id,
        is_published: true,
      };

      const { data, error } = await supabase
        .from('betterat_org_step_templates')
        .insert(payload)
        .select('id,org_id,interest_slug,title,description,step_type,module_ids,suggested_competency_ids,is_published,created_at')
        .single();

      if (error) throw error;

      const inserted = data as OrgStepTemplateRow;
      setTemplates((prev) => [inserted, ...prev]);
      setTitle('');
      setDescription('');
      setStepType(stepTypeOptions[0]?.value || '');
      setModuleIds([]);
      setSuggestedCompetencyIds([]);
    } catch (error: any) {
      Alert.alert('Unable to save template', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [activeOrganization?.id, canSubmit, description, moduleIds, selectedInterestSlug, stepType, stepTypeOptions, suggestedCompetencyIds, title, user?.id]);

  const handleTogglePublished = useCallback(async (template: OrgStepTemplateRow) => {
    if (!canManageActiveOrganization) return;
    try {
      const nextPublished = !template.is_published;
      const { error } = await supabase
        .from('betterat_org_step_templates')
        .update({ is_published: nextPublished })
        .eq('id', template.id)
        .eq('org_id', template.org_id);
      if (error) throw error;

      setTemplates((prev) => prev.map((row) => row.id === template.id ? { ...row, is_published: nextPublished } : row));
    } catch (error: any) {
      Alert.alert('Unable to update template', error?.message || 'Please try again.');
    }
  }, [canManageActiveOrganization]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Organization Templates</Text>
          <Text style={styles.subtitle}>
            {isSailing
              ? 'Publish optional sail racing step recommendations for learners.'
              : 'Publish optional nursing step recommendations for learners.'}
          </Text>
          <TouchableOpacity onPress={() => router.push('/organization/access-requests')} style={styles.accessRequestsLink}>
            <Text style={styles.accessRequestsLinkText}>Access requests</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!activeOrganization?.id ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Select an active organization first.</Text>
        </View>
      ) : !canManageActiveOrganization ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Organization admin access is required to manage templates.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>New template</Text>

            <Text style={styles.label}>Interest</Text>
            <View style={styles.chipRow}>
              {INTEREST_OPTIONS.map((option) => {
                const selected = option.slug === selectedInterestSlug;
                return (
                  <TouchableOpacity
                    key={option.slug}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setSelectedInterestSlug(option.slug)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Template title"
              placeholderTextColor="#94A3B8"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Step Type</Text>
            <View style={styles.chipRow}>
              {stepTypeOptions.map((option) => {
                const selected = option.value === stepType;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setStepType(option.value)}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Modules</Text>
            <View style={styles.chipRow}>
              {moduleOptions.map((option) => {
                const selected = moduleIds.includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setModuleIds((prev) => toggleArrayValue(prev, option.id))}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Suggested Competencies</Text>
            <View style={styles.chipRow}>
              {competencyOptions.map((option) => {
                const selected = suggestedCompetencyIds.includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setSuggestedCompetencyIds((prev) => toggleArrayValue(prev, option.id))}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (!canSubmit || saving) && styles.disabledButton]}
              onPress={() => void handleCreateTemplate()}
              disabled={!canSubmit || saving}
            >
              {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />}
              <Text style={styles.primaryButtonText}>Save template</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>{isSailing ? 'Published sail racing templates' : 'Published nursing templates'}</Text>
              <TouchableOpacity onPress={() => void loadTemplates()}>
                <Ionicons name="refresh-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.centerStateCompact}>
                <ActivityIndicator size="small" color="#2563EB" />
              </View>
            ) : templates.length === 0 ? (
              <Text style={styles.stateText}>No templates yet.</Text>
            ) : (
              templates.map((template) => (
                <View key={template.id} style={styles.templateRow}>
                  <View style={styles.templateTextWrap}>
                    <Text style={styles.templateTitle}>{template.title}</Text>
                    {template.description ? <Text style={styles.templateDescription}>{template.description}</Text> : null}
                    <Text style={styles.templateMeta}>
                      {template.step_type} • {template.module_ids.length} modules • {template.suggested_competency_ids.length} competencies
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.publishPill, template.is_published ? styles.publishOn : styles.publishOff]}
                    onPress={() => void handleTogglePublished(template)}
                  >
                    <Text style={[styles.publishPillText, template.is_published ? styles.publishOnText : styles.publishOffText]}>
                      {template.is_published ? 'Published' : 'Hidden'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
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
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  accessRequestsLink: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  accessRequestsLinkText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 12,
    color: '#334155',
  },
  chipTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.5,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateRow: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  templateTextWrap: {
    gap: 4,
  },
  templateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  templateDescription: {
    fontSize: 12,
    color: '#475569',
  },
  templateMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  publishPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  publishOn: {
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
  },
  publishOff: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  publishPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  publishOnText: {
    color: '#067647',
  },
  publishOffText: {
    color: '#334155',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centerStateCompact: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  stateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
