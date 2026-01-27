/**
 * IOSCoachDiscovery.tsx
 * App Store-style coach discovery screen following Apple HIG
 * Features featured coaches, categories, and search
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { IOS_COLORS, IOS_TYPOGRAPHY, IOS_SPACING, IOS_RADIUS } from '@/lib/design-tokens-ios';
import { triggerHaptic } from '@/lib/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH - 32;
const COACH_CARD_WIDTH = 160;

// Types
interface Coach {
  id: string;
  name: string;
  avatar?: string;
  specialty: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  currency: string;
  location: string;
  distance?: number;
  bio: string;
  verified: boolean;
  featured?: boolean;
  availability: 'available' | 'busy' | 'unavailable';
  certifications?: string[];
  totalSessions?: number;
}

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
}

interface FilterOption {
  id: string;
  label: string;
  type: 'specialty' | 'price' | 'rating' | 'distance';
  value: string;
}

interface IOSCoachDiscoveryProps {
  featuredCoaches: Coach[];
  nearbyCoaches: Coach[];
  topRatedCoaches: Coach[];
  categories: Category[];
  searchSuggestions?: string[];
  onCoachPress?: (coach: Coach) => void;
  onCategoryPress?: (category: Category) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: FilterOption[]) => void;
  isLoading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Star Rating Component
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 12 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[...Array(5)].map((_, i) => (
        <Ionicons
          key={i}
          name={i < fullStars ? 'star' : i === fullStars && hasHalfStar ? 'star-half' : 'star-outline'}
          size={size}
          color={i < fullStars || (i === fullStars && hasHalfStar) ? '#FFD700' : IOS_COLORS.systemGray3}
        />
      ))}
    </View>
  );
};

// Featured Coach Card (App Store Hero Style)
const FeaturedCoachCard: React.FC<{
  coach: Coach;
  onPress?: () => void;
}> = ({ coach, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={() => {
        triggerHaptic('selection');
        onPress?.();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ width: FEATURED_CARD_WIDTH }, animatedStyle]}
    >
      <View
        style={{
          borderRadius: IOS_RADIUS.xl,
          overflow: 'hidden',
          backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
        }}
      >
        {/* Hero Image/Gradient Section */}
        <LinearGradient
          colors={['#007AFF', '#5856D6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 180,
            padding: IOS_SPACING.lg,
            justifyContent: 'space-between',
          }}
        >
          {/* Top Row - Category Badge */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: IOS_SPACING.sm,
                paddingVertical: IOS_SPACING.xs,
                borderRadius: IOS_RADIUS.sm,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                FEATURED COACH
              </Text>
            </View>
            {coach.verified && (
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
              </View>
            )}
          </View>

          {/* Bottom Row - Coach Info */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            {/* Avatar */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: IOS_SPACING.md,
                borderWidth: 3,
                borderColor: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              {coach.avatar ? (
                <Image
                  source={{ uri: coach.avatar }}
                  style={{ width: 66, height: 66, borderRadius: 33 }}
                />
              ) : (
                <Text style={{ color: 'white', fontSize: 28, fontWeight: '600' }}>
                  {coach.name.charAt(0)}
                </Text>
              )}
            </View>

            {/* Name and Specialty */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: 'white',
                  fontSize: IOS_TYPOGRAPHY.title2.fontSize,
                  fontWeight: '700',
                }}
                numberOfLines={1}
              >
                {coach.name}
              </Text>
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
                }}
                numberOfLines={1}
              >
                {coach.specialty.join(' • ')}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Info Section */}
        <View style={{ padding: IOS_SPACING.lg }}>
          <Text
            style={{
              color: IOS_COLORS.label,
              fontSize: IOS_TYPOGRAPHY.body.fontSize,
              lineHeight: 22,
              marginBottom: IOS_SPACING.md,
            }}
            numberOfLines={2}
          >
            {coach.bio}
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: IOS_SPACING.xs }}>
              <StarRating rating={coach.rating} />
              <Text style={{ color: IOS_COLORS.secondaryLabel, fontSize: 13 }}>
                ({coach.reviewCount})
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ color: IOS_COLORS.systemBlue, fontSize: 20, fontWeight: '700' }}>
                {coach.currency === 'USD' ? '$' : coach.currency}{coach.hourlyRate}
              </Text>
              <Text style={{ color: IOS_COLORS.secondaryLabel, fontSize: 13 }}>
                /hr
              </Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
};

