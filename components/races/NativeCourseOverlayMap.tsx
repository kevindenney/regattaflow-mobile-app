/**
 * NativeCourseOverlayMap
 *
 * Read-only native map showing a positioned course with the full overlay:
 * laylines, start box, thirds, side labels, favored side shading.
 *
 * Used in the briefing wizard Course tab and anywhere a course preview is needed on native.
 */

import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Platform, TurboModuleRegistry } from 'react-native';
import type { PositionedCourse, StartLinePosition } from '@/types/courses';

// ── Conditional react-native-maps ──
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let Polygon: any = null;
let mapsAvailable = false;

if (Platform.OS !== 'web') {
  try {
    const nativeModule = TurboModuleRegistry.get('RNMapsAirModule');
    if (nativeModule) {
      const maps = require('react-native-maps');
      MapView = maps.default;
      Marker = maps.Marker;
      Polyline = maps.Polyline;
      Polygon = maps.Polygon;
      mapsAvailable = true;
    }
  } catch (e) {
    // Maps not available
  }
}

// ── Geometry helpers ──

type Coord = { latitude: number; longitude: number };

function offsetCoordinate(lat: number, lng: number, bearingDeg: number, distanceM: number): Coord {
  const R = 6371000;
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const d = distanceM / R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );
  return { latitude: (lat2 * 180) / Math.PI, longitude: (lng2 * 180) / Math.PI };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lerpCoord(a: Coord, b: Coord, t: number): Coord {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

function flatBearing(from: Coord, to: Coord): number {
  const toRad = Math.PI / 180;
  const dlng = (to.longitude - from.longitude) * Math.cos(from.latitude * toRad);
  const dlat = to.latitude - from.latitude;
  return ((Math.atan2(dlng, dlat) * 180) / Math.PI + 360) % 360;
}

function rayIntersection(p1: Coord, b1: number, p2: Coord, b2: number): Coord | null {
  const toRad = Math.PI / 180;
  const cosLat = Math.cos(p1.latitude * toRad);
  const dx1 = Math.sin(b1 * toRad), dy1 = Math.cos(b1 * toRad);
  const dx2 = Math.sin(b2 * toRad), dy2 = Math.cos(b2 * toRad);
  const det = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(det) < 1e-10) return null;
  const ex = (p2.longitude - p1.longitude) * cosLat;
  const ey = p2.latitude - p1.latitude;
  const t1 = (ex * dy2 - ey * dx2) / det;
  if (t1 < 0) return null;
  return {
    latitude: p1.latitude + t1 * dy1,
    longitude: p1.longitude + t1 * dx1 / cosLat,
  };
}

// ── Mark colors ──
const MARK_COLORS: Record<string, string> = {
  windward: '#eab308',
  leeward: '#ef4444',
  gate: '#f97316',
  wing: '#22c55e',
  offset: '#3b82f6',
};

// ── Props ──
interface NativeCourseOverlayMapProps {
  positionedCourse: PositionedCourse;
  windDirection: number;
  currentDirection?: number;
  currentSpeed?: number;
  style?: any;
}

