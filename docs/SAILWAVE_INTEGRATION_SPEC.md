# Sailwave Integration Technical Specification

**Version**: 1.0  
**Created**: December 8, 2025  
**Status**: Ready for Development  
**Priority**: P0 - Critical for European Launch

---

## Executive Summary

Sailwave is the dominant regatta scoring software in Europe, used by thousands of clubs. Rather than competing with this free, entrenched tool, RegattaFlow will integrate seamlessly with Sailwave through its .BLW file format, positioning ourselves as the "mobile and AI companion" to Sailwave.

---

## Goals

1. **Import** - Load any Sailwave series file into RegattaFlow
2. **Export** - Generate valid .BLW files from RegattaFlow data
3. **Round-trip** - Import → modify → export without data loss
4. **Sync workflow** - Support hybrid workflows (score in Sailwave, publish via RegattaFlow)

---

## BLW File Format Specification

### Overview

The .BLW format is an INI-style text file with sections and key-value pairs. It stores:
- Series configuration (scoring system, discards, etc.)
- Competitor list (sail numbers, names, clubs, ratings)
- Race results (positions, times, penalties)
- Publication settings

### File Structure

```ini
[series]
; Series metadata
sername=Club Championship 2025
serpath=C:\Sailwave\Events\ClubChamp2025
session=1
...

[event]
; Event configuration
evtname=Club Championship 2025
evtstart=01/06/2025
evtend=03/06/2025
evtvenue=Royal Yacht Club
evtorgclub=Royal Yacht Club
...

[scoring]
; Scoring system configuration
scrcode=rrs-lp
scrname=RRS Low Point 2021-2024
scrdnfvalue=n+1
scrdncvalue=n+1
scrdsqvalue=n+1
scrdnevalue=n+1
scrocs=n+1
scrzfp=20%
scrbfd=n+1
scrscp=n+1
...

[discard]
; Discard profile
discards=0,0,0,0,1,1,1,2,2,2,3,3
...

[comp]
; Competitor 1
compid=1
compsailno=GBR 1234
compclass=Laser
compfleet=1
comphelmname=John Smith
compcrewname=
compclub=Royal YC
compnat=GBR
comprating=1000
...

[comp]
; Competitor 2 (section repeats)
compid=2
compsailno=GBR 5678
...

[race]
; Race 1
raceid=1
racedate=01/06/2025
racetime=10:00
racename=Race 1
racerank=1
racestatus=sailed
racenotes=
...

[raceresult]
; Results for Race 1
rrid=1
rrrace=1
rrcompetitor=1
rrpos=1
rrelapsed=00:45:32
rrcorrected=00:42:15
rrcode=
rrpts=1.0
rrnotes=
...

[raceresult]
; Another result
rrid=2
rrrace=1
rrcompetitor=2
rrpos=2
...
```

### Key Fields Reference

#### Series Section
| Field | Description | Example |
|-------|-------------|---------|
| `sername` | Series name | "Club Championship 2025" |
| `serpath` | File path (ignored on import) | "C:\Sailwave\..." |
| `session` | Session number | 1 |

#### Event Section
| Field | Description | Example |
|-------|-------------|---------|
| `evtname` | Event name | "Club Championship 2025" |
| `evtstart` | Start date (DD/MM/YYYY) | "01/06/2025" |
| `evtend` | End date | "03/06/2025" |
| `evtvenue` | Venue name | "Royal Yacht Club" |
| `evtorgclub` | Organizing club | "Royal YC" |
| `evtclass` | Boat class | "Laser" |

#### Scoring Section
| Field | Description | Values |
|-------|-------------|--------|
| `scrcode` | Scoring system code | "rrs-lp", "rrs-hp", "rrs-bp" |
| `scrname` | Scoring system name | "RRS Low Point 2021-2024" |
| `scrdnfvalue` | DNF points | "n+1", fixed number |
| `scrdncvalue` | DNC points | "n+1", fixed number |
| `scrdsqvalue` | DSQ points | "n+1", "n+2", fixed |
| `scrdnevalue` | DNE points | "n+1", fixed |
| `scrocs` | OCS points | "n+1", fixed |
| `scrzfp` | ZFP penalty | "20%" |
| `scrbfd` | BFD points | "n+1" |
| `scrscp` | SCP penalty | "n+1" |

#### Competitor Section (repeating)
| Field | Description | Example |
|-------|-------------|---------|
| `compid` | Unique competitor ID | 1, 2, 3... |
| `compsailno` | Sail number | "GBR 1234" |
| `compclass` | Boat class | "Laser" |
| `compfleet` | Fleet/division | 1 |
| `comphelmname` | Helm name | "John Smith" |
| `compcrewname` | Crew name | "Jane Doe" |
| `compclub` | Club name | "Royal YC" |
| `compnat` | Nationality | "GBR" |
| `comprating` | Rating/handicap | 1000 |
| `compexclude` | Excluded from results | 0 or 1 |

