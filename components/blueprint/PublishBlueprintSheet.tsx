/**
 * PublishBlueprintSheet
 *
 * Bottom sheet for timeline owners to publish their timeline as a
 * subscribable blueprint. Allows setting title, description, slug,
 * and toggling published state.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useOrganization } from '@/providers/OrganizationProvider';
import {
  useCreateBlueprint,
  useUpdateBlueprint,
} from '@/hooks/useBlueprint';
import { generateBlueprintSlug } from '@/services/BlueprintService';
import type { BlueprintRecord, BlueprintAccessLevel } from '@/types/blueprint';

const C = {
  bg: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.4)',
  accent: '#00897B',
  accentBg: 'rgba(0,137,123,0.08)',
  border: '#E5E4E1',
  labelDark: '#1A1918',
  labelMid: '#6D6C6A',
  labelLight: '#9C9B99',
  successBg: '#E8F5E9',
  successText: '#2E7D32',
  danger: '#DC503C',
} as const;

const MANAGER_ROLES = new Set(['owner', 'admin', 'manager', 'faculty', 'instructor']);

interface PublishBlueprintSheetProps {
  visible: boolean;
  onClose: () => void;
  interestId: string;
  interestName: string;
  /** Existing blueprint for this interest (edit mode) */
  existingBlueprint?: BlueprintRecord | null;
}

