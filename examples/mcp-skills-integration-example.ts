/**
 * MCP and Claude Skills Integration Examples
 *
 * This file demonstrates various integration patterns for using
 * MCP resources/tools with Claude Skills in RegattaFlow.
 */

import { enhancedClaudeClient, mcpClientService } from '../services/ai';

/**
 * Example 1: Basic Skills Usage
 *
 * Use Claude Skills for expert analysis without real-time data.
 * This is useful for general tactical questions.
 */
async function example1_basicSkillsUsage() {
  console.log('\n=== Example 1: Basic Skills Usage ===\n');

  const response = await enhancedClaudeClient.createEnhancedMessage({
    model: 'claude-3-5-sonnet-20240620',
    messages: [{
      role: 'user',
      content: `What is the optimal upwind strategy when sailing in oscillating wind conditions?
                Explain the theory and provide specific execution steps.`
    }],
    skills: [
      { skillId: 'race-strategy-analyst' }
    ],
    enableCodeExecution: true,
    maxTokens: 2048,
  });

  console.log('Response:', response.text);
  console.log('Tokens used:', response.tokensIn + response.tokensOut);
  console.log('Skills activated:', response.skillsUsed);
}

/**
 * Example 2: MCP Resources Only
 *
 * Fetch and display real-time sailing data using MCP resources.
 */
async function example2_mcpResourcesOnly() {
  console.log('\n=== Example 2: MCP Resources Only ===\n');

  try {
    // Connect to MCP server
    await mcpClientService.connect({
      command: 'node',
      args: ['mcp-server/dist/index.js'],
      env: {
        SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      }
    });

    // Fetch current weather
    const weather = await mcpClientService.getCurrentWeather();
    console.log('Current Weather:', weather);

    // Fetch active races
    const races = await mcpClientService.getActiveRaces();
    console.log('Active Races:', races.length, 'races');

    // Fetch tidal predictions
    const tides = await mcpClientService.getTidalPredictions('san-francisco');
    console.log('Tidal Predictions:', tides.length, 'predictions');

  } finally {
    await mcpClientService.disconnect();
  }
}

/**
 * Example 3: MCP Tools Usage
 *
 * Use MCP tools for specific analysis tasks.
 */
async function example3_mcpToolsUsage() {
  console.log('\n=== Example 3: MCP Tools Usage ===\n');

  try {
    await mcpClientService.connect({
      command: 'node',
      args: ['mcp-server/dist/index.js'],
      env: {
        SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      }
    });

    // Analyze start line
    const startAnalysis = await mcpClientService.analyzeStartLine({
      raceId: 'race-123',
      windDirection: 180,
      windSpeed: 12,
      currentDirection: 90,
      currentSpeed: 1.5
    });

    console.log('Start Line Analysis:', JSON.stringify(startAnalysis, null, 2));

    // Calculate optimal route
    const route = await mcpClientService.calculateOptimalRoute({
      startLat: 37.8,
      startLon: -122.4,
      endLat: 37.82,
      endLon: -122.38,
      windDirection: 270,
      windSpeed: 15,
      currentDirection: 180,
      currentSpeed: 2.0,
      boatClass: 'j24'
    });

    console.log('Optimal Route:', JSON.stringify(route, null, 2));

  } finally {
    await mcpClientService.disconnect();
  }
}

/**
 * Example 4: Combined Skills + MCP (Recommended)
 *
 * Use Claude Skills with real-time MCP data for comprehensive analysis.
 * This is the most powerful integration pattern.
 */
