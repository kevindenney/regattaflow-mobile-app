/**
 * Hong Kong Venue Intelligence Service
 * Provides smart auto-suggestions for Hong Kong sailing venues
 * Cascades suggestions: Venue -> Clubs -> Boats -> Boat Numbers -> Races -> Documents
 */

export interface HongKongClub {
  name: string;
  website: string;
  popularBoats: string[];
  commonSailNumbers: string[];
}

export interface HongKongBoatClass {
  name: string;
  commonSailNumbers: string[];
  popularHullMakers: string[];
  popularRigMakers: string[];
  popularSailMakers: string[];
}

export interface HongKongRace {
  name: string;
  venue: string;
  typicalDates: string[];
  documentUrls: {
    classAssociation?: string;
    tuningGuide?: string;
    calendar?: string;
  };
}

// Hong Kong Yacht Clubs Database
export const HONG_KONG_CLUBS: Record<string, HongKongClub> = {
  'Royal Hong Kong Yacht Club': {
    name: 'Royal Hong Kong Yacht Club',
    website: 'https://www.rhkyc.org.hk',
    popularBoats: ['Dragon', 'Etchells', 'J/70', 'J/80', 'Pandora', 'Flying Fifteen', 'TP52'],
    commonSailNumbers: ['D59', 'D60', 'D61', 'E1', 'E2', 'J70-1', 'J70-2', 'P1', 'P2', 'FF1', 'FF2'],
  },
  'Aberdeen Boat Club': {
    name: 'Aberdeen Boat Club',
    website: 'https://www.abclub.com.hk',
    popularBoats: ['Dragon', 'J/70', 'Laser', 'Optimist', '420'],
    commonSailNumbers: ['D50', 'D51', 'J70-10', 'J70-11'],
  },
  'Hebe Haven Yacht Club': {
    name: 'Hebe Haven Yacht Club',
    website: 'https://www.hhyc.org.hk',
    popularBoats: ['Dragon', 'J/70', 'Laser', 'Optimist'],
    commonSailNumbers: ['D40', 'D41', 'J70-20'],
  },
  'Royal Hong Kong Yacht Club - Middle Island': {
    name: 'Royal Hong Kong Yacht Club - Middle Island',
    website: 'https://www.rhkyc.org.hk',
    popularBoats: ['Dragon', 'Etchells', 'J/70', 'Pandora'],
    commonSailNumbers: ['D59', 'D60', 'E1', 'E2'],
  },
  'Discovery Bay Marina Club': {
    name: 'Discovery Bay Marina Club',
    website: 'https://www.dbmarinaclub.com',
    popularBoats: ['J/70', 'Laser', 'Optimist'],
    commonSailNumbers: ['J70-30'],
  },
};

// Hong Kong Boat Classes with common sail numbers
export const HONG_KONG_BOAT_CLASSES: Record<string, HongKongBoatClass> = {
  'Dragon': {
    name: 'Dragon',
    commonSailNumbers: ['D59', 'D60', 'D61', 'D62', 'D63', 'D64', 'D65', 'D66', 'D67', 'D68', 'D69', 'D70'],
    popularHullMakers: ['Petticrows', 'Borresen', 'Børresen'],
    popularRigMakers: ['Seldén', 'Z-Spars'],
    popularSailMakers: ['North Sails', 'Quantum Sails', 'Doyle Sails'],
  },
  'Etchells': {
    name: 'Etchells',
    commonSailNumbers: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10'],
    popularHullMakers: ['Etchells Yachts', 'David Heritage Yachts'],
    popularRigMakers: ['Seldén', 'Hall Spars'],
    popularSailMakers: ['North Sails', 'Quantum Sails'],
  },
  'J/70': {
    name: 'J/70',
    commonSailNumbers: ['J70-1', 'J70-2', 'J70-3', 'J70-4', 'J70-5', 'J70-10', 'J70-11', 'J70-20', 'J70-30'],
    popularHullMakers: ['J Boats', 'J/Boats'],
    popularRigMakers: ['Seldén', 'Hall Spars'],
    popularSailMakers: ['North Sails', 'Quantum Sails', 'UK Sailmakers'],
  },
  'J/80': {
    name: 'J/80',
    commonSailNumbers: ['J80-1', 'J80-2', 'J80-3'],
    popularHullMakers: ['J Boats'],
    popularRigMakers: ['Seldén'],
    popularSailMakers: ['North Sails', 'Quantum Sails'],
  },
  'Pandora': {
    name: 'Pandora',
    commonSailNumbers: ['P1', 'P2', 'P3', 'P4', 'P5'],
    popularHullMakers: ['Pandora Yachts'],
    popularRigMakers: ['Seldén', 'Z-Spars'],
    popularSailMakers: ['North Sails', 'Quantum Sails'],
  },
  'Flying Fifteen': {
    name: 'Flying Fifteen',
    commonSailNumbers: ['FF1', 'FF2', 'FF3', 'FF4', 'FF5'],
    popularHullMakers: ['Ovington Boats'],
    popularRigMakers: ['Seldén'],
    popularSailMakers: ['North Sails', 'Quantum Sails'],
  },
};

