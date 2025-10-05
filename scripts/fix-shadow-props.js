#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix (from grep results)
const filesToFix = [
  'src/app/(tabs)/dashboard.tsx',
  'src/app/(tabs)/_layout.tsx',
  'src/components/navigation/NavigationHeader.tsx',
  'src/app/(auth)/signup.tsx',
  'src/app/(auth)/login.tsx',
  'src/app/(tabs)/club.tsx',
  'src/app/(tabs)/venue.tsx',
  'src/components/landing/maps/YachtClubManagementMap.tsx',
  'src/components/landing/maps/CoachRaceReplay.tsx',
  'src/components/landing/maps/SailorRaceStrategyMap.tsx',
  'src/components/landing/HeroTabs.tsx',
  'src/components/dashboard/sailor/SailorOverviewEnhanced.tsx',
  'src/components/venue/VenueSelector.tsx',
  'src/components/venue/VenueIntelligenceMapView.tsx',
  'src/components/sailor/TuningGuidesSection.tsx',
  'src/components/venue/VenueMapView.tsx',
  'src/components/venue/FloatingPanel.tsx',
  'src/components/venue/VenueIntelligenceDisplay.tsx',
  'src/app/(tabs)/boat/index.tsx',
  'src/components/sailor/TuningSettings.tsx',
  'src/components/sailor/MaintenanceTimeline.tsx',
  'src/components/sailor/BoatEquipmentInventory.tsx',
  'src/app/(tabs)/boat/[id].tsx',
  'src/components/sailor/BoatActionMenu.tsx',
  'src/app/(tabs)/race/[id].tsx',
  'src/app/(tabs)/fleet/index.tsx',
  'src/components/sailor/EquipmentAlerts.tsx',
  'src/components/sailor/ClassSelector.tsx',
  'src/components/sailor/ClubsAssociationsSection.tsx',
  'src/components/dashboard/sailor/NextRaceCard.tsx',
  'src/components/dashboard/shared/QuickActionGrid.tsx',
  'src/components/coach/CoachCard.tsx',
  'src/components/documents/DocumentUploadCard.tsx',
  'src/components/sailor/ExternalResultsCard.tsx',
  'src/components/sailor/CrewManagement.tsx',
  'src/components/dashboard/shared/DashboardKPICard.tsx',
  'src/components/dashboard/shared/DashboardSection.tsx',
  'src/components/dashboard/sailor/SailorOverview.tsx',
  'src/app/(tabs)/tuning-guides.tsx',
  'src/app/(tabs)/crew.tsx',
  'src/components/shared/CardMenu.tsx',
  'src/components/dashboard/club/ClubOverview.tsx',
  'src/components/dashboard/coach/CoachOverview.tsx',
  'src/components/dashboard/coach/ClientsTab.tsx',
  'src/components/dashboard/sailor/AnalyticsTab.tsx',
  'src/components/dashboard/sailor/RaceStrategyTab.tsx',
  'src/components/layout/AppHeader.tsx',
  'src/app/(tabs)/settings.tsx',
  'src/app/(tabs)/race-management.tsx',
  'src/app/(tabs)/members.tsx',
  'src/app/(tabs)/events.tsx',
  'src/app/(tabs)/earnings.tsx',
  'src/app/(tabs)/schedule.tsx',
  'src/app/(tabs)/clients.tsx',
  'src/app/debug/modal.tsx',
  'src/components/strategy/RaceCourseVisualization3D.tsx',
  'src/components/documents/DocumentViewer.tsx',
  'src/components/weather/WeatherIntelligence.tsx',
  'src/components/venue/GlobalVenueIntelligence.tsx',
  'src/components/race/WeatherIntegration.tsx',
  'src/components/race/yacht-club/RaceSeriesManager.tsx',
  'src/components/race/yacht-club/CoursePublishingPanel.tsx',
  'src/components/race/yacht-club/RaceManagementPanel.tsx',
  'src/components/race/yacht-club/YachtClubCourseDesigner.tsx',
  'src/components/race/yacht-club/ProfessionalCourseDesigner.tsx',
  'src/components/race/SailorRaceInterface.tsx',
  'src/components/race/CourseValidation.tsx',
  'src/components/race/CoachRaceInterface.tsx',
  'src/components/race/CourseDesigner.tsx',
  'src/components/race/CourseTemplateLibrary.tsx',
  'src/components/ai/AIRaceAnalysisDashboard.tsx',
  'src/components/ai/EducationalStrategyDemo.tsx',
  'src/components/ai/VoiceNoteRecorder.tsx',
  'src/components/map/ProfessionalMapScreen.tsx',
  'src/components/map/RaceCourseVisualization.tsx',
  'src/components/map/Map3DView.tsx',
  'src/components/results/ResultsSearchInterface.tsx',
  'src/components/results/ExternalResultsMonitor.tsx',
  'src/components/dashboard/RaceDashboard.tsx',
  'src/components/coach/LiveCoachingAssistant.tsx',
  'src/components/coach/SessionManagement.tsx',
  'src/components/coach/CoachDashboard.tsx',
  'src/components/coach/AICoachMatchmaker.tsx',
  'src/components/coach/AdvancedAnalytics.tsx',
  'src/components/coach/dashboard/EarningsDashboard.tsx',
  'src/components/coach/registration/PersonalInfoStep.tsx',
  'src/components/subscription/SubscriptionManager.tsx',
  'src/components/subscriptions/PaywallModal.tsx',
  'src/components/shared/UniversalMapInterface.tsx',
  'src/components/admin/ResultsPollingDashboard.tsx',
  'src/components/racing/RaceDayInterface.tsx',
  'src/components/developer/DeveloperDocumentUploader.tsx',
  'src/app/documents.tsx',
  'src/app/(tabs)/venue-old.tsx',
];