#### Race Section (repeating)
| Field | Description | Example |
|-------|-------------|---------|
| `raceid` | Unique race ID | 1, 2, 3... |
| `racedate` | Race date | "01/06/2025" |
| `racetime` | Start time | "10:00" |
| `racename` | Race name | "Race 1" |
| `racerank` | Race order | 1 |
| `racestatus` | Status | "sailed", "abandoned", "cancelled" |
| `racenotes` | Notes | "" |
| `racewind` | Wind conditions | "NW 12-15 kts" |

#### Race Result Section (repeating)
| Field | Description | Example |
|-------|-------------|---------|
| `rrid` | Unique result ID | 1, 2, 3... |
| `rrrace` | Race ID reference | 1 |
| `rrcompetitor` | Competitor ID reference | 1 |
| `rrpos` | Finish position | 1, 2, 3... |
| `rrelapsed` | Elapsed time | "00:45:32" |
| `rrcorrected` | Corrected time | "00:42:15" |
| `rrcode` | Status code | "", "DNF", "DSQ", "OCS", etc. |
| `rrpts` | Points scored | 1.0, 2.0, etc. |
| `rrnotes` | Notes | "" |
| `rrpenalty` | Penalty code | "", "ZFP", "SCP" |
| `rrredress` | Redress given | 0 or 1 |
| `rrredresspos` | Redress position | 3 |

### Status Codes

| Code | Description | RegattaFlow Equivalent |
|------|-------------|----------------------|
| (blank) | Finished normally | `finished` |
| DNF | Did Not Finish | `DNF` |
| DNS | Did Not Start | `DNS` |
| DNC | Did Not Come | `DNC` |
| DSQ | Disqualified | `DSQ` |
| DNE | Disqualified Not Excludable | `DNE` |
| OCS | On Course Side | `OCS` |
| BFD | Black Flag Disqualification | `BFD` |
| UFD | U Flag Disqualification | `UFD` |
| ZFP | Z Flag Penalty (20%) | `ZFP` |
| SCP | Scoring Penalty | `SCP` |
| RET | Retired | `RET` |
| RAF | Retired After Finish | `RAF` |
| RDG | Redress Given | `RDG` |
| DPI | Discretionary Penalty Imposed | `DPI` |
| NSC | Did Not Sail Course | `NSC` |

---

## Implementation

### Phase 1: Parser (Week 1)

#### File: `services/sailwave/BLWParser.ts`