// Compact Coach Card (For horizontal scroll)
const CoachCard: React.FC<{
  coach: Coach;
  onPress?: () => void;
}> = ({ coach, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const getAvailabilityColor = () => {
    switch (coach.availability) {
      case 'available': return IOS_COLORS.systemGreen;
      case 'busy': return IOS_COLORS.systemOrange;
      default: return IOS_COLORS.systemGray;
    }
  };

  return (
    <AnimatedPressable
      onPress={() => {
        triggerHaptic('selection');
        onPress?.();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[{ width: COACH_CARD_WIDTH }, animatedStyle]}
    >
      <View
        style={{
          backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
          borderRadius: IOS_RADIUS.lg,
          padding: IOS_SPACING.md,
          alignItems: 'center',
        }}
      >
        {/* Avatar with availability dot */}
        <View style={{ position: 'relative', marginBottom: IOS_SPACING.sm }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: IOS_COLORS.systemGray5,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {coach.avatar ? (
              <Image
                source={{ uri: coach.avatar }}
                style={{ width: 64, height: 64, borderRadius: 32 }}
              />
            ) : (
              <Text style={{ color: IOS_COLORS.secondaryLabel, fontSize: 24, fontWeight: '600' }}>
                {coach.name.charAt(0)}
              </Text>
            )}
          </View>

          {/* Availability dot */}
          <View
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: getAvailabilityColor(),
              borderWidth: 2,
              borderColor: IOS_COLORS.secondarySystemGroupedBackground,
            }}
          />

          {/* Verified badge */}
          {coach.verified && (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                backgroundColor: IOS_COLORS.systemBlue,
                width: 18,
                height: 18,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: IOS_COLORS.secondarySystemGroupedBackground,
              }}
            >
              <Ionicons name="checkmark" size={10} color="white" />
            </View>
          )}
        </View>

        {/* Name */}
        <Text
          style={{
            color: IOS_COLORS.label,
            fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
            fontWeight: '600',
            textAlign: 'center',
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {coach.name}
        </Text>

        {/* Specialty */}
        <Text
          style={{
            color: IOS_COLORS.secondaryLabel,
            fontSize: IOS_TYPOGRAPHY.caption1.fontSize,
            textAlign: 'center',
            marginBottom: IOS_SPACING.xs,
          }}
          numberOfLines={1}
        >
          {coach.specialty[0]}
        </Text>

        {/* Rating */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: IOS_SPACING.xs }}>
          <Ionicons name="star" size={11} color="#FFD700" />
          <Text style={{ color: IOS_COLORS.secondaryLabel, fontSize: 12 }}>
            {coach.rating.toFixed(1)}
          </Text>
        </View>

        {/* Price */}
        <Text style={{ color: IOS_COLORS.systemBlue, fontSize: 14, fontWeight: '600' }}>
          ${coach.hourlyRate}/hr
        </Text>

        {/* Distance if available */}
        {coach.distance !== undefined && (
          <Text style={{ color: IOS_COLORS.tertiaryLabel, fontSize: 11, marginTop: 2 }}>
            {coach.distance < 1 ? `${(coach.distance * 1000).toFixed(0)}m` : `${coach.distance.toFixed(1)}km`} away
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

// Category Card
const CategoryCard: React.FC<{
  category: Category;
  onPress?: () => void;
}> = ({ category, onPress }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        triggerHaptic('selection');
        onPress?.();
      }}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[{ flex: 1 }, animatedStyle]}
    >
      <View
        style={{
          backgroundColor: IOS_COLORS.secondarySystemGroupedBackground,
          borderRadius: IOS_RADIUS.lg,
          padding: IOS_SPACING.lg,
          alignItems: 'center',
          minHeight: 100,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: IOS_COLORS.systemBlue + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: IOS_SPACING.sm,
          }}
        >
          <Ionicons name={category.icon} size={24} color={IOS_COLORS.systemBlue} />
        </View>
        <Text
          style={{
            color: IOS_COLORS.label,
            fontSize: IOS_TYPOGRAPHY.footnote.fontSize,
            fontWeight: '500',
            textAlign: 'center',
          }}
          numberOfLines={2}
        >
          {category.name}
        </Text>
        <Text style={{ color: IOS_COLORS.tertiaryLabel, fontSize: 11, marginTop: 2 }}>
          {category.count} coaches
        </Text>
      </View>
    </AnimatedPressable>
  );
};

