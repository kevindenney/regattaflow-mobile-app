/**
 * Learning content for weather and conditions analysis
 * Progressive disclosure: brief → detailed → academy links
 */

export interface WeatherLearning {
  brief: string;
  detailed?: {
    whatItDoes: string;
    effect: string;
    keyIndicators: string[];
    tacticalImplications: string[];
  };
  academyLinks?: {
    courseId?: string;
    interactiveId?: string;
    videoUrl?: string;
    articleSlug?: string;
  };
}

/**
 * Learning content keyed by normalized setting key
 */
export const WEATHER_LEARNING: Record<string, WeatherLearning> = {
  wind_speed: {
    brief: 'Determines sail selection and rig setup',
    detailed: {
      whatItDoes: 'Wind speed is the primary factor in choosing your sail inventory and rig tension. Different wind ranges require different approaches.',
      effect: 'Light air (0-8 kts) needs full sails and loose rig. Medium (8-15 kts) is optimal for most boats. Heavy (15+ kts) requires depowering and reef consideration.',
      keyIndicators: [
        'Check forecast trends - is wind building or dying?',
        'Look for gusts vs lulls pattern',
        'Note difference between true and apparent wind',
        'Consider your boat\'s optimal wind range',
      ],
      tacticalImplications: [
        'Light air: Minimize maneuvers, keep boat moving',
        'Medium air: Focus on boat speed and tactics',
        'Heavy air: Keep boat under control, don\'t capsize',
        'Building breeze: Plan for power reduction',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  wind_direction: {
    brief: 'Affects course strategy and start line bias',
    detailed: {
      whatItDoes: 'Wind direction determines which end of the start line is favored, which side of the course to play, and how the course will feel.',
      effect: 'Shifts can make or break your race. A 5-degree shift can gain or lose 3+ boat lengths. Persistent shifts favor one side of the course.',
      keyIndicators: [
        'Check forecast for directional trends',
        'Look for geographic influences (land/sea)',
        'Note cloud patterns indicating shifts',
        'Watch for oscillating vs persistent shifts',
      ],
      tacticalImplications: [
        'Play the shifts - tack on headers',
        'Consider geographic wind bends',
        'Start at favored end',
        'Position for expected shifts',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WindShiftPredictionInteractive',
    },
  },

  current_speed: {
    brief: 'Affects boat speed over ground and laylines',
    detailed: {
      whatItDoes: 'Current can add or subtract from your boat speed. A 1-knot current in a 5-knot boat equals 20% speed change.',
      effect: 'Current changes your effective VMG and shifts your laylines. Understanding current is often the difference between winning and losing.',
      keyIndicators: [
        'Check tidal charts for direction and strength',
        'Note time of tide change during race',
        'Look for current lines (debris, color change)',
        'Consider depth effects on current strength',
      ],
      tacticalImplications: [
        'Stay in favorable current',
        'Avoid lee-bow current upwind',
        'Adjust laylines for current',
        'Time mark roundings with current',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'CurrentReadingInteractive',
    },
  },

  current_direction: {
    brief: 'Critical for layline and mark rounding strategy',
    detailed: {
      whatItDoes: 'Current direction relative to wind and course affects your optimal sailing angles and approach to marks.',
      effect: 'Current with the wind = chop, harder to point. Current against wind = flat water, can point higher. Crosscurrent = layline shift.',
      keyIndicators: [
        'Check tide tables for direction',
        'Note current at marks vs mid-course',
        'Watch how anchored boats lie',
        'Look for current differential across course',
      ],
      tacticalImplications: [
        'Upwind: Tack into favorable current',
        'Downwind: Stay in current pushing toward mark',
        'At marks: Account for set in approach',
        'Crossings: Factor current into time/distance',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'CurrentReadingInteractive',
    },
  },

  wave_height: {
    brief: 'Affects boat handling and optimal VMG angles',
    detailed: {
      whatItDoes: 'Waves require different sailing techniques. The angle and height of waves changes how you sail upwind and downwind.',
      effect: 'Bigger waves = need to foot more upwind, sail deeper downwind. Wave timing affects acceleration and mode changes.',
      keyIndicators: [
        'Note wave period (time between waves)',
        'Observe wave direction vs wind',
        'Check if waves are building or subsiding',
        'Look for cross-swell patterns',
      ],
      tacticalImplications: [
        'Upwind in waves: Foot for speed, then point',
        'Downwind: Surf waves, pump legally',
        'Light wind + waves: Minimize hobby-horsing',
        'Crew weight forward in chop',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  swell_direction: {
    brief: 'Determines surfing angles and mark approach',
    detailed: {
      whatItDoes: 'Swell direction independent of wind direction affects your sailing angles and approach strategy, especially downwind.',
      effect: 'Cross-swell creates confused seas. Following swell offers surfing opportunities. Head swell slows VMG.',
      keyIndicators: [
        'Observe swell vs wind-wave alignment',
        'Note swell period and size',
        'Check forecast for swell changes',
        'Look for refraction around points',
      ],
      tacticalImplications: [
        'Downwind: Angle for best surfing',
        'Upwind: Time tacks for swell pattern',
        'At marks: Account for swell push',
        'Consider swell shelter near shore',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  pressure_trend: {
    brief: 'Indicates likely wind changes over race period',
    detailed: {
      whatItDoes: 'Barometric pressure trends indicate incoming weather systems. Falling pressure often means increasing wind.',
      effect: 'Rising pressure = stable/dying wind. Falling pressure = building wind, possible shift. Rapid change = significant weather.',
      keyIndicators: [
        'Check 24-hour pressure trend',
        'Note rate of pressure change',
        'Look for frontal passages',
        'Watch cloud development',
      ],
      tacticalImplications: [
        'Falling fast: Prepare for more wind',
        'Rising: Expect lighter, steadier',
        'Front approaching: Plan for shift',
        'Stable: Trust current conditions',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  cloud_cover: {
    brief: 'Affects thermal activity and wind stability',
    detailed: {
      whatItDoes: 'Cloud patterns indicate atmospheric stability and can predict wind changes. Different cloud types mean different conditions.',
      effect: 'Clear skies = strong thermals, puffy wind. Overcast = steadier but often lighter. Cumulus buildup = possible squalls.',
      keyIndicators: [
        'Watch cumulus development height',
        'Note cloud movement vs surface wind',
        'Look for squall clouds (dark bases)',
        'Observe fog/marine layer burn-off',
      ],
      tacticalImplications: [
        'Cumulus: Expect gusts and shifts',
        'Overcast: More predictable conditions',
        'Squalls visible: Prepare tactics',
        'Sea breeze: Watch for thermal kicks',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  visibility: {
    brief: 'Safety consideration and tactical factor',
    detailed: {
      whatItDoes: 'Visibility affects safety and your ability to read the course. Low visibility requires different tactical approach.',
      effect: 'Good visibility = read puffs from distance. Poor visibility = react mode, stay safe. Fog = safety priority.',
      keyIndicators: [
        'Check forecast visibility',
        'Note fog/mist burn-off time',
        'Watch for rain reducing visibility',
        'Consider sun angle (glare)',
      ],
      tacticalImplications: [
        'Low viz: Stay closer to other boats',
        'Fog: Conservative tactics, safety first',
        'Rain: Watch for wind with squalls',
        'Sun glare: Position accordingly',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  temperature: {
    brief: 'Affects crew comfort and thermal activity',
    detailed: {
      whatItDoes: 'Temperature differential between land and water drives sea breezes. Also affects crew performance and gear choices.',
      effect: 'Land warmer than water = sea breeze. Large differential = stronger thermal. Cold = crew fatigue faster.',
      keyIndicators: [
        'Check land vs water temperature',
        'Note heating through the day',
        'Consider crew clothing needs',
        'Watch for temperature-driven wind',
      ],
      tacticalImplications: [
        'Hot land: Expect afternoon sea breeze',
        'Cold conditions: Keep crew warm/effective',
        'Temperature change: Wind may follow',
        'Plan hydration strategy',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  weather_window: {
    brief: 'Identify optimal racing conditions timing',
    detailed: {
      whatItDoes: 'Weather windows are periods of optimal conditions. Understanding when conditions will be best helps with race planning.',
      effect: 'Racing in optimal window = better performance. Missing window = tougher conditions or delays.',
      keyIndicators: [
        'Check hourly forecast for trends',
        'Note scheduled start time vs conditions',
        'Identify best wind period',
        'Plan for conditions at end of race',
      ],
      tacticalImplications: [
        'Early start: What will conditions do?',
        'Building: Plan conservative early',
        'Dying: Be aggressive early',
        'Shifty: Stay in phase',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WeatherAnalysisInteractive',
    },
  },

  sea_breeze: {
    brief: 'Thermal wind from land-water temperature differential',
    detailed: {
      whatItDoes: 'Sea breeze develops when land heats faster than water. It can override gradient wind or enhance it.',
      effect: 'Sea breeze typically fills from 11am-2pm, peaks mid-afternoon, dies at sunset. Direction perpendicular to shore.',
      keyIndicators: [
        'Check temperature differential',
        'Watch cloud line development',
        'Note gradient wind direction',
        'Observe birds/flags onshore',
      ],
      tacticalImplications: [
        'Position for sea breeze fill',
        'Plan for direction change',
        'Expect pressure increase',
        'Right side often pays initially',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WindShiftPredictionInteractive',
    },
  },

  geographic_effects: {
    brief: 'Local terrain effects on wind and current',
    detailed: {
      whatItDoes: 'Hills, buildings, and shoreline shape affect wind flow. Understanding local effects is crucial for venue knowledge.',
      effect: 'Wind bends around points, accelerates through gaps, lifts over obstacles. These create predictable patterns.',
      keyIndicators: [
        'Study chart for land features',
        'Note wind shadows from shore',
        'Identify acceleration zones',
        'Watch for corner effects at marks',
      ],
      tacticalImplications: [
        'Avoid wind shadows',
        'Use geographic wind bends',
        'Position for known effects',
        'Factor in at mark roundings',
      ],
    },
    academyLinks: {
      courseId: 'race-preparation-mastery',
      interactiveId: 'WindShiftPredictionInteractive',
    },
  },
};

/**
 * Get learning content for a weather key
 */
export function getWeatherLearning(key: string): WeatherLearning | undefined {
  const normalized = key.toLowerCase().replace(/\s+/g, '_');
  return WEATHER_LEARNING[normalized];
}

/**
 * Get brief explanation for a weather topic
 */
export function getWeatherBrief(key: string): string | undefined {
  return getWeatherLearning(key)?.brief;
}
