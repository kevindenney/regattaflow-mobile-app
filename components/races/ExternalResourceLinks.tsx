/**
 * ExternalResourceLinks Component
 * 
 * Quick-access buttons for external sailing resources:
 * - SailSys (race entry/results)
 * - Windy.com (wind forecast)
 * - HK Tidal Current Prediction
 * 
 * Pre-configures URLs with race location and time for convenience.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { ExternalLink, Wind, Waves, ClipboardList, MapPin } from 'lucide-react-native';

interface ExternalResourceLinksProps {
  /** Race venue coordinates */
  coordinates?: { lat: number; lng: number };
  /** Race date/time for forecast */
  raceDateTime?: Date | string;
  /** SailSys registration URL (if available) */
  sailsysUrl?: string;
  /** Entry form URL (alternative to SailSys) */
  entryFormUrl?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
  /** Custom title */
  title?: string;
}

interface ResourceLink {
  id: string;
  name: string;
  icon: React.ReactNode;
  url: string;
  description: string;
  color: string;
  bgColor: string;
}

export function ExternalResourceLinks({
  coordinates,
  raceDateTime,
  sailsysUrl,
  entryFormUrl,
  compact = false,
  title = 'External Resources',
}: ExternalResourceLinksProps) {
  // Build resource links based on available data
  const buildResourceLinks = (): ResourceLink[] => {
    const links: ResourceLink[] = [];
    
    // SailSys / Entry Form
    const registrationUrl = sailsysUrl || entryFormUrl;
    if (registrationUrl) {
      links.push({
        id: 'sailsys',
        name: sailsysUrl ? 'SailSys' : 'Registration',
        icon: <ClipboardList size={compact ? 16 : 20} color="#7C3AED" />,
        url: registrationUrl,
        description: sailsysUrl ? 'Entry & Results' : 'Race Entry',
        color: '#7C3AED',
        bgColor: '#F5F3FF',
      });
    }
    
    // Windy.com - pre-configured with location and date
    if (coordinates) {
      const windyUrl = buildWindyUrl(coordinates, raceDateTime);
      links.push({
        id: 'windy',
        name: 'Windy',
        icon: <Wind size={compact ? 16 : 20} color="#0EA5E9" />,
        url: windyUrl,
        description: 'Wind Forecast',
        color: '#0EA5E9',
        bgColor: '#F0F9FF',
      });
    }
    
    // HK Tidal Current - only for HK waters
    if (coordinates && isHongKongWaters(coordinates.lat, coordinates.lng)) {
      const tidalUrl = buildHKTidalUrl(coordinates);
      links.push({
        id: 'hk-tidal',
        name: 'HK Currents',
        icon: <Waves size={compact ? 16 : 20} color="#14B8A6" />,
        url: tidalUrl,
        description: 'Tidal Currents',
        color: '#14B8A6',
        bgColor: '#F0FDFA',
      });
    }
    
    // General location link (Google Maps)
    if (coordinates) {
      links.push({
        id: 'maps',
        name: 'Map',
        icon: <MapPin size={compact ? 16 : 20} color="#EF4444" />,
        url: `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`,
        description: 'View Location',
        color: '#EF4444',
        bgColor: '#FEF2F2',
      });
    }
    
    return links;
  };

  const handleOpenLink = async (url: string, name: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
        // Fallback: try to open anyway on web
        if (Platform.OS === 'web') {
          window.open(url, '_blank');
        }
      }
    } catch (error) {
      console.error(`Error opening ${name}:`, error);
    }
  };

  const links = buildResourceLinks();
  
  if (links.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={[styles.compactButton, { backgroundColor: link.bgColor }]}
            onPress={() => handleOpenLink(link.url, link.name)}
            activeOpacity={0.7}
          >
            {link.icon}
            <Text style={[styles.compactButtonText, { color: link.color }]}>
              {link.name}
            </Text>
            <ExternalLink size={10} color={link.color} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ExternalLink size={16} color="#6B7280" />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.linksGrid}>
        {links.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={[styles.linkCard, { backgroundColor: link.bgColor }]}
            onPress={() => handleOpenLink(link.url, link.name)}
            activeOpacity={0.7}
          >
            <View style={styles.linkIconContainer}>
              {link.icon}
            </View>
            <View style={styles.linkContent}>
              <Text style={[styles.linkName, { color: link.color }]}>
                {link.name}
              </Text>
              <Text style={styles.linkDescription}>{link.description}</Text>
            </View>
            <ExternalLink size={14} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

/**
 * Build Windy.com URL with coordinates and optional date
 */
function buildWindyUrl(
  coordinates: { lat: number; lng: number },
  raceDateTime?: Date | string
): string {
  const { lat, lng } = coordinates;
  // Windy uses zoom level in URL, 10 is good for coastal areas
  let url = `https://www.windy.com/?${lat.toFixed(4)},${lng.toFixed(4)},10`;
  
  // Add date if provided and in the future
  if (raceDateTime) {
    const raceDate = typeof raceDateTime === 'string' ? new Date(raceDateTime) : raceDateTime;
    const now = new Date();
    
    // Only add date if it's in the future (within 10 days for forecast)
    const daysUntilRace = (raceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysUntilRace > 0 && daysUntilRace <= 10) {
      // Windy uses ISO date format
      url += `&detailLat=${lat.toFixed(4)}&detailLon=${lng.toFixed(4)}`;
    }
  }
  
  return url;
}

/**
 * Build HK Hydrographic Office tidal current URL
 */
function buildHKTidalUrl(coordinates: { lat: number; lng: number }): string {
  const { lat, lng } = coordinates;
  return `https://current.hydro.gov.hk/main/prediction_static.php?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`;
}

/**
 * Check if coordinates are in Hong Kong waters
 */
function isHongKongWaters(lat: number, lng: number): boolean {
  return lat >= 22.0 && lat <= 22.6 && lng >= 113.8 && lng <= 114.5;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  linksGrid: {
    gap: 8,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  linkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  linkContent: {
    flex: 1,
  },
  linkName: {
    fontSize: 14,
    fontWeight: '700',
  },
  linkDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ExternalResourceLinks;

