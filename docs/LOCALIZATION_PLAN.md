# RegattaFlow Localization Plan

**Version**: 1.0  
**Created**: December 8, 2025  
**Goal**: Full multi-language support for European market launch

---

## Executive Summary

To succeed in Europe, RegattaFlow needs proper internationalization (i18n) and localization (l10n). This document outlines our approach, priorities, and implementation plan.

---

## Language Priorities

### Tier 1: Launch Languages (Month 1-2)

| Language | Code | Market Size | Priority | Notes |
|----------|------|-------------|----------|-------|
| **English** | `en` | UK, Ireland, International | P0 | Already done |
| **German** | `de` | Germany, Austria, Switzerland | P0 | Largest EU boat market |

### Tier 2: European Expansion (Month 2-3)

| Language | Code | Market Size | Priority | Notes |
|----------|------|-------------|----------|-------|
| **French** | `fr` | France, Belgium, Switzerland | P1 | Strong sailing culture |
| **Italian** | `it` | Italy | P1 | €3.35B boat market |
| **Spanish** | `es` | Spain | P1 | Compete with SAILTI |

### Tier 3: Future (Month 6+)

| Language | Code | Market Size | Priority | Notes |
|----------|------|-------------|----------|-------|
| **Dutch** | `nl` | Netherlands, Belgium | P2 | Dense sailing population |
| **Polish** | `pl` | Poland | P2 | Growing market |
| **Swedish** | `sv` | Sweden, Nordic | P2 | Strong sailing culture |
| **Portuguese** | `pt` | Portugal | P2 | Olympic sailing focus |
| **Greek** | `el` | Greece | P3 | Charter/racing growth |
| **Croatian** | `hr` | Croatia | P3 | Major charter destination |

---

## Technical Architecture

### Framework: react-i18next

We'll use `react-i18next` for React Native, the industry standard for React localization.

#### Installation

```bash
npm install i18next react-i18next i18next-http-backend expo-localization
```

#### Directory Structure

```
lib/
└── i18n/
    ├── index.ts           # i18n configuration
    ├── languageDetector.ts # Detect device language
    └── locales/
        ├── en/
        │   ├── common.json      # Shared strings
        │   ├── navigation.json  # Tab/nav labels
        │   ├── races.json       # Race management
        │   ├── scoring.json     # Scoring terms
        │   ├── ai.json          # AI features
        │   ├── settings.json    # Settings screen
        │   └── errors.json      # Error messages
        ├── de/
        │   ├── common.json
        │   ├── navigation.json
        │   └── ... (same structure)
        ├── fr/
        ├── it/
        └── es/
```

#### Configuration

```typescript
// lib/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import all translation files
import enCommon from './locales/en/common.json';
import enNavigation from './locales/en/navigation.json';
import enRaces from './locales/en/races.json';
import enScoring from './locales/en/scoring.json';
import enAi from './locales/en/ai.json';
import enSettings from './locales/en/settings.json';
import enErrors from './locales/en/errors.json';

import deCommon from './locales/de/common.json';
import deNavigation from './locales/de/navigation.json';
// ... etc

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    races: enRaces,
    scoring: enScoring,
    ai: enAi,
    settings: enSettings,
    errors: enErrors,
  },
  de: {
    common: deCommon,
    navigation: deNavigation,
    // ... etc
  },
  // ... other languages
};

// Supported locales
export const supportedLocales = ['en', 'de', 'fr', 'it', 'es'] as const;
export type SupportedLocale = typeof supportedLocales[number];

// Locale metadata
export const localeConfig: Record<SupportedLocale, {
  name: string;
  nativeName: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    dateFormat: 'DD/MM/YYYY', // European format for consistency
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: { decimal: '.', thousands: ',' },
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: { decimal: ',', thousands: '.' },
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: { decimal: ',', thousands: ' ' },
  },
  it: {
    name: 'Italian',
    nativeName: 'Italiano',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: { decimal: ',', thousands: '.' },
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currency: 'EUR',
    numberFormat: { decimal: ',', thousands: '.' },
  },
};

// Get device locale, fallback to English
const getDeviceLocale = (): SupportedLocale => {
  const deviceLocale = Localization.locale.split('-')[0];
  if (supportedLocales.includes(deviceLocale as SupportedLocale)) {
    return deviceLocale as SupportedLocale;
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLocale(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'races', 'scoring', 'ai', 'settings', 'errors'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

#### Language Detector

```typescript
// lib/i18n/languageDetector.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { supportedLocales, SupportedLocale } from './index';

