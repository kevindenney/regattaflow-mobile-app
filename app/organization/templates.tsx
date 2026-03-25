import { NURSING_CORE_V1_CAPABILITIES } from '@/configs/competencies/nursing-core-v1';
import { SAILING_CORE_V1_SKILLS } from '@/configs/competencies/sailing-core-v1';
import { NURSING_EVENT_CONFIG } from '@/configs/nursing';
import { SAILING_EVENT_CONFIG } from '@/configs/sailing';
import { orgInterestLabel } from '@/lib/organizations/orgInterest';
import { fetchOrganizationInterestSlug } from '@/components/organizations/OrgContextPill';
import { OrgAdminHeader } from '@/components/organizations/OrgAdminHeader';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import { supabase } from '@/services/supabase';
import { isUuid } from '@/utils/uuid';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { showAlert } from '@/lib/utils/crossPlatformAlert';

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

type OrgCohortRow = {
  id: string;
  name: string;
};

type Option = {
  value: string;
  label: string;
};
type ModuleOption = {
  id: string;
  label: string;
};

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
  const { activeOrganization, activeOrganizationId, canManageActiveOrganization, memberships } = useOrganization();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<OrgStepTemplateRow[]>([]);
  const [cohorts, setCohorts] = useState<OrgCohortRow[]>([]);
  const [templateCohortIds, setTemplateCohortIds] = useState<Record<string, string[]>>({});
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const [orgInterestSlug, setOrgInterestSlug] = useState<string | null>(null);
  const [interestLoadFailed, setInterestLoadFailed] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepType, setStepType] = useState(NURSING_STEP_TYPE_OPTIONS[0]?.value || 'clinical_shift');
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [suggestedCompetencyIds, setSuggestedCompetencyIds] = useState<string[]>([]);

  const resolvedActiveOrgId = String(activeOrganizationId || '').trim()
    || String((memberships || []).find((membership: any) => {
      const status = String(membership?.membership_status || membership?.status || '').trim().toLowerCase();
      return status === 'active';
    })?.organization_id || '').trim();
  const isSailing = orgInterestSlug === SAILING_EVENT_CONFIG.interestSlug;
  const stepTypeOptions = isSailing ? SAILING_STEP_TYPE_OPTIONS : NURSING_STEP_TYPE_OPTIONS;
  const moduleOptions = isSailing ? SAILING_MODULE_OPTIONS : NURSING_MODULE_OPTIONS;
  const competencyOptions = isSailing ? SAILING_COMPETENCY_OPTIONS : NURSING_COMPETENCY_OPTIONS;

  useEffect(() => {
    setStepType(stepTypeOptions[0]?.value || '');
    setModuleIds([]);
    setSuggestedCompetencyIds([]);
  }, [orgInterestSlug]);

  useEffect(() => {
    if (!resolvedActiveOrgId || !isUuid(resolvedActiveOrgId)) {
      setOrgInterestSlug(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const interestSlug = await fetchOrganizationInterestSlug(resolvedActiveOrgId);
        if (cancelled) return;
        setInterestLoadFailed(false);
        setOrgInterestSlug(interestSlug);
      } catch {
        if (cancelled) return;
        setInterestLoadFailed(true);
        setOrgInterestSlug(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedActiveOrgId]);

  const loadTemplates = useCallback(async () => {
    if (!activeOrganization?.id || !orgInterestSlug) {
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
        .eq('interest_slug', orgInterestSlug)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates((data || []) as OrgStepTemplateRow[]);
    } catch (error: any) {
      showAlert('Unable to load templates', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeOrganization?.id, orgInterestSlug]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!activeOrganization?.id || !canManageActiveOrganization) {
      setCohorts([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('betterat_org_cohorts')
        .select('id,name,interest_slug')
        .eq('org_id', activeOrganization.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        setCohorts([]);
        return;
      }

      const normalizedOrgInterest = String(orgInterestSlug || '').trim().toLowerCase();
      const rows = (data || []).filter((row: any) => {
        const cohortInterest = String(row.interest_slug || '').trim().toLowerCase();
        if (!normalizedOrgInterest) return true;
        return !cohortInterest || cohortInterest === normalizedOrgInterest;
      });

      setCohorts(rows.map((row: any) => ({
        id: String(row.id),
        name: String(row.name || 'Cohort'),
      })));
    })();

    return () => {
      cancelled = true;
    };
  }, [activeOrganization?.id, canManageActiveOrganization, orgInterestSlug]);

  useEffect(() => {
    if (!templates.length || !canManageActiveOrganization) {
      setTemplateCohortIds({});
      return;
    }

    const templateIds = templates.map((template) => template.id).filter((id) => isUuid(id));
    if (templateIds.length === 0) {
      setTemplateCohortIds({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from('betterat_org_step_template_cohorts')
        .select('org_template_id,cohort_id')
        .in('org_template_id', templateIds);

      if (cancelled) return;
      if (error) {
        setTemplateCohortIds({});
        return;
      }

      const nextMap: Record<string, string[]> = {};
      for (const row of data || []) {
        const templateId = String((row as any).org_template_id || '');
        const cohortId = String((row as any).cohort_id || '');
        if (!isUuid(templateId) || !isUuid(cohortId)) continue;
        if (!nextMap[templateId]) {
          nextMap[templateId] = [];
        }
        nextMap[templateId].push(cohortId);
      }

      setTemplateCohortIds(nextMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [canManageActiveOrganization, templates]);

  const canSubmit = useMemo(() => {
    return Boolean(
      canManageActiveOrganization
      && activeOrganization?.id
      && user?.id
      && !!orgInterestSlug
      && title.trim().length > 0
      && stepType.trim().length > 0
    );
  }, [activeOrganization?.id, canManageActiveOrganization, orgInterestSlug, stepType, title, user?.id]);

  const handleCreateTemplate = useCallback(async () => {
    if (!canSubmit || !activeOrganization?.id || !user?.id) {
      showAlert('Missing fields', 'Add a title and step type first.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        org_id: activeOrganization.id,
        interest_slug: orgInterestSlug,
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
      showAlert('Unable to save template', error?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  }, [activeOrganization?.id, canSubmit, description, moduleIds, orgInterestSlug, stepType, stepTypeOptions, suggestedCompetencyIds, title, user?.id]);

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
      showAlert('Unable to update template', error?.message || 'Please try again.');
    }
  }, [canManageActiveOrganization]);

  const handleToggleTemplateCohort = useCallback(async (templateId: string, cohortId: string) => {
    if (!canManageActiveOrganization || !isUuid(templateId) || !isUuid(cohortId)) return;
    const key = `${templateId}:${cohortId}`;
    if (assigningKey === key) return;

    const currentIds = new Set(templateCohortIds[templateId] || []);
    const isLinked = currentIds.has(cohortId);
    setAssigningKey(key);
    try {
      if (isLinked) {
        const { error } = await supabase
          .from('betterat_org_step_template_cohorts')
          .delete()
          .eq('org_template_id', templateId)
          .eq('cohort_id', cohortId);
        if (error) throw error;
        currentIds.delete(cohortId);
      } else {
        const { error } = await supabase
          .from('betterat_org_step_template_cohorts')
          .insert({ org_template_id: templateId, cohort_id: cohortId });
        if (error) throw error;
        currentIds.add(cohortId);
      }

      setTemplateCohortIds((prev) => ({
        ...prev,
        [templateId]: Array.from(currentIds),
      }));
    } catch (error: any) {
      showAlert('Unable to update cohort assignment', error?.message || 'Please try again.');
    } finally {
      setAssigningKey(null);
    }
  }, [assigningKey, canManageActiveOrganization, templateCohortIds]);

  return (
    <View style={styles.container}>
      <OrgAdminHeader
        title="Organization Templates"
        subtitle={isSailing
          ? 'Publish optional sail racing step recommendations for learners.'
          : 'Publish optional nursing step recommendations for learners.'}
        interestSlug={orgInterestSlug}
      />

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
            <Text style={styles.contextText}>Using organization context: {orgInterestLabel(orgInterestSlug)}</Text>
            {!orgInterestSlug ? (
              <Text style={styles.warningText}>
                Organization interest not set. Set an organization interest to create templates.
              </Text>
            ) : null}
            {interestLoadFailed ? (
              <Text style={styles.warningText}>Could not load organization interest. Using General.</Text>
            ) : null}

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
              <Text style={styles.sectionTitle}>Published {orgInterestLabel(orgInterestSlug).toLowerCase()} templates</Text>
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
                  {cohorts.length > 0 ? (
                    <View style={styles.templateAssignSection}>
                      <Text style={styles.templateAssignLabel}>Assign to cohorts</Text>
                      <View style={styles.templateAssignChips}>
                        {cohorts.map((cohort) => {
                          const selected = (templateCohortIds[template.id] || []).includes(cohort.id);
                          const key = `${template.id}:${cohort.id}`;
                          const busy = assigningKey === key;
                          return (
                            <TouchableOpacity
                              key={cohort.id}
                              style={[
                                styles.assignChip,
                                selected && styles.assignChipSelected,
                                busy && styles.assignChipBusy,
                              ]}
                              onPress={() => void handleToggleTemplateCohort(template.id, cohort.id)}
                              disabled={busy}
                            >
                              <Text style={[styles.assignChipText, selected && styles.assignChipTextSelected]}>
                                {busy ? 'Saving...' : cohort.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}
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
  contextText: {
    fontSize: 12,
    color: '#475569',
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
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
  templateAssignSection: {
    gap: 6,
  },
  templateAssignLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  templateAssignChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  assignChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  assignChipSelected: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  assignChipBusy: {
    opacity: 0.7,
  },
  assignChipText: {
    fontSize: 11,
    color: '#334155',
  },
  assignChipTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
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
