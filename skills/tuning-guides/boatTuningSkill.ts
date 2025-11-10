import { DEFAULT_GUIDES, type DefaultTuningGuideDefinition } from '@/data/default-tuning-guides';

const CLASS_LABELS: Record<string, string> = {
  dragon: 'Dragon',
  j70: 'J/70',
  etchells: 'Etchells',
  ilca7: 'ILCA 7',
  optimist: 'Optimist'
};

const MAX_KEYS_IN_SUMMARY = 8;

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatSectionSummary(
  section: DefaultTuningGuideDefinition['sections'][number]
): string {
  const keys = section.settings ? Object.keys(section.settings) : [];
  const keyPreview = keys.slice(0, MAX_KEYS_IN_SUMMARY).map(key => `\`${key}\``);
  const suffix = keys.length > MAX_KEYS_IN_SUMMARY ? ' …' : '';

  const conditionParts: string[] = [];
  if (section.conditions?.windSpeed) {
    conditionParts.push(section.conditions.windSpeed);
  }
  if (section.conditions?.points && section.conditions.points !== 'all') {
    conditionParts.push(section.conditions.points);
  }
  if (section.conditions?.seaState) {
    conditionParts.push(section.conditions.seaState);
  }

  const conditionSummary = conditionParts.length > 0
    ? ` (${conditionParts.join(', ')})`
    : '';

  return `    - **${section.title}${conditionSummary}** → keys: ${keyPreview.join(', ')}${suffix}`;
}

function formatGuideSummary(
  classKey: string,
  guide: DefaultTuningGuideDefinition
): string {
  const classLabel = CLASS_LABELS[classKey] ?? toTitleCase(classKey);
  const meta: string[] = [];

  if (guide.year) {
    meta.push(String(guide.year));
  }
  if (guide.source) {
    meta.push(guide.source);
  }
  if (guide.tags && guide.tags.length > 0) {
    meta.push(`tags: ${guide.tags.join(', ')}`);
  }

  const headerMeta = meta.length > 0 ? ` (${meta.join(' • ')})` : '';

  const sections = guide.sections
    .map(section => formatSectionSummary(section))
    .join('\n');

  return [
    `- **${classLabel}** — ${guide.title}${headerMeta}`,
    sections
  ].join('\n');
}

const quickReference = Object.entries(DEFAULT_GUIDES)
  .map(([classKey, guides]) =>
    guides.map(guide => formatGuideSummary(classKey, guide)).join('\n')
  )
  .filter(Boolean)
  .join('\n');

const structuredLibrary = JSON.stringify(DEFAULT_GUIDES, null, 2);

const OUTPUT_CONTRACT_JSON = JSON.stringify(
  {
    class: 'J/70',
    matchSummary: {
      windSpeedTarget: '12 (input)',
      matchedSectionWind: '8-12 kts',
      pointsOfSail: 'upwind'
    },
    guideTitle: 'J/70 World Circuit Playbook',
    guideSource: 'One Design Speed Lab',
    sectionTitle: 'Base Rig Tune (8-12 kts)',
    conditionSummary: 'Medium breeze baseline trim',
    settings: [
      {
        key: 'upper_shrouds',
        rawKey: 'upper shrouds',
        label: 'Upper Shrouds',
        value: 'Loos PT-1M 26'
      },
      {
        key: 'forestay_length',
        rawKey: 'forestay length',
        label: 'Forestay Length',
        value: '3122 mm (turnbuckle exposed 7 threads)'
      }
    ],
    notes: [
      'Baseline before venue-specific micro tune.',
      'Pair with vang + backstay adjustments from section text.'
    ],
    tags: ['rig', 'mast', 'sail'],
    confidence: 0.86,
    matchScore: 0.92,
    caveats: [
      'Assumes Southern Spars carbon rig.',
      'Verify crew weight within class target range.'
    ]
  },
  null,
  2
);

export const BOAT_TUNING_SKILL_CONTENT = [
  '# Boat Tuning Analyst',
  '',
  'Convert RegattaFlow tuning guides into race-ready rig setups that match the sailor\'s boat class, forecast breeze, and target point of sail.',
  '',
  '## Mission',
  '- Blend factory tuning matrices with observed conditions to deliver precise rig, sail, and crew trim guidance.',
  '- Highlight why a section was selected (wind range, points of sail, sea state).',
  '- Surface any assumptions (rig package, sailmaker, hull notes) before presenting numbers.',
  '',
  '## Input Signals',
  '- `classId` or `className`: e.g., `j70`, `Dragon`, `ILCA 7`.',
  '- `averageWindSpeed`: numeric knots (optional).',
  '- `pointsOfSail`: upwind | downwind | reach | all (optional).',
  '- `seaState` or qualitative notes (optional, map to section descriptions).',
  '- `inventoryContext`: rig, mast, sails the team actually has (optional).',
  '',
  '## Output Contract',
  'Return JSON objects shaped like the example below. Always provide an array even if only one recommendation qualifies.',
  '```json',
  OUTPUT_CONTRACT_JSON,
  '```',
  '',
  '### Rules',
  '1. Only pull settings from the structured library below—never hallucinate numbers.',
  '2. Match wind range first, then point of sail, then sea state. If no perfect match, pick closest range and explain variance.',
  '3. Preserve units exactly as stored (Loos gauge numbers, millimeters, inches, etc.).',
  '4. Convert setting keys into machine-friendly `key` plus human `label`. Use snake_case for `key`, title case for `label`.',
  '5. Include contextual notes from the section `content` field if it explains the trim philosophy.',
  '6. Confidence should reflect data fit: perfect match ≥0.9, partial matches lower with caveats.',
  '7. If multiple guides exist for a class, rank by best wind match and include `matchScore`.',
  '',
  '## Quick Reference Matrix',
  quickReference,
  '',
  '## Structured Tuning Guide Library',
  'Reference dataset for all calculations. Keys are normalized class identifiers.',
  '```json',
  structuredLibrary,
  '```',
  ''
].join('\n');
