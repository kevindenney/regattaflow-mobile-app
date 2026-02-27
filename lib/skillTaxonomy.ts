/**
 * Cross-Interest Skill Taxonomy
 *
 * Maps universal skills across all interests so the AI suggestion engine
 * can identify cross-pollination opportunities between activities.
 *
 * Each universal skill has per-interest manifestations that the AI uses
 * to generate contextual transfer suggestions.
 */

// =============================================================================
// TYPES
// =============================================================================

export type UniversalSkillId =
  | 'observation'
  | 'time_pressure'
  | 'communication'
  | 'preparation'
  | 'reflection'
  | 'progressive_mastery'
  | 'risk_assessment'
  | 'motor_control'
  | 'focus_endurance'
  | 'pattern_recognition'
  | 'adaptability'
  | 'spatial_awareness';

export type InterestSlug = 'sail-racing' | 'nursing' | 'drawing' | 'fitness';

export type SuggestionType =
  | 'skill_transfer'
  | 'mental_model'
  | 'practice_method'
  | 'recovery_insight'
  | 'metacognitive';

export interface SkillManifest {
  /** Human-readable skill name */
  label: string;
  /** How this skill shows up in the interest */
  description: string;
  /** Key activities that develop this skill */
  developedBy: string[];
  /** Observable evidence that the skill is being practiced */
  indicators: string[];
}

export interface UniversalSkill {
  id: UniversalSkillId;
  label: string;
  description: string;
  manifests: Record<InterestSlug, SkillManifest>;
}

export interface CrossReference {
  sourceSkillId: UniversalSkillId;
  sourceInterest: InterestSlug;
  targetInterest: InterestSlug;
  suggestionType: SuggestionType;
  transferDescription: string;
  /** How strong the transfer is (0-1). Higher = more directly applicable. */
  transferStrength: number;
  /** Example suggestion text the AI can use as a template */
  exampleSuggestion: string;
}

// =============================================================================
// UNIVERSAL SKILLS
// =============================================================================

