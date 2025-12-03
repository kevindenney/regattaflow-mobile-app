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
      title: 'North Sails Dragon Tuning Guide',
      source: 'North Sails',
      sourceUrl: 'https://www.onedesign.com/app/uploads/2019/12/Dragon-Tuning-Guide-2020.pdf',
      year: 2020,
      description: 'Official North Sails tuning guide for Dragon class with Petticrow and Borreskov & Bojsen-Møller masts. Comprehensive settings for all wind ranges.',
      tags: ['rig', 'mast', 'sail', 'genoa', 'mainsail'],
      mast: 'Petticrow / Borreskov & Bojsen-Møller',
      sailmaker: 'North Sails',
      sections: [
        {
          title: 'Light Air Setup (0-5 knots)',
          content: 'Light air setup optimized for power and acceleration. Mast bend to leeward at spreader level for full sail shapes. Minimal runner tension to allow mast pre-bend.',
          conditions: {
            windSpeed: '0-5 kts',
            seaState: 'Flat water',
            points: 'all',
          },
          settings: {
            'upper shrouds': 'Loos PT-2M 14 (Std. Petti/BB) or Loos 12 (stiff Petti) minus 1 turn',
            'lower shrouds': 'Let mast bend 1 cm to leeward at spreader level',
            'mast position': 'Petticrow: 83.0 cm from station 4 to mast front; BB: 81.5 cm',
            'mast rake': 'Petticrow: 122.5-123.5 cm (80cm up from deck); BB: 120.0 cm',
            'forestay': 'Fixed 1.86 cm from mast front (class maximum)',
            'mast ram': '1.5 cm forward at deck',
            'runners': 'Slack to 15-16 cm above deck (Mark #4)',
            'backstay': 'Light tension to pre-bend mast',
            'mainsail sheet': 'Light sheeting, upper telltales flying straight back',
            'main traveller': 'To windward, boom on middle',
            'main outhaul': '2.0 cm from black band',
            'cunningham': 'Loose',
            'genoa sheet': 'Foot just touches shroud at deck level',
            'genoa barberhaul': '15-18 cm from spreader',
            'boomvang': 'Loose upwind, cleated for run',
            'jumpers': 'Loos 6, mast straight side-to-side',
          },
        },
        {
          title: 'Medium Air Setup (6-16 knots)',
          content: 'Base settings for balanced power and control. Mast straight with neutral ram position. Runners marked for consistent forestay tension. Sheet until top batten parallel with boom.',
          conditions: {
            windSpeed: '6-16 kts',
            seaState: '0.5-1m chop',
            points: 'all',
          },
          settings: {
            'upper shrouds': 'Loos PT-2M 14 (Std. Petti/BB) or Loos 12 (stiff Petti) plus 1-2 turns',
            'lower shrouds': 'Mast straight',
            'mast position': 'Petticrow: 83.0 cm from station 4 to mast front; BB: 81.5 cm',
            'mast rake': 'Petticrow: 122.5-123.5 cm (80cm up from deck); BB: 120.0 cm',
            'forestay': 'Fixed 1.86 cm from mast front (class maximum)',
            'mast ram': 'Neutral position',
            'runners': '15-5 cm above deck (Mark #3-#2)',
            'backstay': 'Just tight to prevent mast top moving in waves',
            'mainsail sheet': 'Sheet until top batten parallel with boom, upper telltales 20% on leeward side',
            'main traveller': 'To windward, boom on middle',
            'main outhaul': '1 cm from black band',
            'cunningham': 'Loose - just remove wrinkles',
            'genoa sheet': 'Foot touching 10 cm up at shrouds',
            'genoa barberhaul': '5 cm from spreader',
            'boomvang': 'Loose upwind, cleated for run. On reach/run pull until top batten parallel to boom',
            'jumpers': 'Loos 6, mast straight side-to-side',
            'sail inventory': 'Mainsail A-7+ (Std. Petti & BB) or LM-2 (stiff Petti); Genoa MG-15 / MJ-8 (light/medium)',
          },
        },
        {
          title: 'Heavy Air Setup (17+ knots)',
          content: 'Depowering mode with increased rig tension and flattened sails. Mast bends to windward via lower shrouds. Maximum runner tension (Mark #1 = forestay Loos 30). Top batten twisted 2° to leeward.',
          conditions: {
            windSpeed: '17+ kts',
            seaState: 'Steep wind waves',
            points: 'all',
          },
          settings: {
            'upper shrouds': 'Loos PT-2M 14 (Std. Petti/BB) or Loos 12 (stiff Petti) plus 3 turns',
            'lower shrouds': 'Mast straight plus 1-1.5 turns so mast bends to windward',
            'mast position': 'Petticrow: 83.0 cm from station 4 to mast front; BB: 81.5 cm',
            'mast rake': 'Petticrow: 122.5-123.5 cm (80cm up from deck); BB: 120.0 cm',
            'forestay': 'Fixed 1.86 cm from mast front (class maximum)',
            'mast ram': '2.5 cm forward at deck',
            'runners': '5-0 cm above deck, maximum tension (Mark #1 = forestay Loos 30)',
            'backstay': 'Just tight to prevent mast top moving',
            'mainsail sheet': 'Top batten 2° twisted to leeward, telltales flying straight back',
            'main traveller': 'On middle up to 10 cm to leeward',
            'main outhaul': 'All the way to black band',
            'cunningham': 'Just remove wrinkles (pull hard in very heavy to move draft forward)',
            'genoa sheet': 'Foot touching 25 cm up at shrouds',
            'genoa barberhaul': '8 cm from spreader',
            'boomvang': 'Loose upwind, cleated for run. On reach/run pull until top batten parallel to boom',
            'jumpers': 'Loos 6, mast straight side-to-side',
            'sail inventory': 'Mainsail A-10 (stiff Petti) in 17+ knots; Genoa HG-15 / MJ-8H (heavy)',
            'crew notes': 'For light crews (220-240 kg): Place shrouds one hole forward (80 cm from station 4)',
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
