/**
 * Monte Carlo Race Simulation Service
 *
 * Runs 1,000+ race simulations to predict outcomes based on:
 * - Wind shifts (±15° variation)
 * - Current variation (±20%)
 * - Fleet behavior (conservative/aggressive)
 * - Equipment performance
 * - Start position options
 * - Tactical decision points
 */

import { supabase } from './supabase';

// Simulation parameters
interface SimulationParams {
  raceStrategyId: string;
  iterations?: number; // Default: 1000
  windVariation?: number; // Default: 15 degrees
  currentVariation?: number; // Default: 0.2 (20%)
  fleetSize?: number; // Default: from race data
}

// Race conditions from strategy
interface RaceConditions {
  windSpeed: number; // knots
  windDirection: number; // degrees
  currentSpeed: number; // knots
  currentDirection: number; // degrees
  waveHeight?: number; // meters
}

// Equipment performance profile
interface EquipmentProfile {
  boatType: string;
  sailConfiguration: string;
  uphillSpeed: number; // relative to fleet (1.0 = average)
  downhillSpeed: number;
  maneuverability: number;
}

// Single simulation iteration result
interface SimulationIteration {
  finishPosition: number;
  elapsedTime: number; // seconds
  windShifts: number[]; // degrees at each leg
  currentVariations: number[]; // speed multipliers
  tacticalDecisions: {
    startPosition: 'pin' | 'committee' | 'middle';
    firstBeatTack: 'left' | 'right';
    gateChoice?: 'left' | 'right';
    markRoundings: number; // count of clean vs. dirty roundings
  };
  incidents: string[]; // "mark touch at windward", etc.
}

// Aggregated simulation results
export interface SimulationResults {
  totalIterations: number;
  positionDistribution: Record<number, number>; // position -> probability (0-1)
  expectedFinish: number; // mean position
  medianFinish: number;
  podiumProbability: number; // probability of top 3
  winProbability: number; // probability of 1st

  successFactors: Array<{
    factor: string;
    impact: number; // correlation coefficient
    description: string;
  }>;

  alternativeStrategies: Array<{
    name: string;
    expectedFinish: number;
    podiumProbability: number;
    riskLevel: 'low' | 'medium' | 'high';
    description: string;
  }>;

  confidenceInterval: {
    lower: number; // 95% CI lower bound
    upper: number; // 95% CI upper bound
  };

  // Raw data for charts
  iterations: SimulationIteration[];
}

// Strategy comparison
export interface StrategyComparison {
  baseline: SimulationResults;
  alternatives: Array<{
    name: string;
    results: SimulationResults;
    improvement: number; // expected position improvement
  }>;
}

/**
 * Monte Carlo Race Simulation Service
 */
export class MonteCarloService {
  private static instance: MonteCarloService;

  private constructor() {}

  static getInstance(): MonteCarloService {
    if (!this.instance) {
      this.instance = new MonteCarloService();
    }
    return this.instance;
  }

  /**
   * Run Monte Carlo simulation for a race strategy
   */
  async runSimulation(params: SimulationParams): Promise<SimulationResults> {
    const {
      raceStrategyId,
      iterations = 1000,
      windVariation = 15,
      currentVariation = 0.2,
    } = params;

    // Load race strategy and conditions
    const strategy = await this.loadRaceStrategy(raceStrategyId);
    if (!strategy) {
      throw new Error('Race strategy not found');
    }

    const conditions = this.extractConditions(strategy);
    const equipment = this.extractEquipment(strategy);
    const fleetSize = params.fleetSize || strategy.fleetSize || 20;

    // Run simulations
    const simulationIterations: SimulationIteration[] = [];

    for (let i = 0; i < iterations; i++) {
      const iteration = await this.runSingleIteration({
        conditions,
        equipment,
        fleetSize,
        windVariation,
        currentVariation,
        strategy,
      });
      simulationIterations.push(iteration);
    }

    // Aggregate results
    return this.aggregateResults(simulationIterations, fleetSize);
  }

  /**
   * Compare multiple strategies
   */
  async compareStrategies(
    baseStrategyId: string,
    alternativeStrategyIds: string[]
  ): Promise<StrategyComparison> {
    // Run baseline simulation
    const baseline = await this.runSimulation({ raceStrategyId: baseStrategyId });

    // Run alternative simulations
    const alternatives = await Promise.all(
      alternativeStrategyIds.map(async (strategyId) => {
        const results = await this.runSimulation({ raceStrategyId: strategyId });
        const strategy = await this.loadRaceStrategy(strategyId);

        return {
          name: strategy?.name || 'Alternative Strategy',
          results,
          improvement: baseline.expectedFinish - results.expectedFinish,
        };
      })
    );

    return { baseline, alternatives };
  }

