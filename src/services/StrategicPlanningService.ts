import { GoogleGenerativeAI } from '@google/generative-ai';

interface RaceStrategy {
  strategy_id: string;
  course_analysis: CourseAnalysis;
  environmental_conditions: EnvironmentalConditions;
  tactical_plan: TacticalPlan;
  contingency_plans: ContingencyPlan[];
  performance_predictions: PerformancePrediction[];
  confidence_metrics: ConfidenceMetrics;
  monte_carlo_results: MonteCarloResults;
}

interface CourseAnalysis {
  course_type: 'windward_leeward' | 'triangle' | 'trapezoid' | 'random_leg';
  total_distance: number;
  estimated_duration: number;
  key_tactical_points: TacticalPoint[];
  wind_legs_analysis: WindLegAnalysis[];
  mark_rounding_complexity: MarkComplexity[];
  traffic_density_zones: TrafficZone[];
}

interface TacticalPoint {
  location: [number, number];
  point_type: 'start' | 'mark_approach' | 'layline' | 'shift_zone' | 'current_gate';
  importance_level: 'critical' | 'high' | 'medium' | 'low';
  decision_options: DecisionOption[];
  timing_window: number; // seconds before/after
  success_probability: number;
}

interface DecisionOption {
  option_id: string;
  description: string;
  conditions_required: string[];
  expected_gain: number; // positions
  risk_level: 'low' | 'medium' | 'high';
  execution_difficulty: number; // 1-10
}

interface WindLegAnalysis {
  leg_number: number;
  leg_type: 'beat' | 'reach' | 'run';
  distance: number;
  optimal_angle: number;
  expected_shifts: WindShift[];
  strategic_options: StrategicOption[];
  speed_predictions: SpeedPrediction[];
}

interface WindShift {
  shift_time: number; // minutes from start
  direction_change: number; // degrees
  magnitude: number; // shift size
  probability: number;
  duration: number; // minutes
  tactical_impact: string[];
}

interface StrategicOption {
  option_name: string;
  side_preference: 'left' | 'right' | 'middle';
  timing_strategy: 'early' | 'late' | 'reactive';
  risk_reward_ratio: number;
  conditions_favorable: string[];
  execution_notes: string[];
}

interface SpeedPrediction {
  boat_angle: number;
  predicted_speed: number;
  vmg_efficiency: number;
  confidence_interval: [number, number];
}

interface MarkComplexity {
  mark_id: string;
  approach_difficulty: number; // 1-10
  traffic_congestion: number; // 1-10
  current_effects: number; // 1-10
  optimal_approach_angle: number;
  layline_considerations: string[];
  escape_routes: string[];
}

interface TrafficZone {
  zone_coordinates: [number, number][];
  congestion_level: 'low' | 'medium' | 'high' | 'extreme';
  fleet_convergence_time: number;
  avoidance_strategies: string[];
  opportunity_windows: OpportunityWindow[];
}

interface OpportunityWindow {
  start_time: number;
  end_time: number;
  advantage_type: 'clear_air' | 'inside_overlap' | 'shift_leverage' | 'current_advantage';
  execution_requirements: string[];
}

interface EnvironmentalConditions {
  wind_forecast: WindForecast;
  current_forecast: CurrentForecast;
  tide_schedule: TideSchedule;
  weather_stability: WeatherStability;
  visibility_conditions: VisibilityConditions;
}

interface WindForecast {
  race_start_conditions: WindCondition;
  hourly_forecast: WindCondition[];
  shift_predictions: ShiftPrediction[];
  pressure_systems: PressureSystem[];
  local_effects: LocalEffect[];
}