```typescript
/**
 * Sailwave BLW File Parser
 * 
 * Parses .BLW (INI-style) files into structured data
 */

export interface BLWSection {
  type: 'series' | 'event' | 'scoring' | 'discard' | 'comp' | 'race' | 'raceresult' | 'unknown';
  data: Record<string, string>;
}

export interface SailwaveData {
  series: SeriesConfig;
  event: EventConfig;
  scoring: ScoringConfig;
  discards: number[];
  competitors: Competitor[];
  races: Race[];
  results: RaceResult[];
  raw: BLWSection[]; // Preserve unknown sections for round-trip
}

export interface SeriesConfig {
  name: string;
  path?: string;
  session?: number;
}

export interface EventConfig {
  name: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  organizingClub: string;
  boatClass?: string;
  notes?: string;
}

export interface ScoringConfig {
  system: 'low-point' | 'high-point' | 'bonus-point' | 'custom';
  systemCode: string;
  systemName: string;
  dnfValue: string; // "n+1" or number
  dncValue: string;
  dsqValue: string;
  dneValue: string;
  ocsValue: string;
  zfpPenalty: string; // "20%"
  bfdValue: string;
  scpPenalty: string;
}

export interface Competitor {
  id: number;
  sailNumber: string;
  boatClass?: string;
  fleet?: number;
  helmName: string;
  crewName?: string;
  club?: string;
  nationality?: string;
  rating?: number;
  excluded?: boolean;
}

export interface Race {
  id: number;
  date: Date;
  time?: string;
  name: string;
  rank: number;
  status: 'sailed' | 'abandoned' | 'cancelled' | 'scheduled';
  notes?: string;
  windConditions?: string;
}

export interface RaceResult {
  id: number;
  raceId: number;
  competitorId: number;
  position?: number;
  elapsedTime?: string;
  correctedTime?: string;
  statusCode?: string;
  points: number;
  notes?: string;
  penalty?: string;
  redress?: boolean;
  redressPosition?: number;
}

export class BLWParser {
  /**
   * Parse a BLW file string into structured data
   */
  parse(content: string): SailwaveData {
    const lines = content.split(/\r?\n/);
    const sections = this.parseSections(lines);
    
    return {
      series: this.parseSeriesSection(sections),
      event: this.parseEventSection(sections),
      scoring: this.parseScoringSection(sections),
      discards: this.parseDiscardSection(sections),
      competitors: this.parseCompetitorSections(sections),
      races: this.parseRaceSections(sections),
      results: this.parseResultSections(sections),
      raw: sections.filter(s => s.type === 'unknown'),
    };
  }

  /**
   * Parse file into sections
   */
  private parseSections(lines: string[]): BLWSection[] {
    const sections: BLWSection[] = [];
    let currentSection: BLWSection | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith(';')) continue;
      
      // Section header
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        const sectionName = trimmed.slice(1, -1).toLowerCase();
        currentSection = {
          type: this.getSectionType(sectionName),
          data: {},
        };
        continue;
      }
      
      // Key=value pair
      if (currentSection) {
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex > 0) {
          const key = trimmed.slice(0, equalsIndex).toLowerCase();
          const value = trimmed.slice(equalsIndex + 1);
          currentSection.data[key] = value;
        }
      }
    }
    
    // Don't forget last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  private getSectionType(name: string): BLWSection['type'] {
    const typeMap: Record<string, BLWSection['type']> = {
      'series': 'series',
      'event': 'event',
      'scoring': 'scoring',
      'discard': 'discard',
      'comp': 'comp',
      'race': 'race',
      'raceresult': 'raceresult',
    };
    return typeMap[name] || 'unknown';
  }

  private parseSeriesSection(sections: BLWSection[]): SeriesConfig {
    const section = sections.find(s => s.type === 'series');
    if (!section) {
      return { name: 'Imported Series' };
    }
    return {
      name: section.data['sername'] || 'Imported Series',
      path: section.data['serpath'],
      session: section.data['session'] ? parseInt(section.data['session']) : undefined,
    };
  }

  private parseEventSection(sections: BLWSection[]): EventConfig {
    const section = sections.find(s => s.type === 'event');
    if (!section) {
      return {
        name: 'Imported Event',
        startDate: new Date(),
        endDate: new Date(),
        venue: '',
        organizingClub: '',
      };
    }
    return {
      name: section.data['evtname'] || 'Imported Event',
      startDate: this.parseDate(section.data['evtstart']),
      endDate: this.parseDate(section.data['evtend']),
      venue: section.data['evtvenue'] || '',
      organizingClub: section.data['evtorgclub'] || '',
      boatClass: section.data['evtclass'],
      notes: section.data['evtnotes'],
    };
  }

  private parseScoringSection(sections: BLWSection[]): ScoringConfig {
    const section = sections.find(s => s.type === 'scoring');
    if (!section) {
      return this.getDefaultScoringConfig();
    }
    
    const systemCode = section.data['scrcode'] || 'rrs-lp';
    
    return {
      system: this.mapScoringSystem(systemCode),
      systemCode,
      systemName: section.data['scrname'] || 'RRS Low Point',
      dnfValue: section.data['scrdnfvalue'] || 'n+1',
      dncValue: section.data['scrdncvalue'] || 'n+1',
      dsqValue: section.data['scrdsqvalue'] || 'n+1',
      dneValue: section.data['scrdnevalue'] || 'n+1',
      ocsValue: section.data['scrocs'] || 'n+1',
      zfpPenalty: section.data['scrzfp'] || '20%',
      bfdValue: section.data['scrbfd'] || 'n+1',
      scpPenalty: section.data['scrscp'] || 'n+1',
    };
  }

  private parseDiscardSection(sections: BLWSection[]): number[] {
    const section = sections.find(s => s.type === 'discard');
    if (!section || !section.data['discards']) {
      return [0, 0, 0, 0, 1, 1, 1, 2, 2, 2]; // Default: 1 discard after 4 races
    }
    return section.data['discards'].split(',').map(s => parseInt(s.trim()));
  }

  private parseCompetitorSections(sections: BLWSection[]): Competitor[] {
    return sections
      .filter(s => s.type === 'comp')
      .map(section => ({
        id: parseInt(section.data['compid']) || 0,
        sailNumber: section.data['compsailno'] || '',
        boatClass: section.data['compclass'],
        fleet: section.data['compfleet'] ? parseInt(section.data['compfleet']) : undefined,
        helmName: section.data['comphelmname'] || '',
        crewName: section.data['compcrewname'],
        club: section.data['compclub'],
        nationality: section.data['compnat'],
        rating: section.data['comprating'] ? parseFloat(section.data['comprating']) : undefined,
        excluded: section.data['compexclude'] === '1',
      }));
  }

  private parseRaceSections(sections: BLWSection[]): Race[] {
    return sections
      .filter(s => s.type === 'race')
      .map(section => ({
        id: parseInt(section.data['raceid']) || 0,
        date: this.parseDate(section.data['racedate']),
        time: section.data['racetime'],
        name: section.data['racename'] || `Race ${section.data['raceid']}`,
        rank: parseInt(section.data['racerank']) || 0,
        status: this.mapRaceStatus(section.data['racestatus']),
        notes: section.data['racenotes'],
        windConditions: section.data['racewind'],
      }));
  }

  private parseResultSections(sections: BLWSection[]): RaceResult[] {
    return sections
      .filter(s => s.type === 'raceresult')
      .map(section => ({
        id: parseInt(section.data['rrid']) || 0,
        raceId: parseInt(section.data['rrrace']) || 0,
        competitorId: parseInt(section.data['rrcompetitor']) || 0,
        position: section.data['rrpos'] ? parseInt(section.data['rrpos']) : undefined,
        elapsedTime: section.data['rrelapsed'],
        correctedTime: section.data['rrcorrected'],
        statusCode: section.data['rrcode'] || undefined,
        points: parseFloat(section.data['rrpts']) || 0,
        notes: section.data['rrnotes'],
        penalty: section.data['rrpenalty'],
        redress: section.data['rrredress'] === '1',
        redressPosition: section.data['rrredresspos'] ? parseInt(section.data['rrredresspos']) : undefined,
      }));
  }

  // Helper methods
  private parseDate(dateStr: string | undefined): Date {
    if (!dateStr) return new Date();
    // Handle DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dateStr);
  }

  private mapScoringSystem(code: string): ScoringConfig['system'] {
    if (code.includes('hp') || code.includes('high')) return 'high-point';
    if (code.includes('bp') || code.includes('bonus')) return 'bonus-point';
    if (code.includes('lp') || code.includes('low')) return 'low-point';
    return 'low-point';
  }

  private mapRaceStatus(status: string | undefined): Race['status'] {
    if (!status) return 'scheduled';
    const s = status.toLowerCase();
    if (s === 'sailed' || s === 'completed') return 'sailed';
    if (s === 'abandoned') return 'abandoned';
    if (s === 'cancelled') return 'cancelled';
    return 'scheduled';
  }

  private getDefaultScoringConfig(): ScoringConfig {
    return {
      system: 'low-point',
      systemCode: 'rrs-lp',
      systemName: 'RRS Low Point',
      dnfValue: 'n+1',
      dncValue: 'n+1',
      dsqValue: 'n+1',
      dneValue: 'n+1',
      ocsValue: 'n+1',
      zfpPenalty: '20%',
      bfdValue: 'n+1',
      scpPenalty: 'n+1',
    };
  }
}
```

