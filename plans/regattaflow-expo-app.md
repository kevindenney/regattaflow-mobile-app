# RegattaFlow Expo App - Comprehensive Planning Document

## 1. Executive Summary

RegattaFlow is a comprehensive sailing race strategy platform that combines weather data, AI-powered recommendations, and collaborative planning tools. The platform consists of a Next.js marketing website and an Expo-based application for Web, iOS, and Android that serves as the primary race planning and strategy tool.

## 2. User Journeys

### 2.1 Web User Journey
```mermaid
1. Visit regattaflow.oceanflow.io → Marketing site
2. Browse features → View pricing
3. Create account → Supabase Auth
4. Subscribe via Stripe → Payment processing
5. Redirect to app.regattaflow.oceanflow.io → Expo web app
6. Setup first regatta → Core app experience
```

### 2.2 Mobile App User Journey (iOS/Android)
```mermaid
1. Download from App/Play Store
2. Open app → Onboarding screens
3. Create account or login
4. Start free trial or subscribe (RevenueCat)
5. Access full app features
6. Offline mode available for on-water use
```

### 2.3 Racing Day User Flow
```
Pre-Race (1-7 days before):
- Upload sailing instructions/NoR
- AI extracts race details
- Review course options
- Check weather forecast
- Plan initial strategy
- Share with crew

Race Day Morning:
- Update weather data
- Confirm course selection
- Review tide tables
- Finalize strategy
- Brief crew via app

During Race:
- Start countdown timer
- Track GPS position
- Monitor wind shifts
- View tide/current overlays
- Record observations

Post-Race:
- Stop timer & save track
- AI analyzes performance
- Compare plan vs actual
- Debrief with crew
- Update notes for next race
```

## 3. 3D Mapping System (onX Maps Style)

### 3.1 Map Visualization Features

**Core 3D Capabilities:**
```typescript
interface Map3DConfig {
  // Terrain & Bathymetry
  elevation: {
    exaggeration: 1.5,  // Vertical scale for depth/height
    seaFloorRendering: true,
    contourLines: {
      depths: [2, 5, 10, 20, 50, 100], // meters
      colors: ['#E3F2FD', '#90CAF9', '#42A5F5', '#1E88E5', '#1565C0', '#0D47A1']
    }
  },

  // Camera Controls (onX style)
  camera: {
    pitch: 0-85,  // Tilt angle
    bearing: 0-360,  // Rotation
    zoom: 10-20,
    animation: 'smooth',
    followMode: 'off' | 'GPS' | 'compass'
  },

  // Layer System
  layers: {
    nauticalChart: true,
    satellite: false,
    bathymetry: true,
    currentFlow: true,
    windField: true,
    hazards: true
  }
}
```

**Visual Features from onX:**
- **Smooth terrain rendering** with bathymetric data
- **Property boundaries** → Racing area boundaries
- **Color-coded depths** with gradient overlays
- **3D rotation gestures** with momentum
- **Pinch-to-tilt** for perspective changes
- **Offline map caching** for race areas
- **Custom waypoint markers** → Race marks
- **Track recording** with elevation profile

### 3.2 Nautical Chart Layers

```typescript
// Nautical-specific overlays
const nauticalLayers = {
  // NOAA Chart Integration
  noaaCharts: {
    type: 'raster',
    source: 'noaa-rnc',
    opacity: 0.8,
    bounds: getBoundingBox()
  },

  // Depth Contours (3D)
  bathymetry: {
    type: 'mesh3D',
    source: 'gebco-bathymetry',
    exaggeration: 2.0,
    colorRamp: 'ocean_depth'
  },

  // Navigation Aids
  navAids: {
    buoys: { icon: '3d-buoy-model', size: dynamic },
    lights: { icon: 'lighthouse-3d', animation: 'flash' },
    daymarks: { icon: 'daymark-3d' }
  },

  // Tidal Current Arrows (Animated)
  tidalFlow: {
    type: 'animated-arrows',
    source: 'noaa-currents',
    animation: {
      speed: 'actual',
      scale: 'logarithmic',
      colors: ['#00FF00', '#FFFF00', '#FF0000'] // Weak to strong
    }
  }
}
```