interface WindCondition {
  time: string;
  direction: number;
  speed: number;
  gust_factor: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface ShiftPrediction {
  predicted_time: string;
  shift_direction: 'left' | 'right';
  magnitude: number;
  probability: number;
  duration_minutes: number;
  tactical_significance: 'major' | 'moderate' | 'minor';
}

interface PressureSystem {
  system_type: 'high' | 'low' | 'front' | 'convergence';
  location: [number, number];
  movement_vector: [number, number];
  intensity: number;
  time_of_closest_approach: string;
}

interface LocalEffect {
  effect_type: 'thermal' | 'topographic' | 'sea_breeze' | 'katabatic';
  affected_area: [number, number][];
  typical_timing: string;
  strength_indicator: number;
  predictability: number;
}

interface CurrentForecast {
  tidal_currents: TidalCurrent[];
  stream_patterns: StreamPattern[];
  eddy_formations: EddyFormation[];
  current_gates: CurrentGate[];
}

interface TidalCurrent {
  time: string;
  direction: number;
  speed: number;
  affected_coordinates: [number, number][];
  tidal_state: 'flood' | 'ebb' | 'slack_before_flood' | 'slack_before_ebb';
}

interface StreamPattern {
  pattern_id: string;
  flow_direction: number;
  peak_velocity: number;
  gradient_strength: number;
  tactical_opportunities: string[];
}

interface EddyFormation {
  location: [number, number];
  rotation_direction: 'clockwise' | 'counterclockwise';
  strength: number;
  formation_time: string;
  dissipation_time: string;
}

interface CurrentGate {
  gate_coordinates: [number, number][];
  favorable_crossing_times: string[];
  penalty_zones: [number, number][][];
  crossing_strategies: string[];
}

interface TideSchedule {
  high_tide: string;
  low_tide: string;
  tide_range: number;
  current_strength_profile: CurrentStrengthProfile[];
}

interface CurrentStrengthProfile {
  time_offset_from_tide: number; // minutes
  current_strength: number; // knots
  direction: number; // degrees
}

interface WeatherStability {
  pressure_trend: 'rising' | 'falling' | 'stable';
  wind_consistency: number; // 0-1
  shift_frequency: number; // shifts per hour
  predictability_index: number; // 0-1
}

interface VisibilityConditions {
  visibility_km: number;
  fog_probability: number;
  light_conditions: 'bright' | 'overcast' | 'low_light';
  mark_visibility_rating: number; // 1-10
}

interface TacticalPlan {
  pre_start_sequence: PreStartSequence;
  start_strategy: StartStrategy;
  first_beat_plan: BeatPlan;
  mark_rounding_plans: MarkRoundingPlan[];
  downwind_strategies: DownwindStrategy[];
  finish_approach: FinishApproach;
  fleet_management: FleetManagement;
}

interface PreStartSequence {
  timing_schedule: TimingPoint[];
  line_bias_assessment: LineBiasAssessment;
  wind_reading_routine: WindReadingRoutine;
  positioning_strategy: PositioningStrategy;
  escape_routes: EscapeRoute[];
}

interface TimingPoint {
  time_to_start: number; // seconds
  action: string;
  position_target: [number, number];
  contingency_actions: string[];
}

interface LineBiasAssessment {
  favored_end: 'pin' | 'boat' | 'neutral';
  bias_angle: number;
  confidence: number;
  reassessment_triggers: string[];
}

interface WindReadingRoutine {
  measurement_points: [number, number][];
  reading_frequency: number; // seconds
  trend_analysis_duration: number; // minutes
  decision_thresholds: DecisionThreshold[];
}

interface DecisionThreshold {
  wind_change_magnitude: number;
  time_remaining: number;
  strategy_adjustment: string;
}

interface PositioningStrategy {
  initial_position: [number, number];
  hold_pattern: [number, number][];
  acceleration_zone: [number, number][];
  timing_objectives: TimingObjective[];
}

interface TimingObjective {
  objective_time: number;
  target_position: [number, number];
  speed_profile: SpeedProfile[];
}

interface SpeedProfile {
  time_point: number;
  target_speed: number;
  acceleration_phase: 'building' | 'maintaining' | 'full_speed';
}

interface EscapeRoute {
  trigger_conditions: string[];
  exit_direction: number;
  safe_zone: [number, number][];
  recovery_strategy: string;
}

interface StartStrategy {
  start_position_target: [number, number];
  timing_strategy: 'aggressive' | 'conservative' | 'reactive';
  first_shift_plan: ShiftPlan;
  traffic_management: TrafficManagement;
  execution_priorities: ExecutionPriority[];
}

interface ShiftPlan {
  expected_first_shift: 'left' | 'right' | 'none';
  positioning_for_shift: PositioningForShift;
  shift_timing_window: number; // minutes
  backup_plans: BackupPlan[];
}

interface PositioningForShift {
  optimal_side: 'left' | 'right' | 'middle';
  positioning_coordinates: [number, number];
  timing_requirements: string[];
}

interface BackupPlan {
  trigger_condition: string;
  alternative_strategy: string;
  position_adjustment: [number, number];
}

interface TrafficManagement {
  congestion_zones: [number, number][][];
  avoidance_strategies: string[];
  overtaking_opportunities: OvertakingOpportunity[];
}

interface OvertakingOpportunity {
  location: [number, number];
  timing_window: [number, number];
  execution_requirements: string[];
  success_probability: number;
}

interface ExecutionPriority {
  priority_level: number;
  objective: string;
  success_criteria: string[];
  failure_response: string;
}

interface BeatPlan {
  side_selection: SideSelection;
  tacking_strategy: TackingStrategy;
  layline_approach: LaylineApproach;
  shift_response_plan: ShiftResponsePlan;
}

interface SideSelection {
  initial_side: 'left' | 'right' | 'middle';
  commitment_level: 'high' | 'medium' | 'low';
  decision_factors: DecisionFactor[];
  side_switch_triggers: SideSwitchTrigger[];
}

interface DecisionFactor {
  factor_name: string;
  weight: number; // 0-1
  current_value: number;
  favorable_threshold: number;
}

interface SideSwitchTrigger {
  trigger_condition: string;
  timing_requirements: string;
  execution_plan: string;
}

interface TackingStrategy {
  tack_timing: TackTiming[];
  tack_execution: TackExecution;
  traffic_considerations: string[];
}

interface TackTiming {
  timing_type: 'shift_based' | 'position_based' | 'traffic_based' | 'tactical';
  execution_trigger: string;
  optimal_timing_window: [number, number];
}

interface TackExecution {
  preparation_checklist: string[];
  execution_sequence: string[];
  performance_targets: PerformanceTarget[];
}

interface PerformanceTarget {
  metric: string;
  target_value: number;
  acceptable_range: [number, number];
}

interface LaylineApproach {
  layline_identification: LaylineIdentification;
  approach_strategy: ApproachStrategy;
  traffic_management: string[];
}

interface LaylineIdentification {
  calculation_method: 'current_adjusted' | 'standard' | 'conservative';
  safety_margin: number; // degrees
  reassessment_frequency: number; // seconds
}

interface ApproachStrategy {
  approach_angle: number;
  speed_profile: string;
  positioning_relative_to_fleet: string;
}

interface ShiftResponsePlan {
  shift_detection_criteria: ShiftDetectionCriteria;
  response_protocols: ResponseProtocol[];
  timing_considerations: string[];
}

interface ShiftDetectionCriteria {
  minimum_shift_magnitude: number;
  confirmation_time: number;
  reliability_threshold: number;
}

interface ResponseProtocol {
  shift_type: 'header' | 'lift' | 'oscillation';
  immediate_response: string;
  follow_up_actions: string[];
  timing_requirements: string[];
}

interface MarkRoundingPlan {
  mark_id: string;
  approach_strategy: MarkApproachStrategy;
  rounding_execution: RoundingExecution;
  exit_strategy: ExitStrategy;
}

interface MarkApproachStrategy {
  approach_angle: number;
  speed_management: SpeedManagement;
  traffic_positioning: TrafficPositioning;
  current_compensation: CurrentCompensation;
}

interface SpeedManagement {
  deceleration_point: [number, number];
  minimum_speed: number;
  acceleration_timing: string;
}

interface TrafficPositioning {
  optimal_approach_lane: string;
  overtaking_zones: [number, number][];
  defensive_positions: [number, number][];
}

interface CurrentCompensation {
  current_direction: number;
  current_strength: number;
  compensation_angle: number;
  timing_adjustments: string[];
}

interface RoundingExecution {
  turn_initiation_point: [number, number];
  turn_radius: number;
  sail_handling_sequence: string[];
  boat_handling_priorities: string[];
}

interface ExitStrategy {
  exit_angle: number;
  acceleration_plan: string;
  next_leg_positioning: string;
  traffic_clearing: string[];
}

interface DownwindStrategy {
  leg_number: number;
  sailing_angle_strategy: SailingAngleStrategy;
  wind_patterns: WindPatternStrategy;
  mark_approach_preparation: MarkApproachPreparation;
}

interface SailingAngleStrategy {
  base_sailing_angle: number;
  angle_adjustments: AngleAdjustment[];
  gybe_strategy: GybeStrategy;
}

interface AngleAdjustment {
  condition: string;
  angle_change: number;
  duration: string;
  performance_impact: number;
}

interface GybeStrategy {
  gybe_timing: GybeTiming[];
  execution_plan: string[];
  traffic_considerations: string[];
}

interface GybeTiming {
  timing_trigger: string;
  optimal_location: [number, number];
  wind_requirements: string[];
}

interface WindPatternStrategy {
  pressure_seeking: PressureSeeking;
  shift_utilization: ShiftUtilization;
  traffic_management: string[];
}

interface PressureSeeking {
  pressure_indicators: string[];
  seeking_strategy: string;
  commitment_level: 'high' | 'medium' | 'low';
}

interface ShiftUtilization {
  shift_anticipation: string;
  positioning_strategy: string;
  timing_requirements: string[];
}

interface MarkApproachPreparation {
  preparation_distance: number;
  speed_building_strategy: string;
  positioning_objectives: string[];
}

interface FinishApproach {
  finish_line_strategy: FinishLineStrategy;
  sprint_planning: SprintPlanning;
  traffic_management: string[];
}

interface FinishLineStrategy {
  line_bias_assessment: string;
  optimal_approach_angle: number;
  timing_considerations: string[];
}

interface SprintPlanning {
  sprint_initiation_distance: number;
  speed_building_plan: string[];
  energy_management: string[];
}

interface FleetManagement {
  position_tracking: PositionTracking;
  competitive_analysis: CompetitiveAnalysis;
  opportunity_identification: OpportunityIdentification;
}

interface PositionTracking {
  key_competitors: string[];
  position_monitoring_frequency: number;
  relative_performance_metrics: string[];
}

interface CompetitiveAnalysis {
  competitor_strengths: CompetitorStrength[];
  tactical_countermeasures: TacticalCountermeasure[];
}

interface CompetitorStrength {
  competitor_id: string;
  strength_area: string;
  counterstrategy: string;
}

interface TacticalCountermeasure {
  situation: string;
  countermeasure: string;
  timing_requirements: string[];
}

interface OpportunityIdentification {
  opportunity_types: string[];
  recognition_criteria: string[];
  exploitation_strategies: string[];
}

interface ContingencyPlan {
  scenario_id: string;
  trigger_conditions: string[];
  alternative_strategy: AlternativeStrategy;
  implementation_timeline: ImplementationTimeline;
  success_metrics: SuccessMetric[];
}

interface AlternativeStrategy {
  strategy_name: string;
  key_adjustments: string[];
  resource_requirements: string[];
  risk_assessment: RiskAssessment;
}

interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: string[];
  mitigation_measures: string[];
}

