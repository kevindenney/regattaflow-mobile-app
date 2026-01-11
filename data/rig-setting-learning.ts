/**
 * Learning content for rig tuning settings
 * Progressive disclosure: brief → detailed → academy links
 */

export interface SettingLearning {
  brief: string;           // Level 1: One-liner explanation
  detailed?: {             // Level 2: Expandable deep-dive
    whatItDoes: string;
    effect: string;
    whenToDeviate: string[];
    related: string[];
  };
  academyLinks?: {         // Level 3: Academy deep-dive
    courseId?: string;
    interactiveId?: string;
    videoUrl?: string;
    articleSlug?: string;
  };
}

/**
 * Learning content keyed by normalized setting key
 */
export const RIG_SETTING_LEARNING: Record<string, SettingLearning> = {
  upper_shrouds: {
    brief: 'Controls forestay sag and mainsail entry shape',
    detailed: {
      whatItDoes: 'Upper shroud tension determines how much the forestay can sag under load. This directly affects jib/genoa shape and mainsail entry.',
      effect: 'Tighter = flatter sail entry, less power, better pointing. Looser = fuller entry, more power, better acceleration.',
      whenToDeviate: [
        'Choppy water: Go looser (-1 turn) for power through waves',
        'Flat water: Go tighter (+1 turn) for better pointing',
        'Old/stretched sails: Go tighter to compensate for cloth stretch',
        'Light crew weight: Go looser to maintain power',
      ],
      related: ['forestay', 'backstay', 'mast_rake'],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'ShroudTensionSimulator',
    },
  },

  lower_shrouds: {
    brief: 'Controls mast bend at spreader height',
    detailed: {
      whatItDoes: 'Lower shrouds control lateral mast bend at the spreaders. This affects mainsail shape in the middle section.',
      effect: 'Leeward bend adds twist and flattens the mid-sail. Straight mast gives fuller shape. Windward prebend depowers in heavy air.',
      whenToDeviate: [
        'Light air + flat water: Allow slight leeward bend for twist',
        'Medium breeze: Keep mast straight for balanced power',
        'Heavy air: Pull to windward to depower and open leech',
        'Waves: Slightly looser for acceleration between waves',
      ],
      related: ['upper_shrouds', 'spreader_sweep', 'prebend'],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'ShroudTensionSimulator',
    },
  },

  mast_rake: {
    brief: 'Moves center of effort fore/aft, affects helm balance',
    detailed: {
      whatItDoes: 'Mast rake tilts the entire rig forward or aft, moving the center of effort (CE) relative to the center of lateral resistance (CLR).',
      effect: 'More rake = CE moves aft = more weather helm. Less rake = CE forward = lighter helm. Affects pointing ability and feel.',
      whenToDeviate: [
        'Heavy air: More rake for weather helm to help depower',
        'Light air: Less rake for neutral/light helm',
        'Waves: Slightly less rake for easier steering',
        'If rudder is always fighting: Adjust rake to balance helm',
      ],
      related: ['forestay', 'backstay', 'mast_position'],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'HelmBalanceInteractive',
    },
  },

  mast_ram: {
    brief: 'Fine-tunes mast position at deck level',
    detailed: {
      whatItDoes: 'The mast ram pushes or pulls the mast butt forward or aft at deck level, affecting prebend and overall rig geometry.',
      effect: 'Forward = more prebend = flatter main. Aft = less prebend = fuller main. Works with backstay for shape control.',
      whenToDeviate: [
        'Heavy air: More forward for flatter shape',
        'Light air: Neutral or slightly aft for power',
        'Choppy conditions: Less forward to maintain drive',
      ],
      related: ['backstay', 'prebend', 'mast_position'],
    },
  },

  mast_position: {
    brief: 'Sets mast placement in the partners/step',
    detailed: {
      whatItDoes: 'Mast position in the boat affects rig geometry and interaction with shrouds. Usually set once and rarely adjusted.',
      effect: 'Forward = tighter shrouds required, affects rake range. Aft = different shroud angles. Class rules often specify limits.',
      whenToDeviate: [
        'Usually fixed by class rules or one-time setup',
        'Different mast manufacturers may need different positions',
      ],
      related: ['mast_rake', 'upper_shrouds'],
    },
  },

  forestay: {
    brief: 'Sets headstay length and affects jib/genoa shape',
    detailed: {
      whatItDoes: 'Forestay length determines the maximum mast rake and affects how the headsail sets. Often fixed by class rules.',
      effect: 'Shorter = more rake possible, tighter headstay. Longer = less rake, may allow more sag.',
      whenToDeviate: [
        'Usually fixed at class maximum or optimal length',
        'Adjust rake via shrouds rather than changing forestay',
      ],
      related: ['mast_rake', 'backstay', 'upper_shrouds'],
    },
  },

  backstay: {
    brief: 'Tensions forestay and flattens mainsail',
    detailed: {
      whatItDoes: 'Backstay tension pulls the masthead aft, which tightens the forestay and bends the mast to flatten the mainsail.',
      effect: 'More tension = tighter forestay (better pointing) + flatter main (depowering). Less = fuller sails for power.',
      whenToDeviate: [
        'Gusts: Pump on backstay to depower',
        'Lulls: Ease backstay for power',
        'Upwind in chop: Moderate tension for balance',
        'Reaching: Usually eased significantly',
      ],
      related: ['forestay', 'upper_shrouds', 'mast_rake'],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'ShroudTensionSimulator',
    },
  },

  runners: {
    brief: 'Support masthead and control forestay tension',
    detailed: {
      whatItDoes: 'Running backstays provide lateral support to the masthead and allow dynamic forestay tension control while sailing.',
      effect: 'Tighter = more forestay tension, flatter jib. The loaded (windward) runner should be firm; leeward eased.',
      whenToDeviate: [
        'Heavy air upwind: Both runners firm',
        'Light air: Eased for fuller sails',
        'Reaching: Weather runner on, leeward well eased',
        'Gybing: Remember to swap!',
      ],
      related: ['backstay', 'forestay'],
    },
  },

  prebend: {
    brief: 'Built-in mast curve that flattens the mainsail',
    detailed: {
      whatItDoes: 'Prebend is the forward curve built into the mast when at rest. The mainsail is cut to match this curve.',
      effect: 'More prebend = flatter sail when rig is loaded. Must match your sail cut - too much and the sail will be too flat.',
      whenToDeviate: [
        'Should match your sailmaker specifications',
        'New sails may need different prebend than old',
        'Consult your sailmaker if unsure',
      ],
      related: ['mast_ram', 'spreader_sweep', 'lower_shrouds'],
    },
  },

  spreader_sweep: {
    brief: 'Angle of spreaders affects shroud angles and mast bend',
    detailed: {
      whatItDoes: 'Spreader sweep (angle aft from perpendicular) affects how shrouds support the mast and influences mast bend characteristics.',
      effect: 'More sweep = shrouds pull mast aft, limits forward bend. Less sweep = allows more mast bend.',
      whenToDeviate: [
        'Usually fixed by class rules or rig specifications',
        'One-time setup rather than race-day adjustment',
      ],
      related: ['upper_shrouds', 'lower_shrouds', 'prebend'],
    },
  },

  vang: {
    brief: 'Controls boom height and mainsail leech tension',
    detailed: {
      whatItDoes: 'The vang (kicking strap) pulls the boom down, which tensions the leech and controls twist in the mainsail.',
      effect: 'More vang = tighter leech, less twist, more power but can stall. Less vang = more twist, depowers top of sail.',
      whenToDeviate: [
        'Heavy air: More vang to control leech',
        'Light air: Less vang for twist',
        'Reaching: Moderate vang prevents hooking',
        'Downwind: Ease vang to allow boom to rise',
      ],
      related: ['mainsheet', 'traveler'],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'MainsailControlsInteractive',
    },
  },

  cunningham: {
    brief: 'Tensions luff, moves draft forward',
    detailed: {
      whatItDoes: 'The cunningham tensions the mainsail luff, which pulls the point of maximum draft forward and flattens the entry.',
      effect: 'More cunningham = draft forward, flatter entry, opens leech slightly. Use to depower and improve pointing in breeze.',
      whenToDeviate: [
        'Heavy air: Pull hard to flatten and move draft forward',
        'Medium air: Light tension to position draft',
        'Light air: Usually none - let sail be full',
        'Old/stretched sails: More cunningham needed',
      ],
      related: ['outhaul', 'vang'],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'MainsailControlsInteractive',
    },
  },

  outhaul: {
    brief: 'Controls mainsail foot depth',
    detailed: {
      whatItDoes: 'The outhaul tensions the foot of the mainsail along the boom, controlling the depth in the lower third of the sail.',
      effect: 'Tight = flat foot, less drag, better pointing. Eased = full foot, more power, better acceleration.',
      whenToDeviate: [
        'Heavy air: Tight for flat shape',
        'Light air: Eased for full foot and power',
        'Reaching: Moderate for balance',
        'Running: Can ease significantly',
      ],
      related: ['cunningham', 'vang'],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'MainsailControlsInteractive',
    },
  },
};

/**
 * Get learning content for a setting key
 * Returns undefined if no learning content exists
 */
export function getSettingLearning(settingKey: string): SettingLearning | undefined {
  const normalized = settingKey.toLowerCase().replace(/\s+/g, '_');
  return RIG_SETTING_LEARNING[normalized];
}

/**
 * Get brief explanation for a setting
 * Returns undefined if no learning content exists
 */
export function getSettingBrief(settingKey: string): string | undefined {
  return getSettingLearning(settingKey)?.brief;
}