---

### Phase 2: Generator (Week 2)

#### File: `services/sailwave/BLWGenerator.ts`

```typescript
/**
 * Sailwave BLW File Generator
 * 
 * Generates .BLW files from RegattaFlow data
 */

import { SailwaveData, Competitor, Race, RaceResult } from './BLWParser';

export class BLWGenerator {
  /**
   * Generate BLW file content from structured data
   */
  generate(data: SailwaveData): string {
    const sections: string[] = [];
    
    // Series section
    sections.push(this.generateSeriesSection(data));
    
    // Event section
    sections.push(this.generateEventSection(data));
    
    // Scoring section
    sections.push(this.generateScoringSection(data));
    
    // Discard section
    sections.push(this.generateDiscardSection(data));
    
    // Competitor sections
    for (const comp of data.competitors) {
      sections.push(this.generateCompetitorSection(comp));
    }
    
    // Race sections
    for (const race of data.races) {
      sections.push(this.generateRaceSection(race));
    }
    
    // Result sections
    for (const result of data.results) {
      sections.push(this.generateResultSection(result));
    }
    
    // Preserve unknown sections for round-trip fidelity
    for (const section of data.raw) {
      sections.push(this.generateRawSection(section));
    }
    
    return sections.join('\n\n');
  }

  private generateSeriesSection(data: SailwaveData): string {
    return `[series]
sername=${data.series.name}
serpath=${data.series.path || ''}
session=${data.series.session || 1}`;
  }

  private generateEventSection(data: SailwaveData): string {
    return `[event]
evtname=${data.event.name}
evtstart=${this.formatDate(data.event.startDate)}
evtend=${this.formatDate(data.event.endDate)}
evtvenue=${data.event.venue}
evtorgclub=${data.event.organizingClub}
evtclass=${data.event.boatClass || ''}
evtnotes=${data.event.notes || ''}`;
  }

  private generateScoringSection(data: SailwaveData): string {
    const s = data.scoring;
    return `[scoring]
scrcode=${s.systemCode}
scrname=${s.systemName}
scrdnfvalue=${s.dnfValue}
scrdncvalue=${s.dncValue}
scrdsqvalue=${s.dsqValue}
scrdnevalue=${s.dneValue}
scrocs=${s.ocsValue}
scrzfp=${s.zfpPenalty}
scrbfd=${s.bfdValue}
scrscp=${s.scpPenalty}`;
  }

  private generateDiscardSection(data: SailwaveData): string {
    return `[discard]
discards=${data.discards.join(',')}`;
  }

  private generateCompetitorSection(comp: Competitor): string {
    return `[comp]
compid=${comp.id}
compsailno=${comp.sailNumber}
compclass=${comp.boatClass || ''}
compfleet=${comp.fleet || 1}
comphelmname=${comp.helmName}
compcrewname=${comp.crewName || ''}
compclub=${comp.club || ''}
compnat=${comp.nationality || ''}
comprating=${comp.rating || ''}
compexclude=${comp.excluded ? 1 : 0}`;
  }

  private generateRaceSection(race: Race): string {
    return `[race]
raceid=${race.id}
racedate=${this.formatDate(race.date)}
racetime=${race.time || ''}
racename=${race.name}
racerank=${race.rank}
racestatus=${this.mapRaceStatusToSailwave(race.status)}
racenotes=${race.notes || ''}
racewind=${race.windConditions || ''}`;
  }

  private generateResultSection(result: RaceResult): string {
    return `[raceresult]
