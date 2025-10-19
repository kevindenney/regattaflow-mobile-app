/**
 * Validation Utilities
 *
 * Functions for validating race course data extracted from sailing documents.
 */

import type { Mark, CourseLeg, CourseType } from './course-generation';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MarkValidationResult extends ValidationResult {
  mark?: Mark;
}

export interface CourseValidationResult extends ValidationResult {
  course?: {
    marks: Mark[];
    legs?: CourseLeg[];
    type?: CourseType;
  };
}

/**
 * Validates a single race mark
 *
 * Checks required fields, coordinate validity, and data quality.
 *
 * @param mark - Mark data to validate
 * @param strict - If true, warnings become errors
 * @returns Validation result with errors and warnings
 *
 * @example
 * const result = validateMark({
 *   name: 'Windward Mark',
 *   latitude: 22.285,
 *   longitude: 114.165,
 *   type: 'mark'
 * });
 * if (!result.valid) console.error(result.errors);
 */
export function validateMark(
  mark: Partial<Mark>,
  strict: boolean = false
): MarkValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field validation
  if (!mark.name || mark.name.trim().length === 0) {
    errors.push('Mark name is required');
  } else if (mark.name.length > 100) {
    warnings.push('Mark name is unusually long (>100 characters)');
  }

  if (mark.latitude === undefined || mark.latitude === null) {
    errors.push('Latitude is required');
  } else {
    // Coordinate range validation
    if (mark.latitude < -90 || mark.latitude > 90) {
      errors.push(`Latitude out of range (-90 to 90): ${mark.latitude}`);
    }

    // Precision check (more than 6 decimal places is excessive)
    const latStr = mark.latitude.toString();
    if (latStr.includes('.')) {
      const decimals = latStr.split('.')[1].length;
      if (decimals > 8) {
        warnings.push(`Latitude has excessive precision (${decimals} decimals)`);
      }
    }
  }

  if (mark.longitude === undefined || mark.longitude === null) {
    errors.push('Longitude is required');
  } else {
    if (mark.longitude < -180 || mark.longitude > 180) {
      errors.push(`Longitude out of range (-180 to 180): ${mark.longitude}`);
    }

    const lngStr = mark.longitude.toString();
    if (lngStr.includes('.')) {
      const decimals = lngStr.split('.')[1].length;
      if (decimals > 8) {
        warnings.push(`Longitude has excessive precision (${decimals} decimals)`);
      }
    }
  }

  if (!mark.type) {
    errors.push('Mark type is required');
  } else {
    const validTypes = [
      'start-line',
      'finish-line',
      'start-finish',
      'mark',
      'gate',
      'offset',
      'committee-boat',
      'pin',
    ];

    if (!validTypes.includes(mark.type)) {
      warnings.push(
        `Unknown mark type: ${mark.type}. Valid types: ${validTypes.join(', ')}`
      );
    }
  }

  // Rounding direction validation
  if (mark.rounding) {
    const validRounding = ['port', 'starboard', 'either'];
    if (!validRounding.includes(mark.rounding)) {
      warnings.push(
        `Unknown rounding direction: ${mark.rounding}. Valid: ${validRounding.join(', ')}`
      );
    }
  }

  // Data quality warnings
  if (mark.latitude === 0 && mark.longitude === 0) {
    warnings.push('Coordinates are (0,0) - likely a default/placeholder value');
  }

  if (
    mark.name &&
    (mark.name.toLowerCase().includes('todo') ||
      mark.name.toLowerCase().includes('tbd') ||
      mark.name.toLowerCase().includes('tba'))
  ) {
    warnings.push('Mark name suggests incomplete data (contains TODO/TBD/TBA)');
  }

  // Convert warnings to errors in strict mode
  const finalErrors = strict ? [...errors, ...warnings] : errors;

  return {
    valid: finalErrors.length === 0,
    errors: finalErrors,
    warnings: strict ? [] : warnings,
    mark: mark as Mark,
  };
}

/**
 * Validates an array of race marks
 *
 * Checks for duplicate names, coordinate collisions, and course coherence.
 *
 * @param marks - Array of marks to validate
 * @param strict - If true, warnings become errors
 * @returns Validation result
 *
 * @example
 * const result = validateMarks(extractedMarks);
 * if (!result.valid) {
 *   result.errors.forEach(e => console.error(e));
 * }
 */