// Hong Kong Popular Races
export const HONG_KONG_RACES: HongKongRace[] = [
  {
    name: 'Hong Kong Dragon Championship',
    venue: 'Victoria Harbour',
    typicalDates: ['March', 'April', 'May'],
    documentUrls: {
      classAssociation: 'https://www.internationaldragonsailing.net',
      tuningGuide: 'https://www.rhkyc.org.hk/dragon-tuning',
    },
  },
  {
    name: 'Hong Kong Etchells Championship',
    venue: 'Victoria Harbour',
    typicalDates: ['February', 'March'],
    documentUrls: {
      classAssociation: 'https://www.etchells.org',
    },
  },
  {
    name: 'Hong Kong J/70 Championship',
    venue: 'Victoria Harbour',
    typicalDates: ['April', 'May'],
    documentUrls: {
      classAssociation: 'https://www.j70class.org',
    },
  },
  {
    name: 'Spring Series',
    venue: 'Victoria Harbour',
    typicalDates: ['March', 'April'],
    documentUrls: {
      calendar: 'https://www.rhkyc.org.hk/racing/calendar',
    },
  },
  {
    name: 'Autumn Series',
    venue: 'Victoria Harbour',
    typicalDates: ['October', 'November'],
    documentUrls: {
      calendar: 'https://www.rhkyc.org.hk/racing/calendar',
    },
  },
];

/**
 * Detect if a venue is in Hong Kong
 */
export function isHongKongVenue(venueName: string): boolean {
  const normalized = venueName.toLowerCase();
  const hkKeywords = [
    'hong kong',
    'hongkong',
    'hk',
    'victoria harbour',
    'victoria harbor',
    'aberdeen',
    'hebe haven',
    'discovery bay',
    'middle island',
    'stanley',
    'sai kung',
    'repulse bay',
  ];
  
  return hkKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Get club suggestions for Hong Kong venue
 */
export function getHongKongClubs(venueName?: string): HongKongClub[] {
  if (!venueName || !isHongKongVenue(venueName)) {
    return Object.values(HONG_KONG_CLUBS);
  }
  
  // Filter by venue if specific
  const normalizedVenue = venueName.toLowerCase();
  if (normalizedVenue.includes('victoria') || normalizedVenue.includes('central')) {
    return [HONG_KONG_CLUBS['Royal Hong Kong Yacht Club']];
  }
  
  return Object.values(HONG_KONG_CLUBS);
}

/**
 * Get boat class suggestions for a Hong Kong club
 */
export function getBoatClassesForClub(clubName: string): string[] {
  const club = Object.values(HONG_KONG_CLUBS).find(c => 
    c.name.toLowerCase().includes(clubName.toLowerCase()) ||
    clubName.toLowerCase().includes(c.name.toLowerCase())
  );
  
  return club?.popularBoats || Object.keys(HONG_KONG_BOAT_CLASSES);
}

/**
 * Get sail number suggestions for a boat class
 */
export function getSailNumbersForClass(className: string): string[] {
  const boatClass = HONG_KONG_BOAT_CLASSES[className];
  return boatClass?.commonSailNumbers || [];
}

/**
 * Get equipment suggestions for a boat class
 */
export function getEquipmentForClass(className: string): {
  hullMakers: string[];
  rigMakers: string[];
  sailMakers: string[];
} {
  const boatClass = HONG_KONG_BOAT_CLASSES[className];
  if (!boatClass) {
    return { hullMakers: [], rigMakers: [], sailMakers: [] };
  }
  
  return {
    hullMakers: boatClass.popularHullMakers,
    rigMakers: boatClass.popularRigMakers,
    sailMakers: boatClass.popularSailMakers,
  };
}

/**
 * Get race suggestions for Hong Kong
 */
export function getHongKongRaces(venueName?: string): HongKongRace[] {
  if (!venueName || !isHongKongVenue(venueName)) {
    return HONG_KONG_RACES;
  }
  
  const normalizedVenue = venueName.toLowerCase();
  return HONG_KONG_RACES.filter(race => 
    race.venue.toLowerCase().includes(normalizedVenue) ||
    normalizedVenue.includes(race.venue.toLowerCase())
  );
}

/**
 * Get document URL suggestions for a race
 */
export function getDocumentUrlsForRace(raceName: string): {
  classAssociation?: string;
  tuningGuide?: string;
  calendar?: string;
} {
  const race = HONG_KONG_RACES.find(r => 
    r.name.toLowerCase().includes(raceName.toLowerCase()) ||
    raceName.toLowerCase().includes(r.name.toLowerCase())
  );
  
  return race?.documentUrls || {};
}