export const UNIVERSAL_SKILLS: UniversalSkill[] = [
  {
    id: 'observation',
    label: 'Observation',
    description: 'Ability to notice, scan, and interpret environmental cues quickly and accurately.',
    manifests: {
      'sail-racing': {
        label: 'Wind & Fleet Awareness',
        description: 'Reading wind patterns, shifts, gusts, and fleet positioning on the water.',
        developedBy: ['race_upwind', 'race_prestart', 'drill_starting'],
        indicators: ['wind_shift_anticipation', 'fleet_position_awareness', 'puff_detection'],
      },
      nursing: {
        label: 'Patient Assessment',
        description: 'Noticing subtle changes in patient condition, vital sign trends, and clinical deterioration.',
        developedBy: ['shift_assessment', 'simulation', 'skills_lab'],
        indicators: ['vital_sign_trends', 'skin_color_changes', 'behavioral_changes', 'lab_value_patterns'],
      },
      drawing: {
        label: 'Visual Perception',
        description: 'Accurately perceiving proportion, value, edges, and spatial relationships.',
        developedBy: ['gesture_drawing', 'life_drawing', 'plein_air'],
        indicators: ['proportional_accuracy', 'value_perception', 'edge_sensitivity', 'negative_space_awareness'],
      },
      fitness: {
        label: 'Body Awareness',
        description: 'Sensing body position, muscle engagement, movement quality, and fatigue signals.',
        developedBy: ['form_practice', 'warmup', 'mobility_work'],
        indicators: ['proprioception', 'fatigue_recognition', 'movement_quality_self_assessment'],
      },
    },
  },
  {
    id: 'time_pressure',
    label: 'Time Pressure Performance',
    description: 'Executing skills accurately under time constraints.',
    manifests: {
      'sail-racing': {
        label: 'Start Sequence Timing',
        description: 'Precision timing during the countdown, line approach, and acceleration.',
        developedBy: ['race_start', 'drill_starting', 'race_prestart'],
        indicators: ['start_timing_accuracy', 'countdown_management', 'acceleration_timing'],
      },
      nursing: {
        label: 'Clinical Urgency Response',
        description: 'Acting quickly during codes, rapid responses, and time-sensitive medication administration.',
        developedBy: ['simulation_code_blue', 'shift_emergency', 'nclex_timed_practice'],
        indicators: ['code_response_time', 'med_timing_accuracy', 'triage_speed'],
      },
      drawing: {
        label: 'Timed Drawing Constraints',
        description: 'Capturing essential information within strict time limits (gesture, timed sketches).',
        developedBy: ['gesture_drawing', 'study_sketch', 'plein_air_changing_light'],
        indicators: ['gesture_capture_speed', 'essential_mark_selection', 'prioritization_under_time'],
      },
      fitness: {
        label: 'Interval & Rest Timing',
        description: 'Maintaining output quality during timed intervals and managing rest periods.',
        developedBy: ['hiit', 'competition', 'sport_conditioning'],
        indicators: ['interval_pacing', 'rest_discipline', 'rep_quality_under_fatigue'],
      },
    },
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Conveying and receiving information effectively with others.',
    manifests: {
      'sail-racing': {
        label: 'Crew Communication',
        description: 'Clear, concise communication with crew and protest/rules interactions.',
        developedBy: ['race_crew_work', 'drill_crew_work', 'protest_hearings'],
        indicators: ['call_clarity', 'timing_calls', 'protest_communication'],
      },
      nursing: {
        label: 'Clinical Communication',
        description: 'SBAR handoffs, patient education, interprofessional team communication.',
        developedBy: ['shift_handoff', 'patient_education', 'team_huddles'],
        indicators: ['sbar_quality', 'patient_teach_back', 'interprofessional_clarity'],
      },
      drawing: {
        label: 'Critique & Feedback',
        description: 'Giving and receiving constructive critique on artwork.',
        developedBy: ['critique_session', 'portfolio_review', 'peer_feedback'],
        indicators: ['critique_specificity', 'feedback_receptivity', 'artistic_vocabulary'],
      },
      fitness: {
        label: 'Coaching Cues',
        description: 'Understanding and giving movement cues, training partner communication.',
        developedBy: ['coached_session', 'partner_workout', 'competition_team'],
        indicators: ['cue_comprehension', 'spotting_communication', 'encouragement_quality'],
      },
    },
  },
  {
    id: 'preparation',
    label: 'Preparation',
    description: 'Systematic readiness before performance.',
    manifests: {
      'sail-racing': {
        label: 'Race Prep',
        description: 'Weather analysis, boat setup, race strategy, and checklist completion.',
        developedBy: ['race_days_before', 'race_prep_checklist'],
        indicators: ['weather_analysis_depth', 'boat_readiness', 'strategy_documentation'],
      },
      nursing: {
        label: 'Pre-Shift Preparation',
        description: 'Patient chart review, medication reconciliation, and learning objective setting.',
        developedBy: ['shift_prep', 'patient_review', 'learning_goal_setting'],
        indicators: ['chart_review_completeness', 'med_reconciliation', 'objective_clarity'],
      },
      drawing: {
        label: 'Session Planning',
        description: 'Reference gathering, composition thumbnails, material selection.',
        developedBy: ['reference_collection', 'thumbnail_sketching', 'material_prep'],
        indicators: ['reference_quality', 'composition_planning', 'material_readiness'],
      },
      fitness: {
        label: 'Workout Programming',
        description: 'Warmup routine, nutrition timing, workout plan review.',
        developedBy: ['warmup', 'nutrition_planning', 'program_review'],
        indicators: ['warmup_completeness', 'nutrition_timing', 'workout_plan_adherence'],
      },
    },
  },
  {
    id: 'reflection',
    label: 'Structured Reflection',
    description: 'Deliberate analysis of performance to extract learning.',
    manifests: {
      'sail-racing': {
        label: 'Post-Race Debrief',
        description: 'Analyzing race decisions, mark roundings, starts, and tactical choices.',
        developedBy: ['race_debrief', 'video_review', 'gps_analysis'],
        indicators: ['debrief_depth', 'tactical_analysis_quality', 'improvement_identification'],
      },
      nursing: {
        label: 'Post-Shift Reflection',
        description: 'Structured reflection on clinical decisions, patient interactions, and learning moments.',
        developedBy: ['post_shift_journal', 'group_debrief', 'preceptor_feedback_review'],
        indicators: ['reflection_depth', 'clinical_reasoning_analysis', 'growth_area_identification'],
      },
      drawing: {
        label: 'Self-Critique',
        description: 'Honest assessment of finished work against intentions and references.',
        developedBy: ['critique_session', 'progress_comparison', 'reference_comparison'],
        indicators: ['self_assessment_accuracy', 'growth_tracking', 'technique_analysis'],
      },
      fitness: {
        label: 'Post-Workout Review',
        description: 'Analyzing performance vs plan, tracking progressive overload, and identifying adjustments.',
        developedBy: ['workout_log_review', 'coach_debrief', 'video_form_check'],
        indicators: ['plan_vs_actual_analysis', 'overload_tracking', 'recovery_assessment'],
      },
    },
  },
  {
    id: 'progressive_mastery',
    label: 'Progressive Mastery',
    description: 'Systematic skill development through increasing difficulty.',
    manifests: {
      'sail-racing': {
        label: 'Drill → Race → Regatta',
        description: 'Building from isolated drills to club racing to competitive regattas.',
        developedBy: ['drill_progression', 'club_racing', 'regatta_campaign'],
        indicators: ['drill_to_race_transfer', 'performance_trend', 'competitive_readiness'],
      },
      nursing: {
        label: 'Lab → Sim → Clinical',
        description: 'Progressing from skills lab to simulation to real patient care.',
        developedBy: ['skills_lab', 'simulation', 'clinical_shift', 'competency_checkoff'],
        indicators: ['competency_progression', 'independence_level', 'validation_success_rate'],
      },
      drawing: {
        label: 'Study → Practice → Portfolio',
        description: 'Moving from study sketches to technique practice to finished portfolio pieces.',
        developedBy: ['study_sketch', 'technique_drill', 'portfolio_piece'],
        indicators: ['technique_consistency', 'complexity_increase', 'portfolio_quality'],
      },
      fitness: {
        label: 'Practice → Test → Compete',
        description: 'Building from practice sets to fitness tests to competition.',
        developedBy: ['practice_set', 'fitness_test', 'competition'],
        indicators: ['progressive_overload', 'test_improvement', 'competition_readiness'],
      },
    },
  },
  {
    id: 'risk_assessment',
    label: 'Risk Assessment',
    description: 'Evaluating risk vs reward and making safety-conscious decisions.',
    manifests: {
      'sail-racing': {
        label: 'Weather & Boat Handling Risk',
        description: 'Assessing conditions, knowing limits, and managing equipment failure.',
        developedBy: ['weather_assessment', 'heavy_weather_sailing', 'equipment_checks'],
        indicators: ['go_no_go_decisions', 'reef_timing', 'risk_awareness'],
      },
      nursing: {
        label: 'Patient Safety & Clinical Judgment',
        description: 'Identifying patient deterioration, medication risks, and safety hazards.',
        developedBy: ['patient_assessment', 'medication_admin', 'safety_checks'],
        indicators: ['deterioration_recognition', 'med_error_prevention', 'safety_protocol_adherence'],
      },
      drawing: {
        label: 'Material & Technique Risk',
        description: 'Choosing appropriate materials and knowing when to push technique boundaries.',
        developedBy: ['material_experimentation', 'technique_stretching'],
        indicators: ['material_appropriateness', 'calculated_experimentation', 'recovery_from_mistakes'],
      },
      fitness: {
        label: 'Injury Prevention & Load Management',
        description: 'Managing training load, recognizing injury signals, and scaling appropriately.',
        developedBy: ['load_management', 'recovery_protocols', 'scaling_decisions'],
        indicators: ['load_progression_safety', 'pain_vs_soreness_distinction', 'deload_timing'],
      },
    },
  },
  {
    id: 'motor_control',
    label: 'Fine Motor Control',
    description: 'Precise physical execution of learned movement patterns.',
    manifests: {
      'sail-racing': {
        label: 'Tiller & Sheet Handling',
        description: 'Precise control of helm, sheets, and boat handling maneuvers.',
        developedBy: ['boat_handling_drills', 'mark_rounding', 'tacking_gybing'],
        indicators: ['helm_smoothness', 'tack_efficiency', 'gybe_control'],
      },
      nursing: {
        label: 'Clinical Procedure Technique',
        description: 'Precision in IV insertion, injection technique, catheter placement.',
        developedBy: ['skills_lab', 'clinical_practice', 'simulation'],
        indicators: ['insertion_success_rate', 'technique_smoothness', 'patient_comfort'],
      },
      drawing: {
        label: 'Mark-Making Control',
        description: 'Pencil pressure, line quality, brush control, and medium manipulation.',
        developedBy: ['technique_drill', 'gesture_drawing', 'rendering_practice'],
        indicators: ['line_confidence', 'pressure_variation', 'medium_control'],
      },
      fitness: {
        label: 'Movement Quality',
        description: 'Barbell path, joint tracking, movement efficiency under load.',
        developedBy: ['technique_work', 'light_practice', 'coach_correction'],
        indicators: ['barbell_path_consistency', 'joint_tracking', 'movement_efficiency'],
      },
    },
  },
  {
    id: 'focus_endurance',
    label: 'Focus & Endurance',
    description: 'Maintaining concentration and performance quality over extended periods.',
    manifests: {
      'sail-racing': {
        label: 'Race-Length Focus',
        description: 'Maintaining tactical awareness across hours of racing.',
        developedBy: ['distance_race', 'multi_race_regatta', 'long_upwind_leg'],
        indicators: ['late_race_decision_quality', 'consistency_across_races', 'fatigue_management'],
      },
      nursing: {
        label: 'Shift-Length Performance',
        description: 'Maintaining clinical accuracy and patient safety across 8-12 hour shifts.',
        developedBy: ['clinical_shift', 'double_patient_load', 'night_shift'],
        indicators: ['late_shift_accuracy', 'documentation_completeness', 'fatigue_awareness'],
      },
      drawing: {
        label: 'Sustained Observation',
        description: 'Maintaining visual accuracy and creative energy across long drawing sessions.',
        developedBy: ['long_pose_life_drawing', 'plein_air_session', 'portfolio_piece'],
        indicators: ['late_session_quality', 'observation_consistency', 'creative_endurance'],
      },
      fitness: {
        label: 'Training Endurance',
        description: 'Maintaining form and intensity across long sessions and training blocks.',
        developedBy: ['endurance_training', 'long_workout', 'competition_day'],
        indicators: ['late_set_form', 'multi_event_performance', 'training_block_consistency'],
      },
    },
  },
  {
    id: 'pattern_recognition',
    label: 'Pattern Recognition',
    description: 'Identifying recurring patterns and using them to predict outcomes.',
    manifests: {
      'sail-racing': {
        label: 'Wind Pattern & Tactical Patterns',
        description: 'Recognizing wind shift patterns, fleet behavior, and tactical opportunities.',
        developedBy: ['race_analysis', 'gps_review', 'weather_study'],
        indicators: ['shift_pattern_detection', 'fleet_behavior_prediction', 'course_optimization'],
      },
      nursing: {
        label: 'Clinical Pattern Recognition',
        description: 'Recognizing disease progression patterns, medication responses, and treatment trajectories.',
        developedBy: ['patient_trending', 'case_study', 'clinical_experience'],
        indicators: ['early_deterioration_detection', 'treatment_response_prediction', 'diagnosis_pattern_matching'],
      },
      drawing: {
        label: 'Visual Pattern & Composition',
        description: 'Seeing underlying geometry, value patterns, and compositional structures.',
        developedBy: ['master_study', 'composition_analysis', 'value_mapping'],
        indicators: ['structural_simplification', 'value_grouping', 'compositional_balance'],
      },
      fitness: {
        label: 'Training Response Patterns',
        description: 'Recognizing overtraining signals, plateau patterns, and optimal progression rates.',
        developedBy: ['training_log_analysis', 'periodization_study', 'recovery_tracking'],
        indicators: ['plateau_detection', 'overtraining_recognition', 'optimal_load_identification'],
      },
    },
  },
  {
    id: 'adaptability',
    label: 'Adaptability',
    description: 'Adjusting plans and approach when conditions change unexpectedly.',
    manifests: {
      'sail-racing': {
        label: 'Tactical Adaptation',
        description: 'Changing strategy when wind shifts, fleet positions, or conditions change.',
        developedBy: ['race_tactical_decisions', 'variable_conditions', 'fleet_situations'],
        indicators: ['mid_race_strategy_changes', 'condition_adaptation_speed', 'plan_B_execution'],
      },
      nursing: {
        label: 'Clinical Flexibility',
        description: 'Adapting care plans when patient conditions change or unexpected situations arise.',
        developedBy: ['clinical_shift_changes', 'emergency_response', 'patient_acuity_changes'],
        indicators: ['rapid_reprioritization', 'care_plan_modification', 'composure_under_change'],
      },
      drawing: {
        label: 'Creative Problem-Solving',
        description: 'Adapting when medium behaves unexpectedly or reference conditions change.',
        developedBy: ['plein_air_light_changes', 'medium_experimentation', 'creative_pivots'],
        indicators: ['recovery_from_mistakes', 'medium_adaptation', 'creative_flexibility'],
      },
      fitness: {
        label: 'Workout Modification',
        description: 'Scaling, substituting, and adapting when body signals or equipment availability change.',
        developedBy: ['scaling_decisions', 'injury_workarounds', 'equipment_substitution'],
        indicators: ['smart_scaling', 'injury_management', 'substitute_exercise_selection'],
      },
    },
  },
  {
    id: 'spatial_awareness',
    label: 'Spatial Awareness',
    description: 'Understanding position, distance, and spatial relationships.',
    manifests: {
      'sail-racing': {
        label: 'Course & Fleet Positioning',
        description: 'Awareness of position on the course, distance to marks, and fleet geometry.',
        developedBy: ['race_upwind', 'race_downwind', 'mark_rounding'],
        indicators: ['layline_judgment', 'fleet_geometry_reading', 'mark_approach_angle'],
      },
      nursing: {
        label: 'Environment Navigation',
        description: 'Efficient movement in clinical space, equipment location, and room setup.',
        developedBy: ['unit_orientation', 'emergency_response', 'procedure_setup'],
        indicators: ['equipment_location_speed', 'sterile_field_spatial_awareness', 'room_navigation'],
      },
      drawing: {
        label: 'Compositional Space',
        description: 'Understanding picture plane, negative space, depth, and spatial relationships.',
        developedBy: ['composition_planning', 'perspective_drawing', 'life_drawing'],
        indicators: ['negative_space_accuracy', 'depth_rendering', 'perspective_consistency'],
      },
      fitness: {
        label: 'Movement Space',
        description: 'Awareness of bar path, body position in space, and gym environment.',
        developedBy: ['olympic_lifting', 'gymnastics', 'group_class'],
        indicators: ['bar_path_awareness', 'wall_ball_distance', 'spatial_gym_awareness'],
      },
    },
  },
];