export function validateMarks(
  marks: Partial<Mark>[],
  strict: boolean = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Empty array check
  if (!marks || marks.length === 0) {
    errors.push('No marks provided - course must have at least 2 marks');
    return { valid: false, errors, warnings };
  }

  // Minimum mark count
  if (marks.length < 2) {
    errors.push('Course must have at least 2 marks (start and finish minimum)');
  }

  // Validate each mark individually
  marks.forEach((mark, index) => {
    const result = validateMark(mark, false);
    if (!result.valid) {
      errors.push(`Mark ${index} (${mark.name || 'unnamed'}): ${result.errors.join(', ')}`);
    }
    if (result.warnings.length > 0) {
      warnings.push(`Mark ${index} (${mark.name || 'unnamed'}): ${result.warnings.join(', ')}`);
    }
  });

  // Check for duplicate names
  const nameCount = new Map<string, number>();
  marks.forEach(mark => {
    if (mark.name) {
      const count = nameCount.get(mark.name) || 0;
      nameCount.set(mark.name, count + 1);
    }
  });

  nameCount.forEach((count, name) => {
    if (count > 1) {
      warnings.push(`Duplicate mark name: "${name}" appears ${count} times`);
    }
  });

  // Check for coordinate collisions (marks too close together)
  const COLLISION_THRESHOLD = 0.0001; // ~11 meters
  for (let i = 0; i < marks.length; i++) {
    for (let j = i + 1; j < marks.length; j++) {
      const mark1 = marks[i];
      const mark2 = marks[j];

      if (
        mark1.latitude !== undefined &&
        mark1.longitude !== undefined &&
        mark2.latitude !== undefined &&
        mark2.longitude !== undefined
      ) {
        const latDiff = Math.abs(mark1.latitude - mark2.latitude);
        const lngDiff = Math.abs(mark1.longitude - mark2.longitude);

        if (latDiff < COLLISION_THRESHOLD && lngDiff < COLLISION_THRESHOLD) {
          warnings.push(
            `Marks "${mark1.name}" and "${mark2.name}" have nearly identical coordinates (distance < 11m)`
          );
        }
      }
    }
  }

  // Check for start/finish marks
  const hasStart = marks.some(
    m => m.type && (m.type.includes('start') || m.name?.toLowerCase().includes('start'))
  );
  const hasFinish = marks.some(
    m => m.type && (m.type.includes('finish') || m.name?.toLowerCase().includes('finish'))
  );

  if (!hasStart) {
    warnings.push('No start mark identified - course may be incomplete');
  }
  if (!hasFinish) {
    warnings.push('No finish mark identified - course may be incomplete');
  }

  // Check for reasonable geographic spread
  if (marks.length >= 2) {
    const lats = marks.map(m => m.latitude).filter(l => l !== undefined) as number[];
    const lngs = marks.map(m => m.longitude).filter(l => l !== undefined) as number[];

    if (lats.length >= 2 && lngs.length >= 2) {
      const latRange = Math.max(...lats) - Math.min(...lats);
      const lngRange = Math.max(...lngs) - Math.min(...lngs);

      // Approximate degree ranges
      if (latRange < 0.001 && lngRange < 0.001) {
        warnings.push('Course has very small geographic extent (<100m) - verify coordinates');
      }

      if (latRange > 0.5 || lngRange > 0.5) {
        warnings.push('Course has very large geographic extent (>50km) - verify coordinates');
      }
    }
  }

  const finalErrors = strict ? [...errors, ...warnings] : errors;

  return {
    valid: finalErrors.length === 0,
    errors: finalErrors,
    warnings: strict ? [] : warnings,
  };
}

/**
 * Validates course leg definitions
 *
 * @param legs - Array of course legs
 * @param marks - Array of marks (to verify references)
 * @returns Validation result
 *
 * @example
 * const result = validateLegs(legs, marks);
 */