function fixShadowProps(content) {
  let fixed = content;

  // Fix shadowOffset
  fixed = fixed.replace(
    /shadowOffset:\s*\{\s*width:\s*(-?\d+(?:\.\d+)?),\s*height:\s*(-?\d+(?:\.\d+)?)\s*\}/g,
    (match, width, height) => `boxShadow: '${width}px ${height}px'`
  );

  // Fix standalone shadow properties to boxShadow
  // This is more complex - we need to collect all shadow properties in a style object
  // and convert them to a single boxShadow

  // Pattern: Look for style objects with shadow properties
  const styleObjectRegex = /(\w+):\s*\{([^}]*(?:shadowColor|shadowOffset|shadowOpacity|shadowRadius)[^}]*)\}/g;

  fixed = fixed.replace(styleObjectRegex, (match, styleName, styleContent) => {
    if (!styleContent.match(/shadow(Color|Offset|Opacity|Radius)/)) {
      return match;
    }

    let newStyleContent = styleContent;

    // Extract shadow values
    const colorMatch = styleContent.match(/shadowColor:\s*['"]([^'"]+)['"]/);
    const offsetMatch = styleContent.match(/shadowOffset:\s*\{\s*width:\s*(-?\d+(?:\.\d+)?),\s*height:\s*(-?\d+(?:\.\d+)?)\s*\}/);
    const opacityMatch = styleContent.match(/shadowOpacity:\s*(-?\d+(?:\.\d+)?)/);
    const radiusMatch = styleContent.match(/shadowRadius:\s*(-?\d+(?:\.\d+)?)/);

    if (offsetMatch) {
      const offsetX = offsetMatch[1];
      const offsetY = offsetMatch[2];
      const blur = radiusMatch ? radiusMatch[1] : '0';
      const color = colorMatch ? colorMatch[1] : '#000';
      const opacity = opacityMatch ? opacityMatch[1] : '1';

      // Convert color with opacity to rgba if needed
      let finalColor = color;
      if (opacity !== '1' && color.startsWith('#')) {
        // Simple hex to rgba conversion (assumes #RGB or #RRGGBB)
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        finalColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      }

      const boxShadowValue = `${offsetX}px ${offsetY}px ${blur}px ${finalColor}`;

      // Remove old shadow properties
      newStyleContent = newStyleContent.replace(/,?\s*shadowColor:\s*['"][^'"]+['"]/, '');
      newStyleContent = newStyleContent.replace(/,?\s*shadowOffset:\s*\{[^}]+\}/, '');
      newStyleContent = newStyleContent.replace(/,?\s*shadowOpacity:\s*-?\d+(?:\.\d+)?/, '');
      newStyleContent = newStyleContent.replace(/,?\s*shadowRadius:\s*-?\d+(?:\.\d+)?/, '');

      // Add boxShadow
      newStyleContent = newStyleContent.trim();
      if (newStyleContent && !newStyleContent.endsWith(',')) {
        newStyleContent += ',';
      }
      newStyleContent += ` boxShadow: '${boxShadowValue}'`;
    }

    return `${styleName}: {${newStyleContent}}`;
  });

  // Fix textShadow properties similarly
  fixed = fixed.replace(
    /textShadowOffset:\s*\{\s*width:\s*(-?\d+(?:\.\d+)?),\s*height:\s*(-?\d+(?:\.\d+)?)\s*\}/g,
    (match, width, height) => `textShadow: '${width}px ${height}px'`
  );

  // Fix textShadow in style objects
  const textShadowStyleRegex = /(\w+):\s*\{([^}]*(?:textShadowColor|textShadowOffset|textShadowRadius)[^}]*)\}/g;

  fixed = fixed.replace(textShadowStyleRegex, (match, styleName, styleContent) => {
    if (!styleContent.match(/textShadow(Color|Offset|Radius)/)) {
      return match;
    }

    let newStyleContent = styleContent;

    const colorMatch = styleContent.match(/textShadowColor:\s*['"]([^'"]+)['"]/);
    const offsetMatch = styleContent.match(/textShadowOffset:\s*\{\s*width:\s*(-?\d+(?:\.\d+)?),\s*height:\s*(-?\d+(?:\.\d+)?)\s*\}/);
    const radiusMatch = styleContent.match(/textShadowRadius:\s*(-?\d+(?:\.\d+)?)/);

    if (offsetMatch) {
      const offsetX = offsetMatch[1];
      const offsetY = offsetMatch[2];
      const blur = radiusMatch ? radiusMatch[1] : '0';
      const color = colorMatch ? colorMatch[1] : '#000';

      const textShadowValue = `${offsetX}px ${offsetY}px ${blur}px ${color}`;

      newStyleContent = newStyleContent.replace(/,?\s*textShadowColor:\s*['"][^'"]+['"]/, '');
      newStyleContent = newStyleContent.replace(/,?\s*textShadowOffset:\s*\{[^}]+\}/, '');
      newStyleContent = newStyleContent.replace(/,?\s*textShadowRadius:\s*-?\d+(?:\.\d+)?/, '');

      newStyleContent = newStyleContent.trim();
      if (newStyleContent && !newStyleContent.endsWith(',')) {
        newStyleContent += ',';
      }
      newStyleContent += ` textShadow: '${textShadowValue}'`;
    }

    return `${styleName}: {${newStyleContent}}`;
  });

  return fixed;
}

let filesFixed = 0;
let filesWithErrors = 0;

for (const file of filesToFix) {
  const fullPath = path.join(__dirname, '..', file);

  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping ${file} (not found)`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const fixed = fixShadowProps(content);

    if (content !== fixed) {
      fs.writeFileSync(fullPath, fixed, 'utf8');
      console.log(`✓ Fixed ${file}`);
      filesFixed++;
    } else {
      console.log(`- No changes needed in ${file}`);
    }
  } catch (error) {
    console.error(`✗ Error processing ${file}:`, error.message);
    filesWithErrors++;
  }
}

console.log(`\n✓ Fixed ${filesFixed} files`);
if (filesWithErrors > 0) {
  console.log(`✗ ${filesWithErrors} files had errors`);
}