const LANGUAGE_KEY = '@regattaflow/language';

export const languageDetector = {
  type: 'languageDetector',
  async: true,
  
  detect: async (callback: (lng: string) => void) => {
    try {
      // Check for saved preference
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage && supportedLocales.includes(savedLanguage as SupportedLocale)) {
        callback(savedLanguage);
        return;
      }
      
      // Fall back to device locale
      const deviceLocale = Localization.locale.split('-')[0];
      if (supportedLocales.includes(deviceLocale as SupportedLocale)) {
        callback(deviceLocale);
        return;
      }
      
      // Default to English
      callback('en');
    } catch (error) {
      callback('en');
    }
  },
  
  init: () => {},
  
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lng);
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  },
};
```

---

## Translation File Structure

### Example: English (en/common.json)

```json
{
  "app": {
    "name": "RegattaFlow",
    "tagline": "AI-Powered Sailing Intelligence"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "confirm": "Confirm",
    "back": "Back",
    "next": "Next",
    "done": "Done",
    "retry": "Retry",
    "close": "Close",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "refresh": "Refresh",
    "share": "Share",
    "export": "Export",
    "import": "Import"
  },
  "status": {
    "loading": "Loading...",
    "saving": "Saving...",
    "success": "Success!",
    "error": "Error",
    "offline": "You're offline",
    "syncing": "Syncing..."
  },
  "time": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "now": "Now",
    "ago": "{{time}} ago",
    "in": "in {{time}}",
    "minutes": "{{count}} minute",
    "minutes_plural": "{{count}} minutes",
    "hours": "{{count}} hour",
    "hours_plural": "{{count}} hours",
    "days": "{{count}} day",
    "days_plural": "{{count}} days"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be at most {{max}} characters"
  }
}
```

### Example: German (de/common.json)

```json
{
  "app": {
    "name": "RegattaFlow",
    "tagline": "KI-gestützte Segel-Intelligenz"
  },
  "actions": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "confirm": "Bestätigen",
    "back": "Zurück",
    "next": "Weiter",
    "done": "Fertig",
    "retry": "Erneut versuchen",
    "close": "Schließen",
    "search": "Suchen",
    "filter": "Filtern",
    "sort": "Sortieren",
    "refresh": "Aktualisieren",
    "share": "Teilen",
    "export": "Exportieren",
    "import": "Importieren"
  },
  "status": {
    "loading": "Laden...",
    "saving": "Speichern...",
    "success": "Erfolgreich!",
    "error": "Fehler",
    "offline": "Sie sind offline",
    "syncing": "Synchronisieren..."
  },
  "time": {
    "today": "Heute",
    "yesterday": "Gestern",
    "tomorrow": "Morgen",
    "now": "Jetzt",
    "ago": "vor {{time}}",
    "in": "in {{time}}",
    "minutes": "{{count}} Minute",
    "minutes_plural": "{{count}} Minuten",
    "hours": "{{count}} Stunde",
    "hours_plural": "{{count}} Stunden",
    "days": "{{count}} Tag",
    "days_plural": "{{count}} Tage"
  },
  "validation": {
    "required": "Dieses Feld ist erforderlich",
    "email": "Bitte geben Sie eine gültige E-Mail-Adresse ein",
    "minLength": "Mindestens {{min}} Zeichen erforderlich",
    "maxLength": "Maximal {{max}} Zeichen erlaubt"
  }
}
```

### Example: Sailing-Specific Terms (en/scoring.json)

```json
{
  "scoring": {
    "title": "Scoring",
    "series": "Series",
    "race": "Race",
    "results": "Results",
    "standings": "Standings",
    "points": "Points",
    "position": "Position",
    "totalPoints": "Total Points",
    "netPoints": "Net Points",
    "discards": "Discards"
  },
  "systems": {
    "lowPoint": "Low Point",
    "highPoint": "High Point",
    "bonusPoint": "Bonus Point"
  },
  "codes": {
    "DNF": "Did Not Finish",
    "DNS": "Did Not Start",
    "DNC": "Did Not Come",
    "DSQ": "Disqualified",
    "DNE": "Disqualified Not Excludable",
    "OCS": "On Course Side",
    "BFD": "Black Flag Disqualification",
    "UFD": "U Flag Disqualification",
    "ZFP": "Z Flag Penalty",
    "SCP": "Scoring Penalty",
    "RET": "Retired",
    "RAF": "Retired After Finish",
    "RDG": "Redress Given",
    "DPI": "Discretionary Penalty",
    "NSC": "Did Not Sail Course"
  },
  "actions": {
    "enterResults": "Enter Results",
    "publishResults": "Publish Results",
    "calculateStandings": "Calculate Standings",
    "applyPenalty": "Apply Penalty",
    "grantRedress": "Grant Redress"
  },
  "status": {
    "provisional": "Provisional",
    "final": "Final",
    "draft": "Draft"
  }
}
```

### Example: German Sailing Terms (de/scoring.json)

```json
{
  "scoring": {
    "title": "Wertung",
    "series": "Serie",
    "race": "Wettfahrt",
    "results": "Ergebnisse",
    "standings": "Gesamtwertung",
    "points": "Punkte",
    "position": "Platz",
    "totalPoints": "Gesamtpunkte",
    "netPoints": "Nettopunkte",
    "discards": "Streicher"
  },
  "systems": {
    "lowPoint": "Tiefpunktsystem",
    "highPoint": "Hochpunktsystem",
    "bonusPoint": "Bonuspunktsystem"
  },
  "codes": {
    "DNF": "Nicht beendet",
    "DNS": "Nicht gestartet",
    "DNC": "Nicht erschienen",
    "DSQ": "Disqualifiziert",
    "DNE": "Disqualifiziert (nicht streichbar)",
    "OCS": "Frühstart",
    "BFD": "Schwarze-Flagge-Disqualifikation",
    "UFD": "U-Flagge-Disqualifikation",
    "ZFP": "Z-Flagge-Strafe",
    "SCP": "Wertungsstrafe",
    "RET": "Aufgegeben",
    "RAF": "Nach dem Ziel aufgegeben",
    "RDG": "Wiedergutmachung gewährt",
    "DPI": "Ermessensstrafe",
    "NSC": "Bahn nicht gesegelt"
  },
  "actions": {
    "enterResults": "Ergebnisse eingeben",
    "publishResults": "Ergebnisse veröffentlichen",
    "calculateStandings": "Wertung berechnen",
    "applyPenalty": "Strafe anwenden",
    "grantRedress": "Wiedergutmachung gewähren"
  },
  "status": {
    "provisional": "Vorläufig",
    "final": "Endgültig",
    "draft": "Entwurf"
  }
}
```

---

## Usage in Components

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <View>
      <Text>{t('common:actions.save')}</Text>
      <Text>{t('scoring:codes.DNF')}</Text>
    </View>
  );
}
```