interface ImplementationTimeline {
  decision_point: number; // seconds from race start
  implementation_duration: number; // seconds
  checkpoints: Checkpoint[];
}

interface Checkpoint {
  time_point: number;
  validation_criteria: string[];
  adjustment_options: string[];
}

interface SuccessMetric {
  metric_name: string;
  target_value: number;
  measurement_method: string;
}

interface PerformancePrediction {
  scenario_name: string;
  predicted_finish_position: number;
  confidence_interval: [number, number];
  key_performance_factors: PerformanceFactor[];
  sensitivity_analysis: SensitivityAnalysis;
}

interface PerformanceFactor {
  factor_name: string;
  impact_magnitude: number;
  controllability: 'high' | 'medium' | 'low';
  optimization_potential: number;
}

interface SensitivityAnalysis {
  parameter_variations: ParameterVariation[];
  performance_impact: PerformanceImpact[];
}

interface ParameterVariation {
  parameter_name: string;
  variation_range: [number, number];
  likelihood: number;
}

interface PerformanceImpact {
  scenario: string;
  position_change: number;
  time_difference: number;
}

interface ConfidenceMetrics {
  overall_confidence: number; // 0-1
  wind_forecast_confidence: number;
  tactical_plan_confidence: number;
  execution_confidence: number;
  contingency_preparedness: number;
}