  /**
   * Load race strategy from database
   */
  private async loadRaceStrategy(strategyId: string): Promise<any> {
    const { data, error } = await supabase
      .from('race_strategies')
      .select('*')
      .eq('id', strategyId)
      .single();

    if (error) {
      console.error('Error loading race strategy:', error);
      return null;
    }

    return data;
  }

  /**
   * Extract race conditions from strategy
   */
  private extractConditions(strategy: any): RaceConditions {
    return {
      windSpeed: strategy.wind_speed || 12,
      windDirection: strategy.wind_direction || 0,
      currentSpeed: strategy.current_speed || 0,
      currentDirection: strategy.current_direction || 0,
      waveHeight: strategy.wave_height,
    };
  }

  /**
   * Extract equipment profile from strategy
   */
  private extractEquipment(strategy: any): EquipmentProfile {
    return {
      boatType: strategy.boat_type || 'Dragon',
      sailConfiguration: strategy.sail_configuration || 'standard',
      uphillSpeed: strategy.uphill_speed || 1.0,
      downhillSpeed: strategy.downhill_speed || 1.0,
      maneuverability: strategy.maneuverability || 1.0,
    };
  }

  /**
   * Run a single simulation iteration
   */
  private async runSingleIteration(params: {
    conditions: RaceConditions;
    equipment: EquipmentProfile;
    fleetSize: number;
    windVariation: number;
    currentVariation: number;
    strategy: any;
  }): Promise<SimulationIteration> {
    const {
      conditions,
      equipment,
      fleetSize,
      windVariation,
      currentVariation,
      strategy,
    } = params;

    // Randomize conditions for this iteration
    const iterationConditions = this.randomizeConditions(
      conditions,
      windVariation,
      currentVariation
    );

    // Determine tactical decisions
    const tacticalDecisions = this.simulateTacticalDecisions(
      iterationConditions,
      equipment
    );

    // Simulate race progression
    const { finishPosition, elapsedTime } = this.simulateRaceProgression(
      iterationConditions,
      equipment,
      tacticalDecisions,
      fleetSize
    );

    // Generate random incidents (5% chance per race)
    const incidents: string[] = [];
    if (Math.random() < 0.05) {
      incidents.push(this.generateRandomIncident());
    }

    return {
      finishPosition,
      elapsedTime,
      windShifts: iterationConditions.windShifts,
      currentVariations: iterationConditions.currentVariations,
      tacticalDecisions,
      incidents,
    };
  }

  /**
   * Randomize race conditions for an iteration
   */
  private randomizeConditions(
    baseConditions: RaceConditions,
    windVariation: number,
    currentVariation: number
  ): any {
    // Wind variations per leg (assuming 6 legs)
    const windShifts = Array.from({ length: 6 }, () =>
      (Math.random() - 0.5) * 2 * windVariation
    );

    // Current variations per leg
    const currentVariations = Array.from({ length: 6 }, () =>
      1 + (Math.random() - 0.5) * 2 * currentVariation
    );

    // Wind speed variation (±20%)
    const windSpeedMultiplier = 1 + (Math.random() - 0.5) * 0.4;

    return {
      windSpeed: baseConditions.windSpeed * windSpeedMultiplier,
      windDirection: baseConditions.windDirection,
      currentSpeed: baseConditions.currentSpeed,
      currentDirection: baseConditions.currentDirection,
      windShifts,
      currentVariations,
    };
  }

  /**
   * Simulate tactical decisions based on conditions
   */
  private simulateTacticalDecisions(
    conditions: any,
    equipment: EquipmentProfile
  ): SimulationIteration['tacticalDecisions'] {
    // Start position preference
    const startPosition = Math.random() < 0.33 ? 'pin'
      : Math.random() < 0.5 ? 'committee' : 'middle';

    // First beat tack (favor lifted side)
    const avgWindShift = conditions.windShifts.slice(0, 2).reduce((a: number, b: number) => a + b, 0) / 2;
    const firstBeatTack = avgWindShift > 0 ? 'right' : 'left';

    // Gate choice (if applicable)
    const gateChoice = Math.random() < 0.5 ? 'left' : 'right';

    // Mark roundings quality (higher maneuverability = more clean roundings)
    const markRoundings = Math.floor(
      Math.random() * 6 * equipment.maneuverability
    );

    return {
      startPosition: startPosition as any,
      firstBeatTack: firstBeatTack as any,
      gateChoice: gateChoice as any,
      markRoundings,
    };
  }