### With Interpolation

```tsx
function TimeAgo({ minutes }: { minutes: number }) {
  const { t } = useTranslation();
  
  return (
    <Text>
      {t('common:time.ago', { time: t('common:time.minutes', { count: minutes }) })}
    </Text>
  );
}
// Output (English): "5 minutes ago"
// Output (German): "vor 5 Minuten"
```

### Pluralization

```tsx
function RaceCount({ count }: { count: number }) {
  const { t } = useTranslation('races');
  
  return (
    <Text>
      {t('raceCount', { count })}
    </Text>
  );
}

// races.json:
// "raceCount": "{{count}} race"
// "raceCount_plural": "{{count}} races"
```

### Language Switcher Component

```tsx
import { useTranslation } from 'react-i18next';
import { supportedLocales, localeConfig } from '@/lib/i18n';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (locale: string) => {
    i18n.changeLanguage(locale);
  };
  
  return (
    <View>
      {supportedLocales.map((locale) => (
        <TouchableOpacity
          key={locale}
          onPress={() => changeLanguage(locale)}
          style={[
            styles.option,
            i18n.language === locale && styles.selected
          ]}
        >
          <Text>{localeConfig[locale].nativeName}</Text>
          {i18n.language === locale && (
            <Ionicons name="checkmark" size={20} color="#007AFF" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## Date/Time/Number Formatting

### Date Formatting

```typescript
// lib/i18n/formatters.ts
import { format, parseISO } from 'date-fns';
import { de, fr, it, es, enGB } from 'date-fns/locale';
import i18n from './index';