interface MonteCarloResults {
  simulation_parameters: SimulationParameters;
  scenario_outcomes: ScenarioOutcome[];
  statistical_summary: StatisticalSummary;
  optimization_recommendations: OptimizationRecommendation[];
}

interface SimulationParameters {
  number_of_simulations: number;
  variable_parameters: VariableParameter[];
  fixed_constraints: FixedConstraint[];
}

interface VariableParameter {
  parameter_name: string;
  distribution_type: 'normal' | 'uniform' | 'triangular';
  distribution_parameters: number[];
}

interface FixedConstraint {
  constraint_name: string;
  constraint_value: any;
  constraint_type: 'hard' | 'soft';
}

interface ScenarioOutcome {
  simulation_id: number;
  wind_conditions: WindCondition[];
  strategic_decisions: StrategicDecision[];
  finish_position: number;
  finish_time: number;
  key_events: KeyEvent[];
}

interface StrategicDecision {
  decision_time: number;
  decision_type: string;
  chosen_option: string;
  outcome_impact: number;
}

interface KeyEvent {
  event_time: number;
  event_type: string;
  event_description: string;
  position_impact: number;
}

interface StatisticalSummary {
  mean_finish_position: number;
  median_finish_position: number;
  position_distribution: PositionDistribution[];
  success_probability: SuccessProbability[];
  risk_analysis: RiskAnalysis;
}

interface PositionDistribution {
  position: number;
  probability: number;
}

interface SuccessProbability {
  success_criteria: string;
  probability: number;
}

interface RiskAnalysis {
  worst_case_scenarios: WorstCaseScenario[];
  risk_mitigation_effectiveness: number;
  strategic_robustness: number;
}

interface WorstCaseScenario {
  scenario_description: string;
  probability: number;
  impact_severity: number;
  mitigation_options: string[];
}

interface OptimizationRecommendation {
  recommendation_type: 'strategic' | 'tactical' | 'execution';
  description: string;
  expected_improvement: number;
  implementation_difficulty: number;
  confidence: number;
}

export class StrategicPlanningService {
  private static genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

  /**
   * Generate comprehensive race strategy using AI and Monte Carlo simulation
   */
  static async generateRaceStrategy(
    courseExtraction: CourseExtraction,
    venueIntelligence: VenueIntelligence,
    environmentalData: any,
    sailorProfile: any,
    competitionLevel: 'club' | 'regional' | 'national' | 'international'
  ): Promise<RaceStrategy> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
Generate a comprehensive race strategy for competitive sailing using advanced tactical analysis.

COURSE INFORMATION:
${JSON.stringify(courseExtraction, null, 2)}

VENUE INTELLIGENCE:
${JSON.stringify(venueIntelligence, null, 2)}

ENVIRONMENTAL CONDITIONS:
${JSON.stringify(environmentalData, null, 2)}

SAILOR PROFILE:
${JSON.stringify(sailorProfile, null, 2)}

COMPETITION LEVEL: ${competitionLevel}

Generate a detailed race strategy that includes:

1. COMPREHENSIVE COURSE ANALYSIS:
   - Tactical points and decision zones
   - Wind leg analysis with shift predictions
   - Mark rounding complexity assessment
   - Traffic density and congestion zones

2. ENVIRONMENTAL INTEGRATION:
   - Wind forecast analysis and shift planning
   - Current and tidal effect utilization
   - Weather stability assessment
   - Visibility and safety considerations

3. DETAILED TACTICAL PLAN:
   - Pre-start sequence and timing
   - Start strategy with positioning
   - Beat plans with side selection logic
   - Mark rounding execution plans
   - Downwind strategies and gybe planning
   - Finish approach optimization

4. CONTINGENCY PLANNING:
   - Alternative strategies for different scenarios
   - Risk assessment and mitigation
   - Flexibility points and decision trees

5. PERFORMANCE PREDICTIONS:
   - Expected finish positions with confidence intervals
   - Key performance factors and optimization areas
   - Sensitivity analysis for strategic decisions

6. MONTE CARLO SIMULATION SETUP:
   - Variable parameters for simulation
   - Scenario outcome predictions
   - Statistical analysis and risk assessment
   - Optimization recommendations

The strategy should be tactical, data-driven, and adaptable to changing conditions during the race.

Consider the sailor's experience level, boat performance characteristics, and competition intensity.

Provide specific, actionable tactical guidance with timing, positioning, and decision-making frameworks.

Respond with a comprehensive JSON strategy structure.
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const strategyData = JSON.parse(jsonMatch[0]);