rrid=${result.id}
rrrace=${result.raceId}
rrcompetitor=${result.competitorId}
rrpos=${result.position || ''}
rrelapsed=${result.elapsedTime || ''}
rrcorrected=${result.correctedTime || ''}
rrcode=${result.statusCode || ''}
rrpts=${result.points}
rrnotes=${result.notes || ''}
rrpenalty=${result.penalty || ''}
rrredress=${result.redress ? 1 : 0}
rrredresspos=${result.redressPosition || ''}`;
  }

  private generateRawSection(section: { type: string; data: Record<string, string> }): string {
    const lines = [`[${section.type}]`];
    for (const [key, value] of Object.entries(section.data)) {
      lines.push(`${key}=${value}`);
    }
    return lines.join('\n');
  }

  private formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private mapRaceStatusToSailwave(status: Race['status']): string {
    const map: Record<Race['status'], string> = {
      'sailed': 'sailed',
      'abandoned': 'abandoned',
      'cancelled': 'cancelled',
      'scheduled': '',
    };
    return map[status] || '';
  }
}
```

---

### Phase 3: Service Layer (Week 2-3)

#### File: `services/sailwave/SailwaveService.ts`

```typescript
/**
 * Sailwave Integration Service
 * 
 * High-level service for importing/exporting Sailwave files
 */

import { BLWParser, SailwaveData } from './BLWParser';
import { BLWGenerator } from './BLWGenerator';
import { supabase } from '@/lib/supabase';

export interface ImportResult {
  success: boolean;
  regattaId?: string;
  warnings: string[];
  errors: string[];
  stats: {
    competitors: number;
    races: number;
    results: number;
  };
}

export interface ExportResult {
  success: boolean;
  content?: string;
  filename?: string;
  errors: string[];
}

export class SailwaveService {
  private parser: BLWParser;
  private generator: BLWGenerator;

  constructor() {
    this.parser = new BLWParser();
    this.generator = new BLWGenerator();
  }

  /**
   * Import a Sailwave .BLW file and create a regatta
   */
  async importBLW(
    file: File,
    options: {
      championshipId?: string;
      clubId?: string;
      userId: string;
    }
  ): Promise<ImportResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    try {
      // Read file content
      const content = await file.text();
      
      // Parse BLW
      const data = this.parser.parse(content);
      
      // Validate data
      const validation = this.validateImport(data);
      warnings.push(...validation.warnings);
      if (validation.errors.length > 0) {
        return {
          success: false,
          warnings,
          errors: validation.errors,
          stats: { competitors: 0, races: 0, results: 0 },
        };
      }

      // Create regatta
      const { data: regatta, error: regattaError } = await supabase
        .from('regattas')
        .insert({
          name: data.event.name,
          start_date: data.event.startDate.toISOString(),
          end_date: data.event.endDate.toISOString(),
          venue_name: data.event.venue,
          organizing_club: data.event.organizingClub,
          boat_class: data.event.boatClass,
          championship_id: options.championshipId,
          club_id: options.clubId,
          created_by: options.userId,
          scoring_config: this.mapScoringConfigToRegattaFlow(data.scoring, data.discards),
          sailwave_import: true,
          sailwave_raw: data, // Store raw data for perfect round-trip
        })
        .select()
        .single();

      if (regattaError) {
        errors.push(`Failed to create regatta: ${regattaError.message}`);
        return { success: false, warnings, errors, stats: { competitors: 0, races: 0, results: 0 } };
      }

      // Create competitors
      const competitorMap = new Map<number, string>(); // Sailwave ID -> RegattaFlow ID
      for (const comp of data.competitors) {
        const { data: entry, error: entryError } = await supabase
          .from('regatta_entries')
          .insert({
            regatta_id: regatta.id,
            sail_number: comp.sailNumber,
            boat_class: comp.boatClass,
            fleet: comp.fleet,
            helm_name: comp.helmName,
            crew_name: comp.crewName,
            club: comp.club,
            nationality: comp.nationality,
            rating: comp.rating,
            sailwave_id: comp.id,
          })
          .select()
          .single();

        if (entryError) {
          warnings.push(`Failed to import competitor ${comp.sailNumber}: ${entryError.message}`);
        } else {
          competitorMap.set(comp.id, entry.id);
        }
      }

      // Create races
      const raceMap = new Map<number, string>(); // Sailwave ID -> RegattaFlow ID
      for (const race of data.races) {
        const { data: raceRecord, error: raceError } = await supabase
          .from('regatta_races')
          .insert({
            regatta_id: regatta.id,
            race_number: race.rank,
            race_name: race.name,
            race_date: race.date.toISOString().split('T')[0],
            start_time: race.time ? `${race.date.toISOString().split('T')[0]}T${race.time}:00Z` : null,
            status: this.mapRaceStatusToRegattaFlow(race.status),
            notes: race.notes,
            sailwave_id: race.id,
          })
          .select()
          .single();

        if (raceError) {
          warnings.push(`Failed to import race ${race.name}: ${raceError.message}`);
        } else {
          raceMap.set(race.id, raceRecord.id);
        }
      }

      // Create results
      let resultsCount = 0;
      for (const result of data.results) {
        const raceId = raceMap.get(result.raceId);
        const entryId = competitorMap.get(result.competitorId);

        if (!raceId || !entryId) {
          warnings.push(`Skipping result: missing race or competitor reference`);
          continue;
        }

        const { error: resultError } = await supabase
          .from('race_results')
          .insert({
            race_id: raceId,
            entry_id: entryId,
            finish_position: result.position,
            elapsed_time: result.elapsedTime,
            corrected_time: result.correctedTime,
            score_code: result.statusCode || null,
            points: result.points,
            notes: result.notes,
            sailwave_id: result.id,
          });

        if (resultError) {
          warnings.push(`Failed to import result: ${resultError.message}`);
        } else {
          resultsCount++;
        }
      }

      return {
        success: true,
        regattaId: regatta.id,
        warnings,
        errors,
        stats: {
          competitors: competitorMap.size,
          races: raceMap.size,
          results: resultsCount,
        },
      };
    } catch (error) {
      errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, warnings, errors, stats: { competitors: 0, races: 0, results: 0 } };
    }
  }

  /**
   * Export a regatta to Sailwave .BLW format
   */
  async exportBLW(regattaId: string): Promise<ExportResult> {
    const errors: string[] = [];

    try {
      // Fetch regatta with all related data
      const { data: regatta, error: regattaError } = await supabase
        .from('regattas')
        .select(`
          *,
          regatta_entries (*),
          regatta_races (
            *,
            race_results (*)
          )
        `)
        .eq('id', regattaId)
        .single();

      if (regattaError || !regatta) {
        errors.push(`Failed to fetch regatta: ${regattaError?.message || 'Not found'}`);
        return { success: false, errors };
      }

      // If we have stored raw Sailwave data, use it as base for round-trip
      const baseData = regatta.sailwave_raw as SailwaveData | null;

      // Build SailwaveData structure
      const data: SailwaveData = {
        series: {
          name: regatta.name,
          session: 1,
        },
        event: {
          name: regatta.name,
          startDate: new Date(regatta.start_date),
          endDate: new Date(regatta.end_date),
          venue: regatta.venue_name || '',
          organizingClub: regatta.organizing_club || '',
          boatClass: regatta.boat_class,
        },
        scoring: this.mapRegattaFlowScoringToSailwave(regatta.scoring_config),
        discards: this.extractDiscards(regatta.scoring_config),
        competitors: regatta.regatta_entries.map((entry: any, index: number) => ({
          id: entry.sailwave_id || index + 1,
          sailNumber: entry.sail_number,
          boatClass: entry.boat_class,
          fleet: entry.fleet || 1,
          helmName: entry.helm_name,
          crewName: entry.crew_name,
          club: entry.club,
          nationality: entry.nationality,
          rating: entry.rating,
          excluded: false,
        })),
        races: regatta.regatta_races.map((race: any) => ({
          id: race.sailwave_id || race.race_number,
          date: new Date(race.race_date),
          time: race.start_time ? new Date(race.start_time).toTimeString().slice(0, 5) : undefined,
          name: race.race_name || `Race ${race.race_number}`,
          rank: race.race_number,
          status: this.mapRegattaFlowStatusToSailwave(race.status),
          notes: race.notes,
        })),
        results: this.flattenResults(regatta.regatta_races, regatta.regatta_entries),
        raw: baseData?.raw || [],
      };

      // Generate BLW content
      const content = this.generator.generate(data);
      const filename = `${regatta.name.replace(/[^a-z0-9]/gi, '_')}.blw`;

      return {
        success: true,
        content,
        filename,
        errors,
      };
    } catch (error) {
      errors.push(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  // Helper methods
  private validateImport(data: SailwaveData): { warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!data.event.name) {
      warnings.push('Event name is empty, using default');
    }

    if (data.competitors.length === 0) {
      warnings.push('No competitors found in file');
    }

    if (data.races.length === 0) {
      warnings.push('No races found in file');
    }

    // Check for duplicate sail numbers
    const sailNumbers = new Set<string>();
    for (const comp of data.competitors) {
      if (sailNumbers.has(comp.sailNumber)) {
        warnings.push(`Duplicate sail number: ${comp.sailNumber}`);
      }
      sailNumbers.add(comp.sailNumber);
    }

    return { warnings, errors };
  }

  private mapScoringConfigToRegattaFlow(scoring: SailwaveData['scoring'], discards: number[]): object {
    return {
      system: scoring.system,
      dnf_points: scoring.dnfValue,
      dnc_points: scoring.dncValue,
      dsq_points: scoring.dsqValue,
      dne_points: scoring.dneValue,
      ocs_points: scoring.ocsValue,
      zfp_penalty: scoring.zfpPenalty,
      bfd_points: scoring.bfdValue,
      scp_penalty: scoring.scpPenalty,
      discards: this.discardArrayToConfig(discards),
    };
  }

  private mapRegattaFlowScoringToSailwave(config: any): SailwaveData['scoring'] {
    return {
      system: config?.system || 'low-point',
      systemCode: config?.system === 'high-point' ? 'rrs-hp' : 'rrs-lp',
      systemName: config?.system === 'high-point' ? 'RRS High Point' : 'RRS Low Point 2021-2024',
      dnfValue: config?.dnf_points || 'n+1',
      dncValue: config?.dnc_points || 'n+1',
      dsqValue: config?.dsq_points || 'n+1',
      dneValue: config?.dne_points || 'n+1',
      ocsValue: config?.ocs_points || 'n+1',
      zfpPenalty: config?.zfp_penalty || '20%',
      bfdValue: config?.bfd_points || 'n+1',
      scpPenalty: config?.scp_penalty || 'n+1',
    };
  }

  private discardArrayToConfig(discards: number[]): object[] {
    const config: { after_races: number; discards: number }[] = [];
    let lastDiscard = 0;
    
    for (let i = 0; i < discards.length; i++) {
      if (discards[i] !== lastDiscard) {
        config.push({ after_races: i, discards: discards[i] });
        lastDiscard = discards[i];
      }
    }
    
    return config;
  }

  private extractDiscards(config: any): number[] {
    // Convert RegattaFlow discard config back to Sailwave array format
    const discards: number[] = [];
    const discardConfig = config?.discards || [];
    
    for (let i = 0; i < 20; i++) {
      let discardsForRace = 0;
      for (const rule of discardConfig) {
        if (i >= rule.after_races) {
          discardsForRace = rule.discards;
        }
      }
      discards.push(discardsForRace);
    }
    
    return discards;
  }

  private mapRaceStatusToRegattaFlow(status: string): string {
    const map: Record<string, string> = {
      'sailed': 'completed',
      'abandoned': 'abandoned',
      'cancelled': 'cancelled',
      'scheduled': 'scheduled',
    };
    return map[status] || 'scheduled';
  }

  private mapRegattaFlowStatusToSailwave(status: string): 'sailed' | 'abandoned' | 'cancelled' | 'scheduled' {
    const map: Record<string, 'sailed' | 'abandoned' | 'cancelled' | 'scheduled'> = {
      'completed': 'sailed',
      'abandoned': 'abandoned',
      'cancelled': 'cancelled',
      'scheduled': 'scheduled',
      'started': 'sailed',
    };
    return map[status] || 'scheduled';
  }

  private flattenResults(races: any[], entries: any[]): SailwaveData['results'] {
    const results: SailwaveData['results'] = [];
    let resultId = 1;

    const entryIdToSailwaveId = new Map<string, number>();
    entries.forEach((entry: any, index: number) => {
      entryIdToSailwaveId.set(entry.id, entry.sailwave_id || index + 1);
    });

    for (const race of races) {
      for (const result of race.race_results || []) {
        results.push({
          id: result.sailwave_id || resultId++,
          raceId: race.sailwave_id || race.race_number,
          competitorId: entryIdToSailwaveId.get(result.entry_id) || 0,
          position: result.finish_position,
          elapsedTime: result.elapsed_time,
          correctedTime: result.corrected_time,
          statusCode: result.score_code,
          points: result.points,
          notes: result.notes,
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const sailwaveService = new SailwaveService();
```

