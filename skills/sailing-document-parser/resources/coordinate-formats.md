# Coordinate Format Reference Guide

## Overview

Sailing race documents use various coordinate formats depending on region, organization, and document author preferences. This guide covers all common formats and provides parsing guidelines.

## Supported Coordinate Formats

### 1. Decimal Degrees (DD)

**Most Common Format:** Used in digital systems and GPS devices

**Structure:**
```
Latitude: -90.0 to +90.0
Longitude: -180.0 to +180.0
```

**Examples:**
```
22.279300, 114.162800
22.279300N, 114.162800E
N22.279300, E114.162800
+22.279300, +114.162800
```

**Parsing Guidelines:**
- Positive = North/East, Negative = South/West
- May include hemisphere indicators (N/S/E/W) or +/- signs
- Precision: Typically 5-7 decimal places
- 6 decimal places ≈ 10cm precision (adequate for racing)
- 7 decimal places ≈ 1cm precision (excessive for most uses)

**Regional Variations:**
- **Global Standard:** Decimal degrees with 6 decimals
- **North America:** May include +/- signs
- **Europe:** Often uses N/S/E/W suffix
- **Asia-Pacific:** Mixed - both formats common

---

### 2. Degrees Decimal Minutes (DDM)

**Second Most Common:** Preferred by many sailing organizations

**Structure:**
```
Latitude: DD MM.MMMM N/S
Longitude: DDD MM.MMMM E/W
```

**Examples:**
```
22 16.760N, 114 09.768E
22° 16.760'N, 114° 09.768'E
22° 16.760' N, 114° 09.768' E
N22 16.760, E114 09.768
N 22° 16.760', E 114° 09.768'
```

