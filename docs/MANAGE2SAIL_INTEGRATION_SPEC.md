# Manage2Sail Integration Specification

## Overview

Manage2Sail is the leading regatta registration and management platform in Europe, particularly dominant in Nordic countries (Finland, Sweden, Denmark, Norway). This document outlines the integration strategy for RegattaFlow to work alongside Manage2Sail.

## Market Analysis

### Manage2Sail Market Presence
- **Primary Markets**: Nordic countries, Germany, Netherlands
- **Key Features**: Online registration, entry management, NoR publishing
- **User Base**: 1000+ clubs, 50,000+ regattas annually
- **Dragon Class Usage**: Common for Nordic Dragon Class events

### Integration Rationale
Rather than competing directly, RegattaFlow should complement Manage2Sail by:
1. Importing entry data from Manage2Sail events
2. Providing AI-powered race strategy (Manage2Sail doesn't offer this)
3. Offering real-time on-water features (GPS tracking, tactical analysis)
4. Exporting results back to Manage2Sail

## Technical Integration

### 1. Entry Import (Manage2Sail → RegattaFlow)

#### Data Available via Manage2Sail
```typescript
interface Manage2SailEntry {
  eventId: string;
  boatName: string;
  sailNumber: string;
  className: string;
  helmName: string;
  crewNames: string[];
  club: string;
  country: string; // ISO country code
  entryStatus: 'confirmed' | 'pending' | 'cancelled';
  entryDate: string; // ISO date
  paymentStatus: 'paid' | 'pending' | 'exempt';
}

interface Manage2SailEvent {
  eventId: string;
  eventName: string;
  venueName: string;
  venueCoordinates?: {
    lat: number;
    lng: number;
  };
  startDate: string;
  endDate: string;
  classes: string[];
  entries: Manage2SailEntry[];
  noRUrl?: string; // Notice of Race PDF
  siUrl?: string;  // Sailing Instructions PDF
}
```

#### Import Methods

**Option A: Manual CSV/Excel Export**
- User exports entries from Manage2Sail
- RegattaFlow parses and imports

**Option B: API Integration (Requires Partnership)**
- Direct API access to event data
- Real-time sync of entries

**Option C: Web Scraping (Fallback)**
- Parse public event pages
- Limited to public data only

### 2. Results Export (RegattaFlow → Manage2Sail)

#### Export Format
```typescript
interface Manage2SailResult {
  sailNumber: string;
  position: number;
  points: number;
  elapsedTime?: string; // HH:MM:SS
  correctedTime?: string;
  finishCode?: 'DNF' | 'DNS' | 'DSQ' | 'OCS' | 'BFD' | 'RET';
}

interface Manage2SailRaceResult {
  raceNumber: number;
  raceDate: string;
  windSpeed?: number;
  windDirection?: number;
  results: Manage2SailResult[];
}
```

### 3. Implementation Plan

#### Phase 1: Manual Import/Export (MVP)
```typescript
// services/manage2sail/Manage2SailParser.ts
export class Manage2SailParser {
  /**
   * Parse Manage2Sail CSV export
   */
  parseCSV(csvContent: string): Manage2SailEntry[] {
    // CSV columns: Sail Number, Boat Name, Helm, Crew, Club, Country, Status
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        sailNumber: values[0]?.trim(),
        boatName: values[1]?.trim(),
        helmName: values[2]?.trim(),
        crewNames: values[3]?.split(';').map(c => c.trim()),
        club: values[4]?.trim(),
        country: values[5]?.trim(),
        entryStatus: 'confirmed',
      } as Manage2SailEntry;
    });
  }

  /**
   * Generate CSV for Manage2Sail results import
   */
  generateResultsCSV(results: Manage2SailRaceResult[]): string {
    const headers = ['Race', 'Sail Number', 'Position', 'Points', 'Elapsed', 'Code'];
    const rows = results.flatMap(race => 
      race.results.map(r => [
        race.raceNumber,
        r.sailNumber,
        r.position,
        r.points,
        r.elapsedTime || '',
        r.finishCode || '',
      ].join(','))
    );
    return [headers.join(','), ...rows].join('\n');
  }
}
```

#### Phase 2: Deep Integration (Partnership Required)
- OAuth authentication with Manage2Sail
- Real-time entry sync
- Automatic results publishing
- Event discovery and registration

## UI Components

### Import Modal
```typescript
// components/manage2sail/Manage2SailImportModal.tsx
interface Manage2SailImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: (entries: RegattaFlowEntry[]) => void;
  raceId: string;
}
```

### Export Button
```typescript
// In race results screen
<Button
  icon="cloud-upload"
  onPress={() => exportToManage2Sail(raceResults)}
>
  Export to Manage2Sail
</Button>
```

## Dragon Class Specific Integration

### Finnish Dragon Association Events
- Finnish Dragon Championship (annual)
- Helsinki Dragon Gold Cup (hosted 2018)
- Hanko Regatta Dragon class

### Data Mapping
```typescript
// Dragon Class specific fields
interface DragonClassEntry extends Manage2SailEntry {
  className: 'Dragon';
  measurementCertificate?: string;
  sailmaker?: string;
  boatBuilder?: 'Petticrows' | 'Borresen' | 'Markus' | string;
  boatYear?: number;
}
```

## API Endpoints (Future)

### If Manage2Sail Partnership Achieved

```typescript
// Hypothetical API client
class Manage2SailClient {
  private apiKey: string;
  private baseUrl = 'https://api.manage2sail.com/v1';

  async getEvent(eventId: string): Promise<Manage2SailEvent> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }

  async getEntries(eventId: string): Promise<Manage2SailEntry[]> {
    const response = await fetch(`${this.baseUrl}/events/${eventId}/entries`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }

  async publishResults(eventId: string, results: Manage2SailRaceResult[]): Promise<void> {
    await fetch(`${this.baseUrl}/events/${eventId}/results`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(results)
    });
  }
}
```

## Competitive Positioning

### RegattaFlow Advantages Over Manage2Sail
| Feature | RegattaFlow | Manage2Sail |
|---------|-------------|-------------|
| AI Race Strategy | ✅ Yes | ❌ No |
| Real-time GPS Tracking | ✅ Yes | ❌ No |
| 3D Bathymetry | ✅ Yes | ❌ No |
| Weather Intelligence | ✅ Yes | ⚠️ Basic |
| Mobile App | ✅ Native iOS/Android | ⚠️ Web only |
| Post-Race AI Coaching | ✅ Yes | ❌ No |
| Offline Mode | ✅ Yes | ❌ No |

### Recommended Messaging
> "Use Manage2Sail for registration, use RegattaFlow for winning."

## Implementation Timeline

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| 1 | Week 1-2 | CSV import/export |
| 2 | Week 3-4 | UI components |
| 3 | Month 2 | Partnership outreach |
| 4 | Month 3+ | API integration (if partnership) |

## Partnership Outreach

### Contact
- **Company**: Manage2Sail ApS
- **Location**: Denmark
- **Website**: manage2sail.com

### Pitch Points
1. Complementary, not competitive
2. Expand M2S value with AI features
3. Joint marketing to Dragon Class
4. Revenue share on premium features

## Success Metrics

- Import success rate > 95%
- Export accuracy 100%
- User satisfaction > 4.5/5
- Partnership achieved within 6 months

