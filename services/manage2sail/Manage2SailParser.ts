/**
 * Manage2Sail CSV Parser
 * 
 * Parses entry lists and results exported from Manage2Sail.
 * Used primarily in Nordic countries for Dragon Class events.
 */

// ============================================================================
// Types
// ============================================================================

export interface Manage2SailEntry {
  sailNumber: string;
  boatName?: string;
  helmName: string;
  crewNames: string[];
  club?: string;
  country?: string;
  className?: string;
  entryStatus: 'confirmed' | 'pending' | 'cancelled';
  entryDate?: string;
  paymentStatus?: 'paid' | 'pending' | 'exempt';
  email?: string;
  phone?: string;
}

export interface Manage2SailResult {
  sailNumber: string;
  position: number;
  points: number;
  elapsedTime?: string;
  correctedTime?: string;
  finishCode?: string;
}

export interface Manage2SailRaceResult {
  raceNumber: number;
  raceDate?: string;
  windSpeed?: number;
  windDirection?: number;
  results: Manage2SailResult[];
}

export interface Manage2SailImportResult {
  success: boolean;
  entries?: Manage2SailEntry[];
  results?: Manage2SailRaceResult[];
  errors?: string[];
  warnings?: string[];
  type: 'entries' | 'results' | 'unknown';
}

// ============================================================================
// Parser
// ============================================================================

export class Manage2SailParser {
  /**
   * Parse Manage2Sail CSV content
   * Auto-detects whether it's an entry list or results
   */
  parse(csvContent: string): Manage2SailImportResult {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        return {
          success: false,
          errors: ['CSV file is empty or has no data rows'],
          type: 'unknown',
        };
      }

      // Parse headers
      const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

      // Detect type based on headers
      const isEntryList = headers.some(h => 
        h.includes('helm') || h.includes('skipper') || h.includes('crew')
      );
      const isResults = headers.some(h => 
        h.includes('position') || h.includes('place') || h.includes('points')
      );