---

### Phase 4: UI Components (Week 3)

#### File: `components/sailwave/SailwaveImportModal.tsx`

```tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { sailwaveService, ImportResult } from '@/services/sailwave/SailwaveService';
import { useAuth } from '@/providers/AuthProvider';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: (regattaId: string) => void;
  championshipId?: string;
  clubId?: string;
}

export function SailwaveImportModal({ visible, onClose, onSuccess, championshipId, clubId }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      
      // Check file extension
      if (!file.name.toLowerCase().endsWith('.blw')) {
        setResult({
          success: false,
          warnings: [],
          errors: ['Please select a Sailwave .BLW file'],
          stats: { competitors: 0, races: 0, results: 0 },
        });
        return;
      }

      setSelectedFile(file.name);
      setLoading(true);
      setResult(null);

      // Fetch file content
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const fileObj = new File([blob], file.name, { type: 'text/plain' });

      // Import
      const importResult = await sailwaveService.importBLW(fileObj, {
        championshipId,
        clubId,
        userId: user!.id,
      });

      setResult(importResult);

      if (importResult.success && importResult.regattaId) {
        setTimeout(() => {
          onSuccess(importResult.regattaId!);
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Failed to import file'],
        stats: { competitors: 0, races: 0, results: 0 },
      });
    } finally {
      setLoading(false);
    }
  }, [championshipId, clubId, user, onSuccess]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Import from Sailwave</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* File picker */}
          <TouchableOpacity style={styles.dropZone} onPress={pickFile} disabled={loading}>
            <Ionicons name="cloud-upload-outline" size={48} color="#007AFF" />
            <Text style={styles.dropZoneText}>
              {selectedFile || 'Tap to select a .BLW file'}
            </Text>
            <Text style={styles.dropZoneHint}>
              Sailwave series files (.blw)
            </Text>
          </TouchableOpacity>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Importing...</Text>
            </View>
          )}

          {/* Results */}
          {result && (
            <View style={[styles.resultContainer, result.success ? styles.success : styles.error]}>
              <Ionicons 
                name={result.success ? 'checkmark-circle' : 'alert-circle'} 
                size={32} 
                color={result.success ? '#34C759' : '#FF3B30'} 
              />
              <Text style={styles.resultTitle}>
                {result.success ? 'Import Successful!' : 'Import Failed'}
              </Text>
              
              {result.success && (
                <View style={styles.stats}>
                  <Text style={styles.statText}>
                    ✓ {result.stats.competitors} competitors
                  </Text>
                  <Text style={styles.statText}>
                    ✓ {result.stats.races} races
                  </Text>
                  <Text style={styles.statText}>
                    ✓ {result.stats.results} results
                  </Text>
                </View>
              )}

              {result.warnings.length > 0 && (
                <View style={styles.warnings}>
                  <Text style={styles.warningsTitle}>Warnings:</Text>
                  {result.warnings.map((warning, i) => (
                    <Text key={i} style={styles.warningText}>• {warning}</Text>
                  ))}
                </View>
              )}

              {result.errors.length > 0 && (
                <View style={styles.errors}>
                  {result.errors.map((error, i) => (
                    <Text key={i} style={styles.errorText}>• {error}</Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Import your Sailwave series including competitors, races, and results. 
            You can export back to .BLW format anytime.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  dropZoneText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 12,
    textAlign: 'center',
  },
  dropZoneHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  resultContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  success: {
    backgroundColor: '#E8F5E9',
  },
  error: {
    backgroundColor: '#FFEBEE',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  stats: {
    marginTop: 12,
  },
  statText: {
    fontSize: 14,
    color: '#34C759',
    marginVertical: 2,
  },
  warnings: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
  warningsTitle: {
    fontWeight: '600',
    color: '#FF9500',
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
  },
  errors: {
    marginTop: 8,
    alignSelf: 'stretch',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
  },
});
```

