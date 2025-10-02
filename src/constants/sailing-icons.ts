/**
 * Sailing-Specific Icon Constants
 * Centralized emoji icons for consistent use across web and mobile
 */

// Venue Type Icons
export const VENUE_ICONS = {
  championship: '🏆',
  premier: '⭐',
  regional: '📍',
  default: '⚓',
} as const;

// Yacht Club Icons
export const CLUB_ICONS = {
  international: '🏆',
  national: '⭐',
  regional: '🌊',
  local: '⚓',
  membership: '👥',
  anchor: '⚓',
} as const;

// Service Type Icons
export const SERVICE_ICONS = {
  sailmaker: '⛵',
  rigger: '🔧',
  coach: '👤',
  chandlery: '🛒',
  clothing: '👕',
  marina: '⚓',
  repair: '🛠️',
  engine: '⚙️',
  preferred: '⭐',
} as const;

// Information Icons
export const INFO_ICONS = {
  // Location & Address
  location: '📍',
  address: '📮',
  country: '🌍',
  region: '🗺️',

  // Contact
  phone: '📞',
  email: '✉️',
  website: '🌐',
  contact: '👤',

  // Dates & Time
  established: '⛵',
  founded: '⚓',
  calendar: '📅',

  // Ratings & Reviews
  rating: '⭐',
  reviews: '💬',

  // Money & Pricing
  price: '💰',
  expensive: '💎',
  moderate: '💵',
  affordable: '💰',

  // Features & Amenities
  specialties: '🛠️',
  classes: '⛵',
  badge: '🏅',
  verified: '✓',

  // Actions
  directions: '🧭',
  navigate: '➡️',
  info: 'ℹ️',
  warning: '⚠️',
} as const;

// Country Flags
export const COUNTRY_FLAGS = {
  'Hong Kong SAR': '🇭🇰',
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'France': '🇫🇷',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
  'Japan': '🇯🇵',
  'Bermuda': '🇧🇲',
  'United Arab Emirates': '🇦🇪',
  'South Africa': '🇿🇦',
  'Brazil': '🇧🇷',
  'Turkey': '🇹🇷',
  'Netherlands': '🇳🇱',
  'Germany': '🇩🇪',
  'Denmark': '🇩🇰',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Greece': '🇬🇷',
  'Croatia': '🇭🇷',
  'Portugal': '🇵🇹',
  'Singapore': '🇸🇬',
  'Thailand': '🇹🇭',
  'Malaysia': '🇲🇾',
  'Indonesia': '🇮🇩',
  'Philippines': '🇵🇭',
  'China': '🇨🇳',
  'South Korea': '🇰🇷',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Ireland': '🇮🇪',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  'Monaco': '🇲🇨',
  'Malta': '🇲🇹',
  'Cyprus': '🇨🇾',
  'Iceland': '🇮🇸',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'Russia': '🇷🇺',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Belgium': '🇧🇪',
} as const;

// Helper functions
export const getVenueIcon = (type: string): string => {
  return VENUE_ICONS[type as keyof typeof VENUE_ICONS] || VENUE_ICONS.default;
};

export const getClubIcon = (prestigeLevel: string): string => {
  return CLUB_ICONS[prestigeLevel as keyof typeof CLUB_ICONS] || CLUB_ICONS.anchor;
};

export const getServiceIcon = (serviceType: string): string => {
  return SERVICE_ICONS[serviceType as keyof typeof SERVICE_ICONS] || SERVICE_ICONS.repair;
};

export const getCountryFlag = (country: string): string => {
  return COUNTRY_FLAGS[country as keyof typeof COUNTRY_FLAGS] || '🌍';
};
