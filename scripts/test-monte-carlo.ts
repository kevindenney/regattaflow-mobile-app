/**
 * Test Monte Carlo Simulation Service
 *
 * Verifies realistic outputs with sample race data
 */

import { monteCarloService } from '../src/services/monteCarloService';

async function testMonteCarloSimulation() {
  console.log('🎲 Testing Monte Carlo Race Simulation...\n');

  // Create a mock race strategy for testing
  const mockStrategyId = 'test-strategy-001';

  console.log('📊 Running 1,000 simulations...');
  console.log('Parameters:');
  console.log('  - Wind variation: ±15°');
  console.log('  - Current variation: ±20%');
  console.log('  - Fleet size: 20 boats');
  console.log('  - Boat type: Dragon');
  console.log('');

  try {
    const results = await monteCarloService.runSimulation({
      raceStrategyId: mockStrategyId,
      iterations: 1000,
      windVariation: 15,
      currentVariation: 0.2,
      fleetSize: 20,
    });

    console.log('✅ Simulation completed!\n');

    // Display results
    console.log('📈 EXPECTED PERFORMANCE');
    console.log('─'.repeat(50));
    console.log(`Expected Finish:       ${results.expectedFinish.toFixed(2)}`);
    console.log(`Median Finish:         ${results.medianFinish}`);
    console.log(`Podium Probability:    ${(results.podiumProbability * 100).toFixed(1)}%`);
    console.log(`Win Probability:       ${(results.winProbability * 100).toFixed(1)}%`);
    console.log(`95% CI:                [${results.confidenceInterval.lower}, ${results.confidenceInterval.upper}]`);
    console.log('');

    // Position distribution
    console.log('📊 POSITION DISTRIBUTION (Top 10)');
    console.log('─'.repeat(50));
    Object.entries(results.positionDistribution)
      .slice(0, 10)
      .forEach(([position, probability]) => {
        const barLength = Math.round(probability * 50);
        const bar = '█'.repeat(barLength);
        console.log(
          `${position.padStart(2)}:  ${bar.padEnd(25)} ${(probability * 100).toFixed(1)}%`
        );
      });
    console.log('');

    // Success factors
    console.log('🎯 SUCCESS FACTORS');
    console.log('─'.repeat(50));
    results.successFactors.forEach((factor, index) => {
      console.log(`${index + 1}. ${factor.factor}`);
      console.log(`   Impact: ${(factor.impact * 100).toFixed(1)}%`);
      console.log(`   ${factor.description}`);
      console.log('');
    });

    // Alternative strategies
    console.log('🔄 ALTERNATIVE STRATEGIES');
    console.log('─'.repeat(50));
    results.alternativeStrategies.forEach((strategy) => {
      console.log(`${strategy.name} (${strategy.riskLevel.toUpperCase()} RISK)`);
      console.log(`   Expected: ${strategy.expectedFinish.toFixed(2)}`);
      console.log(`   Podium:   ${(strategy.podiumProbability * 100).toFixed(1)}%`);
      console.log(`   ${strategy.description}`);
      console.log('');
    });

    // Validation
    console.log('✅ VALIDATION CHECKS');
    console.log('─'.repeat(50));

    const checks = [
      {
        name: 'Total iterations',
        pass: results.totalIterations === 1000,
        value: results.totalIterations,
      },
      {
        name: 'Expected finish in range',
        pass: results.expectedFinish >= 1 && results.expectedFinish <= 20,
        value: results.expectedFinish.toFixed(2),
      },
      {
        name: 'Probabilities sum to ~1',
        pass:
          Math.abs(
            Object.values(results.positionDistribution).reduce(
              (a, b) => a + b,
              0
            ) - 1
          ) < 0.01,
        value: Object.values(results.positionDistribution)
          .reduce((a, b) => a + b, 0)
          .toFixed(3),
      },
      {
        name: 'Podium probability valid',
        pass:
          results.podiumProbability >= 0 && results.podiumProbability <= 1,
        value: (results.podiumProbability * 100).toFixed(1) + '%',
      },
      {
        name: 'Win probability ≤ Podium',
        pass: results.winProbability <= results.podiumProbability,
        value: `${(results.winProbability * 100).toFixed(1)}% ≤ ${(results.podiumProbability * 100).toFixed(1)}%`,
      },
      {
        name: 'Success factors present',
        pass: results.successFactors.length > 0,
        value: results.successFactors.length,
      },
      {
        name: 'Alternative strategies',
        pass: results.alternativeStrategies.length > 0,
        value: results.alternativeStrategies.length,
      },
      {
        name: 'Confidence interval valid',
        pass:
          results.confidenceInterval.lower < results.confidenceInterval.upper,
        value: `[${results.confidenceInterval.lower}, ${results.confidenceInterval.upper}]`,
      },
    ];

    checks.forEach((check) => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.value}`);
    });

    const allPassed = checks.every((c) => c.pass);
    console.log('');
    if (allPassed) {
      console.log('🎉 All validation checks passed!');
    } else {
      console.log('⚠️  Some validation checks failed.');
    }

    return allPassed;
  } catch (error) {
    console.error('❌ Simulation failed:', error);
    return false;
  }
}

// Run test
testMonteCarloSimulation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