// Filter Chip
const FilterChip: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => {
  return (
    <Pressable
      onPress={() => {
        triggerHaptic('selection');
        onPress();
      }}
    >
      <View
        style={{
          paddingHorizontal: IOS_SPACING.md,
          paddingVertical: IOS_SPACING.sm,
          borderRadius: IOS_RADIUS.full,
          backgroundColor: selected ? IOS_COLORS.systemBlue : IOS_COLORS.secondarySystemGroupedBackground,
          borderWidth: 1,
          borderColor: selected ? IOS_COLORS.systemBlue : IOS_COLORS.separator,
        }}
      >
        <Text
          style={{
            color: selected ? 'white' : IOS_COLORS.label,
            fontSize: IOS_TYPOGRAPHY.subhead.fontSize,
            fontWeight: '500',
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
};

// Section Header
const SectionHeader: React.FC<{
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, actionLabel, onAction }) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: IOS_SPACING.lg,
      marginTop: IOS_SPACING.xl,
      marginBottom: IOS_SPACING.md,
    }}
  >
    <Text
      style={{
        color: IOS_COLORS.label,
        fontSize: IOS_TYPOGRAPHY.title3.fontSize,
        fontWeight: '600',
      }}
    >
      {title}
    </Text>
    {actionLabel && onAction && (
      <Pressable onPress={onAction}>
        <Text
          style={{
            color: IOS_COLORS.systemBlue,
            fontSize: IOS_TYPOGRAPHY.body.fontSize,
          }}
        >
          {actionLabel}
        </Text>
      </Pressable>
    )}
  </View>
);