### 3.3 Weather Visualization (3D)

```typescript
// Wind field rendering (onX-style overlay)
const windVisualization = {
  // 3D Wind Barbs floating above water
  windBarbs: {
    height: 50, // meters above sea level
    spacing: 500, // meters grid
    size: 'proportional',
    animation: 'flutter',
    opacity: 0.8
  },

  // Particle system for wind flow
  windParticles: {
    count: 1000,
    speed: 'windSpeed',
    color: 'gradient',
    lifetime: 5000,
    trails: true
  },

  // Pressure gradient shading
  pressureField: {
    type: 'heatmap',
    opacity: 0.3,
    colors: 'pressure_gradient'
  }
}

// Wave field (3D animated)
const waveVisualization = {
  waveHeight: {
    type: 'displacement',
    source: 'wave-model',
    animation: 'realistic',
    frequency: 'actual'
  },

  swellDirection: {
    type: 'arrow-field',
    size: 'waveHeight',
    color: 'period'
  }
}
```

## 4. Technical Architecture

### 4.1 System Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
├─────────────────────────┬────────────────┬──────────────┤
│   Next.js Marketing     │  Expo Web App  │ Mobile Apps  │
│  regattaflow.oceanflow  │   (subdomain)  │  iOS/Android │
└───────────┬─────────────┴────────┬───────┴──────────────┘
            │                      │
            ▼                      ▼
┌───────────────────────────────────────────────────────┐
│                    API Layer                          │
├────────────────────────────────────────────────────────┤
│  Next.js API Routes  │  Supabase Edge Functions       │
│  - Stripe webhooks   │  - Real-time subscriptions     │
│  - OCR processing    │  - Crew collaboration          │
│  - Weather proxies   │  - Data sync                   │
│  - Map tile proxy    │  - Track processing            │
└──────────┬───────────┴─────────────┬──────────────────┘
           │                         │
           ▼                         ▼
┌───────────────────────────────────────────────────────┐
│                  Data Layer                           │
├────────────────────────────────────────────────────────┤
│           Supabase (PostgreSQL + Realtime)            │
│  - Users, Subscriptions, Regattas, Races              │
│  - Strategies, Tracks, Documents, Settings            │
│  - Offline map cache metadata                         │
└────────────────────────────────────────────────────────┘
           │
           ▼
┌───────────────────────────────────────────────────────┐
│              External Services                         │
├────────────────────────────────────────────────────────┤
│ Stripe │ RevenueCat │ Gemini AI │ Weather APIs │      │
│ Mapbox │ NOAA Charts │ GEBCO Bathymetry │ Tides API  │
└────────────────────────────────────────────────────────┘
```

### 4.2 Enhanced Folder Structure
```
/Users/kevindenney/Developer/
├── RegattaFlowWebsite/           # Existing Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── (marketing)/     # Public pages
│   │   │   ├── (auth)/          # Login/signup
│   │   │   ├── api/             # API routes
│   │   │   └── dashboard/       # Redirect to Expo
│   │   └── lib/
│   │       ├── supabase/        # Shared client
│   │       └── stripe/          # Subscription logic
│   └── plans/
│       └── regattaflow-expo-app.md  # THIS DOCUMENT
│
└── regattaflow-app/              # NEW Expo app
    ├── app/                      # Expo Router
    │   ├── (auth)/
    │   │   ├── login.tsx
    │   │   ├── signup.tsx
    │   │   └── onboarding.tsx
    │   ├── (tabs)/
    │   │   ├── _layout.tsx
    │   │   ├── map.tsx          # Main map view
    │   │   ├── regattas.tsx     # Regatta list
    │   │   ├── strategy.tsx     # AI insights
    │   │   └── profile.tsx      # Settings
    │   └── modals/
    │       ├── race-setup.tsx
    │       ├── mark-editor.tsx
    │       └── crew-share.tsx
    ├── src/
    │   ├── components/
    │   │   ├── map/
    │   │   │   ├── Map3DView.tsx    # Main 3D map
    │   │   │   ├── MapControls.tsx  # onX-style controls
    │   │   │   ├── LayerToggle.tsx  # Layer switcher
    │   │   │   ├── DepthProfile.tsx # Bathymetry view
    │   │   │   ├── WindField3D.tsx  # Wind visualization
    │   │   │   ├── TidalFlow3D.tsx  # Current arrows
    │   │   │   ├── RaceCourse3D.tsx # Course in 3D
    │   │   │   └── TrackReplay3D.tsx # 3D track replay
    │   │   └── ui/              # Shared UI
    │   ├── features/
    │   │   ├── map/
    │   │   ├── race/
    │   │   ├── regatta/
    │   │   ├── strategy/
    │   │   └── tracking/
    │   ├── services/
    │   │   ├── supabase.ts
    │   │   ├── mapbox.ts            # 3D map engine
    │   │   ├── noaaCharts.ts        # Chart tiles
    │   │   ├── bathymetry.ts        # Depth data
    │   │   ├── offlineMaps.ts       # Map caching
    │   │   ├── weather.ts
    │   │   ├── gemini.ts
    │   │   ├── ocr.ts
    │   │   └── revenueCat.ts
    │   └── lib/
    │       ├── types/
    │       ├── utils/
    │       └── constants/
    └── shaders/                 # Custom WebGL shaders
        ├── water.glsl           # Water surface
        ├── depth.glsl           # Depth shading
        └── wind.glsl            # Wind particles