export function PublishBlueprintSheet({
  visible,
  onClose,
  interestId,
  interestName,
  existingBlueprint,
}: PublishBlueprintSheetProps) {
  const { user } = useAuth();
  const { memberships } = useOrganization();
  const createBlueprint = useCreateBlueprint();
  const updateBlueprint = useUpdateBlueprint();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [publishAs, setPublishAs] = useState<'individual' | string>('individual');
  const [accessLevel, setAccessLevel] = useState<BlueprintAccessLevel>('public');
  const isEditing = !!existingBlueprint;

  // Filter to orgs where user has a manager role
  const managerOrgs = memberships.filter(
    (m) =>
      (m.membership_status === 'active' || m.status === 'active') &&
      MANAGER_ROLES.has(String(m.role || '').toLowerCase()) &&
      m.organization,
  );

  useEffect(() => {
    if (existingBlueprint) {
      setTitle(existingBlueprint.title);
      setDescription(existingBlueprint.description ?? '');
      setSlug(existingBlueprint.slug);
      setPublishAs(existingBlueprint.organization_id ?? 'individual');
      setAccessLevel(existingBlueprint.access_level ?? 'public');
    } else {
      const defaultTitle = `${interestName} Blueprint`;
      setTitle(defaultTitle);
      setDescription('');
      setPublishAs('individual');
      setAccessLevel('public');
      setSlug(generateBlueprintSlug(user?.user_metadata?.display_name ?? 'user', interestName));
    }
  }, [existingBlueprint, interestName, user, visible]);

  const selectedOrgId = publishAs !== 'individual' ? publishAs : null;

  // Update slug when publishAs changes
  useEffect(() => {
    if (isEditing) return;
    if (selectedOrgId) {
      const org = managerOrgs.find((m) => m.organization_id === selectedOrgId);
      const orgName = org?.organization?.name ?? 'org';
      setSlug(generateBlueprintSlug(orgName, interestName));
    } else {
      setSlug(generateBlueprintSlug(user?.user_metadata?.display_name ?? 'user', interestName));
    }
  }, [publishAs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePublish = useCallback(async () => {
    if (!user?.id || !title.trim()) return;

    if (isEditing && existingBlueprint) {
      await updateBlueprint.mutateAsync({
        blueprintId: existingBlueprint.id,
        updates: {
          title: title.trim(),
          description: description.trim() || null,
          is_published: true,
          access_level: selectedOrgId ? accessLevel : 'public',
        },
      });
    } else {
      await createBlueprint.mutateAsync({
        user_id: user.id,
        interest_id: interestId,
        slug: slug.trim(),
        title: title.trim(),
        description: description.trim() || null,
        is_published: true,
        organization_id: selectedOrgId,
        access_level: selectedOrgId ? accessLevel : 'public',
      });
    }
    onClose();
  }, [user, title, description, slug, interestId, isEditing, existingBlueprint, createBlueprint, updateBlueprint, onClose, selectedOrgId, accessLevel]);

  const handleUnpublish = useCallback(async () => {
    if (!existingBlueprint) return;
    await updateBlueprint.mutateAsync({
      blueprintId: existingBlueprint.id,
      updates: { is_published: false },
    });
    onClose();
  }, [existingBlueprint, updateBlueprint, onClose]);

  const handleShareLink = useCallback(async () => {
    const url = `${Platform.OS === 'web' ? window.location.origin : 'https://betterat.com'}/blueprint/${slug}`;
    if (Platform.OS === 'web') {
      await navigator.clipboard?.writeText(url);
    } else {
      await Share.share({ url, message: `Check out my ${interestName} blueprint: ${url}` });
    }
  }, [slug, interestName]);

  const blueprintUrl = `/blueprint/${slug}`;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="layers" size={20} color={C.accent} />
            </View>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Manage Blueprint' : 'Publish as Blueprint'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditing
                ? 'Edit your published blueprint settings'
                : 'Make your timeline subscribable so others can follow and adopt your steps'}
            </Text>
          </View>

          {/* Published status */}
          {isEditing && existingBlueprint?.is_published && (
            <View style={styles.statusRow}>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={12} color={C.successText} />
                <Text style={styles.statusText}>Published</Text>
              </View>
              <Text style={styles.subscriberCount}>
                {existingBlueprint.subscriber_count} subscriber{existingBlueprint.subscriber_count !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Publish As — only shown when user has manager-level org memberships */}
          {managerOrgs.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Publish As</Text>
              <View style={styles.segmentRow}>
                <Pressable
                  style={[styles.segmentBtn, publishAs === 'individual' && styles.segmentBtnActive]}
                  onPress={() => { setPublishAs('individual'); setAccessLevel('public'); }}
                >
                  <Ionicons name="person-outline" size={13} color={publishAs === 'individual' ? C.accent : C.labelMid} />
                  <Text style={[styles.segmentText, publishAs === 'individual' && styles.segmentTextActive]}>
                    Yourself
                  </Text>
                </Pressable>
                {managerOrgs.map((m) => (
                  <Pressable
                    key={m.organization_id}
                    style={[styles.segmentBtn, publishAs === m.organization_id && styles.segmentBtnActive]}
                    onPress={() => {
                      setPublishAs(m.organization_id);
                      const vis = (m.organization?.metadata as any)?.default_content_visibility;
                      setAccessLevel(vis === 'org_members' ? 'org_members' : 'public');
                    }}
                  >
                    <Ionicons name="business-outline" size={13} color={publishAs === m.organization_id ? C.accent : C.labelMid} />
                    <Text
                      style={[styles.segmentText, publishAs === m.organization_id && styles.segmentTextActive]}
                      numberOfLines={1}
                    >
                      {m.organization?.name ?? 'Organization'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Access Level — only shown when publishing under an org */}
          {selectedOrgId && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Who Can Subscribe</Text>
              <View style={styles.segmentRow}>
                <Pressable
                  style={[styles.segmentBtn, accessLevel === 'public' && styles.segmentBtnActive]}
                  onPress={() => setAccessLevel('public')}
                >
                  <Ionicons name="globe-outline" size={13} color={accessLevel === 'public' ? C.accent : C.labelMid} />
                  <Text style={[styles.segmentText, accessLevel === 'public' && styles.segmentTextActive]}>
                    Public
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.segmentBtn, accessLevel === 'org_members' && styles.segmentBtnActive]}
                  onPress={() => setAccessLevel('org_members')}
                >
                  <Ionicons name="people-outline" size={13} color={accessLevel === 'org_members' ? C.accent : C.labelMid} />
                  <Text style={[styles.segmentText, accessLevel === 'org_members' && styles.segmentTextActive]}>
                    Members Only
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.segmentBtn, { opacity: 0.4 }]}
                  disabled
                >
                  <Ionicons name="card-outline" size={13} color={C.labelLight} />
                  <Text style={styles.segmentText}>Paid</Text>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., MHI Global Health Playbook"
              placeholderTextColor={C.labelLight}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what subscribers will learn by following this blueprint..."
              placeholderTextColor={C.labelLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* URL preview */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Blueprint URL</Text>
            <View style={styles.urlRow}>
              <Text style={styles.urlPrefix}>betterat.com</Text>
              <Text style={styles.urlSlug}>{blueprintUrl}</Text>
              {isEditing && existingBlueprint?.is_published && (
                <Pressable style={styles.copyBtn} onPress={handleShareLink}>
                  <Ionicons name="share-outline" size={14} color={C.accent} />
                </Pressable>
              )}
            </View>
          </View>

          {/* What gets shared */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={14} color={C.labelMid} />
            <Text style={styles.infoText}>
              All your non-private steps for {interestName} will be visible to subscribers.
              When you add new steps, subscribers will see them as suggestions they can adopt.
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.publishBtn, !title.trim() && styles.publishBtnDisabled]}
              onPress={handlePublish}
              disabled={!title.trim() || createBlueprint.isPending || updateBlueprint.isPending}
            >
              <Ionicons name="rocket-outline" size={16} color="#FFFFFF" />
              <Text style={styles.publishBtnText}>
                {isEditing ? 'Save Changes' : 'Publish Blueprint'}
              </Text>
            </Pressable>

            {isEditing && existingBlueprint?.is_published && (
              <Pressable style={styles.unpublishBtn} onPress={handleUnpublish}>
                <Text style={styles.unpublishText}>Unpublish</Text>
              </Pressable>
            )}

            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: C.overlay,
  },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'web' ? 24 : 40,
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accentBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.labelDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: C.labelMid,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.successText,
  },
  subscriberCount: {
    fontSize: 11,
    color: C.labelMid,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.labelMid,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: C.labelDark,
  },
  textArea: {
    minHeight: 72,
    paddingTop: 10,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  urlPrefix: {
    fontSize: 12,
    color: C.labelLight,
  },
  urlSlug: {
    fontSize: 12,
    fontWeight: '600',
    color: C.accent,
    flex: 1,
  },
  copyBtn: {
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#F5F5F4',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 11,
    color: C.labelMid,
    lineHeight: 16,
    flex: 1,
  },
  actions: {
    gap: 8,
    marginBottom: 8,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 13,
  },
  publishBtnDisabled: {
    opacity: 0.5,
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unpublishBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  unpublishText: {
    fontSize: 13,
    color: C.danger,
    fontWeight: '500',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    color: C.labelMid,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFFFFF',
    flex: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  segmentBtnActive: {
    borderColor: C.accent,
    backgroundColor: C.accentBg,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.labelMid,
  },
  segmentTextActive: {
    color: C.accent,
    fontWeight: '600',
  },
  comingSoonBadge: {
    backgroundColor: '#F0F0EE',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 2,
  },
  comingSoonText: {
    fontSize: 8,
    fontWeight: '600',
    color: C.labelLight,
  },
});
