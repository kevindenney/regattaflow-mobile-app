#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/(tabs)/settings.tsx',
  'src/app/(tabs)/crew.tsx',
  'src/app/(tabs)/venue.tsx',
  'src/app/(tabs)/venue-old.tsx',
  'src/app/(tabs)/dashboard.tsx',
  'src/app/(tabs)/events.tsx',
  'src/app/(tabs)/tuning-guides.tsx',
  'src/app/(tabs)/earnings.tsx',
  'src/app/(tabs)/boat/index.tsx',
  'src/app/(tabs)/boat/[id].tsx',
  'src/app/(tabs)/members.tsx',
  'src/app/(tabs)/schedule.tsx',
  'src/app/(tabs)/race-management.tsx',
  'src/app/(tabs)/race/[id].tsx',
  'src/app/(tabs)/_layout.tsx',
  'src/app/(tabs)/club.tsx',
  'src/app/(tabs)/fleet/index.tsx',
  'src/app/(tabs)/clients.tsx',
  'src/app/documents.tsx',
  'src/app/(auth)/login.tsx',
  'src/app/(auth)/signup.tsx',
  'src/app/debug/modal.tsx',
  'src/components/sailor/TuningGuidesSection.tsx',
  'src/components/sailor/CrewManagement.tsx',
  'src/components/sailor/TuningSettings.tsx',
  'src/components/sailor/BoatEquipmentInventory.tsx',
  'src/components/sailor/ClubsAssociationsSection.tsx',
  'src/components/sailor/BoatActionMenu.tsx',
  'src/components/sailor/MaintenanceTimeline.tsx',
  'src/components/sailor/EquipmentAlerts.tsx',
  'src/components/sailor/ExternalResultsCard.tsx',
  'src/components/sailor/ClassSelector.tsx',
  'src/components/developer/DeveloperDocumentUploader.tsx',
  'src/components/landing/maps/SailorRaceStrategyMap.tsx',
  'src/components/landing/maps/YachtClubManagementMap.tsx',
  'src/components/landing/maps/CoachRaceReplay.tsx',
  'src/components/landing/HeroTabs.tsx',
  'src/components/layout/AppHeader.tsx',
  'src/components/racing/RaceDayInterface.tsx',
  'src/components/admin/ResultsPollingDashboard.tsx',
  'src/components/navigation/NavigationHeader.tsx',
  'src/components/shared/UniversalMapInterface.tsx',
  'src/components/shared/CardMenu.tsx',
  'src/components/subscriptions/PaywallModal.tsx',
  'src/components/subscription/SubscriptionManager.tsx',
  'src/components/coach/CoachCard.tsx',
  'src/components/coach/registration/PersonalInfoStep.tsx',
  'src/components/coach/dashboard/EarningsDashboard.tsx',
  'src/components/coach/AdvancedAnalytics.tsx',
  'src/components/coach/AICoachMatchmaker.tsx',
  'src/components/coach/CoachDashboard.tsx',
  'src/components/coach/SessionManagement.tsx',
  'src/components/coach/LiveCoachingAssistant.tsx',
  'src/components/dashboard/club/ClubOverview.tsx',
  'src/components/dashboard/sailor/SailorOverview.tsx',
  'src/components/dashboard/sailor/NextRaceCard.tsx',
  'src/components/dashboard/sailor/AnalyticsTab.tsx',
  'src/components/dashboard/sailor/RaceStrategyTab.tsx',
  'src/components/dashboard/sailor/SailorOverviewEnhanced.tsx',
  'src/components/dashboard/shared/DashboardSection.tsx',
  'src/components/dashboard/shared/QuickActionGrid.tsx',
  'src/components/dashboard/shared/DashboardKPICard.tsx',
  'src/components/dashboard/coach/ClientsTab.tsx',
  'src/components/dashboard/coach/CoachOverview.tsx',
  'src/components/dashboard/RaceDashboard.tsx',
  'src/components/results/ExternalResultsMonitor.tsx',
  'src/components/results/ResultsSearchInterface.tsx',
  'src/components/map/Map3DView.tsx',
  'src/components/map/RaceCourseVisualization.tsx',
  'src/components/map/ProfessionalMapScreen.tsx',
  'src/components/ai/VoiceNoteRecorder.tsx',
  'src/components/ai/EducationalStrategyDemo.tsx',
  'src/components/ai/AIRaceAnalysisDashboard.tsx',
  'src/components/race/CourseTemplateLibrary.tsx',
  'src/components/race/CourseDesigner.tsx',
  'src/components/race/CoachRaceInterface.tsx',
  'src/components/race/CourseValidation.tsx',
  'src/components/race/SailorRaceInterface.tsx',
  'src/components/race/yacht-club/ProfessionalCourseDesigner.tsx',
  'src/components/race/yacht-club/YachtClubCourseDesigner.tsx',
  'src/components/race/yacht-club/RaceManagementPanel.tsx',
  'src/components/race/yacht-club/CoursePublishingPanel.tsx',
  'src/components/race/yacht-club/RaceSeriesManager.tsx',
  'src/components/race/WeatherIntegration.tsx',
  'src/components/venue/VenueMapView.tsx',
  'src/components/venue/GlobalVenueIntelligence.tsx',
  'src/components/venue/VenueSelector.tsx',
  'src/components/venue/VenueIntelligenceDisplay.tsx',
  'src/components/venue/VenueIntelligenceMapView.tsx',
  'src/components/venue/FloatingPanel.tsx',
  'src/components/weather/WeatherIntelligence.tsx',
  'src/components/documents/DocumentViewer.tsx',
  'src/components/documents/DocumentUploadCard.tsx',
  'src/components/strategy/RaceCourseVisualization3D.tsx',
];

