/**
 * Comprehensive Sailor Onboarding Form
 * Single page with all structured fields for complete sailor profile
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';
import {
  User, Anchor, MapPin, FileText, Calendar,
  Plus, X, ChevronRight, Loader, ArrowLeft
} from 'lucide-react-native';

interface Boat {
  className: string;
  sailNumber: string;
  boatName?: string;
  hullMaker?: string;
  rigMaker?: string;
  sailMaker?: string;
  role: 'owner' | 'crew' | 'both';
  isPrimary: boolean;
}

interface Club {
  name: string;
  url?: string;
}

interface Venue {
  name: string;
  coordinates?: string;
}

interface Document {
  type: 'class_association' | 'tuning_guide' | 'race_calendar' | 'sailing_instructions' | 'course_map' | 'other';
  url: string;
  description?: string;
}

interface NextRace {
  name: string;
  date: string;
  startTime: string;
  location: string;
  norUrl?: string;
  siUrl?: string;
  courseMapUrl?: string;
}

export default function SailorOnboardingComprehensive() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [isMounted, setIsMounted] = useState(true);

  // Track mount state to prevent state updates after unmount
  React.useEffect(() => {
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Parse chatData if provided
  const chatData = params.chatData ? JSON.parse(params.chatData as string) : null;
  const fromChat = !!chatData;

  // Section 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [primaryRole, setPrimaryRole] = useState<'owner' | 'crew' | 'both'>('owner');
  const [yearsSailing, setYearsSailing] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');

  // Section 2: Boats - Pre-populate from chat
  const [boats, setBoats] = useState<Boat[]>(
    chatData?.boats && chatData.boats.length > 0
      ? chatData.boats.map((b: any, idx: number) => ({
          className: b.className || '',
          sailNumber: b.sailNumber || '',
          boatName: b.boatName || '',
          hullMaker: b.hullMaker || '',
          rigMaker: b.rigMaker || '',
          sailMaker: b.sailMaker || '',
          role: 'owner' as const,
          isPrimary: idx === 0,
        }))
      : [{
          className: '',
          sailNumber: '',
          boatName: '',
          hullMaker: '',
          rigMaker: '',
          sailMaker: '',
          role: 'owner',
          isPrimary: true,
        }]
  );

  // Section 3: Clubs & Venues - Pre-populate from chat
  const [clubs, setClubs] = useState<Club[]>(
    chatData?.clubs && chatData.clubs.length > 0
      ? chatData.clubs.map((c: any) => ({ name: c.name || '', url: c.url || '' }))
      : [{ name: '', url: '' }]
  );
  const [homeVenue, setHomeVenue] = useState(
    chatData?.venues?.[0]?.name || ''
  );
  const [regularVenues, setRegularVenues] = useState<Venue[]>(
    chatData?.venues?.slice(1) || []
  );

  // Section 4: Documents - Pre-populate from chat
  const [documents, setDocuments] = useState<Document[]>(
    chatData?.documents || []
  );
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocType, setNewDocType] = useState<Document['type']>('class_association');

  // Section 5: Next Race (REQUIRED) - Pre-populate from chat
  const [nextRace, setNextRace] = useState<NextRace>({
    name: chatData?.nextRace?.name || '',
    date: chatData?.nextRace?.date || '',
    startTime: chatData?.nextRace?.startTime || '',
    location: chatData?.nextRace?.location || '',
    norUrl: chatData?.nextRace?.norUrl || '',
    siUrl: chatData?.nextRace?.siUrl || '',
    courseMapUrl: chatData?.nextRace?.courseMapUrl || '',
  });

  // Upcoming races from calendar scraping
  const upcomingRaces = chatData?.upcomingRaces || [];
  const [showRaceSelector, setShowRaceSelector] = useState(upcomingRaces.length > 0);

  // NEW: Direct paste fields
  const [calendarPasteData, setCalendarPasteData] = useState('');
  const [siNorPasteData, setSiNorPasteData] = useState('');
  const [raceAreaImageUri, setRaceAreaImageUri] = useState('');
  const [selectedRaces, setSelectedRaces] = useState<number[]>(
    upcomingRaces.length > 0 ? upcomingRaces.map((_: any, idx: number) => idx) : []
  ); // Track which races user wants to keep

  // Debug: Log race data on mount
  React.useEffect(() => {
    if (upcomingRaces.length > 0) {
      console.log('📊 Upcoming races data:', upcomingRaces);
      console.log('📊 First race sample:', upcomingRaces[0]);
    }
  }, []);

  const [submitting, setSubmitting] = useState(false);

  // Select race as "next race" and populate form
  const selectAsNextRace = (race: any, index: number) => {
    console.log('📅 Selecting race as next:', race);

    setNextRace({
      name: race.name || '',
      date: race.date || '',
      startTime: race.startTime || race.time || '',
      location: race.location || '',
      norUrl: race.norUrl || '',
      siUrl: race.siUrl || '',
      courseMapUrl: race.courseMapUrl || '',
    });

    // Ensure this race is selected
    if (!selectedRaces.includes(index)) {
      setSelectedRaces([...selectedRaces, index]);
    }

    console.log('✅ Next race set:', {
      name: race.name,
      date: race.date,
      startTime: race.startTime || race.time,
      location: race.location
    });
  };

  // Toggle race selection for keeping in calendar
  const toggleRaceSelection = (index: number) => {
    if (selectedRaces.includes(index)) {
      setSelectedRaces(selectedRaces.filter(i => i !== index));
    } else {
      setSelectedRaces([...selectedRaces, index]);
    }
  };

  // Boat management
  const addBoat = () => {
    setBoats([...boats, {
      className: '',
      sailNumber: '',
      boatName: '',
      hullMaker: '',
      rigMaker: '',
      sailMaker: '',
      role: 'owner',
      isPrimary: false,
    }]);
  };

  const removeBoat = (index: number) => {
    if (boats.length > 1) {
      setBoats(boats.filter((_, i) => i !== index));
    }
  };

  const updateBoat = (index: number, field: keyof Boat, value: any) => {
    const updated = [...boats];
    updated[index] = { ...updated[index], [field]: value };
    setBoats(updated);
  };

  // Club management
  const addClub = () => {
    setClubs([...clubs, { name: '', url: '' }]);
  };

  const removeClub = (index: number) => {
    if (clubs.length > 1) {
      setClubs(clubs.filter((_, i) => i !== index));
    }
  };

  const updateClub = (index: number, field: keyof Club, value: string) => {
    const updated = [...clubs];
    updated[index] = { ...updated[index], [field]: value };
    setClubs(updated);
  };

  // Document management
  const addDocument = () => {
    if (!newDocUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter a document URL');
      return;
    }

    setDocuments([...documents, {
      type: newDocType,
      url: newDocUrl.trim(),
    }]);

    setNewDocUrl('');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  // Validation
  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Check at least one boat with class and sail number
    const validBoat = boats.find(b => b.className.trim() && b.sailNumber.trim());
    if (!validBoat) {
      errors.push('At least one boat with class and sail number');
    }

    // Check next race required fields
    if (!nextRace.name.trim()) errors.push('Next race name');
    if (!nextRace.date) errors.push('Next race date');
    if (!nextRace.startTime) errors.push('Next race start time');
    if (!nextRace.location.trim()) errors.push('Next race location');

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async () => {
    const validation = validateForm();

    if (!validation.valid) {
      Alert.alert(
        'Missing Required Information',
        `Please provide:\n• ${validation.errors.join('\n• ')}`
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setSubmitting(true);

    try {
      console.log('🚀 Starting onboarding save for user:', user.id);

      // Update user profile with onboarding data
      const profileUpdates = {
        full_name: fullName || null,
        onboarding_completed: true,
        onboarding_step: 'completed',
        // Store as JSON metadata for now
        onboarding_data: {
          primary_role: primaryRole,
          years_sailing: parseInt(yearsSailing) || 0,
          experience_level: experienceLevel,
          home_venue: homeVenue || null,
          boats: boats.filter(b => b.className.trim() && b.sailNumber.trim()),
          clubs,
          documents,
          next_race: nextRace,
          calendar_paste_data: calendarPasteData || null,
          si_nor_paste_data: siNorPasteData || null,
          race_area_image_url: raceAreaImageUri || null,
        }
      };

      console.log('📝 Updating user profile with:', profileUpdates);

      const { error: userUpdateError } = await supabase
        .from('users')
        .update(profileUpdates)
        .eq('id', user.id);

      if (userUpdateError) {
        console.error('❌ User update error:', userUpdateError);
        throw userUpdateError;
      }

      console.log('✅ User profile updated successfully');

      // Only navigate if component is still mounted
      if (isMounted) {
        console.log('🎯 Navigating to dashboard...');
        router.replace('/(tabs)/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Error saving onboarding data:', error);
      // Only show alert if component is still mounted
      if (isMounted) {
        Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
      }
    } finally {
      // Always reset submitting state if still mounted
      if (isMounted) {
        setSubmitting(false);
      }
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        {/* Back to Chat Button */}
        {fromChat && (
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2 mb-4"
          >
            <ArrowLeft size={20} color="#0284c7" />
            <Text className="text-sky-600 font-semibold">Back to Chat</Text>
          </Pressable>
        )}

        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            ⛵ Your Sailing Profile
          </Text>
          <Text className="text-base text-gray-600">
            {fromChat
              ? 'Review and complete the information from our chat'
              : 'Tell us about your sailing so we can provide personalized race strategy and weather forecasts'
            }
          </Text>
        </View>

        {/* SECTION 1: Personal Info */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <User size={24} color="#0284c7" />
            <Text className="text-xl font-bold text-gray-900">Personal Info</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Full Name (Optional)</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g., John Smith"
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Primary Role</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setPrimaryRole('owner')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                  primaryRole === 'owner' ? 'bg-sky-100 border-sky-600' : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  primaryRole === 'owner' ? 'text-sky-700' : 'text-gray-700'
                }`}>Owner</Text>
              </Pressable>

              <Pressable
                onPress={() => setPrimaryRole('crew')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                  primaryRole === 'crew' ? 'bg-sky-100 border-sky-600' : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  primaryRole === 'crew' ? 'text-sky-700' : 'text-gray-700'
                }`}>Crew</Text>
              </Pressable>

              <Pressable
                onPress={() => setPrimaryRole('both')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 ${
                  primaryRole === 'both' ? 'bg-sky-100 border-sky-600' : 'bg-white border-gray-300'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  primaryRole === 'both' ? 'text-sky-700' : 'text-gray-700'
                }`}>Both</Text>
              </Pressable>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Years Sailing</Text>
              <TextInput
                value={yearsSailing}
                onChangeText={setYearsSailing}
                placeholder="e.g., 10"
                keyboardType="numeric"
                className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Experience</Text>
              <View className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3">
                <Text className="text-base text-gray-900">{experienceLevel}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 2: Boats (to be continued...) */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <Anchor size={24} color="#0284c7" />
              <Text className="text-xl font-bold text-gray-900">Your Boats *</Text>
            </View>
            <Pressable
              onPress={addBoat}
              className="flex-row items-center gap-1 bg-sky-600 px-3 py-2 rounded-lg"
            >
              <Plus size={16} color="white" />
              <Text className="text-white font-semibold text-sm">Add Boat</Text>
            </Pressable>
          </View>

          {boats.map((boat, index) => (
            <View key={index} className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-semibold text-gray-900">Boat {index + 1}</Text>
                {boats.length > 1 && (
                  <Pressable onPress={() => removeBoat(index)}>
                    <X size={20} color="#dc2626" />
                  </Pressable>
                )}
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Class *</Text>
                  <TextInput
                    value={boat.className}
                    onChangeText={(val) => updateBoat(index, 'className', val)}
                    placeholder="e.g., Dragon"
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Sail # *</Text>
                  <TextInput
                    value={boat.sailNumber}
                    onChangeText={(val) => updateBoat(index, 'sailNumber', val)}
                    placeholder="e.g., D59"
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Boat Name</Text>
                <TextInput
                  value={boat.boatName}
                  onChangeText={(val) => updateBoat(index, 'boatName', val)}
                  placeholder="e.g., Phoenix"
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2"
                />
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Hull Maker</Text>
                  <TextInput
                    value={boat.hullMaker}
                    onChangeText={(val) => updateBoat(index, 'hullMaker', val)}
                    placeholder="e.g., Petticrows"
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 mb-1">Rig Maker</Text>
                  <TextInput
                    value={boat.rigMaker}
                    onChangeText={(val) => updateBoat(index, 'rigMaker', val)}
                    placeholder="e.g., Selden"
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2"
                  />
                </View>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Sail Maker</Text>
                <TextInput
                  value={boat.sailMaker}
                  onChangeText={(val) => updateBoat(index, 'sailMaker', val)}
                  placeholder="e.g., North Sails, Quantum"
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2"
                />
              </View>
            </View>
          ))}
        </View>

        {/* SECTION 3: Clubs & Venues */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              <MapPin size={24} color="#0284c7" />
              <Text className="text-xl font-bold text-gray-900">Where You Sail</Text>
            </View>
            <Pressable
              onPress={addClub}
              className="flex-row items-center gap-1 bg-sky-600 px-3 py-2 rounded-lg"
            >
              <Plus size={16} color="white" />
              <Text className="text-white font-semibold text-sm">Add Club</Text>
            </Pressable>
          </View>

          {clubs.map((club, index) => (
            <View key={index} className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-semibold text-gray-900">
                  {index === 0 ? 'Home Yacht Club' : `Club ${index + 1}`}
                </Text>
                {clubs.length > 1 && index > 0 && (
                  <Pressable onPress={() => removeClub(index)}>
                    <X size={20} color="#dc2626" />
                  </Pressable>
                )}
              </View>

              <View className="mb-3">
                <Text className="text-sm font-medium text-gray-700 mb-1">Club Name</Text>
                <TextInput
                  value={club.name}
                  onChangeText={(val) => updateClub(index, 'name', val)}
                  placeholder="e.g., Royal Hong Kong Yacht Club"
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Website URL</Text>
                <TextInput
                  value={club.url}
                  onChangeText={(val) => updateClub(index, 'url', val)}
                  placeholder="https://www.rhkyc.org.hk"
                  autoCapitalize="none"
                  className="bg-white border border-gray-300 rounded-lg px-3 py-2"
                />
              </View>
            </View>
          ))}

          <View className="mt-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Home Venue</Text>
            <TextInput
              value={homeVenue}
              onChangeText={setHomeVenue}
              placeholder="e.g., Victoria Harbour, Hong Kong"
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>
        </View>

        {/* SECTION 4: Documents & Organizations */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-4">
            <FileText size={24} color="#0284c7" />
            <Text className="text-xl font-bold text-gray-900">Sailing Documents</Text>
          </View>

          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <Text className="text-sm font-semibold text-blue-900 mb-2">
              📚 Add URLs to sailing documents
            </Text>
            <Text className="text-sm text-blue-800">
              • Class association websites (for fleet lists, tuning guides){'\n'}
              • Sail maker tuning guides (North Sails, Quantum, etc.){'\n'}
              • Race calendars, sailing instructions, course maps
            </Text>
          </View>

          {/* Document Type Selector */}
          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Document Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {[
                { value: 'class_association', label: 'Class Assoc.' },
                { value: 'tuning_guide', label: 'Tuning Guide' },
                { value: 'race_calendar', label: 'Calendar' },
                { value: 'sailing_instructions', label: 'SIs' },
                { value: 'course_map', label: 'Course Map' },
                { value: 'other', label: 'Other' },
              ].map((type) => (
                <Pressable
                  key={type.value}
                  onPress={() => setNewDocType(type.value as Document['type'])}
                  className={`py-2 px-4 rounded-lg border ${
                    newDocType === type.value
                      ? 'bg-sky-100 border-sky-600'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <Text className={`text-sm font-semibold ${
                    newDocType === type.value ? 'text-sky-700' : 'text-gray-700'
                  }`}>{type.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Document URL Input */}
          <View className="flex-row gap-2 mb-4">
            <TextInput
              value={newDocUrl}
              onChangeText={setNewDocUrl}
              placeholder="https://example.com/document.pdf"
              autoCapitalize="none"
              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3"
            />
            <Pressable
              onPress={addDocument}
              className="bg-sky-600 py-3 px-4 rounded-lg items-center justify-center"
            >
              <Plus size={20} color="white" />
            </Pressable>
          </View>

          {/* Document List */}
          {documents.length > 0 && (
            <View className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <Text className="text-sm font-semibold text-gray-900 mb-2">
                Added Documents ({documents.length})
              </Text>
              {documents.map((doc, index) => (
                <View key={index} className="flex-row items-center justify-between py-2 border-b border-gray-200">
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-semibold text-sky-700 capitalize">
                      {doc.type.replace(/_/g, ' ')}
                    </Text>
                    <Text className="text-xs text-gray-600" numberOfLines={1}>
                      {doc.url}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeDocument(index)}>
                    <X size={16} color="#dc2626" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SECTION 5: Next Race (REQUIRED) */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-3">
            <Calendar size={24} color="#dc2626" />
            <Text className="text-xl font-bold text-gray-900">Your Next Race *</Text>
          </View>

          <View className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
            <Text className="text-base font-bold text-red-900 mb-1">
              🎯 Required for Race Strategy
            </Text>
            <Text className="text-sm text-red-800">
              We need these details to provide weather forecasts, hull/rig tuning recommendations, and tactical strategy for your upcoming race.
            </Text>
          </View>

          {/* Race Selector from Calendar */}
          {upcomingRaces.length > 0 && showRaceSelector && (
            <View className="bg-sky-50 border-2 border-sky-300 rounded-lg p-4 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View>
                  <Text className="text-base font-bold text-sky-900">
                    📅 Found {upcomingRaces.length} Upcoming Races
                  </Text>
                  <Text className="text-xs text-sky-700 mt-1">
                    ✓ {selectedRaces.length} selected to keep
                  </Text>
                </View>
                <Pressable onPress={() => setShowRaceSelector(false)}>
                  <Text className="text-sky-600 text-sm font-medium">Enter manually</Text>
                </Pressable>
              </View>

              <View className="flex-row gap-2 mb-3">
                <Pressable
                  onPress={() => setSelectedRaces(upcomingRaces.map((_: any, i: number) => i))}
                  className="flex-1 bg-sky-100 px-3 py-2 rounded-lg"
                >
                  <Text className="text-sky-700 text-xs font-semibold text-center">
                    ✓ Select All
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedRaces([])}
                  className="flex-1 bg-gray-100 px-3 py-2 rounded-lg"
                >
                  <Text className="text-gray-700 text-xs font-semibold text-center">
                    ✗ Deselect All
                  </Text>
                </Pressable>
              </View>

              <Text className="text-sm text-sky-800 mb-3">
                Check races to keep in your calendar. Click "Set as Next" to populate form.
              </Text>

              <ScrollView className="max-h-80">
                {upcomingRaces.map((race: any, idx: number) => {
                  const isSelected = selectedRaces.includes(idx);
                  const isNextRace =
                    nextRace.name === race.name &&
                    nextRace.date === race.date;

                  return (
                    <View
                      key={idx}
                      className={`bg-white border rounded-lg p-3 mb-2 ${
                        isNextRace ? 'border-green-500 border-2' : 'border-sky-200'
                      }`}
                    >
                      <View className="flex-row items-start gap-3">
                        {/* Checkbox */}
                        <Pressable
                          onPress={() => toggleRaceSelection(idx)}
                          className={`w-6 h-6 rounded border-2 items-center justify-center mt-1 ${
                            isSelected
                              ? 'bg-sky-600 border-sky-600'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <Text className="text-white font-bold text-sm">✓</Text>
                          )}
                        </Pressable>

                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="font-semibold text-gray-900 text-base flex-1">
                              {race.name}
                              {isNextRace && (
                                <Text className="text-green-600 text-xs"> (Next Race)</Text>
                              )}
                            </Text>
                          </View>

                          <View className="flex-row flex-wrap gap-3 mb-2">
                            <Text className="text-sm text-gray-600">
                              📅 {race.date}
                            </Text>
                            {race.startTime && (
                              <Text className="text-sm text-gray-600">
                                ⏰ {race.startTime}
                              </Text>
                            )}
                            {race.location && (
                              <Text className="text-sm text-gray-600">
                                📍 {race.location}
                              </Text>
                            )}
                          </View>

                          {!isNextRace && (
                            <Pressable
                              onPress={() => selectAsNextRace(race, idx)}
                              className="bg-sky-600 px-3 py-2 rounded-lg self-start"
                            >
                              <Text className="text-white text-xs font-semibold">
                                Set as Next Race
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              <View className="mt-3 pt-3 border-t border-sky-200">
                <Text className="text-xs text-sky-700 text-center">
                  💡 Tip: Uncheck races you don't want. Selected races will be added to your calendar.
                </Text>
              </View>
            </View>
          )}

          {/* Manual Entry / Show selected */}
          {(!showRaceSelector || upcomingRaces.length === 0) && upcomingRaces.length > 0 && (
            <Pressable
              onPress={() => setShowRaceSelector(true)}
              className="bg-sky-100 border border-sky-300 rounded-lg p-3 mb-3"
            >
              <Text className="text-sky-700 text-sm font-medium text-center">
                📅 Choose from {upcomingRaces.length} calendar races instead
              </Text>
            </Pressable>
          )}

          {/* NEW: Direct Paste Fields */}
          <View className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-4">
            <Text className="text-base font-bold text-purple-900 mb-2">
              📋 Quick Paste Options
            </Text>
            <Text className="text-xs text-purple-700 mb-3">
              Paste calendar data, SI/NOR text, or upload race area images directly
            </Text>

            {/* Calendar CSV/Table Paste */}
            <View className="mb-3">
              <Text className="text-sm font-semibold text-purple-900 mb-1">
                📊 Paste Racing Calendar (CSV/Table)
              </Text>
              <Text className="text-xs text-purple-600 mb-2">
                Copy/paste from Excel, Google Sheets, or CSV racing calendar
              </Text>
              <TextInput
                value={calendarPasteData}
                onChangeText={setCalendarPasteData}
                placeholder="Paste CSV or table data here...&#10;e.g., Croucher 3, 2025-03-15, 14:00, Victoria Harbour"
                multiline
                numberOfLines={4}
                className="bg-white border border-purple-300 rounded-lg px-3 py-2 text-sm min-h-[100px]"
              />
            </View>

            {/* SIs/NORs Text Paste */}
            <View className="mb-3">
              <Text className="text-sm font-semibold text-purple-900 mb-1">
                📄 Paste SIs/NORs Text
              </Text>
              <Text className="text-xs text-purple-600 mb-2">
                Copy/paste Sailing Instructions or Notice of Race text for AI analysis
              </Text>
              <TextInput
                value={siNorPasteData}
                onChangeText={setSiNorPasteData}
                placeholder="Paste sailing instructions or NOR text here...&#10;AI will extract course details, marks, timing, etc."
                multiline
                numberOfLines={6}
                className="bg-white border border-purple-300 rounded-lg px-3 py-2 text-sm min-h-[120px]"
              />
            </View>

            {/* Race Area Image */}
            <View>
              <Text className="text-sm font-semibold text-purple-900 mb-1">
                🗺️ Race Area Image URL
              </Text>
              <Text className="text-xs text-purple-600 mb-2">
                Paste link to course map, race area diagram, or aerial photo
              </Text>
              <TextInput
                value={raceAreaImageUri}
                onChangeText={setRaceAreaImageUri}
                placeholder="https://... (course map, race area, or aerial image)"
                autoCapitalize="none"
                className="bg-white border border-purple-300 rounded-lg px-3 py-2 text-sm"
              />
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-900 mb-2">Race Name *</Text>
            <TextInput
              value={nextRace.name}
              onChangeText={(val) => setNextRace({ ...nextRace, name: val })}
              placeholder="e.g., Croucher Series - Race 3"
              className="bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 mb-2">Date *</Text>
              <TextInput
                value={nextRace.date}
                onChangeText={(val) => setNextRace({ ...nextRace, date: val })}
                placeholder="2025-03-15"
                className="bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 mb-2">Start Time *</Text>
              <TextInput
                value={nextRace.startTime}
                onChangeText={(val) => setNextRace({ ...nextRace, startTime: val })}
                placeholder="14:00"
                className="bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-sm font-semibold text-gray-900 mb-2">Location *</Text>
            <TextInput
              value={nextRace.location}
              onChangeText={(val) => setNextRace({ ...nextRace, location: val })}
              placeholder="e.g., Victoria Harbour, Hong Kong"
              className="bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>

          <View className="bg-gray-100 rounded-lg p-3">
            <Text className="text-sm font-semibold text-gray-700 mb-2">Race Documents (Optional)</Text>

            <View className="mb-2">
              <Text className="text-xs font-medium text-gray-600 mb-1">Notice of Race URL</Text>
              <TextInput
                value={nextRace.norUrl}
                onChangeText={(val) => setNextRace({ ...nextRace, norUrl: val })}
                placeholder="https://..."
                autoCapitalize="none"
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </View>

            <View className="mb-2">
              <Text className="text-xs font-medium text-gray-600 mb-1">Sailing Instructions URL</Text>
              <TextInput
                value={nextRace.siUrl}
                onChangeText={(val) => setNextRace({ ...nextRace, siUrl: val })}
                placeholder="https://..."
                autoCapitalize="none"
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </View>

            <View>
              <Text className="text-xs font-medium text-gray-600 mb-1">Course Map URL</Text>
              <TextInput
                value={nextRace.courseMapUrl}
                onChangeText={(val) => setNextRace({ ...nextRace, courseMapUrl: val })}
                placeholder="https://..."
                autoCapitalize="none"
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View className="mt-6">
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className={`py-4 px-6 rounded-xl flex-row items-center justify-center gap-2 ${
              submitting ? 'bg-gray-400' : 'bg-sky-600 active:bg-sky-700'
            }`}
          >
            {submitting ? (
              <>
                <Loader size={20} color="white" />
                <Text className="text-white font-bold text-lg">Processing...</Text>
              </>
            ) : (
              <>
                <Text className="text-white font-bold text-lg">Continue to Setup</Text>
                <ChevronRight size={20} color="white" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
