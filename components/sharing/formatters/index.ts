/**
 * Content Formatters
 * Format race content for sharing via different channels
 */

import type { ShareableContent, RaceResult } from '../types';

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format position with ordinal suffix (1st, 2nd, 3rd, etc.)
 */
function formatPosition(position: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  return position + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

/**
 * Format pre-race strategy content for sharing
 */
export function formatPreRaceContent(content: ShareableContent): string {
  const lines: string[] = [];
  const { raceDate, raceName, venue, boatClass, preRace } = content;

  lines.push(`🏁 PRE-RACE STRATEGY`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📍 ${raceName}`);
  lines.push(`📅 ${formatDate(raceDate)}`);
  if (venue && venue !== 'Venue TBD') lines.push(`🌊 ${venue}`);
  if (boatClass && boatClass !== 'Class TBD') lines.push(`⛵ ${boatClass}`);

  // Show race type and start time if available
  if (preRace?.raceInfo?.raceType) {
    const typeLabel = preRace.raceInfo.raceType === 'distance' ? '🏔️ Distance Race' :
                      preRace.raceInfo.raceType === 'team' ? '👥 Team Race' :
                      preRace.raceInfo.raceType === 'match' ? '⚔️ Match Race' : '🏁 Fleet Race';
    lines.push(typeLabel);
  }
  if (preRace?.raceInfo?.startTime) {
    lines.push(`⏰ Start: ${preRace.raceInfo.startTime}`);
  }
  if (preRace?.raceInfo?.totalDistanceNm) {
    lines.push(`📏 Distance: ${preRace.raceInfo.totalDistanceNm} nm`);
  }
  lines.push('');

  // Weather conditions
  if (preRace?.raceInfo?.weather) {
    const w = preRace.raceInfo.weather;
    lines.push(`🌤️ CONDITIONS`);
    const parts: string[] = [];

    if (w.windSpeed !== undefined) {
      const windStr = w.windSpeedMax
        ? `Wind: ${w.windSpeed}-${w.windSpeedMax} kts`
        : `Wind: ${w.windSpeed} kts`;
      parts.push(windStr + (w.windDirection ? ` from ${w.windDirection}` : ''));
    }
    if (w.tideState) {
      parts.push(`Tide: ${w.tideState}${w.tideHeight ? ` (${w.tideHeight.toFixed(1)}m)` : ''}`);
    }
    if (w.currentSpeed !== undefined && w.currentSpeed > 0) {
      parts.push(`Current: ${w.currentSpeed.toFixed(1)} kts${w.currentDirection ? ` ${w.currentDirection}` : ''}`);
    }
    if (w.waveHeight !== undefined && w.waveHeight > 0) {
      parts.push(`Waves: ${w.waveHeight.toFixed(1)}m`);
    }

    lines.push(parts.join(' • '));
    lines.push('');
  }

  // Rig tuning
  if (preRace?.raceInfo?.rigTuning) {
    const rig = preRace.raceInfo.rigTuning;
    lines.push(`⚙️ RIG SETUP`);
    if (rig.preset) lines.push(`Preset: ${rig.preset}`);
    if (rig.windRange) lines.push(`Wind Range: ${rig.windRange}`);
    if (rig.settings) {
      const s = rig.settings;
      const settingsLines: string[] = [];
      if (s.cunningham) settingsLines.push(`Cunningham: ${s.cunningham}`);
      if (s.outhaul) settingsLines.push(`Outhaul: ${s.outhaul}`);
      if (s.vang) settingsLines.push(`Vang: ${s.vang}`);
      if (settingsLines.length > 0) {
        lines.push(settingsLines.join(' | '));
      }
    }
    lines.push('');
  }

  // Strategy sections
  const addSection = (emoji: string, title: string, text: string | undefined | null) => {
    if (text && text.trim()) {
      lines.push(`${emoji} ${title.toUpperCase()}`);
      lines.push(text.trim());
      lines.push('');
    }
  };

  if (preRace?.userNotes) {
    addSection('📝', 'My Notes', preRace.userNotes);
  }
  if (preRace?.startStrategy) {
    addSection('🏁', 'Start', preRace.startStrategy);
  }
  if (preRace?.upwindStrategy) {
    addSection('⬆️', 'Upwind', preRace.upwindStrategy);
  }
  if (preRace?.downwindStrategy) {
    addSection('⬇️', 'Downwind', preRace.downwindStrategy);
  }

  // AI recommendations
  if (preRace?.windStrategy || preRace?.tideStrategy) {
    lines.push(`🤖 AI RECOMMENDATIONS`);
    if (preRace.windStrategy) lines.push(`Wind: ${preRace.windStrategy}`);
    if (preRace.tideStrategy) lines.push(`Tide: ${preRace.tideStrategy}`);
    lines.push('');
  }

  // AI insights
  if (preRace?.aiInsights && preRace.aiInsights.length > 0) {
    lines.push(`💡 KEY INSIGHTS`);
    preRace.aiInsights.forEach(insight => {
      lines.push(`• ${insight}`);
    });
    lines.push('');
  }

  // NOR/SI Document Data (crew briefing info)
  if (preRace?.documentData) {
    const doc = preRace.documentData;

    // Key Schedule
    if (doc.schedule && doc.schedule.length > 0) {
      lines.push(`📅 KEY DATES`);
      // Sort by date and time
      const sortedSchedule = [...doc.schedule].sort((a, b) => {
        const dateA = `${a.date} ${a.time}`;
        const dateB = `${b.date} ${b.time}`;
        return dateA.localeCompare(dateB);
      });
      sortedSchedule.forEach(item => {
        const mandatory = item.mandatory ? ' ⚠️' : '';
        const eventDate = new Date(item.date);
        const dateStr = eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        lines.push(`• ${dateStr} ${item.time} - ${item.event}${mandatory}`);
        if (item.location) {
          lines.push(`  📍 ${item.location}`);
        }
      });
      lines.push('');
    } else if (doc.warningSignalTime) {
      // Fallback if no schedule but we have warning signal time
      lines.push(`📅 WARNING SIGNAL`);
      lines.push(`⏰ ${doc.warningSignalTime}`);
      lines.push('');
    }

    // Entry Requirements
    const hasEntryInfo = doc.entryDeadline || doc.entryFees?.length || doc.crewRequirements || doc.minimumCrew || doc.minorSailorRules;
    if (hasEntryInfo) {
      lines.push(`📋 ENTRY`);
      if (doc.entryDeadline) {
        lines.push(`Deadline: ${doc.entryDeadline}`);
      }
      if (doc.entryFees && doc.entryFees.length > 0) {
        doc.entryFees.forEach(fee => {
          const deadline = fee.deadline ? ` (by ${fee.deadline})` : '';
          lines.push(`${fee.type}: ${fee.amount}${deadline}`);
        });
      }
      if (doc.minimumCrew) {
        lines.push(`Min Crew: ${doc.minimumCrew}`);
      }
      if (doc.crewRequirements) {
        lines.push(`Crew Rules: ${doc.crewRequirements}`);
      }
      if (doc.minorSailorRules) {
        lines.push(`Under 18: ${doc.minorSailorRules}`);
      }
      lines.push('');
    }

    // Route (for distance races)
    if (doc.routeWaypoints && doc.routeWaypoints.length > 0) {
      lines.push(`🗺️ ROUTE`);
      if (doc.totalDistanceNm) {
        lines.push(`Total Distance: ${doc.totalDistanceNm} nm`);
      }
      const sortedWaypoints = [...doc.routeWaypoints].sort((a, b) => (a.order || 0) - (b.order || 0));
      sortedWaypoints.forEach((wp, idx) => {
        const notes = wp.notes ? ` (${wp.notes})` : '';
        lines.push(`${idx + 1}. ${wp.name}${notes}`);
      });
      lines.push('');
    }

    // Communications
    if (doc.vhfChannels && doc.vhfChannels.length > 0) {
      lines.push(`📻 VHF CHANNELS`);
      doc.vhfChannels.forEach(ch => {
        const classes = ch.classes?.length ? ` [${ch.classes.join(', ')}]` : '';
        lines.push(`• Ch ${ch.channel}: ${ch.purpose}${classes}`);
      });
      lines.push('');
    }

    // Safety & Prohibited Areas
    const hasSafetyInfo = doc.safetyRequirements || (doc.prohibitedAreas && doc.prohibitedAreas.length > 0);
    if (hasSafetyInfo) {
      lines.push(`⚠️ SAFETY`);
      if (doc.safetyRequirements) {
        lines.push(doc.safetyRequirements);
      }
      if (doc.prohibitedAreas && doc.prohibitedAreas.length > 0) {
        lines.push('Prohibited Areas:');
        doc.prohibitedAreas.forEach(area => {
          const consequence = area.consequence ? ` → ${area.consequence}` : '';
          lines.push(`• ${area.name}${consequence}`);
        });
      }
      lines.push('');
    }

    // Time limit (for distance races)
    if (doc.timeLimitHours) {
      lines.push(`⏱️ Time Limit: ${doc.timeLimitHours} hours`);
      lines.push('');
    }
  }

  // Check if we have any meaningful content beyond basic info
  const hasContent = preRace?.raceInfo?.weather ||
                     preRace?.raceInfo?.rigTuning ||
                     preRace?.userNotes ||
                     preRace?.startStrategy ||
                     preRace?.upwindStrategy ||
                     preRace?.downwindStrategy ||
                     preRace?.aiInsights?.length;

  if (!hasContent) {
    lines.push(`📋 RACE PREP CHECKLIST`);
    lines.push(`• Set venue location for weather forecast`);
    lines.push(`• Add strategy notes in race prep`);
    lines.push(`• Select your boat and sails`);
    lines.push('');
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Generated by RegattaFlow`);

  return lines.join('\n');
}

/**
 * Format post-race analysis content for sharing
 */
export function formatPostRaceContent(content: ShareableContent): string {
  const lines: string[] = [];
  const { raceDate, raceName, venue, boatClass, postRace } = content;

  lines.push(`🏁 RACE COMPLETE`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📍 ${raceName}`);
  lines.push(`📅 ${formatDate(raceDate)}`);
  if (venue) lines.push(`🌊 ${venue}`);
  if (boatClass) lines.push(`⛵ ${boatClass}`);
  lines.push('');

  // Result
  if (postRace?.result) {
    const r = postRace.result;
    lines.push(`🏆 RESULT`);
    if (r.status) {
      lines.push(`${r.status}`);
    } else {
      lines.push(`${formatPosition(r.position)} of ${r.fleetSize} boats`);
      if (r.points !== undefined) {
        lines.push(`${r.points} points`);
      }
    }
    lines.push('');
  }

  // Key takeaway / learning
  if (postRace?.keyLearning) {
    lines.push(`💡 KEY TAKEAWAY`);
    lines.push(`"${postRace.keyLearning}"`);
    lines.push('');
  }

  // Narrative
  if (postRace?.narrative) {
    lines.push(`📝 HOW IT WENT`);
    lines.push(postRace.narrative);
    lines.push('');
  }

  // Key moment
  if (postRace?.keyMoment) {
    lines.push(`⚡ KEY MOMENT`);
    lines.push(postRace.keyMoment);
    lines.push('');
  }

  // AI Analysis summary
  if (postRace?.coachingFeedback && postRace.coachingFeedback.length > 0) {
    lines.push(`📊 AI ANALYSIS`);

    // Show first few coaching insights
    postRace.coachingFeedback.slice(0, 3).forEach(feedback => {
      const phase = feedback.phase || 'General';
      const score = feedback.execution_score;
      const icon = score && score >= 80 ? '✅' : score && score >= 50 ? '⚡' : '❌';
      lines.push(`${icon} ${phase}: ${feedback.execution_feedback || 'Good'}`);
    });
    lines.push('');
  }

  // Framework scores (brief)
  if (postRace?.frameworkScores?.overall_framework_adoption !== undefined) {
    lines.push(`📈 FRAMEWORK SCORE: ${postRace.frameworkScores.overall_framework_adoption}/100`);
    lines.push('');
  }

  // Focus for next race
  if (postRace?.focusNextRace) {
    lines.push(`🎯 FOCUS NEXT RACE`);
    lines.push(postRace.focusNextRace);
    lines.push('');
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Generated by RegattaFlow`);

  return lines.join('\n');
}

/**
 * Format result-only content (minimal share)
 */
export function formatResultOnly(content: ShareableContent): string {
  const lines: string[] = [];
  const { raceDate, raceName, postRace } = content;

  lines.push(`🏁 ${raceName}`);
  lines.push(`📅 ${formatDate(raceDate)}`);

  if (postRace?.result) {
    const r = postRace.result;
    if (r.status) {
      lines.push(`Result: ${r.status}`);
    } else {
      lines.push(`🏆 ${formatPosition(r.position)} of ${r.fleetSize}`);
    }
  }

  if (postRace?.keyMoment) {
    lines.push('');
    lines.push(`"${postRace.keyMoment}"`);
  }

  return lines.join('\n');
}

/**
 * Format content for WhatsApp (more compact)
 */
export function formatForWhatsApp(content: ShareableContent): string {
  // WhatsApp has a character limit, so we use the standard formatters
  // which are already optimized for mobile reading
  switch (content.context) {
    case 'pre-race':
      return formatPreRaceContent(content);
    case 'post-race':
      return formatPostRaceContent(content);
    case 'result-only':
      return formatResultOnly(content);
    default:
      return formatPostRaceContent(content);
  }
}

/**
 * Format content for Email (can be more detailed)
 */
export function formatForEmail(content: ShareableContent): string {
  // Email can handle more detail, so we use the full formatters
  switch (content.context) {
    case 'pre-race':
      return formatPreRaceContent(content);
    case 'post-race':
      return formatPostRaceContent(content);
    case 'result-only':
      return formatResultOnly(content);
    default:
      return formatPostRaceContent(content);
  }
}