        // Run Monte Carlo simulation
        const monteCarloResults = await this.runMonteCarloSimulation(
          courseExtraction,
          venueIntelligence,
          environmentalData,
          strategyData
        );

        // Combine strategy with simulation results
        const completeStrategy: RaceStrategy = {
          strategy_id: `strategy_${Date.now()}`,
          ...strategyData,
          monte_carlo_results: monteCarloResults,
        };

        return completeStrategy;
      }

      // Fallback strategy
      return this.generateFallbackStrategy(courseExtraction, venueIntelligence);
    } catch (error) {
      console.error('Error generating race strategy:', error);
      return this.generateFallbackStrategy(courseExtraction, venueIntelligence);
    }
  }

  /**
   * Run Monte Carlo simulation for strategy optimization
   */
  static async runMonteCarloSimulation(
    courseExtraction: CourseExtraction,
    venueIntelligence: VenueIntelligence,
    environmentalData: any,
    strategyData: any,
    numSimulations: number = 1000
  ): Promise<MonteCarloResults> {
    try {
      const simulations: ScenarioOutcome[] = [];

      // Define variable parameters for simulation
      const variableParameters: VariableParameter[] = [
        {
          parameter_name: 'wind_direction',
          distribution_type: 'normal',
          distribution_parameters: [
            environmentalData.wind?.direction || 90,
            15 // standard deviation
          ],
        },
        {
          parameter_name: 'wind_speed',
          distribution_type: 'normal',
          distribution_parameters: [
            environmentalData.wind?.speed || 12,
            3 // standard deviation
          ],
        },
        {
          parameter_name: 'wind_shift_frequency',
          distribution_type: 'uniform',
          distribution_parameters: [0.1, 0.5], // shifts per minute
        },
        {
          parameter_name: 'current_strength',
          distribution_type: 'triangular',
          distribution_parameters: [0, 1, 2.5], // min, mode, max knots
        },
      ];

      // Run simulations
      for (let i = 0; i < numSimulations; i++) {
        const scenario = this.simulateRaceScenario(
          courseExtraction,
          venueIntelligence,
          variableParameters,
          strategyData,
          i
        );
        simulations.push(scenario);
      }

      // Calculate statistical summary
      const finishPositions = simulations.map(s => s.finish_position);
      const finishTimes = simulations.map(s => s.finish_time);

      const statisticalSummary: StatisticalSummary = {
        mean_finish_position: finishPositions.reduce((a, b) => a + b, 0) / finishPositions.length,
        median_finish_position: this.calculateMedian(finishPositions),
        position_distribution: this.calculatePositionDistribution(finishPositions),
        success_probability: this.calculateSuccessProbabilities(finishPositions),
        risk_analysis: this.analyzeRisks(simulations),
      };

      // Generate optimization recommendations
      const optimizationRecommendations = this.generateOptimizationRecommendations(simulations, strategyData);

      return {
        simulation_parameters: {
          number_of_simulations: numSimulations,
          variable_parameters: variableParameters,
          fixed_constraints: [],
        },
        scenario_outcomes: simulations,
        statistical_summary: statisticalSummary,
        optimization_recommendations: optimizationRecommendations,
      };
    } catch (error) {
      console.error('Error running Monte Carlo simulation:', error);
      return this.generateFallbackMonteCarloResults();
    }
  }

  /**
   * Update strategy during race based on real-time conditions
   */
  static async updateStrategyRealTime(
    strategyId: string,
    currentConditions: any,
    raceProgress: any,
    performanceData: any
  ): Promise<{
    updated_strategy: Partial<RaceStrategy>;
    immediate_recommendations: string[];
    tactical_adjustments: TacticalAdjustment[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
Update race strategy based on real-time conditions and race progress.

CURRENT CONDITIONS:
${JSON.stringify(currentConditions, null, 2)}

RACE PROGRESS:
${JSON.stringify(raceProgress, null, 2)}

PERFORMANCE DATA:
${JSON.stringify(performanceData, null, 2)}

Provide immediate tactical recommendations and strategy adjustments based on:

1. CONDITION CHANGES:
   - Wind shifts and pressure changes
   - Current variations
   - Fleet positioning changes

2. PERFORMANCE ANALYSIS:
   - Speed comparisons with fleet
   - Tactical decision effectiveness
   - Position changes and trends

3. OPPORTUNITY IDENTIFICATION:
   - Immediate tactical opportunities
   - Strategic positioning advantages
   - Risk/reward assessments

4. TACTICAL ADJUSTMENTS:
   - Modified game plan recommendations
   - Timing adjustments
   - Positioning modifications

Provide actionable, time-sensitive recommendations for optimal race execution.

Respond in JSON format with immediate recommendations and tactical adjustments.
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackRealTimeUpdate();
    } catch (error) {
      console.error('Error updating strategy real-time:', error);
      return this.generateFallbackRealTimeUpdate();
    }
  }

  /**
   * Analyze post-race performance and strategy effectiveness
   */
  static async analyzeRacePerformance(
    originalStrategy: RaceStrategy,
    actualRaceData: any,
    finalResults: any
  ): Promise<{
    performance_analysis: PerformanceAnalysis;
    strategy_effectiveness: StrategyEffectiveness;
    lessons_learned: LessonLearned[];
    improvement_recommendations: ImprovementRecommendation[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
Analyze race performance and strategy effectiveness for continuous improvement.

ORIGINAL STRATEGY:
${JSON.stringify(originalStrategy, null, 2)}

ACTUAL RACE DATA:
${JSON.stringify(actualRaceData, null, 2)}

FINAL RESULTS:
${JSON.stringify(finalResults, null, 2)}

Provide comprehensive performance analysis including:

1. STRATEGY EXECUTION ANALYSIS:
   - Plan vs. actual execution comparison
   - Decision point effectiveness
   - Timing accuracy assessment

2. TACTICAL DECISION EVALUATION:
   - Strategic choice outcomes
   - Alternative scenario analysis
   - Risk/reward realization

3. PERFORMANCE METRICS:
   - Speed and positioning analysis
   - Boat handling effectiveness
   - Environmental adaptation

4. LEARNING OPPORTUNITIES:
   - Key insights and patterns
   - Skill development areas
   - Strategic refinements

5. IMPROVEMENT RECOMMENDATIONS:
   - Tactical skill priorities
   - Strategic planning enhancements
   - Preparation improvements

Focus on actionable insights for performance improvement and strategic development.

Respond in JSON format with detailed analysis and recommendations.
`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.generateFallbackPerformanceAnalysis();
    } catch (error) {
      console.error('Error analyzing race performance:', error);
      return this.generateFallbackPerformanceAnalysis();
    }
  }

  // Helper methods for Monte Carlo simulation

  private static simulateRaceScenario(
    courseExtraction: CourseExtraction,
    venueIntelligence: VenueIntelligence,
    variableParameters: VariableParameter[],
    strategyData: any,
    simulationId: number
  ): ScenarioOutcome {
    // Generate random values for variable parameters
    const windConditions = this.generateRandomWindConditions(variableParameters);

    // Simulate strategic decisions based on conditions
    const strategicDecisions = this.simulateStrategicDecisions(strategyData, windConditions);

    // Calculate finish position based on decisions and luck factors
    const finishPosition = this.calculateSimulatedFinishPosition(strategicDecisions, windConditions);

    // Calculate finish time
    const finishTime = this.calculateSimulatedFinishTime(courseExtraction, windConditions, strategicDecisions);

    // Generate key events
    const keyEvents = this.generateKeyEvents(strategicDecisions, windConditions);

    return {
      simulation_id: simulationId,
      wind_conditions: windConditions,
      strategic_decisions: strategicDecisions,
      finish_position: finishPosition,
      finish_time: finishTime,
      key_events: keyEvents,
    };
  }

  private static generateRandomWindConditions(parameters: VariableParameter[]): WindCondition[] {
    const windDirection = this.sampleFromDistribution(
      parameters.find(p => p.parameter_name === 'wind_direction')!
    );
    const windSpeed = this.sampleFromDistribution(
      parameters.find(p => p.parameter_name === 'wind_speed')!
    );

    return [
      {
        time: '00:00',
        direction: windDirection,
        speed: windSpeed,
        gust_factor: 1.1 + Math.random() * 0.3,
        confidence: 0.8 + Math.random() * 0.2,
        trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any,
      },
    ];
  }

  private static sampleFromDistribution(parameter: VariableParameter): number {
    const params = parameter.distribution_parameters;

    switch (parameter.distribution_type) {
      case 'normal':
        return this.normalRandom(params[0], params[1]);
      case 'uniform':
        return params[0] + Math.random() * (params[1] - params[0]);
      case 'triangular':
        return this.triangularRandom(params[0], params[1], params[2]);
      default:
        return params[0];
    }
  }

  private static normalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  private static triangularRandom(min: number, mode: number, max: number): number {
    const u = Math.random();
    const f = (mode - min) / (max - min);

    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (mode - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }

  private static simulateStrategicDecisions(strategyData: any, windConditions: WindCondition[]): StrategicDecision[] {
    // Simplified strategic decision simulation
    return [
      {
        decision_time: 0,
        decision_type: 'start_position',
        chosen_option: 'conservative',
        outcome_impact: Math.random() * 2 - 1, // -1 to 1
      },
      {
        decision_time: 300,
        decision_type: 'first_tack',
        chosen_option: 'early_tack',
        outcome_impact: Math.random() * 3 - 1.5,
      },
    ];
  }

  private static calculateSimulatedFinishPosition(
    decisions: StrategicDecision[],
    windConditions: WindCondition[]
  ): number {
    // Simplified position calculation
    const basePosition = 10; // Starting mid-fleet
    const decisionImpact = decisions.reduce((acc, decision) => acc + decision.outcome_impact, 0);
    const luckFactor = (Math.random() - 0.5) * 4; // ±2 positions from luck

    const finalPosition = Math.max(1, Math.min(20, basePosition + decisionImpact + luckFactor));
    return Math.round(finalPosition);
  }

  private static calculateSimulatedFinishTime(
    courseExtraction: CourseExtraction,
    windConditions: WindCondition[],
    decisions: StrategicDecision[]
  ): number {
    // Simplified time calculation (seconds)
    const baseTime = courseExtraction.course_configurations[0]?.estimated_duration * 60 || 2700; // 45 minutes default
    const windEffect = (windConditions[0].speed - 12) * 10; // ±10 seconds per knot
    const decisionEffect = decisions.reduce((acc, decision) => acc + decision.outcome_impact * 5, 0);

    return baseTime - windEffect + decisionEffect;
  }

  private static generateKeyEvents(
    decisions: StrategicDecision[],
    windConditions: WindCondition[]
  ): KeyEvent[] {
    return [
      {
        event_time: 180,
        event_type: 'wind_shift',
        event_description: 'Significant right shift observed',
        position_impact: Math.random() * 2 - 1,
      },
      {
        event_time: 600,
        event_type: 'mark_rounding',
        event_description: 'Clean windward mark rounding',
        position_impact: Math.random() * 1.5,
      },
    ];
  }

  private static calculateMedian(numbers: number[]): number {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  private static calculatePositionDistribution(positions: number[]): PositionDistribution[] {
    const distribution: { [key: number]: number } = {};

    positions.forEach(position => {
      distribution[position] = (distribution[position] || 0) + 1;
    });

    return Object.entries(distribution).map(([position, count]) => ({
      position: parseInt(position),
      probability: count / positions.length,
    }));
  }

  private static calculateSuccessProbabilities(positions: number[]): SuccessProbability[] {
    const total = positions.length;

    return [
      {
        success_criteria: 'Top 3 finish',
        probability: positions.filter(p => p <= 3).length / total,
      },
      {
        success_criteria: 'Top 5 finish',
        probability: positions.filter(p => p <= 5).length / total,
      },
      {
        success_criteria: 'Top 10 finish',
        probability: positions.filter(p => p <= 10).length / total,
      },
    ];
  }

  private static analyzeRisks(simulations: ScenarioOutcome[]): RiskAnalysis {
    const worstCases = simulations
      .filter(s => s.finish_position > 15)
      .map(s => ({
        scenario_description: `Poor conditions with position ${s.finish_position}`,
        probability: 1 / simulations.length,
        impact_severity: s.finish_position / 20,
        mitigation_options: ['Conservative strategy', 'Focus on clean execution'],
      }));

    return {
      worst_case_scenarios: worstCases.slice(0, 3),
      risk_mitigation_effectiveness: 0.75,
      strategic_robustness: 0.8,
    };
  }

  private static generateOptimizationRecommendations(
    simulations: ScenarioOutcome[],
    strategyData: any
  ): OptimizationRecommendation[] {
    return [
      {
        recommendation_type: 'strategic',
        description: 'Focus on consistent execution over high-risk/high-reward tactics',
        expected_improvement: 1.5,
        implementation_difficulty: 3,
        confidence: 0.85,
      },
      {
        recommendation_type: 'tactical',
        description: 'Improve wind shift recognition and response timing',
        expected_improvement: 2.0,
        implementation_difficulty: 5,
        confidence: 0.78,
      },
    ];
  }

  // Fallback methods

  private static generateFallbackStrategy(
    courseExtraction: CourseExtraction,
    venueIntelligence: VenueIntelligence
  ): RaceStrategy {
    return {
      strategy_id: `fallback_${Date.now()}`,
      course_analysis: {
        course_type: 'windward_leeward',
        total_distance: 2.5,
        estimated_duration: 45,
        key_tactical_points: [],
        wind_legs_analysis: [],
        mark_rounding_complexity: [],
        traffic_density_zones: [],
      },
      environmental_conditions: {
        wind_forecast: {
          race_start_conditions: {
            time: '10:00',
            direction: 90,
            speed: 12,
            gust_factor: 1.2,
            confidence: 0.8,
            trend: 'stable',
          },
          hourly_forecast: [],
          shift_predictions: [],
          pressure_systems: [],
          local_effects: [],
        },
        current_forecast: {
          tidal_currents: [],
          stream_patterns: [],
          eddy_formations: [],
          current_gates: [],
        },
        tide_schedule: {
          high_tide: '14:30',
          low_tide: '08:15',
          tide_range: 2.5,
          current_strength_profile: [],
        },
        weather_stability: {
          pressure_trend: 'stable',
          wind_consistency: 0.8,
          shift_frequency: 0.2,
          predictability_index: 0.75,
        },
        visibility_conditions: {
          visibility_km: 10,
          fog_probability: 0.1,
          light_conditions: 'bright',
          mark_visibility_rating: 9,
        },
      },
      tactical_plan: {
        pre_start_sequence: {
          timing_schedule: [],
          line_bias_assessment: {
            favored_end: 'neutral',
            bias_angle: 0,
            confidence: 0.5,
            reassessment_triggers: [],
          },
          wind_reading_routine: {
            measurement_points: [],
            reading_frequency: 30,
            trend_analysis_duration: 5,
            decision_thresholds: [],
          },
          positioning_strategy: {
            initial_position: [0, 0],
            hold_pattern: [],
            acceleration_zone: [],
            timing_objectives: [],
          },
          escape_routes: [],
        },
        start_strategy: {
          start_position_target: [0, 0],
          timing_strategy: 'conservative',
          first_shift_plan: {
            expected_first_shift: 'none',
            positioning_for_shift: {
              optimal_side: 'middle',
              positioning_coordinates: [0, 0],
              timing_requirements: [],
            },
            shift_timing_window: 10,
            backup_plans: [],
          },
          traffic_management: {
            congestion_zones: [],
            avoidance_strategies: [],
            overtaking_opportunities: [],
          },
          execution_priorities: [],
        },
        first_beat_plan: {
          side_selection: {
            initial_side: 'middle',
            commitment_level: 'medium',
            decision_factors: [],
            side_switch_triggers: [],
          },
          tacking_strategy: {
            tack_timing: [],
            tack_execution: {
              preparation_checklist: [],
              execution_sequence: [],
              performance_targets: [],
            },
            traffic_considerations: [],
          },
          layline_approach: {
            layline_identification: {
              calculation_method: 'standard',
              safety_margin: 5,
              reassessment_frequency: 60,
            },
            approach_strategy: {
              approach_angle: 45,
              speed_profile: 'steady',
              positioning_relative_to_fleet: 'middle',
            },
            traffic_management: [],
          },
          shift_response_plan: {
            shift_detection_criteria: {
              minimum_shift_magnitude: 10,
              confirmation_time: 30,
              reliability_threshold: 0.7,
            },
            response_protocols: [],
            timing_considerations: [],
          },
        },
        mark_rounding_plans: [],
        downwind_strategies: [],
        finish_approach: {
          finish_line_strategy: {
            line_bias_assessment: 'neutral',
            optimal_approach_angle: 45,
            timing_considerations: [],
          },
          sprint_planning: {
            sprint_initiation_distance: 100,
            speed_building_plan: [],
            energy_management: [],
          },
          traffic_management: [],
        },
        fleet_management: {
          position_tracking: {
            key_competitors: [],
            position_monitoring_frequency: 60,
            relative_performance_metrics: [],
          },
          competitive_analysis: {
            competitor_strengths: [],
            tactical_countermeasures: [],
          },
          opportunity_identification: {
            opportunity_types: [],
            recognition_criteria: [],
            exploitation_strategies: [],
          },
        },
      },
      contingency_plans: [],
      performance_predictions: [],
      confidence_metrics: {
        overall_confidence: 0.6,
        wind_forecast_confidence: 0.7,
        tactical_plan_confidence: 0.6,
        execution_confidence: 0.65,
        contingency_preparedness: 0.5,
      },
      monte_carlo_results: this.generateFallbackMonteCarloResults(),
    };
  }

  private static generateFallbackMonteCarloResults(): MonteCarloResults {
    return {
      simulation_parameters: {
        number_of_simulations: 100,
        variable_parameters: [],
        fixed_constraints: [],
      },
      scenario_outcomes: [],
      statistical_summary: {
        mean_finish_position: 10,
        median_finish_position: 9,
        position_distribution: [],
        success_probability: [],
        risk_analysis: {
          worst_case_scenarios: [],
          risk_mitigation_effectiveness: 0.7,
          strategic_robustness: 0.75,
        },
      },
      optimization_recommendations: [],
    };
  }

  private static generateFallbackRealTimeUpdate(): {
    updated_strategy: Partial<RaceStrategy>;
    immediate_recommendations: string[];
    tactical_adjustments: TacticalAdjustment[];
  } {
    return {
      updated_strategy: {},
      immediate_recommendations: ['Continue with current strategy', 'Monitor wind conditions'],
      tactical_adjustments: [],
    };
  }

  private static generateFallbackPerformanceAnalysis(): {
    performance_analysis: PerformanceAnalysis;
    strategy_effectiveness: StrategyEffectiveness;
    lessons_learned: LessonLearned[];
    improvement_recommendations: ImprovementRecommendation[];
  } {
    return {
      performance_analysis: {} as PerformanceAnalysis,
      strategy_effectiveness: {} as StrategyEffectiveness,
      lessons_learned: [],
      improvement_recommendations: [],
    };
  }
}

// Additional interface definitions for completeness
interface TacticalAdjustment {
  adjustment_type: string;
  description: string;
  timing: string;
  priority: 'high' | 'medium' | 'low';
}

interface PerformanceAnalysis {
  overall_performance_rating: number;
  speed_analysis: any;
  tactical_execution: any;
  positioning_effectiveness: any;
}

interface StrategyEffectiveness {
  plan_vs_execution: any;
  decision_quality: any;
  timing_accuracy: any;
  adaptability_score: any;
}

interface LessonLearned {
  category: string;
  insight: string;
  applicability: string;
  priority: 'high' | 'medium' | 'low';
}

interface ImprovementRecommendation {
  area: string;
  recommendation: string;
  implementation_plan: string;
  expected_benefit: string;
}

export default StrategicPlanningService;