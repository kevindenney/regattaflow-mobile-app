/**
 * LocationPreviewMap (Native) - Small static map showing a race location pin
 * Uses react-native-maps MapView with interaction disabled.
 * Falls back to a simple colored rect when react-native-maps is unavailable (e.g. Expo Go).
 */

import React from 'react';
import { View, Text } from 'react-native';

interface LocationPreviewMapProps {
  latitude: number;
  longitude: number;
  width: number;
  height: number;
}

let MapViewComponent: any = null;
let MarkerComponent: any = null;
let PROVIDER_GOOGLE_VALUE: any = null;

try {
  const maps = require('react-native-maps');
  MapViewComponent = maps.default;
  MarkerComponent = maps.Marker;
  PROVIDER_GOOGLE_VALUE = maps.PROVIDER_GOOGLE;
} catch {
  // react-native-maps not available (e.g. Expo Go)
}

const MAP_STYLE = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d7e4' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f0f0f0' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export function LocationPreviewMap({ latitude, longitude, width, height }: LocationPreviewMapProps) {
  if (!MapViewComponent) {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: '#c9d7e4',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
        }}
      >
        <Text style={{ fontSize: 11, color: '#334155' }}>
          {latitude.toFixed(3)}, {longitude.toFixed(3)}
        </Text>
      </View>
    );
  }

  return (
    <MapViewComponent
      provider={PROVIDER_GOOGLE_VALUE}
      style={{ width, height }}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}
      showsUserLocation={false}
      showsCompass={false}
      showsScale={false}
      showsMyLocationButton={false}
      customMapStyle={MAP_STYLE}
      pointerEvents="none"
    >
      {MarkerComponent && (
        <MarkerComponent
          coordinate={{ latitude, longitude }}
          pinColor="#5AC8FA"
        />
      )}
    </MapViewComponent>
  );
}
