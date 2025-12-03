# Weather Dashboard Implementation

## Overview

The Weather Dashboard provides live conditions tracking for race management, including wind data, trends, shift detection, and weather alerts.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WEATHER DASHBOARD                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │  Wind Rose    │    │   Trends &   │    │    Weather      │  │
│  │   Display     │    │   History    │    │    Alerts       │  │
│  └───────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   WeatherService                           │  │
│  │  • Record weather readings                                 │  │
│  │  • Calculate wind statistics                               │  │
│  │  • Detect wind shifts                                      │  │
│  │  • Check alert thresholds                                  │  │
│  │  • Auto-log to Committee Boat Log                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Database Layer                          │  │
│  │                                                            │  │
│  │  weather_stations        weather_readings                  │  │
│  │  ├── name                ├── wind_direction_degrees        │  │
│  │  ├── station_type        ├── wind_speed_knots              │  │
│  │  └── location            ├── wind_gust_knots               │  │
│  │                          ├── temperature_celsius            │  │
│  │  weather_alerts          └── recorded_at                   │  │
│  │  ├── alert_type                                            │  │
│  │  ├── threshold_value     weather_alert_events              │  │
│  │  └── severity            ├── message                       │  │
│  │                          └── triggered_at                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### ✅ Implemented

1. **Wind Display**
   - Wind rose with direction arrow
   - Direction in degrees and cardinal
   - Speed in knots
   - Gust display
   - Beaufort scale indicator

2. **Statistics**
   - Average direction (circular mean)
   - Direction standard deviation (oscillation)
   - Min/max/avg wind speed
   - Rolling statistics (10-minute window)

3. **Wind Shift Detection**
   - Automatic shift detection
   - Veer/back indication
   - Previous vs. current direction
   - Configurable threshold

4. **Weather Alerts**
   - High wind warning
   - Low wind warning
   - Strong gusts
   - Major wind shifts
   - Poor visibility
   - Auto-acknowledge

5. **History & Trends**
   - Hourly wind history
   - Visual trend chart
   - Time-bucketed averages

6. **Additional Conditions**
   - Temperature
   - Humidity
   - Visibility
   - Wave height

7. **Manual Recording**
   - Quick direction buttons
   - Notes field
   - Auto-log to Committee Boat Log

8. **Compact Mode**
   - Inline display for headers
   - Essential wind data
   - Alert indicator

## Database Schema

### weather_stations
```sql
CREATE TABLE weather_stations (
    id UUID PRIMARY KEY,
    club_id UUID REFERENCES clubs(id),
    name TEXT NOT NULL,
    station_type TEXT, -- 'manual', 'boat_mounted', 'shore_station', 'buoy', 'api'
    location_name TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    api_provider TEXT,
    api_station_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_reading_at TIMESTAMPTZ
);
```

### weather_readings
```sql
CREATE TABLE weather_readings (
    id UUID PRIMARY KEY,
    regatta_id UUID REFERENCES regattas(id),
    station_id UUID REFERENCES weather_stations(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    
    -- Wind
    wind_direction_degrees INTEGER,
    wind_speed_knots DECIMAL(5, 2),
    wind_gust_knots DECIMAL(5, 2),
    
    -- Statistics
    wind_direction_avg INTEGER,
    wind_direction_std DECIMAL(5, 2),
    wind_speed_avg DECIMAL(5, 2),
    wind_speed_min DECIMAL(5, 2),
    wind_speed_max DECIMAL(5, 2),
    
    -- Atmospheric
    temperature_celsius DECIMAL(4, 1),
    humidity_percent INTEGER,
    pressure_hpa DECIMAL(6, 1),
    
    -- Sea state
    wave_height_meters DECIMAL(4, 2),
    visibility_nm DECIMAL(5, 2),
    
    source TEXT, -- 'manual', 'sensor', 'api'
    recorded_by UUID,
    notes TEXT
);
```

### weather_alerts
```sql
CREATE TABLE weather_alerts (
    id UUID PRIMARY KEY,
    club_id UUID REFERENCES clubs(id),
    name TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- 'high_wind', 'low_wind', 'wind_shift', etc.
    threshold_value DECIMAL(10, 2),
    threshold_unit TEXT,
    comparison TEXT, -- 'gt', 'gte', 'lt', 'lte', 'change'
    shift_degrees INTEGER,
    shift_minutes INTEGER,
    severity TEXT DEFAULT 'warning', -- 'info', 'warning', 'critical'
    auto_log BOOLEAN DEFAULT TRUE,
    sound_alert BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);
```

## Service API

### WeatherService