export function validateLegs(
  legs: Partial<CourseLeg>[],
  marks: Mark[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!legs || legs.length === 0) {
    warnings.push('No course legs defined');
    return { valid: true, errors, warnings };
  }

  const markNames = new Set(marks.map(m => m.name));

  legs.forEach((leg, index) => {
    if (!leg.from) {
      errors.push(`Leg ${index}: Missing 'from' mark`);
    } else if (!markNames.has(leg.from)) {
      errors.push(`Leg ${index}: 'from' mark "${leg.from}" not found in marks array`);
    }

    if (!leg.to) {
      errors.push(`Leg ${index}: Missing 'to' mark`);
    } else if (!markNames.has(leg.to)) {
      errors.push(`Leg ${index}: 'to' mark "${leg.to}" not found in marks array`);
    }

    if (!leg.type) {
      warnings.push(`Leg ${index}: Missing leg type (upwind/downwind/reaching/run)`);
    }

    if (leg.distance !== undefined) {
      if (leg.distance <= 0) {
        errors.push(`Leg ${index}: Distance must be positive (got ${leg.distance})`);
      }
      if (leg.distance > 50) {
        warnings.push(
          `Leg ${index}: Distance is very large (${leg.distance} ${leg.unit || 'nm'}) - verify`
        );
      }
    }

    if (leg.bearing !== undefined) {
      if (leg.bearing < 0 || leg.bearing >= 360) {
        errors.push(`Leg ${index}: Bearing must be 0-359° (got ${leg.bearing})`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates complete course data
 *
 * Performs comprehensive validation of marks, legs, and course coherence.
 *
 * @param course - Course data to validate
 * @param strict - If true, warnings become errors
 * @returns Validation result
 *
 * @example
 * const result = validateCourse({
 *   marks: extractedMarks,
 *   legs: extractedLegs,
 *   type: 'windward-leeward'
 * });
 */
export function validateCourse(
  course: {
    marks: Partial<Mark>[];
    legs?: Partial<CourseLeg>[];
    type?: CourseType;
  },
  strict: boolean = false
): CourseValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate marks
  const markResult = validateMarks(course.marks, false);
  errors.push(...markResult.errors);
  warnings.push(...markResult.warnings);

  // Validate legs if provided
  if (course.legs && course.legs.length > 0) {
    const legResult = validateLegs(course.legs, course.marks as Mark[]);
    errors.push(...legResult.errors);
    warnings.push(...legResult.warnings);
  }

  // Validate course type if provided
  if (course.type) {
    const validTypes: CourseType[] = [
      'windward-leeward',
      'triangle',
      'trapezoid',
      'olympic',
      'custom',
    ];

    if (!validTypes.includes(course.type)) {
      warnings.push(
        `Unknown course type: ${course.type}. Valid types: ${validTypes.join(', ')}`
      );
    }

    // Course type specific validation
    if (course.type === 'windward-leeward' && course.marks.length < 3) {
      warnings.push(
        'Windward-leeward course typically has at least 3 marks (start, windward, leeward)'
      );
    }

    if (course.type === 'triangle' && course.marks.length < 3) {
      warnings.push('Triangle course should have at least 3 marks');
    }
  }

  const finalErrors = strict ? [...errors, ...warnings] : errors;

  return {
    valid: finalErrors.length === 0,
    errors: finalErrors,
    warnings: strict ? [] : warnings,
    course: course as any,
  };
}

/**
 * Sanitizes mark data by removing invalid characters and normalizing
 *
 * @param mark - Mark data to sanitize
 * @returns Sanitized mark data
 *
 * @example
 * const clean = sanitizeMark(dirtyMark);
 */
export function sanitizeMark(mark: Partial<Mark>): Partial<Mark> {
  const sanitized: Partial<Mark> = { ...mark };

  // Trim and normalize name
  if (sanitized.name) {
    sanitized.name = sanitized.name
      .trim()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/[^\w\s\-()]/g, ''); // Remove special chars except -, (), space
  }

  // Round coordinates to reasonable precision (7 decimal places ≈ 1cm)
  if (sanitized.latitude !== undefined) {
    sanitized.latitude = parseFloat(sanitized.latitude.toFixed(7));
  }
  if (sanitized.longitude !== undefined) {
    sanitized.longitude = parseFloat(sanitized.longitude.toFixed(7));
  }

  // Normalize type to lowercase
  if (sanitized.type) {
    sanitized.type = sanitized.type.toLowerCase() as any;
  }

  // Normalize rounding direction
  if (sanitized.rounding) {
    sanitized.rounding = sanitized.rounding.toLowerCase() as any;
  }

  // Trim description
  if (sanitized.description) {
    sanitized.description = sanitized.description.trim();
  }

  return sanitized;
}

/**
 * Attempts to auto-fix common validation issues
 *
 * @param marks - Marks with potential issues
 * @returns Fixed marks and list of fixes applied
 *
 * @example
 * const { fixed, fixes } = autoFixMarks(problematicMarks);
 * console.log('Applied fixes:', fixes);
 */
export function autoFixMarks(marks: Partial<Mark>[]): {
  fixed: Partial<Mark>[];
  fixes: string[];
} {
  const fixes: string[] = [];
  const fixed = marks.map((mark, index) => {
    const sanitized = sanitizeMark(mark);

    // Fix missing type based on name
    if (!sanitized.type && sanitized.name) {
      const nameLower = sanitized.name.toLowerCase();
      if (nameLower.includes('start') && nameLower.includes('finish')) {
        sanitized.type = 'start-finish';
        fixes.push(`Mark ${index}: Set type to 'start-finish' based on name`);
      } else if (nameLower.includes('start')) {
        sanitized.type = 'start-line';
        fixes.push(`Mark ${index}: Set type to 'start-line' based on name`);
      } else if (nameLower.includes('finish')) {
        sanitized.type = 'finish-line';
        fixes.push(`Mark ${index}: Set type to 'finish-line' based on name`);
      } else if (nameLower.includes('gate')) {
        sanitized.type = 'gate';
        fixes.push(`Mark ${index}: Set type to 'gate' based on name`);
      } else if (nameLower.includes('pin')) {
        sanitized.type = 'pin';
        fixes.push(`Mark ${index}: Set type to 'pin' based on name`);
      } else if (nameLower.includes('committee') || nameLower.includes('rc boat')) {
        sanitized.type = 'committee-boat';
        fixes.push(`Mark ${index}: Set type to 'committee-boat' based on name`);
      } else {
        sanitized.type = 'mark';
        fixes.push(`Mark ${index}: Set default type to 'mark'`);
      }
    }

    // Fix missing rounding based on conventions (default to port)
    if (!sanitized.rounding && sanitized.type === 'mark') {
      sanitized.rounding = 'port';
      fixes.push(`Mark ${index}: Set default rounding to 'port'`);
    }

    // Generate ID if missing
    if (!sanitized.id) {
      sanitized.id = `mark-${index}-${Date.now()}`;
      fixes.push(`Mark ${index}: Generated ID`);
    }

    return sanitized;
  });

  return { fixed, fixes };
}