const locales = {
  en: enGB,
  de: de,
  fr: fr,
  it: it,
  es: es,
};

export function formatDate(date: Date | string, formatStr: string = 'PPP'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const locale = locales[i18n.language as keyof typeof locales] || enGB;
  return format(d, formatStr, { locale });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const locale = locales[i18n.language as keyof typeof locales] || enGB;
  return format(d, 'PPp', { locale });
}

// Examples:
// formatDate(new Date(), 'PPP')
// English: "December 8, 2025"
// German: "8. Dezember 2025"
// French: "8 décembre 2025"
```

### Number Formatting

```typescript
// lib/i18n/formatters.ts
import { localeConfig, SupportedLocale } from './index';
import i18n from './index';

export function formatNumber(
  value: number,
  options?: { decimals?: number; style?: 'decimal' | 'currency' | 'percent' }
): string {
  const locale = i18n.language as SupportedLocale;
  const config = localeConfig[locale] || localeConfig.en;
  
  if (options?.style === 'currency') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: config.currency,
    }).format(value);
  }
  
  if (options?.style === 'percent') {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: options.decimals || 0,
    }).format(value);
  }
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: options?.decimals || 0,
    maximumFractionDigits: options?.decimals || 2,
  }).format(value);
}

// Examples:
// formatNumber(1234.56)
// English: "1,234.56"
// German: "1.234,56"
// French: "1 234,56"
```

---

## Translation Workflow

### 1. String Extraction

Use `i18next-parser` to extract strings:

```bash
npm install -D i18next-parser
```

```javascript
// i18next-parser.config.js
module.exports = {
  locales: ['en', 'de', 'fr', 'it', 'es'],
  output: 'lib/i18n/locales/$LOCALE/$NAMESPACE.json',
  input: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  defaultNamespace: 'common',
  keySeparator: '.',
  namespaceSeparator: ':',
};
```

```bash
npx i18next-parser
```

### 2. Translation Management

#### Option A: Manual (Small Scale)
- Export JSON files to translators
- Track in spreadsheet
- Manual merge

#### Option B: Locize (Recommended for Scale)
- Cloud-based translation management
- In-context editing
- Automatic sync
- ~$25/month

#### Option C: Crowdin
- Open source friendly
- Community translations possible
- Free for open source

### 3. Translation Review Process

```
1. Extract new strings (i18next-parser)
2. Send to translator (native speaker)
3. Translator completes in tool
4. Review by second native speaker
5. Developer imports and tests
6. QA in-app
7. Release
```

### 4. Translator Guidelines

```markdown
## Translation Guidelines for RegattaFlow

### General Rules
1. Use formal "you" (German: Sie, French: vous, etc.)
2. Keep sailing terminology consistent with local federation standards
3. Don't translate proper nouns (Sailwave, RegattaFlow)
4. Keep placeholders intact: {{name}}, {{count}}
5. Match length roughly (±20%) to avoid layout issues

### Sailing Terminology
- Use official RRS translations where available
- When in doubt, check national federation website
- Status codes (DNF, DNS, etc.) stay in English

### UI Guidelines
- Button text: short, action-oriented
- Error messages: clear, helpful
- Be concise - mobile screens have limited space