// =============================================================================
// CROSS-REFERENCES (Pre-computed transfer suggestions)
// =============================================================================

export const CROSS_REFERENCES: CrossReference[] = [
  // Observation transfers
  {
    sourceSkillId: 'observation',
    sourceInterest: 'drawing',
    targetInterest: 'sail-racing',
    suggestionType: 'skill_transfer',
    transferDescription: 'Gesture drawing trains rapid scanning and essential detail capture — the same skill needed for reading wind patterns.',
    transferStrength: 0.8,
    exampleSuggestion: 'Your gesture drawing practice is training exactly the same quick-scan observation skill you need for reading wind shifts on the water. Before your next race, try doing a 30-second "gesture sketch" of the wind conditions — it forces the same rapid prioritization.',
  },
  {
    sourceSkillId: 'observation',
    sourceInterest: 'nursing',
    targetInterest: 'drawing',
    suggestionType: 'skill_transfer',
    transferDescription: 'Clinical assessment trains systematic observation — inspecting one system at a time mirrors drawing from general to specific.',
    transferStrength: 0.7,
    exampleSuggestion: 'Your systematic clinical assessment approach — checking one body system at a time — maps perfectly to the drawing process: start with the big shapes, then refine details. Apply your assessment discipline to your next still life.',
  },
  {
    sourceSkillId: 'observation',
    sourceInterest: 'fitness',
    targetInterest: 'nursing',
    suggestionType: 'skill_transfer',
    transferDescription: 'Body awareness from training translates to noticing subtle patient condition changes.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your training has made you highly attuned to subtle body signals — muscle fatigue, breathing patterns, skin color changes from exertion. Apply this same sensitivity when assessing patients. You already know what "off" looks like in the body.',
  },

  // Time pressure transfers
  {
    sourceSkillId: 'time_pressure',
    sourceInterest: 'drawing',
    targetInterest: 'sail-racing',
    suggestionType: 'practice_method',
    transferDescription: 'Timed gesture drawing builds the same countdown focus used in race starts.',
    transferStrength: 0.7,
    exampleSuggestion: 'Your timed gesture drawing sessions build the exact same "capture the essentials under a countdown" skill you need during the start sequence. Both require committing to action as time runs out instead of hesitating.',
  },
  {
    sourceSkillId: 'time_pressure',
    sourceInterest: 'fitness',
    targetInterest: 'nursing',
    suggestionType: 'mental_model',
    transferDescription: 'HIIT interval discipline maps to code blue response timing.',
    transferStrength: 0.7,
    exampleSuggestion: 'Your HIIT training has conditioned you to perform at high intensity on a countdown. That same "go now, think while moving" reflex directly applies during rapid response situations. Your body already knows how to activate under time pressure.',
  },
  {
    sourceSkillId: 'time_pressure',
    sourceInterest: 'sail-racing',
    targetInterest: 'fitness',
    suggestionType: 'mental_model',
    transferDescription: 'Race countdown management applies to competition event pacing.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your experience managing the race start countdown — staying calm while the clock ticks, committing at the right moment — directly applies to competition heat management. Use the same "build, build, GO" rhythm you use approaching the start line.',
  },

  // Communication transfers
  {
    sourceSkillId: 'communication',
    sourceInterest: 'nursing',
    targetInterest: 'sail-racing',
    suggestionType: 'practice_method',
    transferDescription: 'SBAR communication structure creates clear, concise crew calls.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your SBAR communication training — Situation, Background, Assessment, Recommendation — creates the exact kind of clear, structured calls that make great crew communication. Try using the SBAR pattern for tactical calls: "Wind shift right (S), was 180 now 190 (B), we can tack for the mark (A), tacking in 10 (R)."',
  },
  {
    sourceSkillId: 'communication',
    sourceInterest: 'drawing',
    targetInterest: 'nursing',
    suggestionType: 'metacognitive',
    transferDescription: 'Art critique vocabulary builds specificity in clinical observations.',
    transferStrength: 0.5,
    exampleSuggestion: 'Your art critique skills — describing exactly what you see without interpretation — directly improve clinical documentation. When you document "skin warm, dry, slightly flushed over bilateral cheeks" instead of "patient looks feverish," you are doing the same precise observation-to-words work as critiquing a drawing.',
  },

  // Preparation transfers
  {
    sourceSkillId: 'preparation',
    sourceInterest: 'sail-racing',
    targetInterest: 'nursing',
    suggestionType: 'practice_method',
    transferDescription: 'Race prep checklist discipline applies to pre-shift preparation.',
    transferStrength: 0.8,
    exampleSuggestion: 'Your race prep routine — checking weather, reviewing the course, prepping the boat — is the same systematic preparation that makes for excellent pre-shift prep. Create a "pre-shift checklist" just like your race prep list: chart review, med reconciliation, competency goals, equipment check.',
  },
  {
    sourceSkillId: 'preparation',
    sourceInterest: 'nursing',
    targetInterest: 'fitness',
    suggestionType: 'practice_method',
    transferDescription: 'Clinical preparation thoroughness elevates workout planning.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your clinical pre-shift prep is incredibly thorough — you review every patient, every medication, every potential complication. Apply that same diligence to your workout prep: review your program, check progression targets, plan nutrition timing, and identify which movements need extra warmup attention.',
  },

  // Reflection transfers
  {
    sourceSkillId: 'reflection',
    sourceInterest: 'sail-racing',
    targetInterest: 'nursing',
    suggestionType: 'metacognitive',
    transferDescription: 'Structured race debrief methodology deepens clinical reflection quality.',
    transferStrength: 0.8,
    exampleSuggestion: 'Your detailed race debrief style — analyzing each leg, each decision point, what you would do differently — would significantly strengthen your post-shift reflections. Apply the same "decision-by-decision" analysis to your clinical shifts: What did I decide at each critical moment? What information did I have? What would I change?',
  },
  {
    sourceSkillId: 'reflection',
    sourceInterest: 'drawing',
    targetInterest: 'fitness',
    suggestionType: 'metacognitive',
    transferDescription: 'Visual progress documentation methods apply to training logs.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your practice of photographing drawing progress — capturing before, during, and after — is a powerful reflection tool. Apply this to your training: record sets, photograph your form, and compare over time. Visual evidence of progress is motivating and reveals patterns your memory might miss.',
  },

  // Progressive mastery transfers
  {
    sourceSkillId: 'progressive_mastery',
    sourceInterest: 'fitness',
    targetInterest: 'nursing',
    suggestionType: 'mental_model',
    transferDescription: 'Progressive overload principles apply to clinical skill building.',
    transferStrength: 0.8,
    exampleSuggestion: 'Your understanding of progressive overload from strength training applies directly to clinical skill building: increase difficulty gradually. If you managed 2 patients well last shift, advocate for 3 this time. Same principle — small, systematic increases in challenge to build capacity without injury.',
  },
  {
    sourceSkillId: 'progressive_mastery',
    sourceInterest: 'nursing',
    targetInterest: 'drawing',
    suggestionType: 'mental_model',
    transferDescription: 'Competency sign-off chain maps to portfolio development.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your competency progression — not_started → learning → practicing → validated → competent — is a framework you can apply to drawing techniques. For each technique you are learning, honestly self-assess where you are in that chain. Seek instructor validation before considering a technique "competent."',
  },

  // Risk assessment transfers
  {
    sourceSkillId: 'risk_assessment',
    sourceInterest: 'sail-racing',
    targetInterest: 'fitness',
    suggestionType: 'mental_model',
    transferDescription: 'Go/no-go weather decision framework applies to training load management.',
    transferStrength: 0.7,
    exampleSuggestion: 'Your sailing "go/no-go" decision framework — assessing conditions against your limits — applies perfectly to training load decisions. When you are fatigued or sore, run the same assessment: conditions (body state) vs limits (injury risk). Sometimes the smartest move is to stay in the harbor.',
  },
  {
    sourceSkillId: 'risk_assessment',
    sourceInterest: 'fitness',
    targetInterest: 'sail-racing',
    suggestionType: 'recovery_insight',
    transferDescription: 'Recovery and deload knowledge supports sailing physical demands.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your training knowledge about recovery and deload weeks applies to regatta campaigns. Before a big regatta, taper your training load just like you would before a competition — arrive physically fresh, not depleted from a heavy training week.',
  },

  // Motor control transfers
  {
    sourceSkillId: 'motor_control',
    sourceInterest: 'drawing',
    targetInterest: 'nursing',
    suggestionType: 'skill_transfer',
    transferDescription: 'Fine pencil control and hand steadiness directly support clinical procedure precision.',
    transferStrength: 0.7,
    exampleSuggestion: 'Your drawing hand control — steady pressure, precise positioning, smooth movements — is directly transferable to clinical procedures like IV insertion. The same steady hand that creates controlled pencil marks can guide a needle into a vein. Warm up your fine motor control before clinical shifts the same way you warm up before drawing.',
  },
  {
    sourceSkillId: 'motor_control',
    sourceInterest: 'fitness',
    targetInterest: 'sail-racing',
    suggestionType: 'skill_transfer',
    transferDescription: 'Movement quality focus improves boat handling precision.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your focus on movement quality under load — maintaining form when fatigued — directly improves boat handling. The tiller and sheet control required in heavy air demands the same quality-under-fatigue discipline. Your body is better prepared for physical sailing than you might think.',
  },

  // Focus endurance transfers
  {
    sourceSkillId: 'focus_endurance',
    sourceInterest: 'nursing',
    targetInterest: 'sail-racing',
    suggestionType: 'skill_transfer',
    transferDescription: '12-hour shift focus endurance supports long race concentration.',
    transferStrength: 0.8,
    exampleSuggestion: 'Your ability to maintain clinical focus across a 12-hour shift is exceptional endurance. Most sailors lose concentration after 2-3 hours of racing. You have a built-in advantage — use the same mental stamina techniques (regular micro-breaks, hydration, task chunking) during distance races.',
  },
  {
    sourceSkillId: 'focus_endurance',
    sourceInterest: 'drawing',
    targetInterest: 'nursing',
    suggestionType: 'recovery_insight',
    transferDescription: 'Drawing as active rest restores mental energy for clinical work.',
    transferStrength: 0.5,
    exampleSuggestion: 'Your drawing practice activates a different kind of focus — creative, meditative, right-brain — that actually helps restore the clinical analytical focus you deplete during shifts. Consider a 20-minute sketching session as a recovery practice between clinical days.',
  },

  // Pattern recognition transfers
  {
    sourceSkillId: 'pattern_recognition',
    sourceInterest: 'sail-racing',
    targetInterest: 'drawing',
    suggestionType: 'mental_model',
    transferDescription: 'Wind pattern reading = visual pattern reading in composition.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your ability to read wind patterns on the water — seeing the dark patches, the ripples, predicting where gusts will arrive — is the same pattern recognition needed for strong composition. Both require seeing the "big picture" first (where is the energy?) before focusing on details.',
  },
  {
    sourceSkillId: 'pattern_recognition',
    sourceInterest: 'nursing',
    targetInterest: 'fitness',
    suggestionType: 'mental_model',
    transferDescription: 'Clinical trending skills apply to training log analysis.',
    transferStrength: 0.7,
    exampleSuggestion: 'Your clinical skill in trending vital signs — spotting when a value is "normal but trending wrong" — applies directly to training log analysis. Track your key lifts and times the way you trend patient vitals. A performance plateau is like vital signs trending sideways — investigate before it becomes a problem.',
  },

  // Adaptability transfers
  {
    sourceSkillId: 'adaptability',
    sourceInterest: 'sail-racing',
    targetInterest: 'nursing',
    suggestionType: 'mental_model',
    transferDescription: 'Mid-race tactical adaptation applies to care plan flexibility.',
    transferStrength: 0.7,
    exampleSuggestion: 'Your ability to change race strategy mid-course when conditions shift is exactly the clinical flexibility needed when a patient condition changes. The same "assess, decide, commit, reassess" loop you use on the water works for clinical decision-making. Do not stay on a losing tack — and do not stick with a care plan that is not working.',
  },

  // Spatial awareness transfers
  {
    sourceSkillId: 'spatial_awareness',
    sourceInterest: 'sail-racing',
    targetInterest: 'drawing',
    suggestionType: 'mental_model',
    transferDescription: 'Course positioning intuition maps to composition and perspective.',
    transferStrength: 0.6,
    exampleSuggestion: 'Your intuitive sense of position on the racecourse — distance to marks, angles, fleet geometry — is spatial intelligence that enhances your drawing composition. Apply the same "where am I relative to everything else" awareness to placing subjects in your picture plane. Composition is positioning.',
  },
];

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get all cross-references where the source interest matches.
 */