export function NativeCourseOverlayMap({
  positionedCourse,
  windDirection,
  currentDirection,
  currentSpeed,
  style,
}: NativeCourseOverlayMapProps) {
  const mapRef = useRef<any>(null);
  const marks = positionedCourse.marks || [];
  const startLine: StartLinePosition | null = positionedCourse.startLine || null;

  // ── Course overlay computation (same as CoursePositionEditor) ──
  const courseOverlay = useMemo(() => {
    if (marks.length === 0) return null;
    const windwardMark = marks.find((m) => m.type === 'windward');
    const leewardMark = marks.find((m) => m.type === 'leeward');
    const gateMarks = marks.filter((m) => m.type === 'gate');
    const leewardPos = leewardMark
      ? { latitude: leewardMark.latitude, longitude: leewardMark.longitude }
      : gateMarks.length >= 2
        ? { latitude: (gateMarks[0].latitude + gateMarks[1].latitude) / 2,
            longitude: (gateMarks[0].longitude + gateMarks[1].longitude) / 2 }
        : gateMarks.length === 1
          ? { latitude: gateMarks[0].latitude, longitude: gateMarks[0].longitude }
          : startLine
            ? { latitude: (startLine.pin.lat + startLine.committee.lat) / 2,
                longitude: (startLine.pin.lng + startLine.committee.lng) / 2 }
            : null;
    if (!windwardMark || !leewardPos) return null;

    const W: Coord = { latitude: windwardMark.latitude, longitude: windwardMark.longitude };
    const L: Coord = leewardPos;
    const M = lerpCoord(L, W, 0.5);

    const legDistanceM = haversineDistance(W.latitude, W.longitude, L.latitude, L.longitude);
    const halfWidth = (legDistanceM / 2) * Math.tan((45 * Math.PI) / 180);

    const rightBearing = (windDirection + 90) % 360;
    const leftBearing = (windDirection - 90 + 360) % 360;
    const downwindBearing = (windDirection + 180) % 360;

    let portCorner = offsetCoordinate(M.latitude, M.longitude, rightBearing, halfWidth);
    let stbdCorner = offsetCoordinate(M.latitude, M.longitude, leftBearing, halfWidth);

    // Third dividers
    const oneThird = lerpCoord(L, W, 1 / 3);
    const twoThirds = lerpCoord(L, W, 2 / 3);
    const oneThirdHW = halfWidth * (2 / 3);
    const twoThirdsHW = halfWidth * (2 / 3);
    const oneThirdLeft = offsetCoordinate(oneThird.latitude, oneThird.longitude, leftBearing, oneThirdHW);
    const oneThirdRight = offsetCoordinate(oneThird.latitude, oneThird.longitude, rightBearing, oneThirdHW);
    const twoThirdsLeft = offsetCoordinate(twoThirds.latitude, twoThirds.longitude, leftBearing, twoThirdsHW);
    const twoThirdsRight = offsetCoordinate(twoThirds.latitude, twoThirds.longitude, rightBearing, twoThirdsHW);

    const bottomThirdLabel = lerpCoord(L, W, 1 / 6);
    const middleThirdLabel = lerpCoord(L, W, 1 / 2);
    const upperThirdLabel = lerpCoord(L, W, 5 / 6);

    // Favored side
    const hasCurrent = currentDirection !== undefined && currentSpeed !== undefined && currentSpeed > 0.05;
    let favoredSide: 'left' | 'right' | null = null;
    if (hasCurrent) {
      const rel = ((currentDirection! - windDirection) % 360 + 360) % 360;
      favoredSide = (rel > 0 && rel < 180) ? 'left' : 'right';
    }

    const sideOffset = halfWidth * 0.5;
    const leftLabel = offsetCoordinate(M.latitude, M.longitude, leftBearing, sideOffset);
    const rightLabel = offsetCoordinate(M.latitude, M.longitude, rightBearing, sideOffset);

    let portLLLabel = lerpCoord(W, portCorner, 0.5);
    let stbdLLLabel = lerpCoord(W, stbdCorner, 0.5);

    let P: Coord = L;
    let C: Coord = L;
    let startMid: Coord = L;
    let startBox: { outline: Coord[]; dividers: Coord[][] } | null = null;
    let startLabels: { pinEnd: Coord; middle: Coord; boatEnd: Coord } | null = null;

    if (startLine) {
      P = { latitude: startLine.pin.lat, longitude: startLine.pin.lng };
      C = { latitude: startLine.committee.lat, longitude: startLine.committee.lng };
      startMid = lerpCoord(P, C, 0.5);

      const boxDepth = legDistanceM * 0.15;
      const dLat = C.latitude - P.latitude;
      const dLng = (C.longitude - P.longitude) * Math.cos((P.latitude * Math.PI) / 180);
      const lineBearingPtoC = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

      const candidateA = (lineBearingPtoC - 45 + 360) % 360;
      const candidateB = (lineBearingPtoC + 45) % 360;
      const diffA = Math.abs(((candidateA - downwindBearing + 540) % 360) - 180);
      const diffB = Math.abs(((candidateB - downwindBearing + 540) % 360) - 180);
      const shortSideBearing = diffA < diffB ? candidateA : candidateB;

      const pinDown = offsetCoordinate(P.latitude, P.longitude, shortSideBearing, boxDepth);
      const committeeDown = offsetCoordinate(C.latitude, C.longitude, shortSideBearing, boxDepth);
      const startOneThird = lerpCoord(P, C, 1 / 3);
      const startTwoThirds = lerpCoord(P, C, 2 / 3);
      const oneThirdDown = offsetCoordinate(startOneThird.latitude, startOneThird.longitude, shortSideBearing, boxDepth);
      const twoThirdsDown = offsetCoordinate(startTwoThirds.latitude, startTwoThirds.longitude, shortSideBearing, boxDepth);

      const labelDownOffset = boxDepth * 0.5;
      const pinEndLabel = offsetCoordinate(
        lerpCoord(P, startOneThird, 0.5).latitude,
        lerpCoord(P, startOneThird, 0.5).longitude,
        shortSideBearing, labelDownOffset
      );
      const startMidLabel = offsetCoordinate(startMid.latitude, startMid.longitude, shortSideBearing, labelDownOffset);
      const boatEndLabel = offsetCoordinate(
        lerpCoord(startTwoThirds, C, 0.5).latitude,
        lerpCoord(startTwoThirds, C, 0.5).longitude,
        shortSideBearing, labelDownOffset
      );

      startBox = {
        outline: [P, C, committeeDown, pinDown],
        dividers: [
          [startOneThird, oneThirdDown],
          [startTwoThirds, twoThirdsDown],
        ],
      };
      startLabels = { pinEnd: pinEndLabel, middle: startMidLabel, boatEnd: boatEndLabel };

      // Extend lower laylines (45° to wind) to meet upper laylines
      const laylineBearingFromP = (windDirection - 45 + 360) % 360;
      const laylineBearingFromC = (windDirection + 45) % 360;
      const bearingWtoPort = flatBearing(W, portCorner);
      const bearingWtoStbd = flatBearing(W, stbdCorner);

      const newStbd = rayIntersection(P, laylineBearingFromP, W, bearingWtoStbd);
      const newPort = rayIntersection(C, laylineBearingFromC, W, bearingWtoPort);

      if (newStbd) stbdCorner = newStbd;
      if (newPort) portCorner = newPort;

      portLLLabel = lerpCoord(W, portCorner, 0.5);
      stbdLLLabel = lerpCoord(W, stbdCorner, 0.5);
    }

    return {
      W, L, M, P, C, startMid, portCorner, stbdCorner,
      leftPoly: [W, stbdCorner, P, startMid],
      rightPoly: [W, portCorner, C, startMid],
      thirdDividers: [
        [oneThirdLeft, oneThirdRight],
        [twoThirdsLeft, twoThirdsRight],
      ],
      thirdLabels: { bottom: bottomThirdLabel, middle: middleThirdLabel, upper: upperThirdLabel },
      favoredSide,
      leftLabel,
      rightLabel,
      laylineLabels: { port: portLLLabel, stbd: stbdLLLabel },
      startBox,
      startLabels,
    };
  }, [marks, windDirection, currentDirection, currentSpeed, startLine]);

  // ── Map region from marks + overlay bounds ──
  const mapRegion = useMemo(() => {
    const allCoords: Coord[] = marks.map(m => ({ latitude: m.latitude, longitude: m.longitude }));
    if (startLine) {
      allCoords.push({ latitude: startLine.pin.lat, longitude: startLine.pin.lng });
      allCoords.push({ latitude: startLine.committee.lat, longitude: startLine.committee.lng });
    }
    // Include overlay diamond corners so the full overlay fits in the region
    if (courseOverlay) {
      allCoords.push(courseOverlay.portCorner, courseOverlay.stbdCorner, courseOverlay.W);
      if (courseOverlay.startBox) {
        courseOverlay.startBox.outline.forEach(c => allCoords.push(c));
      }
    }
    if (allCoords.length === 0) return null;

    const lats = allCoords.map(c => c.latitude);
    const lngs = allCoords.map(c => c.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latDelta = Math.max((maxLat - minLat) * 1.6, 0.005);
    const lngDelta = Math.max((maxLng - minLng) * 1.6, 0.005);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [marks, startLine, courseOverlay]);

  // ── Zoom-dependent scaling ──
  // When zoomed out (large latitudeDelta), shrink marks and labels to reduce clutter.
  // Base delta ~0.008 (tight course view) → scale 1.0
  // Larger deltas → proportionally smaller elements
  const zoomScale = useMemo(() => {
    if (!mapRegion) return 1;
    const baseDelta = 0.008;
    const ratio = baseDelta / mapRegion.latitudeDelta;
    return Math.max(0.55, Math.min(1.0, ratio));
  }, [mapRegion?.latitudeDelta]);

  const markerTransform = useMemo(
    () => ({ transform: [{ scale: zoomScale }] as any }),
    [zoomScale],
  );

  const showDetailLabels = zoomScale > 0.65;

  if (!mapsAvailable || !MapView || !mapRegion) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.fallbackText}>Map unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={mapRegion}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        mapType="standard"
      >
        {/* ── Course overlay ── */}
        {courseOverlay && Polygon && (
          <>
            {/* Race area: left/right halves */}
            <Polygon
              coordinates={courseOverlay.leftPoly}
              fillColor={courseOverlay.favoredSide === 'left' ? 'rgba(34, 197, 94, 0.13)' : 'rgba(148, 163, 184, 0.06)'}
              strokeColor="transparent"
            />
            <Polygon
              coordinates={courseOverlay.rightPoly}
              fillColor={courseOverlay.favoredSide === 'right' ? 'rgba(34, 197, 94, 0.13)' : 'rgba(148, 163, 184, 0.06)'}
              strokeColor="transparent"
            />

            {/* Laylines */}
            <Polyline coordinates={[courseOverlay.W, courseOverlay.portCorner]} strokeColor={`rgba(234, 179, 8, ${zoomScale < 0.8 ? 0.4 : 0.8})`} strokeWidth={zoomScale < 0.8 ? 1 : 1.5} lineDashPattern={[8, 5]} />
            <Polyline coordinates={[courseOverlay.C, courseOverlay.portCorner]} strokeColor={`rgba(234, 179, 8, ${zoomScale < 0.8 ? 0.4 : 0.8})`} strokeWidth={zoomScale < 0.8 ? 1 : 1.5} lineDashPattern={[8, 5]} />
            <Polyline coordinates={[courseOverlay.W, courseOverlay.stbdCorner]} strokeColor={`rgba(234, 179, 8, ${zoomScale < 0.8 ? 0.4 : 0.8})`} strokeWidth={zoomScale < 0.8 ? 1 : 1.5} lineDashPattern={[8, 5]} />
            <Polyline coordinates={[courseOverlay.P, courseOverlay.stbdCorner]} strokeColor={`rgba(234, 179, 8, ${zoomScale < 0.8 ? 0.4 : 0.8})`} strokeWidth={zoomScale < 0.8 ? 1 : 1.5} lineDashPattern={[8, 5]} />

            {/* Rhumbline */}
            <Polyline
              coordinates={[courseOverlay.W, courseOverlay.startMid]}
              strokeColor="rgba(255, 255, 255, 0.5)"
              strokeWidth={1.5}
              lineDashPattern={[8, 4]}
            />

            {/* Third dividers */}
            {courseOverlay.thirdDividers.map((coords, i) => (
              <Polyline key={`third-${i}`} coordinates={coords} strokeColor="rgba(148, 163, 184, 0.35)" strokeWidth={1} lineDashPattern={[4, 4]} />
            ))}

            {/* Third labels — hidden when very zoomed out */}
            {showDetailLabels && (
              <>
                <Marker coordinate={courseOverlay.thirdLabels.bottom} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[overlayStyles.thirdPill, markerTransform]}><Text style={overlayStyles.thirdText}>Bottom 1/3</Text></View>
                </Marker>
                <Marker coordinate={courseOverlay.thirdLabels.middle} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[overlayStyles.thirdPill, markerTransform]}><Text style={overlayStyles.thirdText}>Middle 1/3</Text></View>
                </Marker>
                <Marker coordinate={courseOverlay.thirdLabels.upper} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[overlayStyles.thirdPill, markerTransform]}><Text style={overlayStyles.thirdText}>Upper 1/3</Text></View>
                </Marker>
              </>
            )}

            {/* Rhumbline label — hidden when zoomed out */}
            {showDetailLabels && (
              <Marker coordinate={lerpCoord(courseOverlay.startMid, courseOverlay.W, 0.35)} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                <View style={[overlayStyles.rhumblinePill, markerTransform]}><Text style={overlayStyles.rhumblineText}>Rhumbline</Text></View>
              </Marker>
            )}

            {/* LEFT / RIGHT labels */}
            <Marker coordinate={courseOverlay.leftLabel} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={[overlayStyles.sidePill, courseOverlay.favoredSide === 'left' && overlayStyles.sidePillFavored, markerTransform]}>
                <Text style={[overlayStyles.sideText, courseOverlay.favoredSide === 'left' && overlayStyles.sideTextFavored]}>LEFT</Text>
              </View>
            </Marker>
            <Marker coordinate={courseOverlay.rightLabel} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={[overlayStyles.sidePill, courseOverlay.favoredSide === 'right' && overlayStyles.sidePillFavored, markerTransform]}>
                <Text style={[overlayStyles.sideText, courseOverlay.favoredSide === 'right' && overlayStyles.sideTextFavored]}>RIGHT</Text>
              </View>
            </Marker>

            {/* Layline labels — hidden when zoomed out */}
            {showDetailLabels && (
              <>
                <Marker coordinate={courseOverlay.laylineLabels.port} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[overlayStyles.laylinePill, markerTransform]}><Text style={overlayStyles.laylineText}>Stbd LL</Text></View>
                </Marker>
                <Marker coordinate={courseOverlay.laylineLabels.stbd} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[overlayStyles.laylinePill, markerTransform]}><Text style={overlayStyles.laylineText}>Port LL</Text></View>
                </Marker>
              </>
            )}

            {/* Start box */}
            {courseOverlay.startBox && (
              <>
                <Polyline
                  coordinates={[...courseOverlay.startBox.outline, courseOverlay.startBox.outline[0]]}
                  strokeColor={`rgba(249, 115, 22, ${zoomScale < 0.8 ? 0.35 : 0.6})`}
                  strokeWidth={zoomScale < 0.8 ? 1 : 1.5}
                  lineDashPattern={[6, 4]}
                />
                {courseOverlay.startBox.dividers.map((coords, i) => (
                  <Polyline
                    key={`start-div-${i}`}
                    coordinates={coords}
                    strokeColor="rgba(249, 115, 22, 0.35)"
                    strokeWidth={1}
                    lineDashPattern={[4, 4]}
                  />
                ))}
              </>
            )}

            {/* Start line labels */}
            {courseOverlay.startLabels && (
              <>
                <Marker coordinate={courseOverlay.startLabels.pinEnd} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[overlayStyles.startPill, markerTransform]}><Text style={overlayStyles.startText}>Pin End</Text></View>
                </Marker>
                {showDetailLabels && (
                  <Marker coordinate={courseOverlay.startLabels.middle} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                    <View style={[overlayStyles.startPill, markerTransform]}><Text style={overlayStyles.startText}>Middle</Text></View>
                  </Marker>
                )}
                <Marker coordinate={courseOverlay.startLabels.boatEnd} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={[overlayStyles.startPill, markerTransform]}><Text style={overlayStyles.startText}>Boat End</Text></View>
                </Marker>
              </>
            )}
          </>
        )}

        {/* ── Mark markers ── */}
        {marks.map((mark) => {
          const color = MARK_COLORS[mark.type] || '#64748b';
          const label = mark.type === 'windward' ? 'W'
            : mark.type === 'gate' ? 'G'
            : mark.type === 'leeward' ? 'L'
            : mark.type.charAt(0).toUpperCase();
          return (
            <Marker
              key={mark.id}
              coordinate={{ latitude: mark.latitude, longitude: mark.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[markStyles.circle, { backgroundColor: color }, markerTransform]}>
                <Text style={markStyles.label}>{label}</Text>
              </View>
            </Marker>
          );
        })}

        {/* ── Start line ── */}
        {startLine && (
          <>
            <Polyline
              coordinates={[
                { latitude: startLine.pin.lat, longitude: startLine.pin.lng },
                { latitude: startLine.committee.lat, longitude: startLine.committee.lng },
              ]}
              strokeColor="#22c55e"
              strokeWidth={2}
            />
            <Marker
              coordinate={{ latitude: startLine.committee.lat, longitude: startLine.committee.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[markStyles.circle, { backgroundColor: '#3b82f6' }, markerTransform]}>
                <Text style={markStyles.label}>C</Text>
              </View>
            </Marker>
            <Marker
              coordinate={{ latitude: startLine.pin.lat, longitude: startLine.pin.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[markStyles.circle, { backgroundColor: '#f97316' }, markerTransform]}>
                <Text style={markStyles.label}>P</Text>
              </View>
            </Marker>
          </>
        )}
      </MapView>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  fallback: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: '#6b7280',
  },
});

const markStyles = StyleSheet.create({
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});

const overlayStyles = StyleSheet.create({
  sidePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  sidePillFavored: {
    backgroundColor: 'rgba(22, 101, 52, 0.85)',
    borderColor: 'rgba(34, 197, 94, 0.6)',
  },
  sideText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  sideTextFavored: {
    color: '#86efac',
  },
  laylinePill: {
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  laylineText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#eab308',
  },
  thirdPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thirdText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(203, 213, 225, 0.8)',
    letterSpacing: 0.5,
  },
  rhumblinePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  rhumblineText: {
    fontSize: 8,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  startPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  startText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#86efac',
  },
});
