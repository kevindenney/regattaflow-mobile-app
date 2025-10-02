import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DashboardSection } from '../shared';

interface Resource {
  id: string;
  title: string;
  type: 'template' | 'guide' | 'video' | 'document';
  description: string;
  category: string;
  downloads: number;
  lastUsed?: string;
}

interface ResourcesTabProps {
  resources: Resource[];
  onResourcePress: (resourceId: string) => void;
  onCreateTemplate: () => void;
  onUploadResource: () => void;
}

export function ResourcesTab({
  resources,
  onResourcePress,
  onCreateTemplate,
  onUploadResource
}: ResourcesTabProps) {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'template': return 'document-outline';
      case 'guide': return 'book-outline';
      case 'video': return 'videocam-outline';
      case 'document': return 'document-text-outline';
      default: return 'folder-outline';
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'template': return '#3B82F6';
      case 'guide': return '#10B981';
      case 'video': return '#F59E0B';
      case 'document': return '#6366F1';
      default: return '#6B7280';
    }
  };

  const categories = [...new Set(resources.map(r => r.category))];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <DashboardSection
        title="📚 Coaching Resources"
        subtitle="Templates, guides, and materials for effective coaching"
        headerAction={{
          label: 'Add Resource',
          onPress: onUploadResource,
          icon: 'add-circle-outline'
        }}
        showBorder={false}
      >
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={onCreateTemplate}>
            <Ionicons name="document" size={20} color="#3B82F6" />
            <Text style={styles.quickActionText}>Create Template</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={onUploadResource}>
            <Ionicons name="cloud-upload" size={20} color="#10B981" />
            <Text style={styles.quickActionText}>Upload Resource</Text>
          </TouchableOpacity>
        </View>
      </DashboardSection>

      {categories.map((category) => (
        <DashboardSection key={category} title={category}>
          {resources
            .filter(resource => resource.category === category)
            .map((resource) => (
              <TouchableOpacity
                key={resource.id}
                style={styles.resourceCard}
                onPress={() => onResourcePress(resource.id)}
              >
                <View style={styles.resourceHeader}>
                  <View style={[
                    styles.resourceIcon,
                    { backgroundColor: getResourceColor(resource.type) }
                  ]}>
                    <Ionicons
                      name={getResourceIcon(resource.type) as any}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <Text style={styles.resourceDescription}>
                      {resource.description}
                    </Text>
                  </View>
                  <View style={styles.resourceMeta}>
                    <Text style={styles.resourceType}>
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    </Text>
                    <Text style={styles.resourceDownloads}>
                      {resource.downloads} uses
                    </Text>
                  </View>
                </View>
                {resource.lastUsed && (
                  <Text style={styles.lastUsed}>Last used: {resource.lastUsed}</Text>
                )}
              </TouchableOpacity>
            ))}
        </DashboardSection>
      ))}

      {resources.length === 0 && (
        <DashboardSection title="">
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Resources Yet</Text>
            <Text style={styles.emptyText}>
              Create templates and upload materials to build your coaching resource library
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={onCreateTemplate}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create First Template</Text>
            </TouchableOpacity>
          </View>
        </DashboardSection>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  resourceCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  resourceMeta: {
    alignItems: 'flex-end',
  },
  resourceType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3B82F6',
    marginBottom: 2,
  },
  resourceDownloads: {
    fontSize: 12,
    color: '#64748B',
  },
  lastUsed: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});