      if (isEntryList) {
        return this.parseEntries(lines, headers);
      } else if (isResults) {
        return this.parseResults(lines, headers);
      } else {
        return {
          success: false,
          errors: ['Could not determine CSV type. Expected entry list or results.'],
          type: 'unknown',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        errors: [`Parse error: ${error.message}`],
        type: 'unknown',
      };
    }
  }

  /**
   * Parse entry list CSV
   */
  private parseEntries(lines: string[], headers: string[]): Manage2SailImportResult {
    const entries: Manage2SailEntry[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Find column indices
    const cols = {
      sailNumber: this.findColumn(headers, ['sail', 'sail number', 'sailno', 'sail no']),
      boatName: this.findColumn(headers, ['boat', 'boat name', 'yacht', 'yacht name']),
      helmName: this.findColumn(headers, ['helm', 'helmsman', 'skipper', 'captain']),
      crew: this.findColumn(headers, ['crew', 'crew names', 'crew members']),
      club: this.findColumn(headers, ['club', 'yacht club', 'sailing club']),
      country: this.findColumn(headers, ['country', 'nation', 'nat', 'nationality']),
      className: this.findColumn(headers, ['class', 'boat class', 'division']),
      status: this.findColumn(headers, ['status', 'entry status']),
      payment: this.findColumn(headers, ['payment', 'paid', 'payment status']),
      email: this.findColumn(headers, ['email', 'e-mail', 'mail']),
      phone: this.findColumn(headers, ['phone', 'telephone', 'mobile']),
    };

    if (cols.sailNumber === -1) {
      return {
        success: false,
        errors: ['Could not find sail number column'],
        type: 'entries',
      };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;

      try {
        const sailNumber = values[cols.sailNumber]?.trim();
        if (!sailNumber) {
          warnings.push(`Row ${i + 1}: Missing sail number, skipped`);
          continue;
        }

        const entry: Manage2SailEntry = {
          sailNumber,
          boatName: cols.boatName !== -1 ? values[cols.boatName]?.trim() : undefined,
          helmName: cols.helmName !== -1 ? values[cols.helmName]?.trim() || 'Unknown' : 'Unknown',
          crewNames: cols.crew !== -1 
            ? this.parseCrewNames(values[cols.crew]) 
            : [],
          club: cols.club !== -1 ? values[cols.club]?.trim() : undefined,
          country: cols.country !== -1 ? values[cols.country]?.trim() : undefined,
          className: cols.className !== -1 ? values[cols.className]?.trim() : undefined,
          entryStatus: cols.status !== -1 
            ? this.parseEntryStatus(values[cols.status]) 
            : 'confirmed',
          paymentStatus: cols.payment !== -1 
            ? this.parsePaymentStatus(values[cols.payment]) 
            : undefined,
          email: cols.email !== -1 ? values[cols.email]?.trim() : undefined,
          phone: cols.phone !== -1 ? values[cols.phone]?.trim() : undefined,
        };

        entries.push(entry);
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return {
      success: entries.length > 0,
      entries,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      type: 'entries',
    };
  }

  /**
   * Parse results CSV
   */
  private parseResults(lines: string[], headers: string[]): Manage2SailImportResult {
    const races: Map<number, Manage2SailRaceResult> = new Map();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Find column indices
    const cols = {
      sailNumber: this.findColumn(headers, ['sail', 'sail number', 'sailno']),
      position: this.findColumn(headers, ['position', 'place', 'pos', 'rank']),
      points: this.findColumn(headers, ['points', 'pts', 'score']),
      raceNumber: this.findColumn(headers, ['race', 'race number', 'race no', 'r']),
      elapsed: this.findColumn(headers, ['elapsed', 'elapsed time', 'time']),
      corrected: this.findColumn(headers, ['corrected', 'corrected time']),
      code: this.findColumn(headers, ['code', 'finish code', 'status']),
    };

    if (cols.sailNumber === -1 || cols.position === -1) {
      return {
        success: false,
        errors: ['Could not find required columns (sail number, position)'],
        type: 'results',
      };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;

      try {
        const sailNumber = values[cols.sailNumber]?.trim();
        if (!sailNumber) continue;

        const raceNumber = cols.raceNumber !== -1 
          ? parseInt(values[cols.raceNumber]) || 1 
          : 1;

        // Get or create race
        if (!races.has(raceNumber)) {
          races.set(raceNumber, {
            raceNumber,
            results: [],
          });
        }

        const result: Manage2SailResult = {
          sailNumber,
          position: parseInt(values[cols.position]) || 0,
          points: cols.points !== -1 
            ? parseFloat(values[cols.points]) || 0 
            : parseInt(values[cols.position]) || 0,
          elapsedTime: cols.elapsed !== -1 ? values[cols.elapsed]?.trim() : undefined,
          correctedTime: cols.corrected !== -1 ? values[cols.corrected]?.trim() : undefined,
          finishCode: cols.code !== -1 ? values[cols.code]?.trim().toUpperCase() : undefined,
        };

        races.get(raceNumber)!.results.push(result);
      } catch (e: any) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    // Sort results by position
    races.forEach(race => {
      race.results.sort((a, b) => a.position - b.position);
    });

    const raceResults = Array.from(races.values()).sort((a, b) => a.raceNumber - b.raceNumber);

    return {
      success: raceResults.length > 0,
      results: raceResults,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      type: 'results',
    };
  }

  /**
   * Generate CSV for Manage2Sail results import
   */
  generateResultsCSV(races: Manage2SailRaceResult[]): string {
    const headers = ['Race', 'Sail Number', 'Position', 'Points', 'Elapsed Time', 'Code'];
    const rows = races.flatMap(race =>
      race.results.map(r => [
        race.raceNumber.toString(),
        r.sailNumber,
        r.position.toString(),
        r.points.toString(),
        r.elapsedTime || '',
        r.finishCode || '',
      ].join(','))
    );
    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Generate CSV for entry list
   */
  generateEntriesCSV(entries: Manage2SailEntry[]): string {
    const headers = ['Sail Number', 'Boat Name', 'Helm', 'Crew', 'Club', 'Country', 'Class', 'Status'];
    const rows = entries.map(e => [
      e.sailNumber,
      e.boatName || '',
      e.helmName,
      e.crewNames.join('; '),
      e.club || '',
      e.country || '',
      e.className || '',
      e.entryStatus,
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Parse CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }

  /**
   * Find column index by possible header names
   */
  private findColumn(headers: string[], names: string[]): number {
    for (const name of names) {
      const idx = headers.findIndex(h => h.includes(name));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  /**
   * Parse crew names from various formats
   */
  private parseCrewNames(value: string | undefined): string[] {
    if (!value) return [];
    
    // Try semicolon, then slash, then comma
    const separators = [';', '/', ','];
    for (const sep of separators) {
      if (value.includes(sep)) {
        return value.split(sep).map(n => n.trim()).filter(n => n);
      }
    }
    
    // Single name
    return value.trim() ? [value.trim()] : [];
  }

  /**
   * Parse entry status
   */
  private parseEntryStatus(value: string | undefined): Manage2SailEntry['entryStatus'] {
    const v = value?.toLowerCase().trim() || '';
    if (v.includes('cancel')) return 'cancelled';
    if (v.includes('pend') || v.includes('wait')) return 'pending';
    return 'confirmed';
  }

  /**
   * Parse payment status
   */
  private parsePaymentStatus(value: string | undefined): Manage2SailEntry['paymentStatus'] {
    const v = value?.toLowerCase().trim() || '';
    if (v.includes('paid') || v === 'yes' || v === 'y') return 'paid';
    if (v.includes('exempt') || v.includes('free')) return 'exempt';
    return 'pending';
  }
}

export default Manage2SailParser;