```typescript
// Readings
recordReading(input): Promise<WeatherReading>
getLatestWeather(regattaId): Promise<LatestWeather>
getReadings(regattaId, limit?): Promise<WeatherReading[]>
getWindHistory(regattaId): Promise<WindHistoryPoint[]>

// Statistics
getWindStats(regattaId, minutes?): Promise<WindStats>
detectWindShift(regattaId, threshold?, minutes?): Promise<WindShift>
calculateTrueWind(apparent, speed, boatSpeed, heading): { trueDirection, trueSpeed }

// Alerts
getAlerts(clubId?): Promise<WeatherAlert[]>
getAlertEvents(regattaId, unacknowledgedOnly?): Promise<AlertEvent[]>
acknowledgeAlert(alertEventId): Promise<void>

// Stations
getStations(clubId?): Promise<WeatherStation[]>
createStation(station): Promise<WeatherStation>

// Helpers
getDirectionName(degrees): string -- 16-point compass
getShortDirectionName(degrees): string -- 8-point compass
formatWind(direction, speed, gust?): string
getBeaufortScale(speedKnots): { force, description, seaState }
getSeverityColor(severity): { color, bg }
calculateCourseAngles(windDirection): { beat, run, reach angles }
```

## UI Components

### WeatherDashboard (`components/weather/WeatherDashboard.tsx`)

**Full Mode**
- Wind rose with direction arrow
- Speed/gust display
- Beaufort scale badge
- Wind shift indicator
- Statistics row
- Conditions grid
- History chart
- Add reading button

**Compact Mode**
- Inline wind display
- Shift indicator
- Alert badge

## Default Alerts

| Alert | Type | Threshold | Severity |
|-------|------|-----------|----------|
| High Wind Warning | high_wind | ≥25 kts | warning |
| High Wind Critical | high_wind | ≥35 kts | critical |
| Low Wind | low_wind | ≤5 kts | info |
| Strong Gusts | gusts | ≥30 kts | warning |
| Major Wind Shift | wind_shift | ≥30° | warning |
| Poor Visibility | visibility | ≤1 nm | warning |

## Wind Statistics

### Circular Mean (for direction)
```
avg_direction = atan2(
    mean(sin(radians(direction))),
    mean(cos(radians(direction)))
) × 180 / π
```

### Circular Standard Deviation
```
direction_std = sqrt(-2 × ln(R)) × 180 / π

where R = sqrt(mean(sin)² + mean(cos)²)
```

## Wind Shift Detection

```
shift_amount = current_direction - previous_direction

Direction of shift:
- Positive = Veered (clockwise)
- Negative = Backed (counter-clockwise)
```

## Beaufort Scale Reference

| Force | Wind (kts) | Description | Sea State |
|-------|------------|-------------|-----------|
| 0 | 0-1 | Calm | Flat |
| 1 | 1-3 | Light air | Ripples |
| 2 | 4-6 | Light breeze | Small wavelets |
| 3 | 7-10 | Gentle breeze | Large wavelets |
| 4 | 11-16 | Moderate breeze | Small waves |
| 5 | 17-21 | Fresh breeze | Moderate waves |
| 6 | 22-27 | Strong breeze | Large waves |
| 7 | 28-33 | Near gale | Sea heaps up |
| 8 | 34-40 | Gale | Moderately high waves |

## Usage Examples

### Record Weather

```typescript
import { weatherService } from '@/services/WeatherService';

await weatherService.recordReading({
  regatta_id: regattaId,
  wind_direction_degrees: 225,
  wind_speed_knots: 12.5,
  wind_gust_knots: 18,
  temperature_celsius: 22,
  notes: 'Sea breeze building',
});
```

### Check for Wind Shift

```typescript
const shift = await weatherService.detectWindShift(
  regattaId,
  15,  // threshold degrees
  10   // minutes to compare
);

if (shift?.shift_detected) {
  console.log(`Wind ${shift.shift_direction} ${shift.shift_amount}°`);
  // "Wind veered 20°"
}
```

### Get Statistics

```typescript
const stats = await weatherService.getWindStats(regattaId, 10);
console.log(`Avg: ${stats.avg_speed} kts from ${stats.avg_direction}°`);
console.log(`Oscillation: ±${stats.direction_std}°`);
```

### Embed in Race Console

```tsx
import { WeatherDashboard } from '@/components/weather/WeatherDashboard';

// Compact mode in header
<WeatherDashboard regattaId={regattaId} compact />

// Full dashboard
<WeatherDashboard 
  regattaId={regattaId}
  onAlertTrigger={(alert) => {
    // Play sound, show notification
  }}
/>
```

## Committee Log Integration

Manual weather recordings are automatically logged:

```
[10:30:45] WEATHER
Weather: SW 12kts
Wind: 225° (SW) at 12 knots, gusts to 18 knots. Sea breeze building.
Logged by: Race Officer
```

## File Structure

```
components/
└── weather/
    └── WeatherDashboard.tsx   # Main dashboard component

services/
└── WeatherService.ts          # Weather operations

migrations/
└── 20251202_weather_dashboard.sql
```

## Future Enhancements

- [ ] Integration with weather APIs (OpenWeather, etc.)
- [ ] Boat-mounted sensor support
- [ ] True wind calculation from apparent
- [ ] Weather forecast display
- [ ] Historical weather analysis
- [ ] Course recommendation based on wind
- [ ] Push notifications for alerts
- [ ] Weather map overlay

