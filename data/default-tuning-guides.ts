import type { ExtractedSection } from '@/services/TuningGuideExtractionService';

export interface DefaultTuningGuideDefinition {
  title: string;
  source: string;
  sourceUrl?: string;
  year?: number;
  description?: string;
  tags?: string[];
  hull?: string;
  mast?: string;
  sailmaker?: string;
  rig?: string;
  fileType?: 'pdf' | 'doc' | 'image' | 'link';
  sections: ExtractedSection[];
}

export type DefaultGuideLibrary = Record<string, DefaultTuningGuideDefinition[]>;

export const DEFAULT_GUIDES: DefaultGuideLibrary = {
  dragon: [
    {
      title: 'Dragon Class European Trim Reference',
      source: 'RegattaFlow Sail Lab',
      sourceUrl: 'https://regattaflow.ai/tuning/dragon',
      year: 2024,
      description: 'Integrated rig, sail, mast and hull trim targets for modern Dragon programs.',
      tags: ['rig', 'mast', 'sail', 'hull'],
      mast: 'Southern Spars',
      sailmaker: 'North Sails',
      sections: [
        {
          title: 'Medium Air Championship Setup (10-14 kts)',
          content: 'Balanced power mode for sea-breeze regattas. Focus on groove and acceleration off the line.',
          conditions: {
            windSpeed: '10-14 kts',
            seaState: '0.5-1m chop',
            points: 'upwind',
          },
          settings: {
            'upper shrouds': 'Loos PT-2 30 (320 kg)',
            'lower shrouds': 'Loos PT-2 24 (210 kg)',
            'forestay length': '5175 mm (pin 6, headstay max legal)',
            'mast rake': '7800 mm (masthead to transom deck edge)',
            'spreader sweep': '172 mm sweep, 515 mm length',
            'backstay tension': 'Sheet on to maintain 30 mm mast bend',
            'vang': 'On hard at weather mark, ease 50% on beat',
            'main outhaul': '8 mm eased from black band',
            'jib halyard': 'Remove wrinkles, keep 15 mm headstay sag',
            'hull trim': 'Crew weight 20 cm forward in chop, centre crew hiking flat',
            'mast partners': 'Wedge to 4 mm gap leeward to keep column centred',
          },
        },
        {
          title: 'Heavy Air Breeze Mode (18-24 kts)',
          content: 'Depower early, lock the rig and protect rudder grip downwind.',
          conditions: {
            windSpeed: '18-24 kts',
            seaState: 'Steep wind waves',
            points: 'all',
          },
          settings: {
            'upper shrouds': 'Loos PT-2 34 (355 kg)',
            'lower shrouds': 'Loos PT-2 28 (245 kg)',
            'mast rake': '7815 mm (2 holes longer forestay)',
            'backstay': 'Max tension upwind, ease to 50% on run',
            'vang': 'Block-to-block, ease in puffs downwind',
            'cunningham': 'Firm on both sails to remove overbend wrinkles',
            'main outhaul': 'Strap to black band',
            'jib halyard': 'Hard on, target zero luff sag',
            'hull trim': 'Crew aft to release bow, bowman down low to reduce drag',
            'rudder toe-in': '1 mm toe-in to keep helm neutral',
          },
        },
      ],
    },
  ],
  j70: [
    {
      title: 'J/70 World Circuit Playbook',
      source: 'One Design Speed Lab',
      year: 2023,
      tags: ['rig', 'mast', 'sail'],
      rig: 'Southern Spars Carbon',
      sections: [
        {
          title: 'Base Rig Tune (8-12 kts)',
          content: 'Baseline that most pro teams lock in before small adjustments for venue.',
          conditions: {
            windSpeed: '8-12 kts',
            points: 'upwind',
          },
          settings: {
            'upper shrouds': 'Loos PT-1M 26',
            'lower shrouds': 'Loos PT-1M 23',
            'mast rake': '21\' 7 3/4" (masthead to transom corner)',
            'forestay length': '3122 mm (turnbuckle exposed 7 threads)',
            'backstay': 'Two-block in 14 kts, ease 200 mm in 8 kts',
            'vang': 'Snug reaching, firm downwind in breeze',
            'jib halyard': 'Mark 0 at just smooth, pull +3 marks in waves',
            'main outhaul': 'Hand width off band under 10 kts, on band above 12',
            'cunningham': 'On only past 12 kts',
          },
        },
        {
          title: 'Light Air Mode (4-7 kts)',
          content: 'Target heel 6-8°, keep groove with eased rig and flow over foils.',
          conditions: {
            windSpeed: '4-7 kts',
            seaState: 'Flat water',
            points: 'upwind',
          },
          settings: {
            'upper shrouds': 'Loos PT-1M 23',
            'lower shrouds': 'Loos PT-1M 18',
            'backstay tension': 'Completely eased',
            'mast butt': 'Forward to light-air mark',
            'vang': 'Slack, only remove leech flutter downwind',
            'main outhaul': 'Two fists off band',
            'jib lead': 'Two holes forward of base',
            'hull trim': 'Crew 40 cm forward, weight to leeward to induce heel',
          },
        },
      ],
    },
  ],
  etchells: [
    {
      title: 'Etchells Grand Prix Settings',
      source: 'Class Technical Committee',
      year: 2024,
      tags: ['rig', 'mast', 'sail', 'hull'],
      mast: 'Hall Spars',
      sections: [
        {
          title: 'Standard Rake & Shroud Targets',
          content: 'Settings calibrated to suit 15-18 kts with North AP inventory.',
          conditions: {
            windSpeed: '15-18 kts',
            points: 'all',
          },
          settings: {
            'mast rake': '47\' 7" (masthead to transom deck edge)',
            'forestay length': '4220 mm (turnbuckle mid setting)',
            'upper shrouds': 'Loos PT-2 29',
            'lower shrouds': 'Loos PT-2 19',
            'spreader sweep': '175 mm sweep, 450 mm length',
            'backstay': 'Block-to-block in puffs, ease 150 mm downwind',
            'vang': 'Firm on reaches to support leech',
            'outhaul': 'On band upwind, ease 20 mm downwind',
            'mast butt': 'Base position 540 mm from transom',
            'hull trim': 'Keep 5 mm leeward heel upwind, crew aft in waves',
          },
        },
      ],
    },
  ],
  ilca7: [
    {
      title: 'ILCA 7 Olympic Tuning Matrix',
      source: 'World Sailing Development',
      year: 2024,
      tags: ['sail', 'mast', 'rig'],
      sections: [
        {
          title: 'Radial Cut MKII - Medium Breeze',
          content: 'Applies to ILCA 7 with composite top mast. Prioritise leech return and low drag.',
          conditions: {
            windSpeed: '12-16 kts',
            seaState: 'Short chop',
            points: 'all',
          },
          settings: {
            'vang': 'Sheeted hard upwind, always inside blocks downwind',
            'cunningham': 'Down to boom, remove wrinkles from upper mast',
            'outhaul': 'On band for upwind, ease 25 mm reaching',
            'mast rotation': 'Keep top mast aligned to leech telltales',
            'daggerboard rake': 'Neutral, 5 mm aft in overpowered reaches',
            'sail tuning': 'Ensure battens tensioned to “two finger” resistance',
            'hull trim': 'Keep bow just kissing chop, hike max power',
          },
        },
        {
          title: 'Light Air Pump Mode',
          content: 'Power build trim for sub-8 kts with carbon lower mast.',
          conditions: {
            windSpeed: '4-7 kts',
            seaState: 'Flat',
            points: 'downwind',
          },
          settings: {
            'vang': 'Off, boom lifting 10 cm on roll',
            'cunningham': 'Completely eased',
            'outhaul': 'Hand-width from band',
            'mast rotation': 'Slight leeward bend to project sail',
            'daggerboard rake': '2 cm forward to prevent leeway in rolls',
            'sail tuning': 'Ease leech cord to avoid hooking',
          },
        },
      ],
    },
  ],
  optimist: [
    {
      title: 'Optimist Gold Fleet Fast Pack',
      source: 'Youth Performance Lab',
      year: 2023,
      tags: ['rig', 'sail', 'hull'],
      sections: [
        {
          title: 'Coach Mike Medium Breeze Trim',
          content: 'Works on Epoxy hulls with North P-5 sail.',
          conditions: {
            windSpeed: '9-13 kts',
            points: 'upwind',
          },
          settings: {
            'sprits tension': 'Block-to-block plus 20 mm, adjust for wrinkles',
            'vang': 'Snug to prevent leech flutter',
            'mast rake': '283 cm (mast top to transom corner)',
            'mast partners': 'Shim mast to zero play, centre with tape',
            'daggerboard rake': 'Neutral, use forward stopper in breeze',
            'sail tuning': 'Ease outhaul 15 mm from boom band',
            'hull trim': 'Sailor just forward of centre thwart, hike flat',
          },
        },
        {
          title: 'Light Air Mode',
          content: 'Keep boat moving, reduce wetted surface.',
          conditions: {
            windSpeed: '4-7 kts',
            points: 'all',
          },
          settings: {
            'sprits tension': 'Ease to remove diagonal wrinkles only',
            'vang': 'Off completely',
            'mast rake': '284 cm (plus 1 cm from base)',
            'daggerboard rake': 'Pull board 3 cm up to free stern',
            'sail tuning': 'Ease outhaul 30 mm, sheet to top tell tale just streaming',
            'hull trim': 'Slide 10 cm forward, keep leeward heel 5°',
          },
        },
      ],
    },
  ],
};

const CLASS_ALIASES: Record<string, string> = {
  dragon: 'dragon',
  internationaldragon: 'dragon',
  dragons: 'dragon',
  j70: 'j70',
  j70class: 'j70',
  etchells: 'etchells',
  etchells22: 'etchells',
  ilca: 'ilca7',
  ilca7: 'ilca7',
  laser: 'ilca7',
  laserstandard: 'ilca7',
  optimist: 'optimist',
  oppi: 'optimist',
};

export function normalizeClassKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getDefaultGuidesForClass(className?: string | null): DefaultTuningGuideDefinition[] {
  if (!className) {
    return [];
  }

  const normalized = normalizeClassKey(className);
  const aliasKey = CLASS_ALIASES[normalized] || normalized;

  return DEFAULT_GUIDES[aliasKey] || [];
}

export function getAllDefaultTuningGuides(): DefaultGuideLibrary {
  return DEFAULT_GUIDES;
}
