import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useAuth } from '@/src/providers/AuthProvider';
import { supabase } from '@/src/services/supabase';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' }
];

interface LanguageItemProps {
  language: Language;
  selected: boolean;
  onPress: () => void;
}

const LanguageItem: React.FC<LanguageItemProps> = ({ language, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center px-4 py-4 border-b border-gray-100 active:bg-gray-50 ${
      selected ? 'bg-blue-50' : ''
    }`}
  >
    <Text className="text-2xl mr-3">{language.flag}</Text>
    <View className="flex-1">
      <Text className="text-gray-800 font-medium">{language.name}</Text>
      <Text className="text-gray-500 text-sm mt-0.5">{language.nativeName}</Text>
    </View>
    {selected && <Check size={20} color="#2563EB" />}
  </TouchableOpacity>
);

export default function LanguageScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState('en');

  React.useEffect(() => {
    loadLanguagePreference();
  }, [user]);

  const loadLanguagePreference = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('language')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.language) {
        setSelectedLanguage(data.language);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLanguage = async (languageCode: string) => {
    const previousLanguage = selectedLanguage;
    setSelectedLanguage(languageCode);
    setSaving(true);

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          language: languageCode,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      const language = LANGUAGES.find((l) => l.code === languageCode);
      Alert.alert(
        'Language Changed',
        `Language has been changed to ${language?.name}. The app will update on next restart.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving language preference:', error);
      setSelectedLanguage(previousLanguage);
      Alert.alert('Error', 'Failed to save language preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Language</Text>
          </View>
          {saving && <ActivityIndicator size="small" color="#2563EB" />}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Info */}
        <View className="bg-blue-50 mx-4 mt-4 p-4 rounded-lg border border-blue-200">
          <Text className="text-blue-900 font-semibold mb-1">
            Multi-Language Support
          </Text>
          <Text className="text-blue-700 text-sm">
            RegattaFlow supports multiple languages for sailors around the world. Select your
            preferred language below. Document parsing and AI features will adapt to your selection.
          </Text>
        </View>

        {/* Language List */}
        <View className="bg-white mt-4">
          {LANGUAGES.map((language) => (
            <LanguageItem
              key={language.code}
              language={language}
              selected={selectedLanguage === language.code}
              onPress={() => handleSelectLanguage(language.code)}
            />
          ))}
        </View>

        {/* Additional Info */}
        <View className="bg-gray-100 mx-4 mt-4 p-4 rounded-lg">
          <Text className="text-gray-600 text-sm">
            <Text className="font-semibold">Note: </Text>
            Some features may not be fully translated yet. We're continuously working to improve
            language support across all features.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
