/**
 * DocumentManagementScreen Component
 *
 * Full-screen document management for a race.
 * Lists all documents, allows adding new ones, and shows provenance.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, FileText, Info } from 'lucide-react-native';
import { DocumentList } from './DocumentList';
import { UnifiedDocumentInput } from '@/components/documents/UnifiedDocumentInput';
import {
  UnifiedDocumentService,
  type RaceSourceDocument,
  type FieldProvenance,
} from '@/services/UnifiedDocumentService';
import { IOS_COLORS } from '@/components/cards/constants';

interface DocumentManagementScreenProps {
  regattaId: string;
  regattaName?: string;
  onBack?: () => void;
}

export function DocumentManagementScreen({
  regattaId,
  regattaName,
  onBack,
}: DocumentManagementScreenProps) {
  // State
  const [documents, setDocuments] = useState<RaceSourceDocument[]>([]);
  const [provenance, setProvenance] = useState<Map<string, FieldProvenance>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProvenanceModal, setShowProvenanceModal] = useState(false);

  // Load documents
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const [docs, prov] = await Promise.all([
        UnifiedDocumentService.getRaceDocuments(regattaId),
        UnifiedDocumentService.getFieldProvenance(regattaId),
      ]);
      setDocuments(docs);
      setProvenance(prov);
    } catch (error) {
      console.error('[DocumentManagementScreen] Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [regattaId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handlers
  const handleAddDocument = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleDocumentAdded = useCallback(() => {
    setShowAddModal(false);
    loadDocuments();
  }, [loadDocuments]);

  const handleDeleteDocument = useCallback(async (document: RaceSourceDocument) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.title}"? This will also remove any field provenance from this document.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await UnifiedDocumentService.deleteDocument(document.id);
              loadDocuments();
            } catch (error) {
              console.error('[DocumentManagementScreen] Failed to delete:', error);
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  }, [loadDocuments]);

  const handleViewSource = useCallback((document: RaceSourceDocument) => {
    if (document.sourceUrl) {
      Linking.openURL(document.sourceUrl);
    }
  }, []);

  const handleToggleShare = useCallback(async (document: RaceSourceDocument) => {
    try {
      await UnifiedDocumentService.updateSharingStatus(document.id, !document.isShared);
      loadDocuments();
    } catch (error) {
      console.error('[DocumentManagementScreen] Failed to toggle share:', error);
    }
  }, [loadDocuments]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={IOS_COLORS.blue} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Race Documents</Text>
          {regattaName && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {regattaName}
            </Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.infoButton}
            onPress={() => setShowProvenanceModal(true)}
          >
            <Info size={20} color={IOS_COLORS.blue} />
          </Pressable>
          <Pressable style={styles.addButton} onPress={handleAddDocument}>
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{documents.length}</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{provenance.size}</Text>
          <Text style={styles.statLabel}>Tracked Fields</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {documents.filter((d) => d.extractionStatus === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Extracted</Text>
        </View>
      </View>

      {/* Document List */}
      <DocumentList
        documents={documents}
        isLoading={isLoading}
        onRefresh={loadDocuments}
        onDocumentDelete={handleDeleteDocument}
        onViewSource={handleViewSource}
        onToggleShare={handleToggleShare}
        groupByType={true}
        emptyMessage="No documents added yet"
      />

      {/* Add Document Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowAddModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Add Document</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <View style={styles.modalContent}>
            <UnifiedDocumentInput
              regattaId={regattaId}
              mode="document_management"
              defaultDocumentType="si"
              onExtractionComplete={() => handleDocumentAdded()}
              initialExpanded={true}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Provenance Info Modal */}
      <Modal
        visible={showProvenanceModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProvenanceModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalCloseButton} />
            <Text style={styles.modalTitle}>Field Provenance</Text>
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setShowProvenanceModal(false)}
            >
              <Text style={styles.modalCloseText}>Done</Text>
            </Pressable>
          </View>

          <View style={styles.provenanceContent}>
            <View style={styles.provenanceInfo}>
              <FileText size={32} color={IOS_COLORS.blue} />
              <Text style={styles.provenanceTitle}>Source Tracking</Text>
              <Text style={styles.provenanceText}>
                RegattaFlow tracks which document contributed each piece of race
                information. This helps you understand where data came from and
                ensures accuracy.
              </Text>
            </View>

            {provenance.size > 0 ? (
              <View style={styles.provenanceList}>
                <Text style={styles.provenanceSectionTitle}>
                  {provenance.size} fields tracked
                </Text>
                {Array.from(provenance.entries()).slice(0, 10).map(([path, prov]) => (
                  <View key={path} style={styles.provenanceItem}>
                    <Text style={styles.provenanceFieldPath}>{path}</Text>
                    <View style={styles.provenanceFieldMeta}>
                      {prov.extractionConfidence && (
                        <Text style={styles.provenanceConfidence}>
                          {Math.round(prov.extractionConfidence * 100)}% confidence
                        </Text>
                      )}
                      {prov.userVerified && (
                        <Text style={styles.provenanceVerified}>Verified</Text>
                      )}
                    </View>
                  </View>
                ))}
                {provenance.size > 10 && (
                  <Text style={styles.provenanceMore}>
                    +{provenance.size - 10} more fields
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.provenanceEmpty}>
                No field provenance data yet. Add documents and extract data to
                start tracking.
              </Text>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoButton: {
    padding: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: IOS_COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  modalCloseButton: {
    minWidth: 60,
  },
  modalCloseText: {
    fontSize: 17,
    color: IOS_COLORS.blue,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  // Provenance modal
  provenanceContent: {
    flex: 1,
    padding: 16,
  },
  provenanceInfo: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  provenanceTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  provenanceText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  provenanceList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  provenanceSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  provenanceItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  provenanceFieldPath: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'monospace',
  },
  provenanceFieldMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  provenanceConfidence: {
    fontSize: 12,
    color: '#6B7280',
  },
  provenanceVerified: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  provenanceMore: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },
  provenanceEmpty: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});

export default DocumentManagementScreen;
