/**
 * Add/Edit Next Race Screen
 * Quick form to add or update next race details
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, ChevronLeft, CheckCircle, FileText, Plus, X } from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';

export default function AddNextRace() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingRaceId, setExistingRaceId] = useState<string | null>(null);

  // Form fields
  const [raceName, setRaceName] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [location, setLocation] = useState('');

  // Race documents
  const [documents, setDocuments] = useState<Array<{
    type: 'notice_of_race' | 'sailing_instructions' | 'course_map' | 'other';
    url: string;
    name?: string;
  }>>([]);
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocType, setNewDocType] = useState<'notice_of_race' | 'sailing_instructions' | 'course_map' | 'other'>('notice_of_race');

  // Load existing next race if any
  useEffect(() => {
    loadExistingRace();
  }, []);

  const loadExistingRace = async () => {
    if (!user?.id) return;

    try {
      // Get sailor profile first
      const { data: profile } = await supabase
        .from('sailor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Get next upcoming race
      const { data: race } = await supabase
        .from('sailor_race_calendar')
        .select('*')
        .eq('sailor_id', profile.id)
        .gte('race_date', new Date().toISOString().split('T')[0])
        .order('race_date', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (race) {
        setExistingRaceId(race.id);
        setRaceName(race.name || '');
        setRaceDate(race.race_date || '');
        setStartTime(race.start_time || '');
        setLocation(race.location || '');

        // Load associated documents if any
        if (race.documents) {
          setDocuments(race.documents);
        }
      }
    } catch (error) {
      console.error('Error loading race:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDocument = () => {
    if (!newDocUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter a document URL');
      return;
    }

    // Extract filename from URL for display
    const fileName = newDocUrl.split('/').pop() || 'Document';

    setDocuments([
      ...documents,
      {
        type: newDocType,
        url: newDocUrl.trim(),
        name: fileName,
      },
    ]);

    // Reset form
    setNewDocUrl('');
    setNewDocType('notice_of_race');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'notice_of_race':
        return 'Notice of Race';
      case 'sailing_instructions':
        return 'Sailing Instructions';
      case 'course_map':
        return 'Course Map';
      default:
        return 'Other Document';
    }
  };

  const handleSave = async () => {
    // Validation
    if (!raceName || !raceDate || !startTime || !location) {
      Alert.alert('Missing Information', 'Please fill in all fields to get the best race strategy.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please try logging in again.');
      return;
    }

    setSaving(true);

    try {
      // Get sailor profile
      const { data: profile } = await supabase
        .from('sailor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        throw new Error('Sailor profile not found');
      }

      const raceData = {
        sailor_id: profile.id,
        name: raceName,
        race_date: raceDate,
        start_time: startTime,
        location: location,
        documents: documents.length > 0 ? documents : null,
        updated_at: new Date().toISOString(),
      };

      if (existingRaceId) {
        // Update existing race
        const { error } = await supabase
          .from('sailor_race_calendar')
          .update(raceData)
          .eq('id', existingRaceId);

        if (error) throw error;
        Alert.alert('Success', 'Race updated! Your dashboard will now show race strategy recommendations.');
      } else {
        // Insert new race
        const { error } = await supabase
          .from('sailor_race_calendar')
          .insert({
            ...raceData,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        Alert.alert('Success', 'Race added! Your Races tab will now show race strategy recommendations.');
      }

      // Navigate back to races
      router.replace('/(tabs)/races');
    } catch (error: any) {
      console.error('Error saving race:', error);
      Alert.alert('Save Error', error.message || 'Failed to save race. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0284c7" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  const missingFields = [];
  if (!raceName) missingFields.push('race name');
  if (!raceDate) missingFields.push('date');
  if (!startTime) missingFields.push('time');
  if (!location) missingFields.push('location');

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-sky-600 pt-12 pb-6 px-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mb-4"
          disabled={saving}
        >
          <ChevronLeft size={24} color="white" />
          <Text className="text-white text-base ml-2">Back</Text>
        </Pressable>
        <Text className="text-white text-2xl font-bold">
          {existingRaceId ? 'Update' : 'Add'} Next Race
        </Text>
        <Text className="text-white/80 text-base mt-2">
          Get weather forecasts and race strategy recommendations
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        {/* Info Banner */}
        <View className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
          <Text className="text-sm font-semibold text-sky-900 mb-1">
            📍 Why We Need This
          </Text>
          <Text className="text-sm text-sky-800">
            With your race details, we'll provide:
          </Text>
          <Text className="text-sm text-sky-800 mt-1">
            • Weather forecast (wind, waves, tide){'\n'}
            • Hull and rig setup recommendations{'\n'}
            • Tactical strategy for conditions{'\n'}
            • Performance tracking over time
          </Text>
        </View>

        {/* Race Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Race Name *
          </Text>
          <TextInput
            value={raceName}
            onChangeText={setRaceName}
            placeholder="e.g., Croucher Series Race 3"
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
            editable={!saving}
          />
        </View>

        {/* Date and Time */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-2">
              <Calendar size={18} color="#374151" />
              <Text className="text-base font-semibold text-gray-900">
                Date *
              </Text>
            </View>
            <TextInput
              value={raceDate}
              onChangeText={setRaceDate}
              placeholder="YYYY-MM-DD"
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
              editable={!saving}
            />
            <Text className="text-xs text-gray-500 mt-1">Format: 2025-03-15</Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-2">
              <Clock size={18} color="#374151" />
              <Text className="text-base font-semibold text-gray-900">
                Start Time *
              </Text>
            </View>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="HH:MM"
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
              editable={!saving}
            />
            <Text className="text-xs text-gray-500 mt-1">Format: 14:00</Text>
          </View>
        </View>

        {/* Location */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-2">
            <MapPin size={18} color="#374151" />
            <Text className="text-base font-semibold text-gray-900">
              Race Location *
            </Text>
          </View>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Victoria Harbour, Hong Kong"
            className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
            editable={!saving}
            multiline
            numberOfLines={2}
          />
          <Text className="text-xs text-gray-500 mt-1">
            Specific location helps us provide accurate weather & tide forecasts
          </Text>
        </View>

        {/* Race Documents Section */}
        <View className="mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <FileText size={18} color="#374151" />
            <Text className="text-base font-semibold text-gray-900">
              Race Documents (Optional)
            </Text>
          </View>

          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <Text className="text-sm text-blue-900 mb-1">
              📄 Add PDFs for AI Analysis
            </Text>
            <Text className="text-sm text-blue-800">
              We can extract course maps, marks, and tactical info from:
            </Text>
            <Text className="text-sm text-blue-800 mt-1">
              • Notice of Race (NOR){'\n'}
              • Sailing Instructions (SIs){'\n'}
              • Course Maps / Race Areas
            </Text>
          </View>

          {/* Document Type Selector */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 mb-2">Document Type</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setNewDocType('notice_of_race')}
                className={`flex-1 py-2 px-3 rounded-lg border ${
                  newDocType === 'notice_of_race'
                    ? 'bg-sky-100 border-sky-600'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <Text
                  className={`text-center text-xs font-semibold ${
                    newDocType === 'notice_of_race' ? 'text-sky-700' : 'text-gray-700'
                  }`}
                >
                  NOR
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setNewDocType('sailing_instructions')}
                className={`flex-1 py-2 px-3 rounded-lg border ${
                  newDocType === 'sailing_instructions'
                    ? 'bg-sky-100 border-sky-600'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <Text
                  className={`text-center text-xs font-semibold ${
                    newDocType === 'sailing_instructions' ? 'text-sky-700' : 'text-gray-700'
                  }`}
                >
                  SIs
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setNewDocType('course_map')}
                className={`flex-1 py-2 px-3 rounded-lg border ${
                  newDocType === 'course_map'
                    ? 'bg-sky-100 border-sky-600'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <Text
                  className={`text-center text-xs font-semibold ${
                    newDocType === 'course_map' ? 'text-sky-700' : 'text-gray-700'
                  }`}
                >
                  Course
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setNewDocType('other')}
                className={`flex-1 py-2 px-3 rounded-lg border ${
                  newDocType === 'other'
                    ? 'bg-sky-100 border-sky-600'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <Text
                  className={`text-center text-xs font-semibold ${
                    newDocType === 'other' ? 'text-sky-700' : 'text-gray-700'
                  }`}
                >
                  Other
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Document URL Input */}
          <View className="flex-row gap-2 mb-3">
            <TextInput
              value={newDocUrl}
              onChangeText={setNewDocUrl}
              placeholder="https://www.rhkyc.org.hk/.../DragonStandardNOR.pdf"
              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900"
              editable={!saving}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={addDocument}
              disabled={saving}
              className="bg-sky-600 py-3 px-4 rounded-lg active:bg-sky-700 items-center justify-center"
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
              {documents.map((doc, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center justify-between py-2 border-b border-gray-200"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-semibold text-sky-700">
                      {getDocumentTypeLabel(doc.type)}
                    </Text>
                    <Text className="text-xs text-gray-600" numberOfLines={1}>
                      {doc.name}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeDocument(idx)}
                    disabled={saving}
                    className="p-1"
                  >
                    <X size={16} color="#dc2626" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Missing Fields Warning */}
        {missingFields.length > 0 && (
          <View className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <Text className="text-sm font-semibold text-amber-900 mb-1">
              ⚠️ Missing Information
            </Text>
            <Text className="text-sm text-amber-800">
              Please fill in: {missingFields.join(', ')}
            </Text>
          </View>
        )}

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={missingFields.length > 0 || saving}
          className={`py-4 px-6 rounded-xl flex-row items-center justify-center gap-2 ${
            missingFields.length > 0 || saving
              ? 'bg-gray-300'
              : 'bg-sky-600 active:bg-sky-700'
          }`}
        >
          {saving ? (
            <>
              <ActivityIndicator color="white" />
              <Text className="text-center text-base font-semibold text-white">
                Saving...
              </Text>
            </>
          ) : (
            <>
              <CheckCircle size={20} color="white" />
              <Text className="text-center text-base font-semibold text-white">
                {existingRaceId ? 'Update Race' : 'Save Race'}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
