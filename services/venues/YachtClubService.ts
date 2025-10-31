/**
 * Yacht Club Service
 * Manages yacht club data and intelligence
 */

import yachtClubsData from '@/data/yacht-clubs.json';
import sailingLocations from '@/data/sailing-locations.json';

export interface YachtClubFacility {
  name: string;
  type: 'dining' | 'recreation' | 'marine' | 'events' | 'racing' | 'training' | 'social' | 'technical' | 'amenities';
  details: any;
}

export interface YachtClubVenue {
  id: string;
  name: string;
  type: 'headquarters' | 'racing-station' | 'marina-facility';
  coordinates: { latitude: number; longitude: number };
  location: string;
  facilities: YachtClubFacility[];
}

export interface YachtClubData {
  id: string;
  name: string;
  founded: number;
  country: string;
  region: string;
  website: string;
  status?: string;
  membership: {
    total: number;
    racing: number;
    international: boolean;
    reciprocal?: string[];
  };
  multipleVenues: boolean;
  headquarters: {
    name: string;
    coordinates: [number, number];
    address: string;
  };
  venues?: { [key: string]: YachtClubVenue };
  racingProgram?: any;
  classes?: string[];
  contacts?: any;
}

export class YachtClubService {
  private clubs: Map<string, YachtClubData> = new Map();

  constructor() {
    this.initializeClubData();
  }

  private initializeClubData() {
    // Load club data from JSON
    Object.entries(yachtClubsData.clubs).forEach(([clubId, clubData]) => {
      this.clubs.set(clubId, {
        id: clubId,
        ...clubData as any
      });
    });

  }

  /**
   * Get all yacht clubs
   */
  getAllClubs(): YachtClubData[] {
    return Array.from(this.clubs.values());
  }

  /**
   * Get club by ID
   */
  getClubById(clubId: string): YachtClubData | null {
    return this.clubs.get(clubId) || null;
  }

  /**
   * Get clubs for a specific venue
   */
  getClubsForVenue(venueId: string): YachtClubData[] {
    const venueData = (sailingLocations.venues as any)[venueId];
    if (!venueData?.yachtClubs) return [];

    const venueClubs: YachtClubData[] = [];

    venueData.yachtClubs.forEach((clubRef: any) => {
      const clubData = this.clubs.get(clubRef.id);
      if (clubData) {
        venueClubs.push(clubData);
      }
    });

    return venueClubs;
  }

  /**
   * Get clubs by region
   */
  getClubsByRegion(region: string): YachtClubData[] {
    return Array.from(this.clubs.values()).filter(club =>
      club.region === region
    );
  }

  /**
   * Get clubs with multiple venues
   */
  getMultiVenueClubs(): YachtClubData[] {
    return Array.from(this.clubs.values()).filter(club =>
      club.multipleVenues
    );
  }

  /**
   * Get premier yacht clubs (royal charters, etc.)
   */
  getPremiereClubs(): YachtClubData[] {
    const premiereList = Array.isArray(yachtClubsData.clubCategories?.premiere?.clubs)
      ? yachtClubsData.clubCategories.premiere.clubs
      : [];

    return Array.from(this.clubs.values()).filter(club =>
      club.status === 'royal-charter' ||
      premiereList.includes(club.id)
    );
  }

  /**
   * Search clubs by name or location
   */
  searchClubs(query: string): YachtClubData[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.clubs.values()).filter(club =>
      club.name.toLowerCase().includes(searchTerm) ||
      club.country.toLowerCase().includes(searchTerm) ||
      club.headquarters.address.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get club venues with coordinates
   */
  getClubVenuesWithCoordinates(clubId: string): {
    id: string;
    name: string;
    coordinates: [number, number]; // [lng, lat] for MapLibre
    type: string;
    location: string;
  }[] {
    const club = this.clubs.get(clubId);
    if (!club) return [];

    const venues: {
      id: string;
      name: string;
      coordinates: [number, number];
      type: string;
      location: string;
    }[] = [];

    if (club.multipleVenues && club.venues) {
      // Multi-venue club
      Object.entries(club.venues).forEach(([venueId, venue]: [string, any]) => {
        const coordinates: [number, number] = [
          venue.coordinates.longitude,
          venue.coordinates.latitude
        ];

        venues.push({
          id: venueId,
          name: venue.name,
          coordinates,
          type: venue.type,
          location: venue.location
        });
      });
    } else {
      // Single venue club
      const [lng, lat] = club.headquarters.coordinates;
      venues.push({
        id: 'headquarters',
        name: club.headquarters.name,
        coordinates: [lng, lat],
        type: 'headquarters',
        location: club.headquarters.address
      });
    }

    return venues;
  }

  /**
   * Get racing classes offered by a club
   */
  getRacingClasses(clubId: string): string[] {
    const club = this.clubs.get(clubId);
    return club?.classes || [];
  }

  /**
   * Get club facilities by venue
   */
  getClubFacilities(clubId: string, venueId?: string): YachtClubFacility[] {
    const club = this.clubs.get(clubId);
    if (!club) return [];

    const facilities: YachtClubFacility[] = [];

    if (club.multipleVenues && club.venues && venueId) {
      const venue = club.venues[venueId];
      if (venue?.facilities) {
        Object.entries(venue.facilities).forEach(([category, items]: [string, any]) => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              facilities.push({
                name: typeof item === 'string' ? item : item.name || 'Unnamed facility',
                type: category as any,
                details: typeof item === 'object' ? item : {}
              });
            });
          } else if (typeof items === 'object') {
            Object.entries(items).forEach(([subName, subDetails]) => {
              facilities.push({
                name: subName,
                type: category as any,
                details: subDetails
              });
            });
          }
        });
      }
    }

    return facilities;
  }

  /**
   * Get reciprocal club information
   */
  getReciprocalClubs(clubId: string): string[] {
    const club = this.clubs.get(clubId);
    const reciprocal = club?.membership.reciprocal;
    return Array.isArray(reciprocal) ? reciprocal : [];
  }

  /**
   * Get club statistics
   */
  getClubStatistics() {
    const stats = {
      totalClubs: this.clubs.size,
      multiVenueClubs: 0,
      regionalDistribution: {} as { [key: string]: number },
      averageFounded: 0,
      premierClubs: 0
    };

    let foundedSum = 0;

    this.clubs.forEach(club => {
      if (club.multipleVenues) stats.multiVenueClubs++;
      if (club.status === 'royal-charter') stats.premierClubs++;

      stats.regionalDistribution[club.region] =
        (stats.regionalDistribution[club.region] || 0) + 1;

      foundedSum += club.founded;
    });

    stats.averageFounded = Math.round(foundedSum / this.clubs.size);

    return stats;
  }

  /**
   * Get club contact information
   */
  getClubContacts(clubId: string): any {
    const club = this.clubs.get(clubId);
    return club?.contacts || null;
  }

  /**
   * Check if club has specific facility
   */
  hasFacility(clubId: string, facilityType: string, venueId?: string): boolean {
    const facilities = this.getClubFacilities(clubId, venueId);
    return facilities.some(facility => facility.type === facilityType);
  }
}