```

## 5. Data Models

### 5.1 Core Database Schema
```sql
-- Users (managed by Supabase Auth)
users
  id uuid primary key
  email text
  full_name text
  subscription_status text
  subscription_tier text
  stripe_customer_id text
  created_at timestamp

-- Regattas
regattas
  id uuid primary key
  user_id uuid references users
  name text
  venue jsonb -- {lat, lng, name}
  start_date date
  end_date date
  organizing_authority text
  documents jsonb[] -- array of {url, type, extracted_data}
  created_at timestamp

-- Races
races
  id uuid primary key
  regatta_id uuid references regattas
  race_number integer
  scheduled_start timestamp
  actual_start timestamp
  course_config jsonb -- marks, angles, distances
  weather_snapshot jsonb
  strategy jsonb
  crew_members uuid[]
  status text -- planned, active, completed

-- Race Tracks
race_tracks
  id uuid primary key
  race_id uuid references races
  user_id uuid references users
  track_data jsonb[] -- array of {lat, lng, timestamp, sog, cog}
  started_at timestamp
  finished_at timestamp

-- Shared Strategies (real-time collaboration)
shared_strategies
  id uuid primary key
  race_id uuid references races
  created_by uuid references users
  content text
  ai_insights jsonb
  shared_with uuid[]
  updated_at timestamp
```

### 5.2 TypeScript Types
```typescript
// User types
interface User {
  id: string
  email: string
  fullName: string
  subscription: {
    status: 'active' | 'trialing' | 'canceled' | 'past_due'
    tier: 'free' | 'sailor' | 'team' | 'enterprise'
    validUntil: Date
  }
}

// Regatta types
interface Regatta {
  id: string
  name: string
  venue: GeoLocation
  dates: {
    start: Date
    end: Date
  }
  races: Race[]
  documents: RaceDocument[]
  organizingAuthority: string
}

interface Race {
  id: string
  regattaId: string
  raceNumber: number
  scheduledStart: Date
  actualStart?: Date
  course: RaceCourse
  conditions: WeatherConditions
  strategy: RaceStrategy
  tracks: GPSTrack[]
  status: RaceStatus
}

interface RaceCourse {
  marks: RaceMark[]
  configuration: 'windward_leeward' | 'triangle' | 'custom'
  windDirection: number
  currentDirection: number
  currentSpeed: number
}

interface RaceMark {
  id: string
  name: string
  position: GeoLocation
  type: 'start' | 'finish' | 'windward' | 'leeward' | 'gate' | 'offset'
  rounding: 'port' | 'starboard'
}

interface WeatherConditions {
  wind: {
    speed: number
    direction: number
    gusts: number
  }
  tide: {
    height: number
    direction: 'flood' | 'ebb'
    speed: number
  }
  waves: {
    height: number
    period: number
    direction: number
  }
  forecast: WeatherForecast[]
}

