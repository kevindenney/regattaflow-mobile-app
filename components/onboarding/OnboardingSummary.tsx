/**
 * Onboarding Summary Component
 * Displays collected data and allows editing before final save
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Edit2, Check, X, Plus, Trash2 } from 'lucide-react-native';

export interface OnboardingData {
  venue?: { id: string; name: string };
  role?: 'owner' | 'crew' | 'both';
  boats?: Array<{
    id?: string;
    class_name: string;
    sail_number?: string;
    is_owner: boolean;
  }>;
  clubs?: Array<{ id: string; name: string }>;
  fleets?: Array<{ id: string; name: string }>;
}

interface OnboardingSummaryProps {
  data: OnboardingData;
  onEdit: (updatedData: OnboardingData) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function OnboardingSummary({
  data,
  onEdit,
  onConfirm,
  onCancel,
}: OnboardingSummaryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<OnboardingData>(data);

  const handleSave = () => {
    onEdit(editedData);
    setIsEditing(false);
  };

  const addBoat = () => {
    setEditedData({
      ...editedData,
      boats: [
        ...(editedData.boats || []),
        { class_name: '', is_owner: true },
      ],
    });
  };

  const removeBoat = (index: number) => {
    setEditedData({
      ...editedData,
      boats: editedData.boats?.filter((_, i) => i !== index),
    });
  };

  const updateBoat = (index: number, field: string, value: any) => {
    const updatedBoats = [...(editedData.boats || [])];
    updatedBoats[index] = { ...updatedBoats[index], [field]: value };
    setEditedData({ ...editedData, boats: updatedBoats });
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            📋 Your Sailing Profile
          </Text>
          <Text className="text-gray-600">
            Review and edit your information before saving
          </Text>
        </View>

        {/* Venue */}
        {data.venue && (
          <View className="mb-6 p-4 bg-blue-50 rounded-lg">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-blue-900">
                📍 Home Venue
              </Text>
            </View>
            <Text className="text-base text-gray-900">{data.venue.name}</Text>
          </View>
        )}

        {/* Role */}
        {data.role && (
          <View className="mb-6 p-4 bg-green-50 rounded-lg">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-semibold text-green-900">
                👤 Sailor Role
              </Text>
              {!isEditing && (
                <Pressable onPress={() => setIsEditing(true)}>
                  <Edit2 size={16} color="#15803d" />
                </Pressable>
              )}
            </View>
            {isEditing ? (
              <View className="flex-row gap-2">
                {(['owner', 'crew', 'both'] as const).map(role => (
                  <Pressable
                    key={role}
                    onPress={() => setEditedData({ ...editedData, role })}
                    className={`px-3 py-2 rounded-lg ${
                      editedData.role === role
                        ? 'bg-green-600'
                        : 'bg-white border border-green-300'
                    }`}
                  >
                    <Text
                      className={
                        editedData.role === role
                          ? 'text-white font-semibold'
                          : 'text-green-700'
                      }
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text className="text-base text-gray-900 capitalize">
                {data.role}
              </Text>
            )}
          </View>
        )}

        {/* Boats */}
        {data.boats && data.boats.length > 0 && (
          <View className="mb-6 p-4 bg-purple-50 rounded-lg">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold text-purple-900">
                ⛵ Your Boats ({data.boats.length})
              </Text>
              {isEditing && (
                <Pressable onPress={addBoat}>
                  <Plus size={20} color="#6b21a8" />
                </Pressable>
              )}
            </View>

            {(isEditing ? editedData.boats : data.boats)?.map((boat, index) => (
              <View key={index} className="mb-2 p-3 bg-white rounded-lg">
                {isEditing ? (
                  <View>
                    <View className="flex-row justify-between mb-2">
                      <TextInput
                        className="flex-1 border border-gray-300 rounded px-2 py-1 mr-2"
                        placeholder="Boat class"
                        value={boat.class_name}
                        onChangeText={text =>
                          updateBoat(index, 'class_name', text)
                        }
                      />
                      <Pressable onPress={() => removeBoat(index)}>
                        <Trash2 size={20} color="#dc2626" />
                      </Pressable>
                    </View>
                    <TextInput
                      className="border border-gray-300 rounded px-2 py-1 mb-2"
                      placeholder="Sail number (optional)"
                      value={boat.sail_number || ''}
                      onChangeText={text =>
                        updateBoat(index, 'sail_number', text)
                      }
                    />
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => updateBoat(index, 'is_owner', true)}
                        className={`flex-1 px-2 py-1 rounded ${
                          boat.is_owner ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-center ${
                            boat.is_owner ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          Owner
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => updateBoat(index, 'is_owner', false)}
                        className={`flex-1 px-2 py-1 rounded ${
                          !boat.is_owner ? 'bg-purple-600' : 'bg-gray-200'
                        }`}
                      >
                        <Text
                          className={`text-center ${
                            !boat.is_owner ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          Crew
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text className="text-base font-semibold text-gray-900">
                      {boat.class_name}
                      {boat.sail_number && ` (#${boat.sail_number})`}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {boat.is_owner ? 'Owner' : 'Crew'}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Clubs */}
        {data.clubs && data.clubs.length > 0 && (
          <View className="mb-6 p-4 bg-orange-50 rounded-lg">
            <Text className="text-sm font-semibold text-orange-900 mb-2">
              🏛️ Yacht Clubs ({data.clubs.length})
            </Text>
            {data.clubs.map((club, index) => (
              <Text key={index} className="text-base text-gray-900 mb-1">
                • {club.name}
              </Text>
            ))}
          </View>
        )}

        {/* Fleets */}
        {data.fleets && data.fleets.length > 0 && (
          <View className="mb-6 p-4 bg-cyan-50 rounded-lg">
            <Text className="text-sm font-semibold text-cyan-900 mb-2">
              🏁 Racing Fleets ({data.fleets.length})
            </Text>
            {data.fleets.map((fleet, index) => (
              <Text key={index} className="text-base text-gray-900 mb-1">
                • {fleet.name}
              </Text>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-6">
          {isEditing ? (
            <>
              <Pressable
                onPress={handleSave}
                className="flex-1 bg-green-600 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Check size={20} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Save Changes
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setEditedData(data);
                  setIsEditing(false);
                }}
                className="flex-1 bg-gray-300 py-3 rounded-lg flex-row items-center justify-center"
              >
                <X size={20} color="#374151" />
                <Text className="text-gray-700 font-semibold ml-2">Cancel</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={onConfirm}
                className="flex-1 bg-blue-600 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold text-center">
                  ✓ Confirm & Save
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsEditing(true)}
                className="flex-1 bg-gray-200 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Edit2 size={16} color="#374151" />
                <Text className="text-gray-700 font-semibold ml-2">Edit</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

export default OnboardingSummary;
