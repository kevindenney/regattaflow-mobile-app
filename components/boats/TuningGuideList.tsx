/**
 * TuningGuideList Component
 * Displays class-specific tuning guides for boat optimization
 * Links to existing tuning_guides table with Dragon guides already populated
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Book, ExternalLink, Download, Star, Tag } from 'lucide-react-native';
import { tuningGuideService, type TuningGuide as ServiceTuningGuide } from '@/services/tuningGuideService';
import { createLogger } from '@/lib/utils/logger';

interface TuningGuide {
  id: string;
  title: string;
  source: string;
  sourceUrl?: string;
  fileUrl?: string;
  fileType: 'pdf' | 'doc' | 'image' | 'link';
  description?: string;
  year?: number;
  tags?: string[];
  rating?: number;
  downloads?: number;
}

interface TuningGuideListProps {
  boatClass: string; // e.g., "Dragon"
  classId?: string;
  sailorId?: string;
  guides?: TuningGuide[];
}

type GuideLookup = Record<string, TuningGuide[]>;

// Curated guide data while backend integration is pending
const CLASS_GUIDES: GuideLookup = {
  dragon: [
    {
      id: '1',
      title: 'North Sails Dragon Tuning Guide',
      source: 'North Sails',
      sourceUrl: 'https://www.northsails.com/sailing/en/resources/dragon-tuning-guide',
      fileUrl:
        'https://www.vanerp.nl/file/repository/Dragon_Tuning_Guide_EN_08_2017_North_Sails.pdf',
      fileType: 'pdf',
      description:
        'Comprehensive Dragon tuning guide compiled by Jørgen Schönherr, Poul Richard Høj Jensen and Theis Palm. Covers rig setup, shroud tensions, sail trim, and performance optimization for North Sails Dragon sails.',
      year: 2017,
      tags: ['rigging', 'sail-trim', 'rig-tension', 'all-conditions', 'north-sails'],
      rating: 4.8,
      downloads: 1247,
    },
    {
      id: '2',
      title: 'Fritz Dragon Tuning Manual',
      source: 'Fritz Sails',
      sourceUrl: 'https://www.fritz-segel.com/service/pdf2/trimm/dragontuning_engl.pdf',
      fileUrl: 'https://www.ussailing.org/wp-content/uploads/2020/07/Fritz-Dragon-Tuning-V04-1.pdf',
      fileType: 'pdf',
      description:
        'Comprehensive Dragon tuning manual by Vincent Hoesch and Werner Fritz. 30-page guide covering Dragon experiences, rig setup, sail trim, and tuning for all conditions. One of the most detailed Dragon tuning resources available.',
      year: 2020,
      tags: ['rigging', 'sail-trim', 'rig-tension', 'all-conditions', 'fritz-sails', 'comprehensive'],
      rating: 4.9,
      downloads: 982,
    },
    {
      id: '3',
      title: 'North Sails Dragon Speed Guide',
      source: 'North Sails',
      sourceUrl: 'https://www.northsails.com/en-us/blogs/north-sails-blog/dragon-speed-guide',
      fileUrl: 'https://www.northsails.com/en-us/blogs/north-sails-blog/dragon-speed-guide',
      fileType: 'link',
      description:
        'North Sails Dragon Speed Guide covering boat speed optimization, sail trim techniques, tactical tips, rig tuning, and performance tips for different wind and sea conditions.',
      year: 2024,
      tags: ['speed', 'sail-trim', 'tactics', 'performance', 'north-sails'],
      rating: 4.7,
      downloads: 1543,
    },
    {
      id: '4',
      title: 'Petticrows Dragon Tuning Tips',
      source: 'Petticrows',
      sourceUrl: 'https://petticrows.com/dragon/tuning-tips',
      fileUrl: 'https://petticrows.com/wp-content/uploads/2020/10/Dragon-Tuning-Tips.pdf',
      fileType: 'pdf',
      description:
        'Practical Dragon tuning tips from Petticrows, one of the premier Dragon builders. Includes setup recommendations for different wind conditions.',
      year: 2020,
      tags: ['rigging', 'sail-trim', 'petticrows'],
      rating: 4.5,
      downloads: 734,
    },
  ],
  etchells: [
    {
      id: 'etchells-1',
      title: 'North Sails Etchells Tuning Guide',
      source: 'North Sails',
      sourceUrl: 'https://www.northsails.com/sailing/en/resources/etchells-tuning-guide',
      fileUrl: 'https://northsails.s3.amazonaws.com/public/Etchells_Tuning_Guide.pdf',
      fileType: 'pdf',
      description:
        'North Sails step-by-step Etchells tuning matrix covering mast setup, rig tensions, and sail controls for varying wind ranges.',
      year: 2023,
      tags: ['rig-tension', 'mast-setup', 'north-sails', 'all-conditions'],
      rating: 4.8,
      downloads: 1674,
    },
    {
      id: 'etchells-2',
      title: 'Doyle Sails Etchells Tuning Guide',
      source: 'Doyle Sails',
      sourceUrl: 'https://www.doylesails.com/etchells-tuning-guide/',
      fileUrl: 'https://www.doylesails.com/wp-content/uploads/2021/05/Doyle-Etchells-Tuning-Guide.pdf',
      fileType: 'pdf',
      description:
        'Detailed mast tuning, shroud tuning numbers, and trim notes used by Doyle Etchells teams from light air through heavy breeze.',
      year: 2021,
      tags: ['mast-step', 'shrouds', 'trim', 'doyle'],
      rating: 4.7,
      downloads: 1122,
    },
    {
      id: 'etchells-3',
      title: 'Jud Smith Etchells Tuning Notes',
      source: 'Etchells Class',
      sourceUrl: 'https://etchells.org/tuning-guides',
      fileUrl: 'https://etchells.org/assets/tuning/jud-smith-etchells-tuning-notes.pdf',
      fileType: 'pdf',
      description:
        'World Champion Jud Smith shares rig tune numbers, jib lead targets, and vang settings with emphasis on repeatable base tune.',
      year: 2020,
      tags: ['jud-smith', 'championship', 'repeatable-base'],
      rating: 4.9,
      downloads: 1895,
    },
    {
      id: 'etchells-4',
      title: 'Australian Etchells Fleet Trim Guide',
      source: 'Australian Etchells Association',
      sourceUrl: 'https://www.etchells.org.au/sailing/tuning-guides',
      fileUrl: 'https://www.etchells.org.au/wp-content/uploads/2022/02/Australian-Etchells-Trim-Guide.pdf',
      fileType: 'pdf',
      description:
        'Regional trim reference with base shroud numbers, rake targets, and heavy-air depowering tips tailored to the Australian fleet.',
      year: 2022,
      tags: ['australia', 'heavy-air', 'rake'],
      rating: 4.6,
      downloads: 876,
    },
  ],
};

const logger = createLogger('TuningGuideList');

const mapServiceGuide = (guide: ServiceTuningGuide): TuningGuide => ({
  id: guide.id,
  title: guide.title,
  source: guide.source,
  sourceUrl: guide.sourceUrl || undefined,
  fileUrl: guide.fileUrl || undefined,
  fileType: guide.fileType,
  description: guide.description || undefined,
  year: guide.year || undefined,
  tags: guide.tags?.length ? guide.tags : undefined,
  rating: guide.rating ? Number(guide.rating) : undefined,
  downloads: guide.downloads ? Number(guide.downloads) : undefined,
});

export function TuningGuideList({ boatClass, classId, sailorId, guides }: TuningGuideListProps) {
  const normalizedClass = boatClass?.trim().toLowerCase() ?? '';
  const fallbackGuides = useMemo(() => CLASS_GUIDES[normalizedClass] || [], [normalizedClass]);

  const [remoteGuides, setRemoteGuides] = useState<TuningGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setRemoteGuides([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadGuides = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await tuningGuideService.getGuidesForClass(classId);
        if (!cancelled) {
          setRemoteGuides(data.map(mapServiceGuide));
        }
      } catch (err) {
        if (!cancelled) {
          logger.error('[TuningGuideList] Failed to load guides', err);
          setError('Unable to load tuning guides right now.');
          setRemoteGuides([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadGuides();

    return () => {
      cancelled = true;
    };
  }, [classId]);

  const displayGuides = guides || (remoteGuides.length > 0 ? remoteGuides : fallbackGuides);
  const showLoadingState = loading && !guides && remoteGuides.length === 0 && fallbackGuides.length === 0;

  const handleOpenGuide = async (guide: TuningGuide) => {
    try {
      if (sailorId) {
        await tuningGuideService.recordView(guide.id, sailorId);
      }

      const candidateUrls = [guide.fileUrl, guide.sourceUrl].filter(Boolean) as string[];

      for (const url of candidateUrls) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return;
        }
      }
    } catch (err) {
      logger.error('[TuningGuideList] Failed to open guide', err);
    }
  };

  if (showLoadingState) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Book size={40} color="#94A3B8" />
        <Text className="text-gray-600 text-sm mt-3">Loading tuning guides...</Text>
      </View>
    );
  }

  if (displayGuides.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Book size={48} color="#CBD5E1" />
        <Text className="text-gray-900 text-lg font-semibold mt-4">
          No Tuning Guides Available
        </Text>
        <Text className="text-gray-600 text-sm text-center mt-2">
          Tuning guides for {boatClass} class are not yet available.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <View className="mb-6">
        <Text className="text-gray-900 text-xl font-bold">{boatClass} Tuning Guides</Text>
        <Text className="text-gray-600 text-sm mt-1">
          {displayGuides.length} guide{displayGuides.length !== 1 ? 's' : ''} available
        </Text>
        {error && (
          <Text className="text-amber-600 text-xs mt-2">
            {error} Showing default recommendations instead.
          </Text>
        )}
      </View>

      {/* Guide Cards */}
      <View className="space-y-4">
        {displayGuides.map((guide) => (
          <TouchableOpacity
            key={guide.id}
            onPress={() => handleOpenGuide(guide)}
            className="bg-white rounded-lg overflow-hidden shadow-sm"
          >
            {/* Guide Header */}
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 text-base font-semibold">
                    {guide.title}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {guide.source}
                    {guide.year && ` • ${guide.year}`}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    guide.fileType === 'pdf'
                      ? 'bg-red-50'
                      : guide.fileType === 'link'
                      ? 'bg-blue-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      guide.fileType === 'pdf'
                        ? 'text-red-700'
                        : guide.fileType === 'link'
                        ? 'text-blue-700'
                        : 'text-gray-700'
                    }`}
                  >
                    {guide.fileType.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Guide Description */}
            {guide.description && (
              <View className="p-4">
                <Text className="text-gray-700 text-sm leading-5">
                  {guide.description}
                </Text>
              </View>
            )}

            {/* Tags */}
            {guide.tags && guide.tags.length > 0 && (
              <View className="px-4 pb-4">
                <View className="flex-row flex-wrap gap-2">
                  {guide.tags.slice(0, 5).map((tag) => (
                    <View
                      key={tag}
                      className="flex-row items-center bg-gray-100 rounded-full px-3 py-1"
                    >
                      <Tag size={12} color="#64748B" />
                      <Text className="text-gray-600 text-xs ml-1">{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Stats & Actions */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
              {/* Stats */}
              <View className="flex-row items-center gap-4">
                {guide.rating && (
                  <View className="flex-row items-center">
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text className="text-gray-700 text-xs ml-1 font-medium">
                      {guide.rating.toFixed(1)}
                    </Text>
                  </View>
                )}
                {guide.downloads && (
                  <View className="flex-row items-center">
                    <Download size={14} color="#64748B" />
                    <Text className="text-gray-600 text-xs ml-1">
                      {guide.downloads.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Open Link */}
              <View className="flex-row items-center">
                <ExternalLink size={16} color="#3B82F6" />
                <Text className="text-sky-600 text-sm font-medium ml-1">
                  Open Guide
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Footer Note */}
      <View className="mt-6 p-4 bg-blue-50 rounded-lg">
        <Text className="text-blue-900 text-xs font-medium mb-1">
          Tuning Guide Disclaimer
        </Text>
        <Text className="text-blue-700 text-xs leading-4">
          Tuning guides are provided by sail makers and class experts. Always consult class rules
          and regulations before making modifications to your boat.
        </Text>
      </View>
    </ScrollView>
  );
}