  /**
   * Simulate race progression and calculate finish position
   */
  private simulateRaceProgression(
    conditions: any,
    equipment: EquipmentProfile,
    decisions: SimulationIteration['tacticalDecisions'],
    fleetSize: number
  ): { finishPosition: number; elapsedTime: number } {
    // Base performance (centered around middle of fleet)
    let performanceScore = fleetSize / 2;

    // Equipment factors
    const avgWindSpeed = conditions.windSpeed;
    if (avgWindSpeed < 8) {
      // Light air - uphill speed more important
      performanceScore -= (equipment.uphillSpeed - 1.0) * fleetSize * 0.3;
    } else if (avgWindSpeed > 15) {
      // Heavy air - downhill speed more important
      performanceScore -= (equipment.downhillSpeed - 1.0) * fleetSize * 0.3;
    } else {
      // Medium air - balanced
      performanceScore -=
        ((equipment.uphillSpeed + equipment.downhillSpeed) / 2 - 1.0) * fleetSize * 0.3;
    }

    // Start position impact
    const startImpact = {
      pin: -1, // slightly favored
      committee: -1,
      middle: 0,
    };
    performanceScore += startImpact[decisions.startPosition];

    // Tactical decision impact (wind shifts)
    const avgShift = conditions.windShifts.reduce((a: number, b: number) => a + b, 0) / conditions.windShifts.length;
    const tackCorrect =
      (avgShift > 0 && decisions.firstBeatTack === 'right') ||
      (avgShift < 0 && decisions.firstBeatTack === 'left');

    if (tackCorrect) {
      performanceScore -= fleetSize * 0.15; // 15% improvement for correct call
    }

    // Mark rounding quality
    performanceScore -= decisions.markRoundings * 0.5;

    // Add randomness (luck factor - 20% of variance)
    performanceScore += (Math.random() - 0.5) * fleetSize * 0.4;

    // Clamp to valid range
    const finishPosition = Math.max(1, Math.min(fleetSize, Math.round(performanceScore)));

    // Calculate elapsed time (normalize around 3600 seconds = 1 hour)
    const baseTime = 3600;
    const positionTimeDelta = (finishPosition - 1) * 30; // 30 seconds per position
    const elapsedTime = baseTime + positionTimeDelta + (Math.random() - 0.5) * 60;

    return { finishPosition, elapsedTime };
  }

  /**
   * Generate a random incident
   */
  private generateRandomIncident(): string {
    const incidents = [
      'Mark touch at windward mark',
      'Penalty turn after start line infringement',
      'Equipment failure - jammed spinnaker halyard',
      'Crew overboard drill',
      'Protest from competitor',
      'Wind shadow at leeward mark',
    ];

    return incidents[Math.floor(Math.random() * incidents.length)];
  }

  /**
   * Aggregate simulation results
   */
  private aggregateResults(
    iterations: SimulationIteration[],
    fleetSize: number
  ): SimulationResults {
    // Position distribution
    const positionCounts: Record<number, number> = {};
    for (let i = 1; i <= fleetSize; i++) {
      positionCounts[i] = 0;
    }

    iterations.forEach(iter => {
      positionCounts[iter.finishPosition]++;
    });

    const positionDistribution: Record<number, number> = {};
    Object.entries(positionCounts).forEach(([pos, count]) => {
      positionDistribution[Number(pos)] = count / iterations.length;
    });

    // Expected and median finish
    const sortedPositions = iterations
      .map(i => i.finishPosition)
      .sort((a, b) => a - b);

    const expectedFinish =
      sortedPositions.reduce((a, b) => a + b, 0) / iterations.length;

    const medianFinish = sortedPositions[Math.floor(iterations.length / 2)];

    // Probabilities
    const podiumProbability =
      iterations.filter(i => i.finishPosition <= 3).length / iterations.length;

    const winProbability =
      iterations.filter(i => i.finishPosition === 1).length / iterations.length;

    // Success factors analysis
    const successFactors = this.analyzeSuccessFactors(iterations);

    // Alternative strategies
    const alternativeStrategies = this.generateAlternativeStrategies(
      iterations,
      fleetSize
    );

    // Confidence interval (95%)
    const confidenceInterval = {
      lower: sortedPositions[Math.floor(iterations.length * 0.025)],
      upper: sortedPositions[Math.floor(iterations.length * 0.975)],
    };

    return {
      totalIterations: iterations.length,
      positionDistribution,
      expectedFinish,
      medianFinish,
      podiumProbability,
      winProbability,
      successFactors,
      alternativeStrategies,
      confidenceInterval,
      iterations,
    };
  }