async function example4_combinedSkillsAndMCP() {
  console.log('\n=== Example 4: Combined Skills + MCP ===\n');

  try {
    // Step 1: Connect to MCP
    await mcpClientService.connect({
      command: 'node',
      args: ['mcp-server/dist/index.js'],
      env: {
        SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      }
    });

    // Step 2: Fetch race data
    const raceId = 'race-123';
    const race = await mcpClientService.getRaceCourse(raceId);
    const weather = await mcpClientService.getCurrentWeather();
    const tides = await mcpClientService.getTidalPredictions(race.location);

    // Step 3: Analyze with MCP tools
    const startAnalysis = await mcpClientService.analyzeStartLine({
      raceId,
      windDirection: weather.wind_direction,
      windSpeed: weather.wind_speed,
      currentDirection: tides[0]?.current_direction,
      currentSpeed: tides[0]?.current_speed
    });

    const tidalAnalysis = await mcpClientService.analyzeTidalOpportunities({
      raceId,
      startTime: race.start_time,
      duration: race.estimated_duration || 60,
      location: race.location
    });

    // Step 4: Get expert strategy with Skills
    const strategy = await enhancedClaudeClient.createRaceStrategyRequest(
      `Provide a comprehensive race strategy for this ${race.race_type} race.

       Consider:
       1. Start line positioning based on the analysis
       2. Upwind and downwind tactical plans
       3. Current leverage opportunities during the race
       4. Overall execution recommendations

       Be specific and actionable.`,
      {
        raceData: race,
        weatherData: weather,
        tidalData: { predictions: tides, opportunities: tidalAnalysis },
      }
    );

    console.log('\n=== Race Strategy ===');
    console.log(strategy.text);
    console.log('\n=== Metadata ===');
    console.log('Tokens used:', strategy.tokensIn + strategy.tokensOut);
    console.log('Skills used:', strategy.skillsUsed);

  } finally {
    await mcpClientService.disconnect();
  }
}

/**
 * Example 5: Race Preparation Workflow
 *
 * Complete workflow for preparing for a race using all available tools.
 */
async function example5_racePreparationWorkflow(raceId: string) {
  console.log('\n=== Example 5: Race Preparation Workflow ===\n');

  try {
    // Connect to MCP
    await mcpClientService.connect({
      command: 'node',
      args: ['mcp-server/dist/index.js'],
      env: {
        SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      }
    });

    // Gather all environmental data
    console.log('📊 Gathering race data...');
    const [race, weather] = await Promise.all([
      mcpClientService.getRaceCourse(raceId),
      mcpClientService.getCurrentWeather()
    ]);

    const [tides, bathymetry, polars] = await Promise.all([
      mcpClientService.getTidalPredictions(race.location),
      mcpClientService.getBathymetryData(race.venue_id),
      mcpClientService.getBoatPolars(race.boat_class)
    ]);

    console.log('✅ Data gathered');

    // Perform all analyses
    console.log('🔍 Running analyses...');
    const [startAnalysis, tidalAnalysis] = await Promise.all([
      mcpClientService.analyzeStartLine({
        raceId,
        windDirection: weather.wind_direction,
        windSpeed: weather.wind_speed,
        currentDirection: tides[0]?.current_direction,
        currentSpeed: tides[0]?.current_speed
      }),
      mcpClientService.analyzeTidalOpportunities({
        raceId,
        startTime: race.start_time,
        duration: race.estimated_duration || 60,
        location: race.location
      })
    ]);

    console.log('✅ Analyses complete');

    // Get comprehensive strategy from Skills
    console.log('🧠 Generating race strategy...');
    const strategy = await enhancedClaudeClient.createRaceStrategyRequest(
      `I need a complete race preparation plan for Race ${raceId}.

       Please provide:
       1. **Pre-Race Briefing** (5 minutes before start)
          - Key environmental factors
          - Start line approach plan
          - First beat strategy

       2. **Leg-by-Leg Plan**
          - Upwind strategy (shifts, tacking discipline, current leverage)
          - Mark rounding approach
          - Downwind strategy (jibing plan, pressure seeking)

       3. **Contingency Plans**
          - What to do if wind shifts significantly
          - How to adapt if behind/ahead
          - Tidal window adjustments

       4. **Key Numbers to Remember**
          - Compass headings
          - Timing marks
          - Critical decision points

       Make it concise, actionable, and easy to remember on the water.`,
      {
        raceData: {
          ...race,
          startAnalysis,
          tidalAnalysis
        },
        weatherData: weather,
        tidalData: {
          predictions: tides,
          analysis: tidalAnalysis
        },
        bathymetryData: bathymetry
      }
    );

    console.log('✅ Strategy generated\n');

    // Output complete race preparation package
    const preparation = {
      race: {
        id: race.id,
        name: race.name,
        type: race.race_type,
        startTime: race.start_time,
        boatClass: race.boat_class
      },
      conditions: {
        wind: `${weather.wind_speed} kts from ${weather.wind_direction}°`,
        current: tides[0] ? `${tides[0].current_speed} kts from ${tides[0].current_direction}°` : 'None',
        temperature: weather.temperature,
        pressure: weather.pressure
      },
      startLine: {
        favoredEnd: startAnalysis.favoredEnd,
        advantage: `${startAnalysis.biasAngle}° bias = ${startAnalysis.boatLengthAdvantage} boat lengths`,
        recommendation: startAnalysis.recommendation
      },
      tidalWindows: {
        hasSlack: tidalAnalysis.analysis?.hasSlackDuringRace,
        opportunities: tidalAnalysis.opportunities?.length || 0,
        recommendation: tidalAnalysis.analysis?.recommendation
      },
      strategy: strategy.text,
      metadata: {
        generatedAt: new Date().toISOString(),
        tokensUsed: strategy.tokensIn + strategy.tokensOut,
        skillsUsed: strategy.skillsUsed
      }
    };

    console.log('=== RACE PREPARATION PACKAGE ===\n');
    console.log(JSON.stringify(preparation, null, 2));

    return preparation;

  } finally {
    await mcpClientService.disconnect();
  }
}