### Context
We'll provide:
- Screenshots of where strings appear
- Developer notes for complex strings
- Glossary of key terms
```

---

## String Categories & Priorities

### Phase 1 (Critical - Must Translate)

| Category | File | Strings | Notes |
|----------|------|---------|-------|
| Navigation | navigation.json | ~20 | Tab labels, back button |
| Common actions | common.json | ~50 | Save, Cancel, etc. |
| Auth | auth.json | ~30 | Login, signup, errors |
| Errors | errors.json | ~40 | Error messages |

### Phase 2 (Important - Core Features)

| Category | File | Strings | Notes |
|----------|------|---------|-------|
| Races | races.json | ~100 | Race management |
| Scoring | scoring.json | ~80 | Scoring terms |
| Results | results.json | ~60 | Results display |
| Notices | notices.json | ~40 | Notice board |

### Phase 3 (Enhancement - AI Features)

| Category | File | Strings | Notes |
|----------|------|---------|-------|
| AI | ai.json | ~100 | AI coaching, strategy |
| Venues | venues.json | ~60 | Venue intelligence |
| Weather | weather.json | ~40 | Weather data |

### Phase 4 (Complete - All Features)

| Category | File | Strings | Notes |
|----------|------|---------|-------|
| Settings | settings.json | ~50 | App settings |
| Profile | profile.json | ~40 | User profile |
| Clubs | clubs.json | ~60 | Club management |
| Premium | premium.json | ~30 | Subscription |

---

## Estimated Effort & Cost

### String Count Estimate

| Phase | Strings | Pages |
|-------|---------|-------|
| Phase 1 | ~140 | 5-6 |
| Phase 2 | ~280 | 8-10 |
| Phase 3 | ~200 | 5-6 |
| Phase 4 | ~180 | 5-6 |
| **Total** | **~800** | ~25 |

### Translation Cost Estimate

| Language | Cost/Word | Est. Words | Est. Cost |
|----------|-----------|------------|-----------|
| German | €0.10 | 4,000 | €400 |
| French | €0.10 | 4,000 | €400 |
| Italian | €0.10 | 4,000 | €400 |
| Spanish | €0.10 | 4,000 | €400 |
| **Total** | | | **€1,600** |

*Note: Costs are estimates. Professional translation services vary. Native speaker review adds ~30%.*

### Development Effort

| Task | Time |
|------|------|
| i18n setup & infrastructure | 2 days |
| String extraction & organization | 2 days |
| German translation integration | 1 day |
| Testing & QA (per language) | 1 day |
| Date/time/number formatting | 1 day |
| **Total (Tier 1)** | **~1 week** |

---

## Testing Checklist

### Per Language

- [ ] All strings display correctly (no missing translations)
- [ ] No text truncation on buttons/labels
- [ ] Pluralization works correctly
- [ ] Date formats are correct
- [ ] Number formats are correct
- [ ] Currency displays correctly
- [ ] Right-to-left text (if applicable)
- [ ] Sailing terminology is accurate
- [ ] Error messages are clear
- [ ] No English leaking through

### Device Testing

- [ ] iOS - Various screen sizes
- [ ] Android - Various screen sizes
- [ ] Language switching works
- [ ] Preference persists across app restarts
- [ ] Follows device language by default

---

## Quality Assurance

### Translation Quality Gates

1. **Professional Translation**: Native speaker translator
2. **Sailing Expert Review**: Someone who sails in that language
3. **Technical Review**: Developer checks interpolation, plurals
4. **In-App Review**: QA in actual app context
5. **User Testing**: Beta testers from target country

### Common Issues to Watch

| Issue | Example | Prevention |
|-------|---------|------------|
| Missing context | "Start" = race start or button? | Add comments for translators |
| Text overflow | German words 30% longer | Design with flexibility |
| Plural rules | Different languages have different rules | Use i18next pluralization |
| Sailing jargon | Local vs international terms | Sailing expert review |
| Formal/informal | Sie vs du in German | Define style guide |

---

## Rollout Plan

### Week 1-2: Foundation
- [ ] Set up i18n infrastructure
- [ ] Extract all English strings
- [ ] Organize into namespaced files
- [ ] Create translator guidelines

### Week 3-4: German
- [ ] Send to German translator
- [ ] Review with German sailing expert
- [ ] Integrate translations
- [ ] Test thoroughly
- [ ] Release German version

### Week 5-8: French, Italian, Spanish
- [ ] Send to translators (parallel)
- [ ] Review cycles
- [ ] Integration
- [ ] Testing
- [ ] Phased release

### Ongoing
- [ ] Add new strings to extraction
- [ ] Send for translation weekly
- [ ] Update with releases

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Translation coverage | 100% for Tier 1 languages |
| Missing string errors | 0 in production |
| User satisfaction (localized) | 4.5+ stars |
| Time to translate new feature | <1 week |
| Translation accuracy complaints | <5/month |

---

**Document Owner**: Product & Engineering  
**Last Updated**: December 8, 2025  
**Review Cadence**: Monthly

