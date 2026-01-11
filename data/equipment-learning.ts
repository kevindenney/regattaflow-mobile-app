/**
 * Learning content for equipment and gear preparation
 * Progressive disclosure: brief → detailed → academy links
 */

export interface EquipmentLearning {
  brief: string;
  detailed?: {
    whatItDoes: string;
    whyItMatters: string;
    checkPoints: string[];
    preRaceActions: string[];
  };
  academyLinks?: {
    courseId?: string;
    interactiveId?: string;
    videoUrl?: string;
    articleSlug?: string;
  };
}

/**
 * Learning content keyed by normalized equipment key
 */
export const EQUIPMENT_LEARNING: Record<string, EquipmentLearning> = {
  sail_selection: {
    brief: 'Match sail to conditions for optimal performance',
    detailed: {
      whatItDoes: 'Choosing the right sail inventory for the forecasted conditions. Wrong sail = wrong gear ratio.',
      whyItMatters: 'The right sail is like the right gear on a bike. Too much power = hard to control. Too little = no speed.',
      checkPoints: [
        'Check wind range for each sail',
        'Consider crew weight and skill',
        'Factor in wave conditions',
        'Think about race course length',
      ],
      preRaceActions: [
        'Review forecast wind range',
        'Pack backup sail options if allowed',
        'Check sail condition before rigging',
        'Confirm spinnaker/kite selection',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SailSelectionInteractive',
    },
  },

  jib_selection: {
    brief: 'Choose jib based on wind range and sea state',
    detailed: {
      whatItDoes: 'Different jibs are designed for different wind ranges. Selection affects pointing, power, and handling.',
      whyItMatters: 'Wrong jib can either overpower the boat or leave you underpowered. Match to conditions for best VMG.',
      checkPoints: [
        '#1 genoa: 0-8 knots, light air',
        '#2 genoa: 8-14 knots, medium',
        '#3 jib: 14-20 knots, heavy',
        '#4 blade/storm: 20+ knots',
      ],
      preRaceActions: [
        'Check forecast max/min wind',
        'Consider change time if allowed',
        'Inspect head foil condition',
        'Pre-rig backup if rules allow',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SailSelectionInteractive',
    },
  },

  spinnaker_selection: {
    brief: 'Match spinnaker to expected wind and angles',
    detailed: {
      whatItDoes: 'Different spinnakers excel at different angles and wind speeds. S1s for tight angles, A2s for reaching, etc.',
      whyItMatters: 'Wrong kite = fighting the sail instead of racing. Match to expected conditions for maximum VMG.',
      checkPoints: [
        'Check predicted downwind angles',
        'Consider wind strength on runs',
        'Think about expected jibes',
        'Factor in crew experience',
      ],
      preRaceActions: [
        'Pack in launch order',
        'Check all rigging/sheets',
        'Test halyard/retrieval',
        'Brief crew on expected changes',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SailSelectionInteractive',
    },
  },

  safety_gear: {
    brief: 'Required and recommended safety equipment',
    detailed: {
      whatItDoes: 'Safety gear protects crew and meets racing requirements. Missing safety gear = DNS or disqualification.',
      whyItMatters: 'Beyond rules compliance, safety gear saves lives. Conditions can change quickly on the water.',
      checkPoints: [
        'PFDs for all crew (inspect condition)',
        'Throwable device (within reach)',
        'Flares/signals (check expiration)',
        'VHF radio (charged, waterproof)',
        'First aid kit (complete, accessible)',
        'Knife/cutting tool (accessible)',
      ],
      preRaceActions: [
        'Complete safety equipment checklist',
        'Verify all crew have PFDs',
        'Check battery levels on electronics',
        'Brief crew on emergency procedures',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  pfd_lifejacket: {
    brief: 'Personal flotation devices for all crew',
    detailed: {
      whatItDoes: 'PFDs keep you afloat if you go overboard. Many racing rules require wearing them at all times.',
      whyItMatters: 'In cold water or big waves, a PFD can be the difference between survival and drowning.',
      checkPoints: [
        'Proper size for each crew member',
        'Automatic vs manual inflation',
        'Inspect bladder/CO2 cartridge',
        'Check all straps and buckles',
        'Verify hydrostatic release (if auto)',
      ],
      preRaceActions: [
        'All crew fit-check their PFD',
        'Verify cartridges not discharged',
        'Brief on manual inflation',
        'Decide racing vs offshore model',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  electronics_setup: {
    brief: 'Configure instruments for racing',
    detailed: {
      whatItDoes: 'Racing instruments provide wind data, speed, heading, and tactical information. Proper setup = good data.',
      whyItMatters: 'Wrong data leads to wrong decisions. Well-calibrated instruments are like having a weather station on board.',
      checkPoints: [
        'Wind angle/speed calibrated',
        'Boat speed sensor clean',
        'GPS working and accurate',
        'Displays readable in conditions',
        'Backup data sources ready',
      ],
      preRaceActions: [
        'Turn on and verify all instruments',
        'Check calibration numbers',
        'Set up race-specific displays',
        'Verify tactical functions working',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  compass: {
    brief: 'Essential navigation and tactical instrument',
    detailed: {
      whatItDoes: 'The compass tells you your heading. Combined with wind angle, it helps you play shifts and calculate laylines.',
      whyItMatters: 'Compass is your primary tool for tracking wind shifts. A 5-degree header is hard to feel but easy to see.',
      checkPoints: [
        'Compass readable at helm',
        'No magnetic interference',
        'Deviation card current',
        'Know your upwind headings',
      ],
      preRaceActions: [
        'Note baseline compass headings',
        'Set up shift-tracking system',
        'Brief crew on reporting shifts',
        'Calculate expected tacking angles',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WindShiftPredictionInteractive',
    },
  },

  rig_inspection: {
    brief: 'Check standing and running rigging',
    detailed: {
      whatItDoes: 'Rig inspection finds problems before they cause failure. A rig failure can end your race or regatta.',
      whyItMatters: 'Small issues become big problems under load. Finding wear now prevents breakage later.',
      checkPoints: [
        'Shroud terminals and toggles',
        'Spreader tips and tape',
        'Halyard shackles and splices',
        'Sheet condition and splices',
        'Blocks and turning points',
        'Mast fittings and pins',
      ],
      preRaceActions: [
        'Walk the rig visually',
        'Hand-check terminals',
        'Run halyards and test',
        'Check spare parts inventory',
      ],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'ShroudTensionSimulator',
    },
  },

  hull_inspection: {
    brief: 'Check hull condition and fittings',
    detailed: {
      whatItDoes: 'Hull inspection ensures nothing will slow you down or cause problems during racing.',
      whyItMatters: 'Drag from fouling, damage, or fittings costs boat lengths. Clean hull = fast hull.',
      checkPoints: [
        'Bottom clean and fair',
        'Rudder and centerboard condition',
        'Through-hulls sealed',
        'Drain plugs secured',
        'Deck fittings tight',
      ],
      preRaceActions: [
        'Check/clean bottom if needed',
        'Verify rudder bearings smooth',
        'Test all moving parts',
        'Secure loose items below',
      ],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'ShroudTensionSimulator',
    },
  },

  spares_kit: {
    brief: 'Emergency repair items for on-water fixes',
    detailed: {
      whatItDoes: 'A spares kit lets you fix common problems on the water instead of retiring from the race.',
      whyItMatters: 'Simple failures like a broken shackle or chafed line don\'t have to end your race.',
      checkPoints: [
        'Shackles (various sizes)',
        'Line (various sizes)',
        'Tape (rigging and electrical)',
        'Knife and pliers',
        'Spare blocks/cars',
        'Pins and rings',
      ],
      preRaceActions: [
        'Verify spares kit complete',
        'Know where everything is',
        'Brief crew on locations',
        'Check for race-specific needs',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  clothing_gear: {
    brief: 'Appropriate clothing for conditions',
    detailed: {
      whatItDoes: 'Proper clothing keeps you comfortable and performing well regardless of conditions.',
      whyItMatters: 'Cold, wet, or overheated crew make mistakes. Comfort = concentration = performance.',
      checkPoints: [
        'Base layer appropriate to temp',
        'Outer layer for spray/rain',
        'Footwear with grip',
        'Gloves if needed',
        'Sun protection',
        'Spare dry clothes for after',
      ],
      preRaceActions: [
        'Check forecast and dress accordingly',
        'Pack extras for changing conditions',
        'Verify all crew prepared',
        'Apply sunscreen before racing',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  batten_tension: {
    brief: 'Set batten tension for conditions',
    detailed: {
      whatItDoes: 'Batten tension affects mainsail shape and leech profile. Wrong tension = wrong shape.',
      whyItMatters: 'Over-tensioned battens make the sail too flat. Under-tensioned make it too full and hooky.',
      checkPoints: [
        'Check each batten pocket',
        'Verify battens not broken',
        'Match tension to conditions',
        'Top battens looser for twist',
      ],
      preRaceActions: [
        'Adjust for expected wind',
        'Tighter in heavy air',
        'Looser in light air',
        'Test shape before racing',
      ],
    },
    academyLinks: {
      courseId: 'boat-tuning-performance',
      interactiveId: 'MainsailControlsInteractive',
    },
  },

  outboard_engine: {
    brief: 'Engine ready for getting to/from course',
    detailed: {
      whatItDoes: 'The engine gets you to the course and home safely. A broken engine can mean missing the start or a long tow.',
      whyItMatters: 'Reliable engine = no stress about getting home. Saves energy for racing.',
      checkPoints: [
        'Fuel level adequate',
        'Oil level checked',
        'Prop clear and undamaged',
        'Kill switch functional',
        'Starts reliably',
      ],
      preRaceActions: [
        'Test start before leaving dock',
        'Check fuel for day length',
        'Verify kill lanyard present',
        'Know shutdown procedure',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  anchor: {
    brief: 'Anchor ready if needed',
    detailed: {
      whatItDoes: 'An anchor lets you hold position if needed before the start or in emergency.',
      whyItMatters: 'Some classes allow anchoring before starts. In emergencies, an anchor can save the boat.',
      checkPoints: [
        'Anchor rode adequate length',
        'Rode secured at both ends',
        'Shackle wired/seized',
        'Rode free to run',
      ],
      preRaceActions: [
        'Know if anchoring allowed',
        'Verify rode runs free',
        'Brief crew on deployment',
        'Practice if rarely used',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },

  food_water: {
    brief: 'Hydration and nutrition for racing',
    detailed: {
      whatItDoes: 'Proper nutrition and hydration keeps crew alert and performing throughout the race.',
      whyItMatters: 'Dehydration and low blood sugar cause mental errors. Race smart, eat and drink smart.',
      checkPoints: [
        'Water for expected duration',
        'Electrolyte drinks if hot',
        'Easy-to-eat snacks',
        'Quick energy available',
      ],
      preRaceActions: [
        'Load adequate water',
        'Pack snacks in accessible spot',
        'Eat properly before racing',
        'Plan hydration breaks',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'SafetyGearCheckInteractive',
    },
  },
};

/**
 * Get learning content for an equipment key
 */
export function getEquipmentLearning(key: string): EquipmentLearning | undefined {
  const normalized = key.toLowerCase().replace(/\s+/g, '_');
  return EQUIPMENT_LEARNING[normalized];
}

/**
 * Get brief explanation for equipment topic
 */
export function getEquipmentBrief(key: string): string | undefined {
  return getEquipmentLearning(key)?.brief;
}