interface RaceStrategy {
  userNotes: string
  aiRecommendations: AIRecommendation[]
  keyDecisionPoints: DecisionPoint[]
  sharedWithCrew: boolean
}
```

## 6. Enhanced Tech Stack

### 6.1 3D Mapping Dependencies
```json
{
  "dependencies": {
    // Core
    "expo": "~50.0.0",
    "expo-router": "~3.0.0",
    "react": "18.2.0",
    "react-native": "0.73.0",

    // 3D Mapping Core
    "@rnmapbox/maps": "^10.1.0",     // Mapbox with 3D terrain
    "@mapbox/mapbox-gl-native": "^11.0.0",
    "react-native-maps": "^1.7.0",    // Fallback/hybrid

    // 3D Graphics
    "three": "^0.160.0",              // 3D rendering
    "expo-gl": "~13.0.0",             // OpenGL context
    "expo-three": "^7.0.0",           // Three.js for RN
    "@react-three/fiber": "^8.15.0",  // React Three Fiber

    // Map Data
    "mapbox-gl-js": "^3.0.0",        // Web version
    "@turf/turf": "^6.5.0",          // Geospatial analysis
    "cheap-ruler": "^3.0.0",         // Fast geo calculations

    // Maps & Location
    "expo-location": "~16.0.0",

    // Graphics & Overlays
    "@shopify/react-native-skia": "^0.1.0",
    "react-native-svg": "^14.0.0",

    // Storage & State
    "@supabase/supabase-js": "^2.38.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",

    // Payments
    "react-native-purchases": "^7.0.0",

    // Document Processing
    "expo-document-picker": "~11.0.0",
    "@react-native-ml-kit/text-recognition": "^1.0.0",

    // UI Components
    "react-native-gesture-handler": "~2.14.0",
    "react-native-reanimated": "~3.6.0",
    "react-native-safe-area-context": "4.8.0",
    "@gorhom/bottom-sheet": "^4.0.0",

    // Utilities
    "date-fns": "^3.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  }
}
```

### 6.2 3D Map Implementation

```typescript
// Core 3D Map Component
import Mapbox from '@rnmapbox/maps';

export function Map3DView() {
  return (
    <Mapbox.MapView
      styleURL="mapbox://styles/regattaflow/nautical-3d"
      projection="globe"
      terrain={{
        source: 'mapbox-dem',
        exaggeration: 2.0
      }}
      fog={{
        color: 'rgb(186, 210, 235)',
        'horizon-blend': 0.1
      }}
    >
      {/* Bathymetry Layer */}
      <Mapbox.RasterDemSource
        id="bathymetry"
        url="mapbox://regattaflow.gebco-bathymetry"
      />

      {/* NOAA Charts Overlay */}
      <Mapbox.RasterSource
        id="noaa-charts"
        tileUrlTemplates={[NOAA_TILE_URL]}
        tileSize={256}
      />

      {/* 3D Wind Visualization */}
      <CustomWindLayer />

      {/* Tidal Current Arrows */}
      <TidalFlowLayer />

      {/* Race Marks in 3D */}
      <RaceMarks3D marks={raceMarks} />
    </Mapbox.MapView>
  );
}

// onX-style Camera Controls
function CameraController() {
  const camera = useMapCamera();

  const handlePinch = (scale: number) => {
    camera.setZoom(camera.zoom * scale);
  };

  const handleRotate = (rotation: number) => {
    camera.setBearing(camera.bearing + rotation);
  };

  const handleTilt = (dy: number) => {
    camera.setPitch(clamp(camera.pitch + dy, 0, 85));
  };

  return (
    <GestureHandler
      onPinch={handlePinch}
      onRotate={handleRotate}
      onTilt={handleTilt}
    />
  );
}

// Depth-based Water Color
const waterStyle = {
  'fill-color': [
    'interpolate',
    ['linear'],
    ['get', 'depth'],
    0, '#E3F2FD',    // Shallow
    5, '#90CAF9',
    10, '#42A5F5',
    20, '#1E88E5',
    50, '#1565C0',
    100, '#0D47A1',  // Deep
    1000, '#002171'  // Abyss
  ],
  'fill-opacity': 0.8
};
```

### 6.3 Offline Map System

```typescript
// onX-style offline map downloads
interface OfflineRegion {
  id: string;
  name: string;
  bounds: BoundingBox;
  zoom: { min: number; max: number };
  layers: string[];
  size: number; // MB
  progress: number; // 0-100
}

class OfflineMapManager {
  async downloadRegion(region: OfflineRegion) {
    // Download map tiles
    await Mapbox.offlineManager.createPack({
      name: region.name,
      styleURL: 'mapbox://styles/regattaflow/nautical-3d',
      bounds: region.bounds,
      minZoom: region.zoom.min,
      maxZoom: region.zoom.max,
      metadata: {
        layers: region.layers,
        charts: await this.downloadNOAACharts(region.bounds),
        weather: await this.cacheWeatherData(region.bounds)
      }
    });
  }

  async downloadNOAACharts(bounds: BoundingBox) {
    // Cache NOAA raster charts
    const tiles = getTilesForBounds(bounds, [10, 11, 12, 13, 14]);
    return await cacheTiles(tiles);
  }
}
```

## 7. UI/UX Components (onX-Inspired)

### 7.1 Map Control Interface

```typescript
// onX-style map controls
const MapControls = () => (
  <View style={styles.controlPanel}>
    {/* Layer Toggle (onX style) */}
    <LayerButton
      icon="layers"
      onPress={toggleLayerMenu}
      badge={activeLayerCount}
    />

    {/* 3D/2D Toggle */}
    <Toggle3DButton
      is3D={is3D}
      onPress={toggle3D}
    />

    {/* Compass with tilt indicator */}
    <CompassButton
      bearing={bearing}
      pitch={pitch}
      onPress={resetNorth}
    />

    {/* GPS Center */}
    <LocationButton
      following={followingGPS}
      onPress={centerOnLocation}
    />

    {/* Offline Maps */}
    <OfflineButton
      hasOfflineMaps={hasOfflineMaps}
      onPress={openOfflineManager}
    />
  </View>
);

// Layer selection menu (onX style)
const LayerMenu = () => (
  <BottomSheet>
    <LayerGroup title="Charts">
      <LayerToggle layer="noaa" label="NOAA Charts" />
      <LayerToggle layer="openSeaMap" label="OpenSeaMap" />
    </LayerGroup>

    <LayerGroup title="Weather">
      <LayerToggle layer="wind" label="Wind Field" />
      <LayerToggle layer="current" label="Tidal Current" />
      <LayerToggle layer="waves" label="Wave Height" />
      <LayerToggle layer="pressure" label="Pressure" />
    </LayerGroup>

    <LayerGroup title="Depth">
      <LayerToggle layer="contours" label="Depth Contours" />
      <LayerToggle layer="shading" label="Depth Shading" />
      <LayerToggle layer="soundings" label="Soundings" />
    </LayerGroup>

    <LayerGroup title="Navigation">
      <LayerToggle layer="navAids" label="Nav Aids" />
      <LayerToggle layer="hazards" label="Hazards" />
      <LayerToggle layer="anchorages" label="Anchorages" />
    </LayerGroup>
  </BottomSheet>
);
```

### 7.2 3D Visualization Components

```typescript
// Wind particle system (3D)
const WindParticleSystem = () => {
  const particles = useWindParticles();

  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial
            color={particle.color}
            opacity={particle.opacity}
            transparent
          />
        </mesh>
      ))}

      <TrailRenderer particles={particles} />
    </Canvas>
  );
};

