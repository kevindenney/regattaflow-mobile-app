/**
 * Suggestion Chip Component
 * Accept/reject/edit UI for AI suggestions
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Check, X, Edit2, Sparkles } from 'lucide-react-native';

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'edited';

interface SuggestionChipProps {
  label: string;
  value: string;
  confidence?: number;
  status?: SuggestionStatus;
  editable?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: (newValue: string) => void;
  loading?: boolean;
  source?: string;
}

export function SuggestionChip({
  label,
  value,
  confidence = 0.8,
  status = 'pending',
  editable = true,
  onAccept,
  onReject,
  onEdit,
  loading = false,
  source,
}: SuggestionChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const handleEdit = () => {
    if (isEditing && onEdit) {
      onEdit(editedValue);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditedValue(value);
    setIsEditing(false);
  };

  // Determine confidence color
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return '#10B981'; // Green - high confidence
    if (confidence >= 0.6) return '#F59E0B'; // Amber - medium confidence
    return '#EF4444'; // Red - low confidence
  };

  // Get status styles
  const getStatusStyle = () => {
    switch (status) {
      case 'accepted':
        return {
          backgroundColor: '#D1FAE5',
          borderColor: '#10B981',
        };
      case 'rejected':
        return {
          backgroundColor: '#FEE2E2',
          borderColor: '#EF4444',
        };
      case 'edited':
        return {
          backgroundColor: '#DBEAFE',
          borderColor: '#3B82F6',
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
        };
    }
  };

  const statusStyle = getStatusStyle();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}>
        <ActivityIndicator size="small" color="#6B7280" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, statusStyle]}>
      {/* Confidence indicator */}
      {status === 'pending' && (
        <View
          style={[
            styles.confidenceIndicator,
            { backgroundColor: getConfidenceColor() },
          ]}
        />
      )}

      {/* AI icon */}
      {status === 'pending' && (
        <Sparkles size={14} color="#8B5CF6" style={styles.aiIcon} />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Label */}
        <Text style={styles.label}>{label}</Text>

        {/* Value */}
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editedValue}
            onChangeText={setEditedValue}
            autoFocus
            onBlur={handleCancel}
          />
        ) : (
          <Text style={styles.value}>{status === 'edited' ? editedValue : value}</Text>
        )}

        {/* Source badge */}
        {source && status === 'pending' && (
          <Text style={styles.source}>from {source}</Text>
        )}
      </View>

      {/* Actions */}
      {status === 'pending' && !isEditing && (
        <View style={styles.actions}>
          {/* Edit button */}
          {editable && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
            >
              <Edit2 size={14} color="#6B7280" />
            </TouchableOpacity>
          )}

          {/* Accept button */}
          {onAccept && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Check size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Reject button */}
          {onReject && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onReject}
            >
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Edit actions */}
      {isEditing && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={handleEdit}
          >
            <Check size={16} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={handleCancel}
          >
            <X size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Status indicator */}
      {status !== 'pending' && (
        <View style={styles.statusIcon}>
          {status === 'accepted' && <Check size={16} color="#10B981" />}
          {status === 'rejected' && <X size={16} color="#EF4444" />}
          {status === 'edited' && <Edit2 size={16} color="#3B82F6" />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    position: 'relative',
  },
  confidenceIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  aiIcon: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    marginLeft: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  source: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginLeft: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  editButton: {
    backgroundColor: '#E5E7EB',
  },
  statusIcon: {
    marginLeft: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});
