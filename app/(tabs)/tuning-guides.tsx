import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useSailorDashboardData } from '@/hooks';
import {
  TuningGuide,
  FleetTuningGuide,
  tuningGuideService
} from '@/services/tuningGuideService';
import { tuningGuideExtractionService } from '@/services/TuningGuideExtractionService';

export default function TuningGuidesScreen() {
  const { user } = useAuth();
  const sailorData = useSailorDashboardData();

  const [personalGuides, setPersonalGuides] = useState<TuningGuide[]>([]);
  const [fleetGuides, setFleetGuides] = useState<FleetTuningGuide[]>([]);
  const [classGuides, setClassGuides] = useState<TuningGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'personal' | 'fleet' | 'all'>('all');
  const [extracting, setExtracting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      loadGuides();
    }
  }, [user, sailorData.classes]);

  const loadGuides = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get personal and fleet guides
      const { personal, fleet } = await tuningGuideService.getAllSailorGuides(user.id);
      setPersonalGuides(personal);
      setFleetGuides(fleet);

      // Load guides for user's boat classes
      const classGuidesPromises = sailorData.classes.map(cls =>
        tuningGuideService.getGuidesForClass(cls.id)
      );
      const classGuidesArrays = await Promise.all(classGuidesPromises);
      const allClassGuides = classGuidesArrays.flat();

      // Filter out duplicates (guides already in personal library)
      const personalGuideIds = new Set(personal.map(g => g.id));
      const uniqueClassGuides = allClassGuides.filter(g => !personalGuideIds.has(g.id));

      setClassGuides(uniqueClassGuides);
    } catch (error) {
      console.error('Error loading guides:', error);
      Alert.alert('Error', 'Failed to load tuning guides');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractContent = async (guide: TuningGuide) => {
    if (!guide.fileUrl || guide.extractionStatus === 'completed') return;

    try {
      setExtracting(prev => ({ ...prev, [guide.id]: true }));

      await tuningGuideExtractionService.extractContent(
        guide.id,
        guide.fileUrl,
        guide.fileType
      );

      Alert.alert('Success', 'Content extracted successfully! You can now search within this guide.');
      await loadGuides();
    } catch (error) {
      console.error('Error extracting content:', error);
      Alert.alert('Error', 'Failed to extract content from guide');
    } finally {
      setExtracting(prev => ({ ...prev, [guide.id]: false }));
    }
  };

  const handleGuidePress = async (guide: TuningGuide) => {
    if (user) {
      await tuningGuideService.recordView(guide.id, user.id);
    }

    const urlToOpen = guide.fileUrl || guide.sourceUrl;
    if (urlToOpen) {
      const canOpen = await Linking.canOpenURL(urlToOpen);
      if (canOpen) {
        await Linking.openURL(urlToOpen);
      }
    }
  };

  const renderGuideCard = (guide: TuningGuide | FleetTuningGuide, isFleet = false) => {
    const isExtracting = extracting[guide.id];
    const hasExtractedContent = guide.extractionStatus === 'completed';
    const fleetGuide = isFleet ? (guide as FleetTuningGuide) : null;

    return (
      <TouchableOpacity
        key={guide.id}
        style={styles.guideCard}
        onPress={() => handleGuidePress(guide)}
      >
        <View style={styles.guideHeader}>
          <View style={styles.guideIcon}>
            <Ionicons
              name={guide.fileType === 'pdf' ? 'document-text' : 'link'}
              size={24}
              color="#3B82F6"
            />
          </View>
          <View style={styles.guideInfo}>
            <Text style={styles.guideSource}>{guide.source}</Text>
            <Text style={styles.guideTitle} numberOfLines={2}>
              {guide.title}
            </Text>
            {guide.year && (
              <Text style={styles.guideYear}>Updated {guide.year}</Text>
            )}
          </View>
        </View>

        {fleetGuide?.sharedByName && (
          <View style={styles.fleetInfo}>
            <Ionicons name="people" size={14} color="#64748B" />
            <Text style={styles.fleetText}>
              Shared by {fleetGuide.sharedByName}
            </Text>
            {fleetGuide.isRecommended && (
              <View style={styles.recommendedBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.recommendedText}>Recommended</Text>
              </View>
            )}
          </View>
        )}

        {fleetGuide?.shareNotes && (
          <Text style={styles.shareNotes}>{fleetGuide.shareNotes}</Text>
        )}

        {guide.description && (
          <Text style={styles.guideDescription} numberOfLines={2}>
            {guide.description}
          </Text>
        )}

        <View style={styles.guideActions}>
          {hasExtractedContent ? (
            <View style={styles.extractedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.extractedText}>Content extracted</Text>
            </View>
          ) : guide.fileUrl && guide.fileType === 'pdf' ? (
            <TouchableOpacity
              style={styles.extractButton}
              onPress={(e) => {
                e.stopPropagation();
                handleExtractContent(guide);
              }}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <>
                  <Ionicons name="scan" size={16} color="#3B82F6" />
                  <Text style={styles.extractButtonText}>Extract Content</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          {guide.tags.length > 0 && (
            <View style={styles.tags}>
              {guide.tags.slice(0, 3).map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {hasExtractedContent && guide.extractedSections && guide.extractedSections.length > 0 && (
          <View style={styles.sectionsPreview}>
            <Text style={styles.sectionsTitle}>
              📖 {guide.extractedSections.length} sections available
            </Text>
            {guide.extractedSections.slice(0, 2).map((section: any, idx: number) => (
              <Text key={idx} style={styles.sectionItem} numberOfLines={1}>
                • {section.title}
              </Text>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleAutoFetchGuides = async (className: string, classId: string) => {
    try {
      Alert.alert(
        `Fetch ${className} Tuning Guides`,
        `Search for tuning guides from North Sails, Quantum, and other major sailmakers for ${className}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Fetch Guides',
            onPress: async () => {
              await tuningGuideService.triggerAutoScrape(classId);
              Alert.alert('Success', `Searching for ${className} tuning guides...`);
              setTimeout(() => loadGuides(), 2000);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error auto-fetching guides:', error);
      Alert.alert('Error', 'Failed to fetch tuning guides');
    }
  };

  const filteredGuides = () => {
    const allGuides = selectedTab === 'personal'
      ? personalGuides
      : selectedTab === 'fleet'
      ? fleetGuides
      : [...personalGuides, ...fleetGuides, ...classGuides];

    if (!searchQuery.trim()) return allGuides;

    const query = searchQuery.toLowerCase();
    return allGuides.filter(guide =>
      guide.title.toLowerCase().includes(query) ||
      guide.source.toLowerCase().includes(query) ||
      guide.description?.toLowerCase().includes(query) ||
      guide.extractedContent?.toLowerCase().includes(query) ||
      guide.tags.some(tag => tag.toLowerCase().includes(query))
    );
  };

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>
          Sign in to view tuning guides
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.message}>Loading tuning guides...</Text>
      </View>
    );
  }

  const guides = filteredGuides();

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guides, settings, conditions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All ({personalGuides.length + fleetGuides.length + classGuides.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'personal' && styles.tabActive]}
          onPress={() => setSelectedTab('personal')}
        >
          <Text style={[styles.tabText, selectedTab === 'personal' && styles.tabTextActive]}>
            My Guides ({personalGuides.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'fleet' && styles.tabActive]}
          onPress={() => setSelectedTab('fleet')}
        >
          <Ionicons
            name="people"
            size={16}
            color={selectedTab === 'fleet' ? '#3B82F6' : '#64748B'}
          />
          <Text style={[styles.tabText, selectedTab === 'fleet' && styles.tabTextActive]}>
            Fleet ({fleetGuides.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Guides List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {guides.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No guides found' : 'No tuning guides yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : sailorData.classes.length > 0
                ? 'Fetch tuning guides for your boat classes'
                : 'Add a boat to get tuning guides'
              }
            </Text>

            {/* Show boat classes with fetch options */}
            {!searchQuery && sailorData.classes.length > 0 && (
              <View style={styles.classesContainer}>
                <Text style={styles.classesTitle}>Your Boats:</Text>
                {sailorData.classes.map(cls => (
                  <TouchableOpacity
                    key={cls.id}
                    style={styles.classCard}
                    onPress={() => handleAutoFetchGuides(cls.name, cls.id)}
                  >
                    <View style={styles.classIcon}>
                      <Ionicons name="boat" size={24} color="#3B82F6" />
                    </View>
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{cls.name}</Text>
                      {cls.sailNumber && (
                        <Text style={styles.classSailNumber}>Sail #{cls.sailNumber}</Text>
                      )}
                    </View>
                    <View style={styles.fetchButton}>
                      <Ionicons name="download-outline" size={20} color="#3B82F6" />
                      <Text style={styles.fetchButtonText}>Fetch Guides</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          guides.map(guide => {
            const isFleet = fleetGuides.some(fg => fg.id === guide.id);
            return renderGuideCard(guide, isFleet);
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#334155',
    marginTop: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guideHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  guideIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideInfo: {
    flex: 1,
  },
  guideSource: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 4,
  },
  guideYear: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  guideDescription: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 20,
  },
  fleetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fleetText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  shareNotes: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  guideActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  extractButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  extractedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  extractedText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
  },
  tag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#64748B',
  },
  sectionsPreview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sectionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  sectionItem: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  classesContainer: {
    width: '100%',
    paddingHorizontal: 16,
    gap: 12,
  },
  classesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  classIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  classSailNumber: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  fetchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  fetchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