// Depth profile view (cross-section)
const DepthProfileView = ({ track }: { track: GPSTrack }) => {
  const profile = useDepthProfile(track);

  return (
    <View style={styles.profileContainer}>
      <Svg width="100%" height={200}>
        <Path
          d={profile.seaFloor}
          fill="url(#depthGradient)"
          stroke="#0066CC"
        />
        <Path
          d={profile.track}
          stroke="#FF6B35"
          strokeWidth={2}
          fill="none"
        />
        {/* Depth labels */}
        {profile.depths.map(d => (
          <Text key={d.x} x={d.x} y={d.y}>
            {d.value}m
          </Text>
        ))}
      </Svg>
    </View>
  );
};
```

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
```
□ Initialize Expo project with TypeScript
□ Set up Expo Router navigation structure
□ Configure Supabase client & auth
□ Create basic tab layout
□ Implement login/signup flows
□ Set up RevenueCat for mobile
□ Deploy web build to subdomain
□ Create shared types package
```

### Phase 2: 3D Map Core (Week 3-4)
```
□ Integrate Mapbox GL with 3D support
□ Set up terrain/bathymetry sources
□ Implement onX-style camera controls
□ Add gesture handlers (pinch/rotate/tilt)
□ Create layer management system
□ Build compass/location controls
□ Test 3D performance on devices
```

### Phase 3: Nautical Charts (Week 5)
```
□ Integrate NOAA chart tile service
□ Add OpenSeaMap as fallback
□ Implement chart opacity controls
□ Build depth contour rendering
□ Add navigation aid markers
□ Create hazard warnings layer
```

### Phase 4: Weather Visualization (Week 6-7)
```
□ Build 3D wind particle system
□ Create animated wind barbs
□ Implement tidal current arrows
□ Add wave height visualization
□ Build pressure gradient overlay
□ Create weather timeline scrubber
```

### Phase 5: Offline Maps (Week 8)
```
□ Build offline region selector
□ Implement map tile downloader
□ Create storage management UI
□ Add progress indicators
□ Cache weather data locally
□ Test offline functionality
```

### Phase 6: Race Management (Week 9-10)
```
□ Create regatta/race models
□ Build document upload flow
□ Integrate ML Kit OCR
□ Parse sailing instructions
□ Extract course configs
□ Manual override UI
□ Save to Supabase
```

### Phase 7: AI Strategy (Week 11-12)
```
□ Integrate Gemini API
□ Upload strategy knowledge base
□ Build prompt templates
□ Create recommendation UI
□ Add chat interface
□ Implement crew sharing
□ Real-time sync via Supabase
```

### Phase 8: GPS Tracking (Week 13)
```
□ Set up location permissions
□ Build countdown timer
□ Implement GPS recording
□ Create 3D track visualization
□ Add replay controls in 3D
□ Post-race analysis with depth profile
□ Export GPX files
```

### Phase 9: Polish & Deploy (Week 14-15)
```
□ Optimize 3D rendering performance
□ Add level-of-detail (LOD) system
□ Implement smooth transitions
□ Create onboarding for 3D features
□ App store 3D screenshots
□ Submit to TestFlight
□ Deploy web version
□ Launch marketing campaign
```

## 9. API Endpoints

**Next.js API Routes:**
```typescript
// /api/subscriptions/create
POST - Create Stripe subscription
Body: { priceId, userId }

