import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ChevronRight, Plus, User, Mail, Phone, MessageCircle, Shield, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSailorOnboardingState, type SailorCrewData, type SailorCrewMember } from '@/hooks/useSailorOnboardingState';

// Mock data for crew roles
const CREW_ROLES = [
  "Skipper",
  "Tactician",
  "Navigator",
  "Mastman",
  "Bowman",
  "Helmsman",
  "Trimmer",
  "Pitman",
  "Cook",
  "Medic",
  "Photographer"
];

// Communication methods
const COMMUNICATION_METHODS = [
  { id: 'phone', name: 'Phone', icon: Phone },
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle },
  { id: 'signal', name: 'Signal', icon: Shield }
];

export default function CrewScreen() {
  const router = useRouter();
  const { state, updateCrew, loading } = useSailorOnboardingState();
  const [crewMembers, setCrewMembers] = useState<SailorCrewMember[]>(() => state.crew?.crewMembers ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    communicationMethods: [] as string[],
    hasAccess: false
  });
  
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [filteredRoles, setFilteredRoles] = useState(CREW_ROLES);
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  
  // Mock avatars from the tool
  const avatars = [
    "https://unsplash.com/photos/man-standing-beside-wall-pAtA8xe_iVM",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dXNlcnxlbnwwfHwwfHx8MA%3D%3D",
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1605993439219-9d09d2020fa5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTN8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZGFyY2h8Mjh8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTd8fHVzZXJ8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1578445714074-946b536079aa?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fFByb2Zlc3Npb25hbCUyMGF2YXRhciUyMHdpdGglMjBnbGFzc2VzfGVufDB8fDB8fHww"
  ];

  useEffect(() => {
    setCrewMembers(state.crew?.crewMembers ?? []);
  }, [state.crew?.crewMembers]);

  const persistCrewMembers = useCallback(
    (members: SailorCrewMember[]) => {
      setCrewMembers(members);
      const nextCrewData: SailorCrewData = {
        crewMembers: members,
        lookingForCrew: state.crew?.lookingForCrew ?? false,
        crewRoles: Array.from(
          new Set(members.map(member => member.role).filter(Boolean))
        ),
      };
      updateCrew(nextCrewData);
    },
    [state.crew?.lookingForCrew, updateCrew]
  );

  const generateMemberId = () => `crew-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleAddMember = async () => {
    if (isAddingMember) return; // Prevent double-clicks

    try {
      setIsAddingMember(true);

      if (!newMember.name.trim() || !newMember.role.trim()) {
        Alert.alert('Validation Error', 'Please enter both name and role');
        return;
      }

      const member: SailorCrewMember = {
        id: generateMemberId(),
        name: newMember.name.trim(),
        role: newMember.role.trim(),
        email: newMember.email.trim() || undefined,
        phone: newMember.phone.trim() || undefined,
        communicationMethods: newMember.communicationMethods,
        hasAccess: newMember.hasAccess,
      };

      const updatedMembers = [...crewMembers, member];
      
      // Update local state first for immediate feedback
      setCrewMembers(updatedMembers);
      
      // Then persist to storage
      persistCrewMembers(updatedMembers);
      
      Alert.alert('Crew member added', `${member.name} was added to your roster.`);
      
      // Reset form
      setNewMember({
        name: '',
        role: '',
        email: '',
        phone: '',
        communicationMethods: [],
        hasAccess: false
      });
      setSelectedAvatar(0);
      setShowRoleSuggestions(false);
    } catch (error) {
      console.error('Error adding crew member:', error);
      Alert.alert('Error', 'Failed to add crew member. Please try again.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const toggleCommunicationMethod = (methodId: string) => {
    setNewMember(prev => {
      if (prev.communicationMethods.includes(methodId)) {
        return {
          ...prev,
          communicationMethods: prev.communicationMethods.filter(id => id !== methodId)
        };
      } else {
        return {
          ...prev,
          communicationMethods: [...prev.communicationMethods, methodId]
        };
      }
    });
  };

  const toggleAccess = () => {
    setNewMember(prev => ({
      ...prev,
      hasAccess: !prev.hasAccess
    }));
  };

  const filterRoles = (text: string) => {
    setNewMember(prev => ({ ...prev, role: text }));
    if (text.length > 0) {
      const filtered = CREW_ROLES.filter(role => 
        role.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredRoles(filtered);
      setShowRoleSuggestions(true);
    } else {
      setShowRoleSuggestions(false);
    }
  };

  const selectRole = (role: string) => {
    setNewMember(prev => ({ ...prev, role }));
    setShowRoleSuggestions(false);
  };

  const removeCrewMember = (id: string) => {
    const updated = crewMembers.filter(member => member.id !== id);
    persistCrewMembers(updated);
  };

  const handleContinueToReview = () => {
    if (crewMembers.length === 0) {
      Alert.alert('Add crew', 'Add at least one crew member before continuing.');
      return;
    }

    try {
      setIsSaving(true);
      persistCrewMembers(crewMembers);
      router.push('/review');
    } catch (error: any) {
      console.error('Error continuing to review:', error);
      Alert.alert('Unable to continue', 'Please try again in a moment.');
    } finally {
      setIsSaving(false);
    }
  };

  const canContinue = crewMembers.length > 0 && !isSaving;

  return (
    <View className="flex-1 bg-white">
      {/* Progress Header */}
      <View className="bg-blue-600 px-4 pt-12 pb-6">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-lg font-semibold">Step 4 of 5</Text>
          <Text className="text-white text-sm">1:15 remaining</Text>
        </View>
        
        {/* Progress Bar */}
        <View className="h-2 bg-blue-400 rounded-full">
          <View className="w-[80%] h-2 bg-white rounded-full" />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 px-4">
        <View className="mt-6">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Manage Your Crew
          </Text>
          <Text className="text-gray-500 mb-6">
            Add crew members, assign roles, and set communication preferences
          </Text>

          {/* Add Crew Member Form */}
          <View className="mb-8 bg-blue-50 rounded-xl p-4">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Add New Crew Member
            </Text>
            
            {/* Avatar Selection */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-20">
                <View className="flex-row gap-3">
                  {avatars.map((avatar, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedAvatar(index)}
                      className={`rounded-full border-2 ${selectedAvatar === index ? 'border-blue-600' : 'border-transparent'}`}
                    >
                      <View className="w-14 h-14 rounded-full overflow-hidden">
                        <View className="bg-gray-200 w-full h-full rounded-full" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            
            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Name</Text>
              <TextInput
                value={newMember.name}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, name: text }))}
                placeholder="Enter crew member name"
                className="bg-white border border-gray-200 rounded-xl p-4 text-base"
              />
            </View>
            
            {/* Role Input with Auto-Suggest */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Role</Text>
              <View className="relative">
                <TextInput
                  value={newMember.role}
                  onChangeText={filterRoles}
                  onFocus={() => newMember.role.length > 0 && setShowRoleSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowRoleSuggestions(false), 150)}
                  placeholder="Enter crew role"
                  className="bg-white border border-gray-200 rounded-xl p-4 text-base"
                />
                {showRoleSuggestions && filteredRoles.length > 0 && (
                  <View className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 z-10 shadow-lg">
                    <FlatList
                      data={filteredRoles}
                      keyExtractor={(item) => item}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          className="p-3 border-b border-gray-100"
                          onPress={() => selectRole(item)}
                        >
                          <Text className="text-gray-800">{item}</Text>
                        </TouchableOpacity>
                      )}
                      scrollEnabled={filteredRoles.length > 4}
                      style={{ maxHeight: 200 }}
                    />
                  </View>
                )}
              </View>
            </View>
            
            {/* Contact Information */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Contact Information</Text>
              <View className="flex-row gap-3">
                <TextInput
                  value={newMember.email}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, email: text }))}
                  placeholder="Email"
                  className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-base"
                  keyboardType="email-address"
                />
                <TextInput
                  value={newMember.phone}
                  onChangeText={(text) => setNewMember(prev => ({ ...prev, phone: text }))}
                  placeholder="Phone"
                  className="flex-1 bg-white border border-gray-200 rounded-xl p-4 text-base"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            
            {/* Communication Methods */}
            <View className="mb-4">
              <Text className="text-gray-800 font-medium mb-2">Communication Methods</Text>
              <View className="flex-row flex-wrap gap-2">
                {COMMUNICATION_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = newMember.communicationMethods.includes(method.id);
                  return (
                    <TouchableOpacity
                      key={method.id}
                      onPress={() => toggleCommunicationMethod(method.id)}
                      className={`flex-row items-center px-3 py-2 rounded-full border ${isSelected ? 'bg-blue-100 border-blue-600' : 'bg-gray-100 border-gray-300'}`}
                    >
                      <Icon size={16} color={isSelected ? '#2563EB' : '#6B7280'} />
                      <Text className={`ml-2 text-sm ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                        {method.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* RegattaFlow Access */}
            <View className="mb-4">
              <TouchableOpacity 
                onPress={toggleAccess}
                className="flex-row items-center justify-between p-3 bg-white border border-gray-200 rounded-xl"
              >
                <View className="flex-row items-center">
                  <Shield size={20} className="text-blue-600 mr-3" />
                  <Text className="text-gray-800">Grant RegattaFlow Access</Text>
                </View>
                <View className={`w-12 h-6 rounded-full ${newMember.hasAccess ? 'bg-blue-600' : 'bg-gray-300'} justify-center`}>
                  <View className={`w-5 h-5 rounded-full bg-white ${newMember.hasAccess ? 'ml-6' : 'ml-0.5'}`} />
                </View>
              </TouchableOpacity>
              <Text className="text-gray-500 text-xs mt-1 ml-1">
                Allow this crew member to access boat data and race analytics
              </Text>
            </View>
            
            {/* Add Button */}
            <TouchableOpacity 
              onPress={handleAddMember}
              activeOpacity={0.8}
              disabled={isAddingMember}
              style={{
                backgroundColor: isAddingMember ? '#94A3B8' : '#2563EB',
                borderRadius: 12,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
                opacity: isAddingMember ? 0.6 : 1,
              }}
            >
              {isAddingMember ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Plus size={20} color="white" style={{ marginRight: 8 }} />
                  <Text 
                    style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}
                  >
                    Add Crew Member
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Current Crew Members */}
          <View>
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Current Crew ({crewMembers.length})
            </Text>
            
            {loading ? (
              <View className="bg-gray-50 rounded-xl p-8 items-center justify-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-500 mt-4">Loading crew preferences...</Text>
              </View>
            ) : crewMembers.length === 0 ? (
              <View className="bg-gray-50 rounded-xl p-8 items-center justify-center">
                <Users size={48} className="text-gray-300 mb-4" />
                <Text className="text-gray-500 text-center">
                  No crew members added yet. Add your first crew member above.
                </Text>
              </View>
            ) : (
              <FlatList
                data={crewMembers}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                        <User size={24} className="text-gray-500" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">{item.name}</Text>
                        <Text className="text-blue-600">{item.role}</Text>
                        <View className="flex-row flex-wrap mt-1">
                          {(item.communicationMethods ?? []).map(methodId => {
                            const method = COMMUNICATION_METHODS.find(m => m.id === methodId);
                            if (!method) return null;
                            const Icon = method.icon;
                            return (
                              <View 
                                key={methodId} 
                                className="flex-row items-center bg-blue-50 rounded-full px-2 py-1 mr-2 mb-1"
                              >
                                <Icon size={12} className="text-blue-600 mr-1" />
                                <Text className="text-blue-600 text-xs">{method.name}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                      <TouchableOpacity onPress={() => removeCrewMember(item.id)}>
                        <Text className="text-red-500 font-medium">Remove</Text>
                      </TouchableOpacity>
                    </View>
                    {item.hasAccess && (
                      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                        <Shield size={16} className="text-green-500 mr-2" />
                        <Text className="text-green-600 text-sm">Has RegattaFlow Access</Text>
                      </View>
                    )}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-4 py-4 border-t border-gray-200">
        <TouchableOpacity 
          className={`rounded-xl py-4 flex-row items-center justify-center ${canContinue ? 'bg-blue-600' : 'bg-gray-300'}`}
          disabled={!canContinue}
          onPress={handleContinueToReview}
        >
          <Text className="text-white font-semibold text-lg">
            {isSaving ? 'Saving...' : 'Continue to Review'}
          </Text>
          <ChevronRight size={20} color="white" className="ml-2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