export function getCrossReferencesFromInterest(
  interest: InterestSlug,
): CrossReference[] {
  return CROSS_REFERENCES.filter((cr) => cr.sourceInterest === interest);
}

/**
 * Get all cross-references targeting a specific interest.
 */
export function getCrossReferencesToInterest(
  interest: InterestSlug,
): CrossReference[] {
  return CROSS_REFERENCES.filter((cr) => cr.targetInterest === interest);
}

/**
 * Get cross-references between two specific interests.
 */
export function getCrossReferencesBetween(
  source: InterestSlug,
  target: InterestSlug,
): CrossReference[] {
  return CROSS_REFERENCES.filter(
    (cr) => cr.sourceInterest === source && cr.targetInterest === target,
  );
}

/**
 * Get the universal skill definition by ID.
 */
export function getUniversalSkill(id: UniversalSkillId): UniversalSkill | undefined {
  return UNIVERSAL_SKILLS.find((s) => s.id === id);
}

/**
 * Get all universal skills that a specific interest develops.
 */
export function getSkillsForInterest(interest: InterestSlug): UniversalSkill[] {
  return UNIVERSAL_SKILLS.filter((s) => s.manifests[interest] !== undefined);
}

/**
 * Get cross-references sorted by transfer strength (strongest first).
 */
export function getStrongestTransfers(
  targetInterest: InterestSlug,
  limit: number = 5,
): CrossReference[] {
  return getCrossReferencesToInterest(targetInterest)
    .sort((a, b) => b.transferStrength - a.transferStrength)
    .slice(0, limit);
}