// /api/subscriptions/portal
POST - Create customer portal session
Body: { customerId }

// /api/webhooks/stripe
POST - Handle Stripe webhooks
Body: Stripe event

// /api/documents/parse
POST - OCR and parse sailing instructions
Body: { documentUrl, documentType }

// /api/weather/forecast
GET - Get weather forecast
Query: { lat, lng, date }
```

**Supabase Edge Functions:**
```typescript
// sync-mobile-subscription
Sync RevenueCat purchase with Stripe

// share-strategy
Real-time strategy sharing

// analyze-race-track
Post-race AI analysis
```

## 10. Environment Variables
```bash
# Next.js (.env.local)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
GEMINI_API_KEY=
NOAA_API_KEY=
OPENWEATHER_API_KEY=

# Expo (eas.json secrets)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_REVENUECAT_API_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

## 11. Performance Optimization

### 11.1 3D Rendering Optimization
```typescript
// Level of Detail (LOD) system
const LODManager = {
  high: { // < 1km view
    particles: 1000,
    meshDetail: 'high',
    updateFrequency: 60
  },
  medium: { // 1-5km view
    particles: 500,
    meshDetail: 'medium',
    updateFrequency: 30
  },
  low: { // > 5km view
    particles: 100,
    meshDetail: 'low',
    updateFrequency: 10
  }
};

// Frustum culling for marks
const visibleMarks = marks.filter(mark =>
  camera.frustum.contains(mark.position)
);

// Texture atlasing for icons
const iconAtlas = createTextureAtlas([
  'buoy', 'lighthouse', 'mark', 'boat'
]);
```