**Parsing Guidelines:**
- Degrees: Integer value
- Minutes: Decimal value (0-59.9999)
- Hemisphere: N/S for latitude, E/W for longitude
- Can be prefix or suffix
- Spacing is highly variable
- Degree symbol (°) is optional
- Minute symbol (') is optional

**Regional Variations:**
- **Hong Kong/Asia-Pacific:**
  - Often: `22 16.760N, 114 09.768E`
  - Sometimes: `N22 16.760, E114 09.768`
- **Europe:**
  - Common: `22° 16.760'N, 114° 09.768'E`
  - Spacing varies widely
- **North America:**
  - Often: `N 22° 16.760', W 114° 09.768'`
  - Hemisphere typically prefixed

**Common Mistakes:**
- Forgetting to convert minutes to decimal degrees (divide by 60)
- Incorrect hemisphere application (sign inversion)
- Parsing decimal minutes as seconds

---

### 3. Degrees Minutes Seconds (DMS)

**Traditional Format:** Used in older documents and charts

**Structure:**
```
Latitude: DD MM SS.SS N/S
Longitude: DDD MM SS.SS E/W
```

**Examples:**
```
22°16'45.6"N, 114°09'46.1"E
22° 16' 45.6" N, 114° 09' 46.1" E
22d 16m 45.6s N, 114d 09m 46.1s E
```

**Parsing Guidelines:**
- Degrees: Integer value
- Minutes: Integer value (0-59)
- Seconds: Decimal value (0-59.9999)
- Multiple separator styles:
  - Symbols: ° ' "
  - Letters: d m s
  - Text: deg min sec
- Spacing is inconsistent

**Conversion Formula:**
```
Decimal = Degrees + (Minutes / 60) + (Seconds / 3600)
```

**Example:**
```
22°16'45.6"N = 22 + (16/60) + (45.6/3600) = 22.279333°N
```

**Regional Variations:**
- **Traditional Charts:** Almost always DMS
- **Europe:** More common than in other regions
- **Modern Documents:** Increasingly rare (legacy format)

**Common Mistakes:**
- Incorrect order of operations in conversion
- Forgetting to apply hemisphere sign
- Confusion between minutes and decimal minutes

---

## Format Detection Strategy

### Step 1: Identify Separator Patterns

```
Contains ° and ' and " → DMS
Contains ° and ' only → DDM
Contains only . and numbers → Decimal Degrees
```

### Step 2: Check for Hemisphere Indicators

```
Prefix:  N22.279, E114.162 → Hemisphere before number
Suffix:  22.279N, 114.162E → Hemisphere after number
Sign:    +22.279, -114.162 → +/- indicates hemisphere
```

### Step 3: Validate Format

```
Latitude must be:  -90 to +90 (or with N/S indicator)
Longitude must be: -180 to +180 (or with E/W indicator)
```

---

## Parsing Examples

### Mixed Format Pairs

Real-world documents often mix formats within the same coordinate pair:

```
CORRECT PARSING:
"22°16.760'N 114 09.768E"
→ Latitude:  22°16.760'N (DDM with symbols)
→ Longitude: 114 09.768E (DDM without symbols)
→ Result: 22.279333, 114.1628

INCORRECT ASSUMPTION:
Assuming both will have identical formatting
```

### Ambiguous Cases

**Case 1: Missing Hemisphere**
```
Input: 22.279300, 114.162800
Question: Northern or Southern hemisphere?
Solution: Use venue context (Hong Kong = Northern)
```

**Case 2: Unusual Spacing**
```
Input: N  22°  16.760'  ,  E 114°  09.768'
Solution: Strip all whitespace, then parse
```

**Case 3: Alternative Symbols**
```
Input: 22d 16m 45.6s N
Solution: Recognize d/m/s as degree/minute/second markers
```

---

## Precision Guidelines

### GPS Precision by Decimal Places

| Decimal Places | Approximate Precision | Use Case |
|----------------|----------------------|----------|
| 0 | 111 km | Country level |
| 1 | 11.1 km | City level |
| 2 | 1.11 km | Neighborhood |
| 3 | 111 m | Large field |
| 4 | 11.1 m | Individual tree |
| 5 | 1.11 m | **Person/boat** |
| 6 | 11.1 cm | **Racing mark** ✓ |
| 7 | 1.11 cm | Excessive |
| 8 | 1.11 mm | Excessive |

**Recommendation for Racing:**
- **6 decimal places** for mark coordinates (11cm precision)
- **5 decimal places** for venue centers (1m precision)

### Rounding Best Practices

```
GOOD:  22.279300 (6 decimals)
OKAY:  22.27930  (5 decimals)
AVOID: 22.279    (3 decimals - too imprecise for racing)
AVOID: 22.2793000000 (10 decimals - false precision)
```

---

## Regional Format Preferences

### Hong Kong / Asia-Pacific
```
Primary:   22 16.760N, 114 09.768E (DDM, no symbols)
Secondary: 22°16.760'N, 114°09.768'E (DDM, with symbols)
Rare:      22.279300, 114.162800 (Decimal)
```

### Europe
```
Primary:   22° 16.760'N, 114° 09.768'E (DDM, symbols, spaces)
Secondary: 22°16'45.6"N, 114°09'46.1"E (DMS)
Common:    22.279300N, 114.162800E (Decimal with hemisphere)
```

### North America
```
Primary:   N 22° 16.760', W 114° 09.768' (DDM, prefix hemisphere)
Secondary: 22.279300, -114.162800 (Decimal with sign)
Common:    N 22°16'45.6", W 114°09'46.1" (DMS, prefix)
```

### Australia / New Zealand
```
Primary:   22° 16.760'S, 114° 09.768'E (DDM, symbols)
Common:    S 22.279300, E 114.162800 (Decimal with prefix)
```

---

## Validation Checklist

When parsing coordinates, always verify:

- [ ] Latitude is between -90 and +90
- [ ] Longitude is between -180 and +180
- [ ] Hemisphere indicators are consistent (N/S for lat, E/W for lon)
- [ ] Precision is reasonable (5-7 decimals for DD, 3-4 for DDM minutes)
- [ ] Coordinates are in expected geographic region
- [ ] No obviously suspicious values (0, 0) or (99, 99)
- [ ] Positive/negative signs match hemisphere indicators
- [ ] Minutes are 0-59 (not 60+)
- [ ] Seconds are 0-59 (not 60+)

---

## Common Parsing Errors

### Error 1: Incorrect Sign Application
```
WRONG: Parse "22°N" as -22.0 (incorrect hemisphere)
RIGHT: Parse "22°N" as +22.0
```

### Error 2: Minute/Second Confusion
```
WRONG: Parse "22 16.760" as 22 degrees + 16 seconds
RIGHT: Parse "22 16.760" as 22 degrees + 16.760 minutes
```

### Error 3: Longitude/Latitude Reversal
```
WRONG: Assume first number is always longitude
RIGHT: Use hemisphere indicator (N/S = lat, E/W = lon)
```

### Error 4: GeoJSON Coordinate Order
```
WRONG: GeoJSON [latitude, longitude]
RIGHT: GeoJSON [longitude, latitude]  ← Note the order!
```

---

## Utility Function Reference

The `sailing-document-parser/utils` package provides pre-tested functions for handling all these formats:

```typescript
import {
  detectCoordinateFormat,
  convertDMSToDecimal,
  convertDDMToDecimal,
  convertToDecimal,
  parseCoordinatePair,
  validateCoordinates,
  formatCoordinates
} from '@/skills/sailing-document-parser/utils';

// Auto-detect and convert any format
const decimal = convertToDecimal("22°16.760'N");  // 22.279333

// Parse coordinate pairs
const coords = parseCoordinatePair("22°16.760'N, 114°09.768'E");
// → { latitude: 22.279333, longitude: 114.1628, format: 'DMS' }

// Validate range
validateCoordinates(22.279333, 114.1628);  // true or throws error

// Format for output
const formatted = formatCoordinates(22.279333, 114.1628, 'DDM');
// → "22 16.760N, 114 09.768E"
```

---

## References

- **ISO 6709:** Standard representation of geographic point location
- **WGS84:** World Geodetic System (standard for GPS)
- **ISAF RRS:** Racing Rules of Sailing (coordinate conventions)
- **IHO S-52:** International Hydrographic Organization chart standards

---

**Last Updated:** 2025-10-18
**Maintained by:** RegattaFlow Sailing Document Parser Skill