/**
 * Example 6: Performance Analysis
 *
 * Analyze a completed race using GPS track data.
 */
async function example6_performanceAnalysis(trackId: string, boatClass: string) {
  console.log('\n=== Example 6: Performance Analysis ===\n');

  try {
    await mcpClientService.connect({
      command: 'node',
      args: ['mcp-server/dist/index.js'],
      env: {
        SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      }
    });

    // Analyze performance
    const analysis = await mcpClientService.analyzePerformance({
      trackId,
      boatClass,
      compareToPolars: true
    });

    // Get expert feedback using Skills
    const feedback = await enhancedClaudeClient.createEnhancedMessage({
      model: 'claude-3-5-sonnet-20240620',
      messages: [{
        role: 'user',
        content: `Analyze this sailing performance data and provide coaching feedback:

${JSON.stringify(analysis, null, 2)}

Focus on:
1. What went well?
2. What could be improved?
3. Specific drills to practice
4. Target metrics for next race`
      }],
      skills: [
        { skillId: 'race-strategy-analyst' }
      ],
      enableCodeExecution: true,
      maxTokens: 2048,
    });

    console.log('=== Performance Analysis ===\n');
    console.log('Raw Data:', JSON.stringify(analysis, null, 2));
    console.log('\n=== Expert Feedback ===\n');
    console.log(feedback.text);

  } finally {
    await mcpClientService.disconnect();
  }
}

/**
 * Example 7: Multi-Race Analysis
 *
 * Analyze trends across multiple races.
 */
async function example7_multiRaceAnalysis(trackIds: string[], boatClass: string) {
  console.log('\n=== Example 7: Multi-Race Analysis ===\n');

  try {
    await mcpClientService.connect({
      command: 'node',
      args: ['mcp-server/dist/index.js'],
      env: {
        SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
        SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
      }
    });

    // Analyze all tracks
    console.log(`📊 Analyzing ${trackIds.length} races...`);
    const analyses = await Promise.all(
      trackIds.map(trackId =>
        mcpClientService.analyzePerformance({
          trackId,
          boatClass,
          compareToPolars: true
        })
      )
    );

    console.log('✅ Analysis complete');

    // Get trend analysis from Skills
    const trendAnalysis = await enhancedClaudeClient.createEnhancedMessage({
      model: 'claude-3-5-sonnet-20240620',
      messages: [{
        role: 'user',
        content: `Analyze performance trends across these ${trackIds.length} races:

${JSON.stringify(analyses, null, 2)}

Provide:
1. Overall trend (improving/declining/stable)
2. Strongest areas
3. Areas needing work
4. Recommended focus for next training session`
      }],
      skills: [
        { skillId: 'race-strategy-analyst' }
      ],
      enableCodeExecution: true,
      maxTokens: 3072,
    });

    console.log('=== Trend Analysis ===\n');
    console.log(trendAnalysis.text);

  } finally {
    await mcpClientService.disconnect();
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Basic examples
    await example1_basicSkillsUsage();
    await example2_mcpResourcesOnly();
    await example3_mcpToolsUsage();

    // Advanced examples
    await example4_combinedSkillsAndMCP();

    // Real-world workflows (use actual IDs from your database)
    // await example5_racePreparationWorkflow('your-race-id');
    // await example6_performanceAnalysis('your-track-id', 'j24');
    // await example7_multiRaceAnalysis(['track-1', 'track-2'], 'j24');

  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export examples for use in other files
export {
  example1_basicSkillsUsage,
  example2_mcpResourcesOnly,
  example3_mcpToolsUsage,
  example4_combinedSkillsAndMCP,
  example5_racePreparationWorkflow,
  example6_performanceAnalysis,
  example7_multiRaceAnalysis,
};

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