### 11.2 Data Management
```typescript
// Tile caching strategy
const tileCache = new LRUCache<string, Tile>({
  max: 500, // tiles
  ttl: 1000 * 60 * 60 * 24, // 24 hours
  updateAgeOnGet: true
});

// Weather data chunking
const weatherGrid = new QuadTree({
  bounds: viewBounds,
  maxDepth: 8,
  dataLoader: async (node) => {
    return await fetchWeatherForBounds(node.bounds);
  }
});
```

## 12. Testing Strategy

### 12.1 3D Feature Testing
- Test on low-end devices for performance
- Verify gesture responsiveness
- Check memory usage with profiler
- Test offline map functionality
- Validate depth data accuracy
- Ensure smooth transitions between 2D/3D

### 12.2 Platform-Specific Testing
```bash
# iOS testing
- Test on iPhone 12 mini (small screen)
- Test on iPad Pro (large screen)
- Verify Metal rendering performance

# Android testing
- Test on mid-range devices
- Verify OpenGL ES 3.0 support
- Check memory management

# Web testing
- Test WebGL 2.0 performance
- Verify touch events on tablets
- Check WebAssembly support
```

## 13. Deployment Configuration

### 13.1 Build Configuration
```json
// eas.json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease",
        "env": {
          "MAPBOX_DOWNLOADS_TOKEN": "@MAPBOX_SECRET_TOKEN"
        }
      },
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle",
        "enableProguardInReleaseBuilds": true
      },
      "ios": {
        "buildConfiguration": "Release",
        "enableBitcode": false
      }
    }
  }
}
```

## 14. Design System
```typescript
// Based on watchduty.org aesthetic
const theme = {
  colors: {
    primary: '#0066CC',      // Ocean blue
    secondary: '#FF6B35',    // Safety orange
    success: '#00A651',      // Go green
    danger: '#DC3545',       // Warning red
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: {
      primary: '#212529',
      secondary: '#6C757D',
      inverse: '#FFFFFF'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700' },
    h2: { fontSize: 24, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' }
  }
}
```

## 15. Success Metrics

- **Adoption**: 1,000 active users in first 6 months
- **Retention**: 60% monthly active users
- **Revenue**: $10K MRR within first year
- **Ratings**: 4.5+ stars on app stores
- **Engagement**: 3+ races tracked per user per month

## Implementation Log

### Current Status: Foundation Complete
**Date**: 2025-01-24
**Status**: Core foundation implemented, basic app structure ready
**Completed**:
- ✅ Comprehensive planning document created
- ✅ Expo project initialized with TypeScript
- ✅ Navigation structure set up with Expo Router
- ✅ Authentication context and basic auth screens created
- ✅ 3D map foundation with interactive demo
- ✅ All four main tab screens implemented
- ✅ Type definitions for core entities

**Current Issues**:
- Metro bundler dependency conflicts due to Node.js version mismatch
- Some npm packages failed to install completely

**Project Structure Created**:
```
regattaflow-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── map.tsx
│   │   ├── regattas.tsx
│   │   ├── strategy.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── src/
│   ├── components/map/
│   │   └── Map3DView.tsx
│   ├── lib/
│   │   ├── contexts/AuthContext.tsx
│   │   └── types/ (auth.ts, map.ts)
│   └── services/supabase.ts
```

**Next Steps**:
1. Resolve Metro bundler issues
2. Install remaining dependencies
3. Test app functionality
4. Begin 3D map integration with Mapbox
5. Implement actual authentication forms

---

This comprehensive plan provides everything needed to build the RegattaFlow Expo app with advanced 3D mapping capabilities inspired by onX Maps, specifically adapted for nautical navigation and sail racing.