function fixShadowsInFile(content) {
  // Fix patterns where shadowColor, shadowOpacity, shadowRadius appear together
  // but WITHOUT shadowOffset (the previous script only handled shadowOffset cases)

  let fixed = content;

  // Pattern: Find style blocks with shadow props (but no boxShadow already)
  const styleBlockRegex = /(\w+):\s*\{([^}]*)\}/gs;

  fixed = fixed.replace(styleBlockRegex, (match, styleName, styleContent) => {
    // Skip if already has boxShadow or doesn't have shadow props
    if (styleContent.includes('boxShadow:') ||
        !styleContent.match(/shadow(Color|Opacity|Radius|Offset)/)) {
      return match;
    }

    // Extract shadow values
    const colorMatch = styleContent.match(/shadowColor:\s*['"]([^'"]+)['"]/);
    const opacityMatch = styleContent.match(/shadowOpacity:\s*(-?\d+(?:\.\d+)?)/);
    const radiusMatch = styleContent.match(/shadowRadius:\s*(-?\d+(?:\.\d+)?)/);
    const offsetMatch = styleContent.match(/shadowOffset:\s*\{\s*width:\s*(-?\d+(?:\.\d+)?),\s*height:\s*(-?\d+(?:\.\d+)?)\s*\}/);

    // Only convert if we have at least some shadow properties
    if (colorMatch || opacityMatch || radiusMatch || offsetMatch) {
      const offsetX = offsetMatch ? offsetMatch[1] : '0';
      const offsetY = offsetMatch ? offsetMatch[2] : '0';
      const blur = radiusMatch ? radiusMatch[1] : '0';
      const color = colorMatch ? colorMatch[1] : '#000';
      const opacity = opacityMatch ? opacityMatch[1] : '1';

      // Convert color with opacity to rgba if needed
      let finalColor = color;
      if (opacity !== '1' && color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length === 3) {
          // #RGB to #RRGGBB
          const r = parseInt(hex[0] + hex[0], 16);
          const g = parseInt(hex[1] + hex[1], 16);
          const b = parseInt(hex[2] + hex[2], 16);
          finalColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        } else {
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          finalColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
      }

      const boxShadowValue = `${offsetX}px ${offsetY}px ${blur}px ${finalColor}`;

      // Remove old shadow properties
      let newContent = styleContent;
      newContent = newContent.replace(/,?\s*shadowColor:\s*['"][^'"]+['"],?\s*/g, '');
      newContent = newContent.replace(/,?\s*shadowOffset:\s*\{[^}]+\},?\s*/g, '');
      newContent = newContent.replace(/,?\s*shadowOpacity:\s*-?\d+(?:\.\d+)?,?\s*/g, '');
      newContent = newContent.replace(/,?\s*shadowRadius:\s*-?\d+(?:\.\d+)?,?\s*/g, '');

      // Clean up any double commas or trailing commas
      newContent = newContent.replace(/,\s*,/g, ',');
      newContent = newContent.replace(/,\s*\}/g, '}');
      newContent = newContent.replace(/\{\s*,/g, '{');

      // Add boxShadow
      newContent = newContent.trim();
      if (newContent && !newContent.endsWith(',')) {
        newContent += ',';
      }
      newContent += ` boxShadow: '${boxShadowValue}'`;

      return `${styleName}: {${newContent}}`;
    }

    return match;
  });

  return fixed;
}

let filesFixed = 0;

for (const file of filesToFix) {
  const fullPath = path.join(__dirname, '..', file);

  try {
    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const fixed = fixShadowsInFile(content);

    if (content !== fixed) {
      fs.writeFileSync(fullPath, fixed, 'utf8');
      console.log(`✓ ${file}`);
      filesFixed++;
    }
  } catch (error) {
    console.error(`✗ ${file}:`, error.message);
  }
}

console.log(`\n✓ Fixed ${filesFixed} files`);
