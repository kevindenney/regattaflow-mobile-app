/**
 * Test script for AI Rig Tuning System
 *
 * Run with: npx tsx test-ai-rig-tuning.ts
 */

import { raceTuningService } from './services/RaceTuningService';

async function testAIRigTuning() {
  console.log('🧪 Testing AI Rig Tuning System\n');

  const testRequest = {
    className: 'J/70',
    averageWindSpeed: 12,
    windMin: 10,
    windMax: 16,
    windDirection: 225,
    gusts: 16,
    waveHeight: '1-2ft',
    currentSpeed: 0.5,
    currentDirection: 180,
    pointsOfSail: 'upwind' as const,
    limit: 1
  };

  console.log('📋 Test Request:', JSON.stringify(testRequest, null, 2));
  console.log('\n⏳ Generating AI recommendations...\n');

  try {
    const recommendations = await raceTuningService.getRecommendations(testRequest);

    if (recommendations.length === 0) {
      console.log('❌ No recommendations returned');
      console.log('   This could mean:');
      console.log('   - Anthropic API key not configured');
      console.log('   - No tuning guides AND AI generation failed');
      console.log('   - Check logs for errors\n');
      return;
    }

    const rec = recommendations[0];
    console.log('✅ Recommendation Generated!\n');
    console.log('═══════════════════════════════════════════════════════\n');

    if (rec.isAIGenerated) {
      console.log('🤖 AI-GENERATED RECOMMENDATION');
      console.log(`   Confidence: ${rec.confidence ? Math.round(rec.confidence * 100) : 'N/A'}%`);
    } else {
      console.log('📚 GUIDE-BASED RECOMMENDATION');
    }

    console.log('\n📝 Details:');
    console.log(`   Title: ${rec.guideTitle}`);
    console.log(`   Source: ${rec.guideSource}`);
    console.log(`   Section: ${rec.sectionTitle || 'N/A'}`);
    console.log(`   Conditions: ${rec.conditionSummary || 'N/A'}`);

    console.log('\n⚙️  Settings:');
    rec.settings.forEach(setting => {
      console.log(`   ${setting.label}: ${setting.value}`);
      if (setting.reasoning) {
        console.log(`      → ${setting.reasoning}`);
      }
    });

    if (rec.weatherSpecificNotes && rec.weatherSpecificNotes.length > 0) {
      console.log('\n🌤️  Weather-Specific Notes:');
      rec.weatherSpecificNotes.forEach(note => {
        console.log(`   • ${note}`);
      });
    }

    if (rec.caveats && rec.caveats.length > 0) {
      console.log('\n⚠️  Caveats:');
      rec.caveats.forEach(caveat => {
        console.log(`   • ${caveat}`);
      });
    }

    if (rec.notes) {
      console.log('\n📄 Additional Notes:');
      console.log(`   ${rec.notes}`);
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

// Run the test
testAIRigTuning().catch(console.error);