---

## Testing Plan

### Unit Tests

```typescript
// __tests__/sailwave/BLWParser.test.ts

import { BLWParser } from '@/services/sailwave/BLWParser';

describe('BLWParser', () => {
  const parser = new BLWParser();

  it('parses series section', () => {
    const content = `[series]
sername=Test Series
sersion=1`;
    const result = parser.parse(content);
    expect(result.series.name).toBe('Test Series');
  });

  it('parses competitors', () => {
    const content = `[comp]
compid=1
compsailno=GBR 1234
comphelmname=John Smith`;
    const result = parser.parse(content);
    expect(result.competitors).toHaveLength(1);
    expect(result.competitors[0].sailNumber).toBe('GBR 1234');
  });

  it('handles European date format', () => {
    const content = `[event]
evtstart=25/12/2025`;
    const result = parser.parse(content);
    expect(result.event.startDate.getDate()).toBe(25);
    expect(result.event.startDate.getMonth()).toBe(11); // December
  });

  it('parses all status codes', () => {
    const codes = ['DNF', 'DNS', 'DNC', 'DSQ', 'DNE', 'OCS', 'BFD', 'UFD', 'ZFP', 'SCP', 'RET', 'RAF', 'RDG'];
    // Test each code...
  });
});
```

### Integration Tests

