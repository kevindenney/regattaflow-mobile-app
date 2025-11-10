/**
 * Enhanced Club Onboarding Component
 * Hybrid AI + structured form experience
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Sparkles, Send, Globe, MapPin, Users } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/services/supabase';
import { ClubOnboardingService, type ClubSuggestion, type ClassSuggestion } from '@/services/ClubOnboardingService';
import { useClubSuggestions } from '@/hooks/useClubSuggestions';
import { SuggestionChip } from './SuggestionChip';
import { CollapsibleSection, FormField, AutocompleteField, ChipListField } from './ClubFormSection';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('EnhancedClubOnboarding');

interface EnhancedClubOnboardingProps {
  onComplete?: (clubId: string) => void;
  onCancel?: () => void;
}

export function EnhancedClubOnboarding({
  onComplete,
  onCancel,
}: EnhancedClubOnboardingProps) {
  const { user } = useAuth();

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // AI Input
  const [aiInput, setAiInput] = useState('');
  const [processing, setProcessing] = useState(false);

  // Form state
  const [clubName, setClubName] = useState('');
  const [clubWebsite, setClubWebsite] = useState('');
  const [clubEmail, setClubEmail] = useState('');
  const [clubPhone, setClubPhone] = useState('');
  const [clubDescription, setClubDescription] = useState('');

  // Selected club
  const [selectedClub, setSelectedClub] = useState<ClubSuggestion | null>(null);

  // Venue/Location
  const [venueName, setVenueName] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [venueCountry, setVenueCountry] = useState('');

  // Classes
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Events (from scraping)
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{ name: string; date?: string }>>([]);

  // Suggestions state (for accept/reject/edit)
  const [suggestions, setSuggestions] = useState<{
    club_name?: { value: string; confidence: number };
    website?: { value: string; confidence: number };
    email?: { value: string; confidence: number };
    phone?: { value: string; confidence: number };
    venue_name?: { value: string; confidence: number };
    venue_city?: { value: string; confidence: number };
    venue_country?: { value: string; confidence: number };
  }>({});

  // Auto-suggestions
  const {
    clubSuggestions,
    loadingClubs,
    classSuggestions,
    loadingClasses,
    venueSuggestions,
    loadingVenues,
    searchClubs,
  } = useClubSuggestions({
    query: clubName,
    selectedClubId: selectedClub?.id,
    autoDetectLocation: true,
  });

  /**
   * Initialize session
   */
  useEffect(() => {
    if (user) {
      initializeSession();
    }
  }, [user]);

  const initializeSession = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const session = await ClubOnboardingService.getOrCreateSession(user.id);
      if (session) {
        setSessionId(session.id);
        logger.debug('Session initialized:', session.id);

        // Restore any existing data
        if (session.confirmed_data) {
          const data = session.confirmed_data;
          setClubName(data.club_name || '');
          setClubWebsite(data.website || '');
          setClubEmail(data.email || '');
          setClubPhone(data.phone || '');
          setClubDescription(data.description || '');
          setVenueName(data.venue_name || '');
          setVenueCity(data.venue_city || '');
          setVenueCountry(data.venue_country || '');
          setSelectedClasses(data.classes || []);
        }
      }
    } catch (error) {
      logger.error('Error initializing session:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Detect if input is a URL
   */
  const isUrl = (text: string) => {
    const urlPattern = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i;
    return urlPattern.test(text.trim());
  };

  /**
   * Handle AI input submission
   */
  const handleAiInput = async () => {
    if (!aiInput.trim() || !sessionId) return;

    const input = aiInput.trim();
    setAiInput('');
    setProcessing(true);

    try {
      // Check if it's a URL
      if (isUrl(input)) {
        logger.debug('Detected URL input:', input);
        await handleUrlScrape(input);
      } else {
        logger.debug('Text input:', input);
        await handleTextInput(input);
      }
    } catch (error) {
      logger.error('Error processing AI input:', error);
      Alert.alert('Error', 'Failed to process input. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Scrape URL and create suggestions
   */
  const handleUrlScrape = async (url: string) => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase.functions.invoke('club-scrape', {
        body: {
          url,
          skillId: process.env.EXPO_PUBLIC_CLAUDE_SKILL_CLUB_SCRAPE || null,
        },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const scrapedData = data.data;

        // Save to session
        await ClubOnboardingService.saveScrapedData(sessionId, scrapedData, url);

        // Create suggestions instead of direct population
        const newSuggestions: typeof suggestions = {};

        if (scrapedData.club_name) {
          newSuggestions.club_name = { value: scrapedData.club_name, confidence: 0.9 };
        }

        newSuggestions.website = { value: url, confidence: 1.0 };

        if (scrapedData.contact?.email) {
          newSuggestions.email = { value: scrapedData.contact.email, confidence: 0.8 };
        }

        if (scrapedData.contact?.phone) {
          newSuggestions.phone = { value: scrapedData.contact.phone, confidence: 0.8 };
        }

        if (scrapedData.venue?.name) {
          newSuggestions.venue_name = { value: scrapedData.venue.name, confidence: 0.7 };
        }

        if (scrapedData.venue?.city) {
          newSuggestions.venue_city = { value: scrapedData.venue.city, confidence: 0.7 };
        }

        if (scrapedData.venue?.country) {
          newSuggestions.venue_country = { value: scrapedData.venue.country, confidence: 0.7 };
        }

        setSuggestions(newSuggestions);

        // Still populate description and classes directly for now
        if (scrapedData.summary) {
          setClubDescription(scrapedData.summary);
        }

        if (Array.isArray(scrapedData.classes)) {
          const classNames = scrapedData.classes.map((c: any) => c.name).filter(Boolean);
          setSelectedClasses(classNames);
        }

        if (Array.isArray(scrapedData.events)) {
          setUpcomingEvents(scrapedData.events);
        }

        Alert.alert('Success', 'Website scraped successfully! Review and accept/reject suggestions below.');
      } else {
        Alert.alert('Error', data?.error || 'Failed to scrape website');
      }
    } catch (error) {
      logger.error('Error scraping URL:', error);
      throw error;
    }
  };

  /**
   * Handle text input (search clubs)
   */
  const handleTextInput = async (text: string) => {
    // Simply trigger club search
    searchClubs(text);
    setClubName(text);
  };

  /**
   * Handle club selection
   */
  const handleSelectClub = useCallback((club: ClubSuggestion) => {
    setSelectedClub(club);
    setClubName(club.name);
    setClubWebsite(club.website || '');
    setVenueName(club.venue_name || '');
    setVenueCity(club.city || '');
    setVenueCountry(club.country || '');

    logger.debug('Selected club:', club);
  }, []);

  /**
   * Handle class selection from suggestions
   */
  const handleAddClass = useCallback((className: string) => {
    if (!selectedClasses.includes(className)) {
      setSelectedClasses([...selectedClasses, className]);
    }
  }, [selectedClasses]);

  /**
   * Remove class
   */
  const handleRemoveClass = useCallback((index: number) => {
    setSelectedClasses(selectedClasses.filter((_, i) => i !== index));
  }, [selectedClasses]);

  /**
   * Handle suggestion actions
   */
  const handleAcceptSuggestion = (field: keyof typeof suggestions) => {
    const suggestion = suggestions[field];
    if (!suggestion) return;

    // Apply suggestion to form
    switch (field) {
      case 'club_name':
        setClubName(suggestion.value);
        break;
      case 'website':
        setClubWebsite(suggestion.value);
        break;
      case 'email':
        setClubEmail(suggestion.value);
        break;
      case 'phone':
        setClubPhone(suggestion.value);
        break;
      case 'venue_name':
        setVenueName(suggestion.value);
        break;
      case 'venue_city':
        setVenueCity(suggestion.value);
        break;
      case 'venue_country':
        setVenueCountry(suggestion.value);
        break;
    }

    // Remove suggestion
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleRejectSuggestion = (field: keyof typeof suggestions) => {
    setSuggestions((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleEditSuggestion = (field: keyof typeof suggestions, newValue: string) => {
    setSuggestions((prev) => ({
      ...prev,
      [field]: { value: newValue, confidence: 0.5 },
    }));

    // Also update the form field
    switch (field) {
      case 'club_name':
        setClubName(newValue);
        break;
      case 'website':
        setClubWebsite(newValue);
        break;
      case 'email':
        setClubEmail(newValue);
        break;
      case 'phone':
        setClubPhone(newValue);
        break;
      case 'venue_name':
        setVenueName(newValue);
        break;
      case 'venue_city':
        setVenueCity(newValue);
        break;
      case 'venue_country':
        setVenueCountry(newValue);
        break;
    }
  };

  /**
   * Save and complete onboarding
   */
  const handleSave = async () => {
    if (!sessionId || !user) return;

    // Validation
    if (!clubName.trim()) {
      Alert.alert('Error', 'Please enter a club name');
      return;
    }

    setSaving(true);
    try {
      // Prepare confirmed data
      const confirmedData = {
        club_name: clubName,
        website: clubWebsite,
        email: clubEmail,
        phone: clubPhone,
        description: clubDescription,
        venue_name: venueName,
        venue_city: venueCity,
        venue_country: venueCountry,
        classes: selectedClasses,
        events: upcomingEvents,
      };

      // Call edge function to complete onboarding (uses service role)
      const { data, error } = await supabase.functions.invoke('club-onboarding-complete', {
        body: {
          sessionId,
          clubData: {
            name: clubName,
            website: clubWebsite,
            contact_email: clubEmail,
            contact_phone: clubPhone,
            description: clubDescription,
            venue_name: venueName,
            venue_city: venueCity,
            venue_country: venueCountry,
          },
          confirmedData,
          existingClubId: selectedClub?.id,
        },
      });

      if (error) throw error;

      if (data?.success && data?.clubId) {
        Alert.alert('Success', 'Club onboarding completed!', [
          {
            text: 'OK',
            onPress: () => onComplete?.(data.clubId),
          },
        ]);
      } else {
        throw new Error(data?.error || 'Failed to complete onboarding');
      }
    } catch (error) {
      logger.error('Error saving club:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save club. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* AI Input Header */}
      <View style={styles.aiInputContainer}>
        <Sparkles size={20} color="#8B5CF6" style={styles.aiIcon} />
        <TextInput
          style={styles.aiInput}
          value={aiInput}
          onChangeText={setAiInput}
          placeholder="Tell us about your club or paste website URL..."
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={handleAiInput}
          editable={!processing}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!aiInput.trim() || processing) && styles.sendButtonDisabled]}
          onPress={handleAiInput}
          disabled={!aiInput.trim() || processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Send size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Form Sections */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <CollapsibleSection title="Basic Information" defaultExpanded={true}>
          {/* Club Name Suggestion */}
          {suggestions.club_name && (
            <SuggestionChip
              label="Club Name"
              value={suggestions.club_name.value}
              confidence={suggestions.club_name.confidence}
              status="pending"
              onAccept={() => handleAcceptSuggestion('club_name')}
              onReject={() => handleRejectSuggestion('club_name')}
              onEdit={(newValue) => handleEditSuggestion('club_name', newValue)}
            />
          )}

          <AutocompleteField
            label="Club Name"
            value={clubName}
            onChangeText={setClubName}
            suggestions={clubSuggestions}
            renderSuggestion={(club) => (
              <View>
                <Text style={styles.suggestionTitle}>{club.name}</Text>
                {club.city && (
                  <Text style={styles.suggestionSubtitle}>
                    {club.city}, {club.country}
                  </Text>
                )}
              </View>
            )}
            onSelectSuggestion={handleSelectClub}
            loading={loadingClubs}
            placeholder="e.g., Royal Hong Kong Yacht Club"
            required
          />

          {selectedClub && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>
                ✓ Using existing club: {selectedClub.name}
              </Text>
            </View>
          )}

          {/* Website Suggestion */}
          {suggestions.website && (
            <SuggestionChip
              label="Website"
              value={suggestions.website.value}
              confidence={suggestions.website.confidence}
              status="pending"
              onAccept={() => handleAcceptSuggestion('website')}
              onReject={() => handleRejectSuggestion('website')}
              onEdit={(newValue) => handleEditSuggestion('website', newValue)}
            />
          )}

          <FormField
            label="Website"
            value={clubWebsite}
            onChangeText={setClubWebsite}
            placeholder="https://www.yourclub.com"
            keyboardType="url"
          />

          {/* Email Suggestion */}
          {suggestions.email && (
            <SuggestionChip
              label="Contact Email"
              value={suggestions.email.value}
              confidence={suggestions.email.confidence}
              status="pending"
              onAccept={() => handleAcceptSuggestion('email')}
              onReject={() => handleRejectSuggestion('email')}
              onEdit={(newValue) => handleEditSuggestion('email', newValue)}
            />
          )}

          <FormField
            label="Contact Email"
            value={clubEmail}
            onChangeText={setClubEmail}
            placeholder="info@yourclub.com"
            keyboardType="email-address"
          />

          {/* Phone Suggestion */}
          {suggestions.phone && (
            <SuggestionChip
              label="Contact Phone"
              value={suggestions.phone.value}
              confidence={suggestions.phone.confidence}
              status="pending"
              onAccept={() => handleAcceptSuggestion('phone')}
              onReject={() => handleRejectSuggestion('phone')}
              onEdit={(newValue) => handleEditSuggestion('phone', newValue)}
            />
          )}

          <FormField
            label="Contact Phone"
            value={clubPhone}
            onChangeText={setClubPhone}
            placeholder="+1 234 567 8900"
            keyboardType="phone-pad"
          />

          <FormField
            label="Description"
            value={clubDescription}
            onChangeText={setClubDescription}
            placeholder="Tell us about your club..."
            multiline
          />
        </CollapsibleSection>

        {/* Venue/Location */}
        <CollapsibleSection title="Location" defaultExpanded={false}>
          {/* Venue Name Suggestion */}
          {suggestions.venue_name && (
            <SuggestionChip
              label="Venue Name"
              value={suggestions.venue_name.value}
              confidence={suggestions.venue_name.confidence}
              status="pending"
              onAccept={() => handleAcceptSuggestion('venue_name')}
              onReject={() => handleRejectSuggestion('venue_name')}
              onEdit={(newValue) => handleEditSuggestion('venue_name', newValue)}
            />
          )}

          <FormField
            label="Venue Name"
            value={venueName}
            onChangeText={setVenueName}
            placeholder="e.g., Kellett Island"
          />

          {/* City Suggestion */}
          {suggestions.venue_city && (
            <SuggestionChip
              label="City"
              value={suggestions.venue_city.value}
              confidence={suggestions.venue_city.confidence}
              status="pending"
              onAccept={() => handleAcceptSuggestion('venue_city')}
              onReject={() => handleRejectSuggestion('venue_city')}
              onEdit={(newValue) => handleEditSuggestion('venue_city', newValue)}
            />
          )}

          <FormField
            label="City"
            value={venueCity}
            onChangeText={setVenueCity}
            placeholder="e.g., Hong Kong"
          />

          {/* Country Suggestion */}
          {suggestions.venue_country && (
            <SuggestionChip
              label="Country"
              value={suggestions.venue_country.value}
              confidence={suggestions.venue_country.confidence}
              status="pending"
              onAccept={() => handleAcceptSuggestion('venue_country')}
              onReject={() => handleRejectSuggestion('venue_country')}
              onEdit={(newValue) => handleEditSuggestion('venue_country', newValue)}
            />
          )}

          <FormField
            label="Country"
            value={venueCountry}
            onChangeText={setVenueCountry}
            placeholder="e.g., Hong Kong SAR"
          />
        </CollapsibleSection>

        {/* Boat Classes */}
        <CollapsibleSection title="Boat Classes" defaultExpanded={false}>
          <ChipListField
            label="Classes Your Club Races"
            chips={selectedClasses}
            onAddChip={handleAddClass}
            onRemoveChip={handleRemoveClass}
            placeholder="e.g., Dragon, J/80, IRC"
            suggestions={classSuggestions.map((c) => c.name)}
          />

          {classSuggestions.length > 0 && loadingClasses === false && (
            <Text style={styles.helperText}>
              💡 These classes are popular at similar clubs
            </Text>
          )}
        </CollapsibleSection>

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <CollapsibleSection title="Upcoming Events (from website)" defaultExpanded={false}>
            {upcomingEvents.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <Text style={styles.eventName}>{event.name}</Text>
                {event.date && <Text style={styles.eventDate}>{event.date}</Text>}
              </View>
            ))}
          </CollapsibleSection>
        )}

        {/* Spacer for save button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  aiIcon: {
    marginTop: 4,
  },
  aiInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  selectedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedBadgeText: {
    fontSize: 14,
    color: '#065F46',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  eventItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  eventDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