  /**
   * Analyze success factors and their impact
   */
  private analyzeSuccessFactors(
    iterations: SimulationIteration[]
  ): SimulationResults['successFactors'] {
    // Calculate correlations between factors and finish position
    const factors = [
      {
        factor: 'Start Position',
        impact: this.calculateCorrelation(
          iterations,
          i => i.tacticalDecisions.startPosition === 'pin' ? 1 : 0,
          i => i.finishPosition
        ),
        description: 'Impact of favoring pin end vs. committee boat',
      },
      {
        factor: 'First Beat Tack',
        impact: this.calculateCorrelation(
          iterations,
          i => i.tacticalDecisions.firstBeatTack === 'right' ? 1 : 0,
          i => i.finishPosition
        ),
        description: 'Choosing the lifted tack on first upwind leg',
      },
      {
        factor: 'Mark Roundings',
        impact: Math.abs(this.calculateCorrelation(
          iterations,
          i => i.tacticalDecisions.markRoundings,
          i => i.finishPosition
        )),
        description: 'Clean mark roundings without fouling',
      },
      {
        factor: 'Wind Shifts',
        impact: Math.abs(this.calculateCorrelation(
          iterations,
          i => Math.abs(i.windShifts.reduce((a, b) => a + b, 0)),
          i => i.finishPosition
        )),
        description: 'Responding to wind direction changes',
      },
    ];

    return factors.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Calculate correlation coefficient between two variables
   */
  private calculateCorrelation(
    iterations: SimulationIteration[],
    xFunc: (i: SimulationIteration) => number,
    yFunc: (i: SimulationIteration) => number
  ): number {
    const n = iterations.length;
    const xs = iterations.map(xFunc);
    const ys = iterations.map(yFunc);

    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const correlation = numerator / Math.sqrt(denomX * denomY);
    return Math.abs(correlation); // Return absolute value for impact magnitude
  }

  /**
   * Generate alternative strategy suggestions
   */
  private generateAlternativeStrategies(
    iterations: SimulationIteration[],
    fleetSize: number
  ): SimulationResults['alternativeStrategies'] {
    // Analyze what worked best
    const topQuartile = iterations
      .filter(i => i.finishPosition <= fleetSize / 4)
      .sort((a, b) => a.finishPosition - b.finishPosition);

    const bottomQuartile = iterations
      .filter(i => i.finishPosition > fleetSize * 0.75)
      .sort((a, b) => b.finishPosition - a.finishPosition);

    // Conservative strategy (minimize risk)
    const conservativePositions = iterations.map(i => {
      // Simulate more cautious approach (less aggressive tactics)
      return Math.min(fleetSize, i.finishPosition + 2);
    });
    const conservativeExpected =
      conservativePositions.reduce((a, b) => a + b, 0) / iterations.length;

    // Aggressive strategy (maximize upside)
    const aggressivePositions = iterations.map(i => {
      // Simulate more risky approach (higher variance)
      const variance = Math.random() < 0.5 ? -3 : 3;
      return Math.max(1, Math.min(fleetSize, i.finishPosition + variance));
    });
    const aggressiveExpected =
      aggressivePositions.reduce((a, b) => a + b, 0) / iterations.length;

    return [
      {
        name: 'Conservative',
        expectedFinish: conservativeExpected,
        podiumProbability:
          conservativePositions.filter(p => p <= 3).length / iterations.length,
        riskLevel: 'low',
        description: 'Minimize risk, prioritize consistent performance',
      },
      {
        name: 'Aggressive',
        expectedFinish: aggressiveExpected,
        podiumProbability:
          aggressivePositions.filter(p => p <= 3).length / iterations.length,
        riskLevel: 'high',
        description: 'High-risk, high-reward tactical approach',
      },
      {
        name: 'Pin-favored Start',
        expectedFinish:
          topQuartile
            .filter(i => i.tacticalDecisions.startPosition === 'pin')
            .reduce((sum, i) => sum + i.finishPosition, 0) /
          topQuartile.filter(i => i.tacticalDecisions.startPosition === 'pin').length || fleetSize / 2,
        podiumProbability:
          topQuartile.filter(i =>
            i.tacticalDecisions.startPosition === 'pin' && i.finishPosition <= 3
          ).length / iterations.length,
        riskLevel: 'medium',
        description: 'Favor pin end for better wind and current',
      },
    ];
  }

  /**
   * Save simulation results to database
   */
  async saveSimulation(
    strategyId: string,
    results: SimulationResults,
    userId: string
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('monte_carlo_simulations')
      .insert({
        race_strategy_id: strategyId,
        user_id: userId,
        results,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving simulation:', error);
      return null;
    }

    return data.id;
  }

  /**
   * Load saved simulation
   */
  async loadSimulation(simulationId: string): Promise<SimulationResults | null> {
    const { data, error } = await supabase
      .from('monte_carlo_simulations')
      .select('results')
      .eq('id', simulationId)
      .single();

    if (error) {
      console.error('Error loading simulation:', error);
      return null;
    }

    return data.results as SimulationResults;
  }
}

// Export singleton instance
export const monteCarloService = MonteCarloService.getInstance();