```typescript
// __tests__/sailwave/roundtrip.test.ts

import { sailwaveService } from '@/services/sailwave/SailwaveService';
import { readFileSync } from 'fs';

describe('Sailwave Round-Trip', () => {
  it('maintains data integrity through import/export cycle', async () => {
    // 1. Import test file
    const original = readFileSync('test-fixtures/sample.blw', 'utf-8');
    const importResult = await sailwaveService.importBLW(
      new File([original], 'test.blw'),
      { userId: 'test-user' }
    );
    
    expect(importResult.success).toBe(true);
    
    // 2. Export back
    const exportResult = await sailwaveService.exportBLW(importResult.regattaId!);
    expect(exportResult.success).toBe(true);
    
    // 3. Re-import and compare
    const reimportResult = await sailwaveService.importBLW(
      new File([exportResult.content!], 'test.blw'),
      { userId: 'test-user' }
    );
    
    expect(reimportResult.stats.competitors).toBe(importResult.stats.competitors);
    expect(reimportResult.stats.races).toBe(importResult.stats.races);
    expect(reimportResult.stats.results).toBe(importResult.stats.results);
  });
});
```

---

## Test Files

Sample .BLW files for testing should be collected from:
1. Sailwave website downloads
2. Real club files (with permission)
3. Generated test fixtures

Place in: `test-fixtures/sailwave/`

---

## Success Criteria

- [ ] Import 95%+ of real-world Sailwave files without errors
- [ ] Export generates valid files that Sailwave can open
- [ ] Round-trip (import → export → import) maintains all data
- [ ] UI provides clear feedback on import progress/errors
- [ ] Performance: Import 200-competitor file in <5 seconds

---

## Future Enhancements

1. **Real-time sync** - Watch for Sailwave file changes, auto-import
2. **Conflict resolution** - Handle edits in both systems
3. **Rating system support** - Import IRC, ORC, PHRF ratings
4. **Publication templates** - Export with Sailwave publication styles

---

**Document Owner**: Engineering Team  
**Review Date**: After Phase 4 completion

