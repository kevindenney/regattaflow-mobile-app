/**
 * LocationPreviewMap (Native) - Small static map showing a race location pin
 * Uses react-native-maps MapView with interaction disabled.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface LocationPreviewMapProps {
  latitude: number;
  longitude: number;
  width: number;
  height: number;
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
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
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
      <Marker
        coordinate={{ latitude, longitude }}
        pinColor="#5AC8FA"
      />
    </MapView>
  );
}
