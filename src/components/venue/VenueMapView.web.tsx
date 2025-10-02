/**
 * VenueMapView Component - Web Implementation
 * Uses Google Maps JavaScript API for superior web rendering
 */

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/src/components/themed-text';
import { supabase } from '@/src/services/supabase';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import Constants from 'expo-constants';

interface Venue {
  id: string;
  name: string;
  country: string;
  region: string;
  venue_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface MapLayers {
  yachtClubs: boolean;
  sailmakers: boolean;
  riggers: boolean;
  coaches: boolean;
  chandlery: boolean;
  clothing: boolean;
  marinas: boolean;
  repair: boolean;
  engines: boolean;
}

interface VenueMapViewProps {
  currentVenue?: Venue | null;
  onVenueSelect?: (venue: Venue) => void;
  onMarkerPress?: (venue: Venue) => void;
  showAllVenues?: boolean;
  selectedVenue?: Venue | null;
  is3DEnabled?: boolean;
  mapLayers?: MapLayers;
  showOnlySavedVenues?: boolean;
  savedVenueIds?: Set<string>;
}

interface YachtClub {
  id: string;
  venue_id: string;
  name: string;
  short_name?: string;
  prestige_level: string;
  membership_type: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

interface Service {
  id: string;
  club_id?: string;
  venue_id: string;
  service_type: string;
  business_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  specialties?: string[];
  price_level?: string;
  coordinates_lat: number;
  coordinates_lng: number;
}

// Professional SVG Icons
const createMarkerIcon = (type: string, color: string, isSelected = false) => {
  const scale = isSelected ? 1.2 : 1;
  const size = 40 * scale;

  const svgIcons = {
    venue: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
    sailmaker: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M3 3v18h2L18 9 5 3H3zm4 4l7 4-7 4V7z"/></svg>`,
    rigger: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`,
    coach: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
    repair: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>`,
    yachtClub: `<svg viewBox="0 0 24 24" fill="${color}"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`,
  };

  const icon = svgIcons[type as keyof typeof svgIcons] || svgIcons.venue;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="${color}" stroke="white" stroke-width="3" opacity="0.95"/>
        <g transform="translate(12, 12) scale(1)">
          ${icon.replace(/<svg[^>]*>|<\/svg>/g, '')}
        </g>
      </svg>
    `)}`,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
};

// Google Maps Component
function GoogleMapComponent({
  venues,
  yachtClubs,
  services,
  currentVenue,
  selectedVenue,
  onMarkerPress,
  mapLayers,
  showOnlySavedVenues,
  savedVenueIds,
  showAllVenues,
}: {
  venues: Venue[];
  yachtClubs: YachtClub[];
  services: Service[];
  currentVenue?: Venue | null;
  selectedVenue?: Venue | null;
  onMarkerPress?: (venue: Venue) => void;
  mapLayers?: MapLayers;
  showOnlySavedVenues: boolean;
  savedVenueIds: Set<string>;
  showAllVenues: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const defaultCenter = currentVenue && currentVenue.coordinates_lat && currentVenue.coordinates_lng
      ? { lat: currentVenue.coordinates_lat, lng: currentVenue.coordinates_lng }
      : { lat: 22.2793, lng: 114.1628 }; // Hong Kong

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: currentVenue ? 12 : 3,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });
  }, []);

  // Update markers when venues or yacht clubs change
  useEffect(() => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Filter venues to display
    let displayVenues: Venue[];
    if (showOnlySavedVenues && savedVenueIds.size > 0) {
      displayVenues = venues.filter(v => savedVenueIds.has(v.id));
    } else if (showAllVenues) {
      displayVenues = venues;
    } else if (currentVenue) {
      displayVenues = [currentVenue];
    } else {
      displayVenues = [];
    }

    // Add venue markers
    displayVenues.forEach(venue => {
      const isSelected = selectedVenue?.id === venue.id || currentVenue?.id === venue.id;
      const color = getMarkerColor(venue.venue_type);

      const marker = new google.maps.Marker({
        position: { lat: venue.coordinates_lat, lng: venue.coordinates_lng },
        map: googleMapRef.current!,
        title: venue.name,
        icon: createMarkerIcon('venue', color, isSelected),
        optimized: false, // Required for SVG icons
      });

      const ratingHtml = venue.rating
        ? `<div style="margin: 8px 0 0 0; display: flex; align-items: center; gap: 4px;">
             <span style="color: #ffc107;">⭐</span>
             <span style="font-size: 13px; font-weight: 600; color: #1a1a1a;">${venue.rating.toFixed(1)}</span>
             ${venue.user_ratings_total ? `<span style="font-size: 12px; color: #999;">(${venue.user_ratings_total} reviews)</span>` : ''}
           </div>`
        : '';

      const establishedHtml = venue.established_year
        ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #666;">⛵ Established ${venue.established_year}</p>`
        : '';

      const infoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 280px;">
          <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 700; color: #1a1a1a;">${venue.name}</h3>
          <p style="margin: 0; font-size: 13px; color: #666; text-transform: capitalize;">
            📍 ${venue.country} • ${venue.region}
          </p>
          <div style="margin: 6px 0 0 0; padding: 4px 8px; background: #f0f0f0; border-radius: 4px; display: inline-block;">
            <span style="font-size: 11px; font-weight: 600; color: #007AFF; text-transform: uppercase;">${venue.venue_type} Venue</span>
          </div>
          ${establishedHtml}
          ${ratingHtml}
          ${venue.formatted_address ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">📮 ${venue.formatted_address}</p>` : ''}
        </div>`,
      });

      marker.addListener('click', () => {
        infoWindow.open(googleMapRef.current!, marker);
        onMarkerPress?.(venue);
      });

      markersRef.current.push(marker);
    });

    // Add yacht club markers if layer is enabled
    if (mapLayers?.yachtClubs) {
      yachtClubs.forEach(club => {
        if (!club.coordinates_lat || !club.coordinates_lng) return;

        const color = getYachtClubColor(club.prestige_level);

        const marker = new google.maps.Marker({
          position: { lat: club.coordinates_lat, lng: club.coordinates_lng },
          map: googleMapRef.current!,
          title: club.short_name || club.name,
          icon: createMarkerIcon('yachtClub', color),
          optimized: false,
        });

        const membershipHtml = club.membership_type
          ? `<div style="margin: 6px 0 0 0; padding: 3px 8px; background: #e3f2fd; border-radius: 4px; display: inline-block;">
               <span style="font-size: 11px; font-weight: 600; color: #1976d2; text-transform: capitalize;">👥 ${club.membership_type}</span>
             </div>`
          : '';

        const clubRatingHtml = club.rating
          ? `<div style="margin: 8px 0 0 0; display: flex; align-items: center; gap: 4px;">
               <span style="color: #ffc107;">⭐</span>
               <span style="font-size: 13px; font-weight: 600; color: #1a1a1a;">${club.rating.toFixed(1)}</span>
               ${club.user_ratings_total ? `<span style="font-size: 12px; color: #999;">(${club.user_ratings_total} reviews)</span>` : ''}
             </div>`
          : '';

        const clubEstablishedHtml = club.founded
          ? `<p style="margin: 6px 0 0 0; font-size: 12px; color: #666;">⚓ Founded ${club.founded}</p>`
          : '';

        const clubContactHtml = club.phone_number || club.website
          ? `<div style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #e0e0e0;">
               ${club.phone_number ? `<p style="margin: 0; font-size: 12px; color: #007AFF;">📞 ${club.phone_number}</p>` : ''}
               ${club.website ? `<p style="margin: 4px 0 0 0; font-size: 12px;"><a href="${club.website}" target="_blank" style="color: #007AFF; text-decoration: none;">🌐 Visit Website →</a></p>` : ''}
             </div>`
          : '';

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 300px;">
            <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 700; color: #1a1a1a;">${club.short_name || club.name}</h3>
            <p style="margin: 0; font-size: 13px; color: #666; text-transform: capitalize;">
              ${club.prestige_level ? `🏆 ${club.prestige_level} Yacht Club` : '⛵ Yacht Club'}
            </p>
            ${membershipHtml}
            ${clubEstablishedHtml}
            ${clubRatingHtml}
            ${club.formatted_address ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">📮 ${club.formatted_address}</p>` : ''}
            ${clubContactHtml}
          </div>`,
        });

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current!, marker);
        });

        markersRef.current.push(marker);
      });
    }

    // Add service markers if any service layer is enabled
    const anyServiceLayerEnabled = mapLayers?.sailmakers || mapLayers?.riggers || mapLayers?.coaches ||
                                    mapLayers?.chandlery || mapLayers?.clothing || mapLayers?.marinas ||
                                    mapLayers?.repair || mapLayers?.engines;

    if (anyServiceLayerEnabled) {
      // Filter services based on enabled layers
      const filteredServices = services.filter(service => {
        const type = service.service_type;
        if (type === 'sailmaker' && mapLayers?.sailmakers) return true;
        if (type === 'rigger' && mapLayers?.riggers) return true;
        if (type === 'coach' && mapLayers?.coaches) return true;
        if (type === 'chandlery' && mapLayers?.chandlery) return true;
        if (type === 'clothing' && mapLayers?.clothing) return true;
        if (type === 'marina' && mapLayers?.marinas) return true;
        if (type === 'repair' && mapLayers?.repair) return true;
        if (type === 'engine' && mapLayers?.engines) return true;
        return false;
      });

      // Group services by location to handle stacking
      const servicesByLocation = new Map<string, typeof services>();
      filteredServices.forEach(service => {
        if (!service.coordinates_lat || !service.coordinates_lng) return;
        const key = `${service.coordinates_lat.toFixed(4)},${service.coordinates_lng.toFixed(4)}`;
        if (!servicesByLocation.has(key)) {
          servicesByLocation.set(key, []);
        }
        servicesByLocation.get(key)!.push(service);
      });

      // Render markers with slight offsets for stacked services
      servicesByLocation.forEach((servicesAtLocation, locationKey) => {
        servicesAtLocation.forEach((service, index) => {
          const { color } = getServiceStyle(service.service_type);

          // Add small offset for stacked markers (in a circular pattern)
          const offsetAmount = 0.0008; // ~88 meters
          const angle = (index * (360 / servicesAtLocation.length)) * (Math.PI / 180);
          const latOffset = servicesAtLocation.length > 1 ? Math.cos(angle) * offsetAmount : 0;
          const lngOffset = servicesAtLocation.length > 1 ? Math.sin(angle) * offsetAmount : 0;

          const marker = new google.maps.Marker({
            position: {
              lat: service.coordinates_lat + latOffset,
              lng: service.coordinates_lng + lngOffset
            },
            map: googleMapRef.current!,
            title: service.business_name,
            icon: createMarkerIcon(service.service_type, color),
            optimized: false,
          });

          const specialtiesHtml = service.specialties && service.specialties.length > 0
            ? `<div style="margin: 8px 0 0 0;">
                 <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase;">Specialties</p>
                 <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                   ${service.specialties.slice(0, 3).map(s => `<span style="padding: 2px 6px; background: #f0f0f0; border-radius: 3px; font-size: 11px; color: #666;">${s}</span>`).join('')}
                 </div>
               </div>`
            : '';

          const classesHtml = service.classes_supported && service.classes_supported.length > 0
            ? `<div style="margin: 8px 0 0 0;">
                 <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 600; color: #999; text-transform: uppercase;">⛵ Classes Supported</p>
                 <p style="margin: 0; font-size: 12px; color: #666;">${service.classes_supported.slice(0, 4).join(', ')}</p>
               </div>`
            : '';

          const priceLevelHtml = service.price_level
            ? `<div style="margin: 6px 0 0 0; padding: 3px 8px; background: #e8f5e9; border-radius: 4px; display: inline-block;">
                 <span style="font-size: 11px; font-weight: 600; color: #2e7d32; text-transform: uppercase;">💰 ${service.price_level}</span>
               </div>`
            : '';

          const serviceContactHtml = service.phone || service.email || service.website
            ? `<div style="margin: 8px 0 0 0; padding-top: 8px; border-top: 1px solid #e0e0e0;">
                 ${service.phone ? `<p style="margin: 0; font-size: 12px; color: #007AFF;">📞 ${service.phone}</p>` : ''}
                 ${service.email ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #007AFF;">✉️ ${service.email}</p>` : ''}
                 ${service.website ? `<p style="margin: 4px 0 0 0; font-size: 12px;"><a href="${service.website}" target="_blank" style="color: #007AFF; text-decoration: none;">🌐 Visit Website →</a></p>` : ''}
               </div>`
            : '';

          const preferredBadgeHtml = service.preferred_by_club
            ? `<span style="margin-left: 6px; padding: 2px 6px; background: #ffc107; border-radius: 3px; font-size: 10px; font-weight: 600; color: #000;">⭐ PREFERRED</span>`
            : '';

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="padding: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 320px;">
              <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 700; color: #1a1a1a; display: flex; align-items: center;">
                ${service.business_name}
                ${preferredBadgeHtml}
              </h3>
              <p style="margin: 0; font-size: 13px; color: #666; text-transform: capitalize;">
                🔧 ${service.service_type.replace('-', ' ')}
              </p>
              ${priceLevelHtml}
              ${specialtiesHtml}
              ${classesHtml}
              ${service.contact_name ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">👤 Contact: ${service.contact_name}</p>` : ''}
              ${serviceContactHtml}
            </div>`,
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current!, marker);
          });

          markersRef.current.push(marker);
        });
      });
    }
  }, [venues, yachtClubs, services, selectedVenue, currentVenue, mapLayers?.yachtClubs, mapLayers?.services, onMarkerPress, showOnlySavedVenues, savedVenueIds, showAllVenues]);

  // Center map when selected venue changes
  useEffect(() => {
    if (!googleMapRef.current || !selectedVenue) return;
    if (!selectedVenue.coordinates_lat || !selectedVenue.coordinates_lng) return;

    googleMapRef.current.panTo({
      lat: selectedVenue.coordinates_lat,
      lng: selectedVenue.coordinates_lng,
    });
    googleMapRef.current.setZoom(14);
  }, [selectedVenue]);

  // Center map when current venue changes
  useEffect(() => {
    if (!googleMapRef.current || !currentVenue) return;
    if (!currentVenue.coordinates_lat || !currentVenue.coordinates_lng) return;

    googleMapRef.current.panTo({
      lat: currentVenue.coordinates_lat,
      lng: currentVenue.coordinates_lng,
    });
    googleMapRef.current.setZoom(12);
  }, [currentVenue?.id]);

  const getMarkerColor = (venueType: string) => {
    switch (venueType) {
      case 'championship': return '#ffc107'; // Gold
      case 'premier': return '#007AFF'; // Blue
      case 'regional': return '#666'; // Gray
      default: return '#007AFF';
    }
  };

  const getYachtClubColor = (prestigeLevel: string) => {
    switch (prestigeLevel) {
      case 'international': return '#ffc107'; // Gold
      case 'national': return '#007AFF'; // Blue
      case 'regional': return '#28a745'; // Green
      case 'local': return '#666'; // Gray
      default: return '#007AFF';
    }
  };

  const getServiceStyle = (serviceType: string) => {
    switch (serviceType) {
      case 'sailmaker':
        return { color: '#ff9500' }; // Orange
      case 'rigger':
        return { color: '#5856d6' }; // Purple
      case 'coach':
        return { color: '#34c759' }; // Green
      case 'repair':
        return { color: '#ff3b30' }; // Red
      default:
        return { color: '#8e8e93' }; // Gray
    }
  };

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

// Wrapper render function for loading states
function render(status: Status) {
  if (status === Status.LOADING) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        height: '100%',
      }}>
        <div style={{ textAlign: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <div style={{ marginTop: 12, fontSize: 14, color: '#666' }}>Loading Google Maps...</div>
        </div>
      </div>
    );
  }

  if (status === Status.FAILURE) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        height: '100%',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: '600', color: '#ff3b30', marginBottom: 8 }}>
            Failed to load Google Maps
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Please check your API key configuration
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function VenueMapView({
  currentVenue,
  onVenueSelect,
  onMarkerPress,
  showAllVenues = false,
  selectedVenue,
  is3DEnabled = false,
  mapLayers = {},
  showOnlySavedVenues = false,
  savedVenueIds = new Set(),
}: VenueMapViewProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [yachtClubs, setYachtClubs] = useState<YachtClub[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Get Google Maps API key
  const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey ||
                 process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Fetch venues from database
  useEffect(() => {
    fetchVenues();
    fetchYachtClubs();
  }, []);

  // Fetch services when any service layer is enabled
  useEffect(() => {
    const anyServiceLayerEnabled = mapLayers.sailmakers || mapLayers.riggers || mapLayers.coaches ||
                                    mapLayers.chandlery || mapLayers.clothing || mapLayers.marinas ||
                                    mapLayers.repair || mapLayers.engines;
    if (anyServiceLayerEnabled) {
      fetchServices();
    }
  }, [mapLayers.sailmakers, mapLayers.riggers, mapLayers.coaches, mapLayers.chandlery,
      mapLayers.clothing, mapLayers.marinas, mapLayers.repair, mapLayers.engines]);

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from('sailing_venues')
        .select('id, name, country, region, venue_type, coordinates_lat, coordinates_lng, established_year, rating, user_ratings_total, formatted_address')
        .order('name', { ascending: true });

      if (error) throw error;

      setVenues(data || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchYachtClubs = async () => {
    try {
      const { data, error } = await supabase
        .from('yacht_clubs')
        .select('id, venue_id, name, short_name, prestige_level, membership_type, coordinates_lat, coordinates_lng, founded, website, phone_number, formatted_address, rating, user_ratings_total')
        .not('coordinates_lat', 'is', null)
        .not('coordinates_lng', 'is', null)
        .order('name', { ascending: true });

      if (error) throw error;

      setYachtClubs(data || []);
    } catch (error) {
      console.error('Error fetching yacht clubs:', error);
    }
  };

  const fetchServices = async () => {
    try {
      // Fetch services with venue coordinates via foreign key
      const { data, error } = await supabase
        .from('club_services')
        .select(`
          id,
          club_id,
          venue_id,
          service_type,
          business_name,
          contact_name,
          email,
          phone,
          website,
          specialties,
          price_level,
          sailing_venues!club_services_venue_id_fkey(coordinates_lat, coordinates_lng)
        `)
        .order('business_name', { ascending: true });

      if (error) throw error;

      // For services with club_id but no venue coordinates, fetch yacht club coordinates separately
      const servicesWithCoords = await Promise.all((data || []).map(async (service: any) => {
        let lat = service.sailing_venues?.coordinates_lat;
        let lng = service.sailing_venues?.coordinates_lng;

        // If no venue coordinates but has club_id, fetch yacht club coordinates
        if ((!lat || !lng) && service.club_id) {
          const { data: clubData } = await supabase
            .from('yacht_clubs')
            .select('coordinates_lat, coordinates_lng')
            .eq('id', service.club_id)
            .single();

          if (clubData) {
            lat = clubData.coordinates_lat;
            lng = clubData.coordinates_lng;
          }
        }

        return {
          id: service.id,
          club_id: service.club_id,
          venue_id: service.venue_id,
          service_type: service.service_type,
          business_name: service.business_name,
          contact_name: service.contact_name,
          email: service.email,
          phone: service.phone,
          website: service.website,
          specialties: service.specialties,
          price_level: service.price_level,
          coordinates_lat: lat,
          coordinates_lng: lng,
        };
      }));

      setServices(servicesWithCoords.filter(s => s.coordinates_lat && s.coordinates_lng));
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        height: '100%',
      }}>
        <div style={{ textAlign: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <div style={{ marginTop: 12, fontSize: 14, color: '#666' }}>Loading venues...</div>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        height: '100%',
      }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: '600', color: '#ff3b30', marginBottom: 8 }}>
            Google Maps API key not configured
          </div>
          <div style={{ fontSize: 14, color: '#666' }}>
            Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
      <Wrapper apiKey={apiKey} render={render} libraries={['places']}>
        <GoogleMapComponent
          venues={venues}
          yachtClubs={yachtClubs}
          services={services}
          currentVenue={currentVenue}
          selectedVenue={selectedVenue}
          onMarkerPress={onMarkerPress}
          mapLayers={mapLayers}
          showOnlySavedVenues={showOnlySavedVenues}
          savedVenueIds={savedVenueIds}
          showAllVenues={showAllVenues}
        />
      </Wrapper>

      {/* Venue counter overlay */}
      {showAllVenues && !loading && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '8px 16px',
          borderRadius: 20,
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          fontSize: 13,
          fontWeight: '600',
          color: '#333',
        }}>
          {showOnlySavedVenues && savedVenueIds.size > 0
            ? `${savedVenueIds.size} saved venue${savedVenueIds.size !== 1 ? 's' : ''}`
            : `${venues.length} venues worldwide`}
          {mapLayers.yachtClubs && yachtClubs.length > 0 && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {yachtClubs.length} yacht clubs
            </div>
          )}
          {(mapLayers.sailmakers || mapLayers.riggers || mapLayers.coaches || mapLayers.chandlery ||
            mapLayers.clothing || mapLayers.marinas || mapLayers.repair || mapLayers.engines) &&
            services.length > 0 && (
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              {services.length} services
            </div>
          )}
        </div>
      )}

      {/* No saved venues message */}
      {showOnlySavedVenues && savedVenueIds.size === 0 && !loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(255, 255, 255, 0.97)',
          padding: '24px 32px',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          textAlign: 'center',
          maxWidth: '320px',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📍</div>
          <div style={{ fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 }}>
            No Saved Venues
          </div>
          <div style={{ fontSize: 14, color: '#666', lineHeight: '1.5' }}>
            Save your favorite sailing venues by clicking the star icon on any venue card in the sidebar.
          </div>
        </div>
      )}
    </div>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});