// Main Component
export const IOSCoachDiscovery: React.FC<IOSCoachDiscoveryProps> = ({
  featuredCoaches,
  nearbyCoaches,
  topRatedCoaches,
  categories,
  searchSuggestions = [],
  onCoachPress,
  onCategoryPress,
  onSearch,
  onFilterChange,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const filterOptions = [
    { id: 'racing', label: 'Racing' },
    { id: 'cruising', label: 'Cruising' },
    { id: 'beginners', label: 'Beginners' },
    { id: 'youth', label: 'Youth' },
    { id: 'under100', label: 'Under $100/hr' },
    { id: 'topRated', label: '4.5+ Stars' },
  ];

  const toggleFilter = useCallback((filterId: string) => {
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
    triggerHaptic('selection');
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  const submitSearch = useCallback(() => {
    setShowSuggestions(false);
    onSearch?.(searchQuery);
    triggerHaptic('selection');
  }, [searchQuery, onSearch]);

  const filteredSuggestions = searchSuggestions.filter(s =>
    s.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: IOS_COLORS.systemGroupedBackground }}>
      {/* Search Header */}
      <View
        style={{
          backgroundColor: IOS_COLORS.systemBackground,
          paddingTop: IOS_SPACING.md,
          paddingHorizontal: IOS_SPACING.lg,
          paddingBottom: IOS_SPACING.md,
          borderBottomWidth: 0.5,
          borderBottomColor: IOS_COLORS.separator,
        }}
      >
        {/* Large Title */}
        <Text
          style={{
            fontSize: IOS_TYPOGRAPHY.largeTitle.fontSize,
            fontWeight: '700',
            color: IOS_COLORS.label,
            marginBottom: IOS_SPACING.md,
          }}
        >
          Find a Coach
        </Text>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: IOS_COLORS.systemGray6,
            borderRadius: IOS_RADIUS.md,
            paddingHorizontal: IOS_SPACING.md,
            height: 36,
          }}
        >
          <Ionicons name="search" size={18} color={IOS_COLORS.secondaryLabel} />
          <TextInput
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Search coaches, specialties..."
            placeholderTextColor={IOS_COLORS.tertiaryLabel}
            style={{
              flex: 1,
              marginLeft: IOS_SPACING.sm,
              fontSize: IOS_TYPOGRAPHY.body.fontSize,
              color: IOS_COLORS.label,
            }}
            returnKeyType="search"
            onSubmitEditing={submitSearch}
            onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: IOS_COLORS.systemGray3,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={12} color={IOS_COLORS.systemBackground} />
              </View>
            </Pressable>
          )}
        </View>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <View
            style={{
              position: 'absolute',
              top: '100%',
              left: IOS_SPACING.lg,
              right: IOS_SPACING.lg,
              backgroundColor: IOS_COLORS.systemBackground,
              borderRadius: IOS_RADIUS.md,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
              zIndex: 100,
              maxHeight: 200,
            }}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <Pressable
                key={suggestion}
                onPress={() => {
                  setSearchQuery(suggestion);
                  setShowSuggestions(false);
                  onSearch?.(suggestion);
                  triggerHaptic('selection');
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: IOS_SPACING.md,
                    borderBottomWidth: index < filteredSuggestions.length - 1 ? 0.5 : 0,
                    borderBottomColor: IOS_COLORS.separator,
                  }}
                >
                  <Ionicons name="search" size={16} color={IOS_COLORS.tertiaryLabel} />
                  <Text
                    style={{
                      color: IOS_COLORS.label,
                      fontSize: IOS_TYPOGRAPHY.body.fontSize,
                      marginLeft: IOS_SPACING.md,
                    }}
                  >
                    {suggestion}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: IOS_SPACING.xxxl }}
      >
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: IOS_SPACING.lg,
            paddingVertical: IOS_SPACING.md,
            gap: IOS_SPACING.sm,
          }}
        >
          {filterOptions.map(filter => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              selected={activeFilters.includes(filter.id)}
              onPress={() => toggleFilter(filter.id)}
            />
          ))}
        </ScrollView>

        {/* Featured Coaches */}
        {featuredCoaches.length > 0 && (
          <>
            <SectionHeader title="Featured" />
            <FlatList
              data={featuredCoaches}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: IOS_SPACING.lg,
                gap: IOS_SPACING.md,
              }}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <FeaturedCoachCard
                  coach={item}
                  onPress={() => onCoachPress?.(item)}
                />
              )}
              snapToInterval={FEATURED_CARD_WIDTH + IOS_SPACING.md}
              decelerationRate="fast"
            />
          </>
        )}

        {/* Categories Grid */}
        {categories.length > 0 && (
          <>
            <SectionHeader title="Browse by Specialty" />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                paddingHorizontal: IOS_SPACING.lg,
                gap: IOS_SPACING.md,
              }}
            >
              {categories.slice(0, 6).map(category => (
                <View key={category.id} style={{ width: '31%' }}>
                  <CategoryCard
                    category={category}
                    onPress={() => onCategoryPress?.(category)}
                  />
                </View>
              ))}
            </View>
          </>
        )}

        {/* Near You Section */}
        {nearbyCoaches.length > 0 && (
          <>
            <SectionHeader
              title="Near You"
              actionLabel="See All"
              onAction={() => {}}
            />
            <FlatList
              data={nearbyCoaches}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: IOS_SPACING.lg,
                gap: IOS_SPACING.md,
              }}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <CoachCard
                  coach={item}
                  onPress={() => onCoachPress?.(item)}
                />
              )}
            />
          </>
        )}

        {/* Top Rated Section */}
        {topRatedCoaches.length > 0 && (
          <>
            <SectionHeader
              title="Top Rated"
              actionLabel="See All"
              onAction={() => {}}
            />
            <FlatList
              data={topRatedCoaches}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: IOS_SPACING.lg,
                gap: IOS_SPACING.md,
              }}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <CoachCard
                  coach={item}
                  onPress={() => onCoachPress?.(item)}
                />
              )}
            />
          </>
        )}

        {/* Empty State */}
        {featuredCoaches.length === 0 &&
          nearbyCoaches.length === 0 &&
          topRatedCoaches.length === 0 &&
          !isLoading && (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: IOS_SPACING.xxxl * 2,
              paddingHorizontal: IOS_SPACING.xl,
            }}
          >
            <Ionicons
              name="search-outline"
              size={64}
              color={IOS_COLORS.systemGray3}
            />
            <Text
              style={{
                color: IOS_COLORS.label,
                fontSize: IOS_TYPOGRAPHY.title3.fontSize,
                fontWeight: '600',
                marginTop: IOS_SPACING.lg,
                textAlign: 'center',
              }}
            >
              No Coaches Found
            </Text>
            <Text
              style={{
                color: IOS_COLORS.secondaryLabel,
                fontSize: IOS_TYPOGRAPHY.body.fontSize,
                textAlign: 'center',
                marginTop: IOS_SPACING.sm,
              }}
            >
              Try adjusting your filters or search to find coaches in your area.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default IOSCoachDiscovery;
