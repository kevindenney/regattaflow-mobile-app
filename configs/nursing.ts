import type { InterestEventConfig } from '@/types/interestEventConfig';

export const NURSING_EVENT_CONFIG: InterestEventConfig = {
  // ---------------------------------------------------------------------------
  // IDENTITY
  // ---------------------------------------------------------------------------
  interestSlug: 'nursing',

  // ---------------------------------------------------------------------------
  // PHASE LABELS
  // ---------------------------------------------------------------------------
  phaseLabels: {
    days_before: { full: 'Pre-Shift', short: 'Prep' },
    on_water: { full: 'On Shift', short: 'Clinical' },
    after_race: { full: 'Post-Shift', short: 'Review' },
  },

  addEventLabel: 'Add Shift',
  eventNoun: 'Shift',

  // ---------------------------------------------------------------------------
  // EVENT SUBTYPES
  // ---------------------------------------------------------------------------
  eventSubtypes: [
    {
      id: 'clinical_shift',
      label: 'Clinical Shift',
      icon: 'medical-bag',
      description: 'Standard clinical rotation shift',
      formFields: [
        { id: 'date', type: 'date', label: 'Date', required: true },
        { id: 'start_time', type: 'time', label: 'Start Time', required: true },
        { id: 'end_time', type: 'time', label: 'End Time', required: true },
        { id: 'facility', type: 'text', label: 'Facility', placeholder: 'Hospital or clinic name' },
        {
          id: 'unit_type',
          type: 'select',
          label: 'Unit Type',
          options: [
            { value: 'med-surg', label: 'Med-Surg' },
            { value: 'icu', label: 'ICU' },
            { value: 'er', label: 'ER' },
            { value: 'ob', label: 'OB' },
            { value: 'peds', label: 'Peds' },
            { value: 'psych', label: 'Psych' },
            { value: 'community', label: 'Community' },
            { value: 'or', label: 'OR' },
            { value: 'pacu', label: 'PACU' },
            { value: 'rehab', label: 'Rehab' },
          ],
        },
        { id: 'preceptor', type: 'text', label: 'Preceptor', placeholder: 'Preceptor name' },
        { id: 'patient_count', type: 'number', label: 'Patient Count' },
        { id: 'learning_objectives', type: 'text', label: 'Learning Objectives', placeholder: 'Goals for this shift' },
        { id: 'program_course', type: 'text', label: 'Program / Course', placeholder: 'e.g., NUR 302 Adult Health' },
      ],
    },
    {
      id: 'skills_lab',
      label: 'Skills Lab',
      icon: 'flask',
      description: 'Simulation lab skills practice',
      formFields: [
        { id: 'date', type: 'date', label: 'Date', required: true },
        { id: 'time', type: 'time', label: 'Time', required: true },
        { id: 'duration', type: 'duration', label: 'Duration' },
        { id: 'location', type: 'text', label: 'Location', placeholder: 'Lab room or building' },
        {
          id: 'skills_to_practice',
          type: 'multi-select',
          label: 'Skills to Practice',
          options: [
            { value: 'iv_insertion', label: 'IV Insertion' },
            { value: 'foley_catheter', label: 'Foley Catheter' },
            { value: 'wound_care', label: 'Wound Care' },
            { value: 'blood_draw', label: 'Blood Draw' },
            { value: 'injections', label: 'Injections' },
            { value: 'ng_tube', label: 'NG Tube' },
            { value: 'trach_care', label: 'Trach Care' },
            { value: 'vital_signs', label: 'Vital Signs' },
          ],
        },
        { id: 'instructor', type: 'text', label: 'Instructor', placeholder: 'Instructor name' },
      ],
    },
    {
      id: 'simulation',
      label: 'Simulation',
      icon: 'desktop-computer',
      description: 'High-fidelity simulation scenario',
      formFields: [
        { id: 'date', type: 'date', label: 'Date', required: true },
        { id: 'time', type: 'time', label: 'Time', required: true },
        { id: 'duration', type: 'duration', label: 'Duration' },
        { id: 'sim_center', type: 'text', label: 'Sim Center', placeholder: 'Simulation center name' },
        {
          id: 'scenario_type',
          type: 'select',
          label: 'Scenario Type',
          options: [
            { value: 'code_blue', label: 'Code Blue' },
            { value: 'rapid_response', label: 'Rapid Response' },
            { value: 'deterioration', label: 'Deterioration' },
            { value: 'med_error', label: 'Med Error' },
            { value: 'communication', label: 'Communication' },
            { value: 'ob_emergency', label: 'OB Emergency' },
            { value: 'peds', label: 'Peds' },
          ],
        },
        {
          id: 'fidelity',
          type: 'select',
          label: 'Fidelity',
          options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ],
        },
        { id: 'team_size', type: 'number', label: 'Team Size' },
      ],
    },
    {
      id: 'competency_checkoff',
      label: 'Competency Checkoff',
      icon: 'checkmark-done',
      description: 'Competency validation assessment',
      formFields: [
        { id: 'date', type: 'date', label: 'Date', required: true },
        { id: 'time', type: 'time', label: 'Time', required: true },
        { id: 'skill_name', type: 'text', label: 'Skill Name', placeholder: 'Competency being evaluated' },
        { id: 'evaluator', type: 'text', label: 'Evaluator', placeholder: 'Evaluator name' },
        { id: 'attempt_number', type: 'number', label: 'Attempt Number' },
        { id: 'location', type: 'text', label: 'Location', placeholder: 'Location of checkoff' },
      ],
    },
    {
      id: 'nclex_practice',
      label: 'NCLEX Practice',
      icon: 'school',
      description: 'NCLEX preparation study session',
      formFields: [
        { id: 'date', type: 'date', label: 'Date', required: true },
        { id: 'duration', type: 'duration', label: 'Duration' },
        {
          id: 'topics',
          type: 'multi-select',
          label: 'Topics',
          options: [
            { value: 'fundamentals', label: 'Fundamentals' },
            { value: 'pharmacology', label: 'Pharmacology' },
            { value: 'med-surg', label: 'Med-Surg' },
            { value: 'pediatrics', label: 'Pediatrics' },
            { value: 'ob', label: 'OB' },
            { value: 'psych', label: 'Psych' },
            { value: 'community', label: 'Community' },
            { value: 'leadership', label: 'Leadership' },
          ],
        },
        { id: 'question_count', type: 'number', label: 'Question Count' },
        {
          id: 'source',
          type: 'select',
          label: 'Source',
          options: [
            { value: 'uworld', label: 'UWorld' },
            { value: 'kaplan', label: 'Kaplan' },
            { value: 'ati', label: 'ATI' },
            { value: 'hesi', label: 'HESI' },
          ],
        },
      ],
    },
  ],

  defaultSubtype: 'clinical_shift',

  // ---------------------------------------------------------------------------
  // MODULE INFO
  // ---------------------------------------------------------------------------
  moduleInfo: {
    patient_overview: {
      id: 'patient_overview',
      label: 'Patient Overview',
      shortLabel: 'Patients',
      icon: 'people',
      description: 'Assigned patients diagnoses and history',
    },
    medications: {
      id: 'medications',
      label: 'Medications',
      shortLabel: 'Meds',
      icon: 'medkit',
      description: 'Med list timing interactions and high-alerts',
    },
    procedures: {
      id: 'procedures',
      label: 'Procedures',
      shortLabel: 'Procs',
      icon: 'bandage',
      description: 'Skills and procedures expected today',
    },
    clinical_objectives: {
      id: 'clinical_objectives',
      label: 'Clinical Objectives',
      shortLabel: 'Goals',
      icon: 'ribbon',
      description: 'Learning goals aligned to competencies',
    },
    checklist: {
      id: 'checklist',
      label: 'Shift Checklist',
      shortLabel: 'Tasks',
      icon: 'checkbox-marked-outline',
      description: 'Equipment badge stethoscope drug guide',
    },
    lab_values: {
      id: 'lab_values',
      label: 'Lab Values',
      shortLabel: 'Labs',
      icon: 'flask',
      description: 'Key lab results and normal ranges',
    },
    care_plan: {
      id: 'care_plan',
      label: 'Care Plan',
      shortLabel: 'Plan',
      icon: 'clipboard-text',
      description: 'Nursing care plan or concept map',
    },
    unit_protocols: {
      id: 'unit_protocols',
      label: 'Unit Protocols',
      shortLabel: 'Protocols',
      icon: 'shield-check',
      description: 'Unit-specific policies infection control',
    },
    preceptor_goals: {
      id: 'preceptor_goals',
      label: 'Preceptor Goals',
      shortLabel: 'Preceptor',
      icon: 'school',
      description: 'What preceptor wants you to focus on',
    },
    drug_reference: {
      id: 'drug_reference',
      label: 'Drug Reference',
      shortLabel: 'Drugs',
      icon: 'pill',
      description: 'Quick reference for unfamiliar meds',
    },
    share_with_preceptor: {
      id: 'share_with_preceptor',
      label: 'Share with Preceptor',
      shortLabel: 'Share',
      icon: 'share-variant',
      description: 'Share plan before shift',
    },
    competency_log: {
      id: 'competency_log',
      label: 'Competency Log',
      shortLabel: 'Skills',
      icon: 'trophy',
      description: 'Skills performed attempts and proficiency',
    },
    learning_notes: {
      id: 'learning_notes',
      label: 'Learning Notes',
      shortLabel: 'Notes',
      icon: 'lightbulb-outline',
      description: 'What you learned and clinical reasoning moments',
    },
    preceptor_feedback: {
      id: 'preceptor_feedback',
      label: 'Preceptor Feedback',
      shortLabel: 'Feedback',
      icon: 'message-text',
      description: 'Preceptor verbal feedback captured',
    },
    clinical_hours: {
      id: 'clinical_hours',
      label: 'Hours Logged',
      shortLabel: 'Hours',
      icon: 'clock-outline',
      description: 'Total clinical hours for the shift',
    },
    time_log: {
      id: 'time_log',
      label: 'Time Log',
      shortLabel: 'Timer',
      icon: 'timer',
      description: 'Clinical hours tracking auto-running',
    },
  },

  // ---------------------------------------------------------------------------
  // MODULE HEIGHTS (uniform for nursing)
  // ---------------------------------------------------------------------------
  moduleHeights: {
    patient_overview: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    medications: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    procedures: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    clinical_objectives: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    checklist: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    lab_values: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    care_plan: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    unit_protocols: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    preceptor_goals: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    drug_reference: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    share_with_preceptor: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    competency_log: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    learning_notes: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    preceptor_feedback: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    clinical_hours: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
    time_log: { collapsed: 48, minExpanded: 100, maxExpanded: 200 },
  },

  // ---------------------------------------------------------------------------
  // PHASE MODULE CONFIG
  // ---------------------------------------------------------------------------
  phaseModuleConfig: {
    days_before: {
      phase: 'days_before',
      availableModules: [
        'patient_overview',
        'medications',
        'procedures',
        'clinical_objectives',
        'checklist',
        'lab_values',
        'care_plan',
        'unit_protocols',
        'preceptor_goals',
        'drug_reference',
        'share_with_preceptor',
      ],
      defaultModules: [
        'patient_overview',
        'medications',
        'procedures',
        'clinical_objectives',
        'checklist',
      ],
      maxModules: 6,
    },
    on_water: {
      phase: 'on_water',
      availableModules: [
        'patient_overview',
        'clinical_objectives',
        'medications',
        'procedures',
        'time_log',
      ],
      defaultModules: [
        'patient_overview',
        'clinical_objectives',
      ],
      maxModules: 3,
    },
    after_race: {
      phase: 'after_race',
      availableModules: [
        'competency_log',
        'learning_notes',
        'patient_overview',
        'clinical_objectives',
        'preceptor_feedback',
        'clinical_hours',
        'medications',
      ],
      defaultModules: [
        'competency_log',
        'learning_notes',
      ],
      maxModules: 4,
    },
  },

  // ---------------------------------------------------------------------------
  // SUBTYPE OVERRIDES
  // ---------------------------------------------------------------------------
  subtypeOverrides: {
    clinical_shift: {
      subtypeId: 'clinical_shift',
      // No overrides — uses defaults
    },
    skills_lab: {
      subtypeId: 'skills_lab',
      excludedModules: ['patient_overview', 'lab_values'],
      labelOverrides: { procedures: 'Lab Skills' },
    },
    simulation: {
      subtypeId: 'simulation',
      excludedModules: ['patient_overview'],
      labelOverrides: { care_plan: 'Sim Objectives' },
    },
    competency_checkoff: {
      subtypeId: 'competency_checkoff',
      excludedModules: [
        'patient_overview',
        'lab_values',
        'care_plan',
        'unit_protocols',
        'drug_reference',
        'time_log',
        'medications',
      ],
    },
    nclex_practice: {
      subtypeId: 'nclex_practice',
      excludedModules: [
        'patient_overview',
        'lab_values',
        'care_plan',
        'unit_protocols',
        'drug_reference',
        'preceptor_goals',
        'share_with_preceptor',
        'time_log',
        'procedures',
        'medications',
        'competency_log',
        'preceptor_feedback',
        'clinical_hours',
      ],
      phaseDefaultOverrides: {
        days_before: ['clinical_objectives', 'checklist'],
      },
    },
  },

  // ---------------------------------------------------------------------------
  // AI ANALYSIS SECTIONS
  // ---------------------------------------------------------------------------
  aiAnalysisSections: [
    { id: 'overall_summary', label: 'Overall Summary', description: 'High-level summary of shift performance' },
    { id: 'clinical_reasoning', label: 'Clinical Reasoning', description: 'Quality of clinical thinking and decision-making' },
    { id: 'patient_safety', label: 'Patient Safety', description: 'Safety awareness and adherence to protocols' },
    { id: 'communication', label: 'Communication', description: 'Team and patient communication effectiveness' },
    { id: 'time_management', label: 'Time Management', description: 'Organization and time utilization during shift' },
    { id: 'technical_skills', label: 'Technical Skills', description: 'Competency in clinical procedures and skills' },
    { id: 'documentation', label: 'Documentation', description: 'Quality and completeness of clinical documentation' },
    { id: 'recommendations', label: 'Recommendations', description: 'Actionable suggestions for improvement' },
    { id: 'plan_vs_execution', label: 'Plan vs Execution', description: 'How well pre-shift plan matched actual shift' },
  ],

  // ---------------------------------------------------------------------------
  // FRAMEWORK SCORES
  // ---------------------------------------------------------------------------
  frameworkScores: [
    { id: 'clinical_judgment', label: 'Clinical Judgment', description: 'Ability to interpret data and make sound clinical decisions' },
    { id: 'communication', label: 'Communication', description: 'Effective SBAR handoff and team communication' },
    { id: 'safety', label: 'Safety', description: 'Patient safety awareness and protocol adherence' },
    { id: 'prioritization', label: 'Prioritization', description: 'Ability to triage and prioritize patient care' },
    { id: 'technical_proficiency', label: 'Technical Proficiency', description: 'Competence in clinical skills and procedures' },
    { id: 'documentation', label: 'Documentation', description: 'Accuracy and timeliness of clinical documentation' },
    { id: 'overall_competency', label: 'Overall Competency', description: 'Holistic assessment of nursing competency' },
  ],

  // ---------------------------------------------------------------------------
  // DEBRIEF PHASES
  // ---------------------------------------------------------------------------
  debriefPhases: [
    // Phase 1: Preparation
    {
      id: 'preparation',
      title: 'Preparation',
      emoji: '\u2699\uFE0F',
      description: 'How prepared were you for this shift?',
      questions: [
        {
          id: 'prep_readiness',
          type: 'select',
          label: 'How prepared were you?',
          options: [
            { value: 'fully', label: 'Fully prepared \u2014 reviewed everything' },
            { value: 'mostly', label: 'Mostly prepared \u2014 a few gaps' },
            { value: 'somewhat', label: 'Somewhat prepared \u2014 ran out of time' },
            { value: 'underprepared', label: 'Underprepared \u2014 need to improve' },
          ],
        },
        {
          id: 'prep_meds_reviewed',
          type: 'boolean',
          label: 'Did you review all patient medications?',
        },
        {
          id: 'prep_meds_issues',
          type: 'textarea',
          label: 'What medication questions did you have?',
          placeholder: 'Describe any medication concerns or questions...',
          showWhen: { questionId: 'prep_meds_reviewed', answerIn: ['false'] },
        },
      ],
    },

    // Phase 2: Assessment
    {
      id: 'assessment',
      title: 'Assessment',
      emoji: '\uD83E\uDE7A',
      description: 'How were your patient assessments?',
      questions: [
        {
          id: 'assessment_confidence',
          type: 'select',
          label: 'How confident were you in your assessments?',
          options: [
            { value: 'very_confident', label: 'Very confident \u2014 thorough and systematic' },
            { value: 'confident', label: 'Confident \u2014 covered the essentials' },
            { value: 'somewhat', label: 'Somewhat confident \u2014 missed some areas' },
            { value: 'not_confident', label: 'Not confident \u2014 need more practice' },
          ],
        },
        {
          id: 'assessment_changes',
          type: 'boolean',
          label: 'Did you notice changes in patient condition?',
        },
        {
          id: 'assessment_changes_detail',
          type: 'textarea',
          label: 'What changes did you notice and how did you respond?',
          placeholder: 'Describe the changes and your response...',
          showWhen: { questionId: 'assessment_changes', answerIn: ['true'] },
        },
      ],
    },

    // Phase 3: Interventions
    {
      id: 'interventions',
      title: 'Interventions',
      emoji: '\uD83D\uDC89',
      description: 'Procedures and medications',
      questions: [
        {
          id: 'interventions_performed',
          type: 'multi-select',
          label: 'What interventions did you perform?',
          hint: 'Select all that apply',
          options: [
            { value: 'vital_signs', label: 'Vital Signs' },
            { value: 'medication_administration', label: 'Medication Administration' },
            { value: 'iv_insertion_management', label: 'IV Insertion/Management' },
            { value: 'wound_care', label: 'Wound Care' },
            { value: 'foley_catheter', label: 'Foley Catheter' },
            { value: 'blood_draw', label: 'Blood Draw' },
            { value: 'patient_education', label: 'Patient Education' },
            { value: 'nasogastric_tube', label: 'Nasogastric Tube' },
            { value: 'blood_glucose_monitoring', label: 'Blood Glucose Monitoring' },
            { value: 'other_procedure', label: 'Other Procedure' },
          ],
        },
        {
          id: 'interventions_confidence',
          type: 'select',
          label: 'How confident were you performing interventions?',
          options: [
            { value: 'very_confident', label: 'Very confident \u2014 smooth execution' },
            { value: 'confident', label: 'Confident \u2014 minor hesitations' },
            { value: 'somewhat', label: 'Somewhat confident \u2014 needed guidance' },
            { value: 'not_confident', label: 'Not confident \u2014 struggled' },
          ],
        },
        {
          id: 'interventions_med_events',
          type: 'boolean',
          label: 'Any medication-related events or near-misses?',
        },
        {
          id: 'interventions_med_detail',
          type: 'textarea',
          label: 'Describe what happened',
          placeholder: 'Describe the medication event or near-miss...',
          showWhen: { questionId: 'interventions_med_events', answerIn: ['true'] },
        },
      ],
    },

    // Phase 4: Communication
    {
      id: 'communication',
      title: 'Communication',
      emoji: '\uD83D\uDCAC',
      description: 'Team and patient communication',
      questions: [
        {
          id: 'communication_sbar',
          type: 'select',
          label: 'How was your SBAR communication?',
          options: [
            { value: 'excellent', label: 'Excellent \u2014 clear and complete' },
            { value: 'good', label: 'Good \u2014 covered main points' },
            { value: 'fair', label: 'Fair \u2014 missed some details' },
            { value: 'needs_improvement', label: 'Needs improvement' },
          ],
        },
        {
          id: 'communication_team',
          type: 'boolean',
          label: 'Any difficult team interactions?',
        },
        {
          id: 'communication_team_detail',
          type: 'textarea',
          label: 'What happened?',
          placeholder: 'Describe the team interaction...',
          showWhen: { questionId: 'communication_team', answerIn: ['true'] },
        },
      ],
    },

    // Phase 5: Time Management
    {
      id: 'time_management',
      title: 'Time Management',
      emoji: '\u23F1\uFE0F',
      description: 'How did you manage your time?',
      questions: [
        {
          id: 'time_organized',
          type: 'select',
          label: 'How organized were you?',
          options: [
            { value: 'very_organized', label: 'Very organized \u2014 ahead of schedule' },
            { value: 'organized', label: 'Organized \u2014 on time' },
            { value: 'somewhat', label: 'Somewhat organized \u2014 fell behind' },
            { value: 'disorganized', label: 'Disorganized \u2014 need a better system' },
          ],
        },
        {
          id: 'time_documentation',
          type: 'boolean',
          label: 'Did you complete documentation during the shift?',
        },
      ],
    },

    // Phase 6: Safety
    {
      id: 'safety',
      title: 'Safety',
      emoji: '\uD83D\uDEE1\uFE0F',
      description: 'Patient safety awareness',
      questions: [
        {
          id: 'safety_concerns',
          type: 'boolean',
          label: 'Any safety concerns during the shift?',
        },
        {
          id: 'safety_concern_detail',
          type: 'textarea',
          label: 'What safety concerns did you have?',
          placeholder: 'Describe any safety concerns...',
          showWhen: { questionId: 'safety_concerns', answerIn: ['true'] },
        },
        {
          id: 'safety_protocols',
          type: 'select',
          label: 'How well did you follow safety protocols?',
          options: [
            { value: 'followed_all', label: 'Followed all protocols' },
            { value: 'minor_deviations', label: 'Minor protocol deviations' },
            { value: 'missed_step', label: 'Missed a protocol step' },
            { value: 'unsure', label: 'Unsure about a protocol' },
          ],
        },
      ],
    },

    // Phase 7: Overall Reflection
    {
      id: 'overall',
      title: 'Overall Reflection',
      emoji: '\uD83D\uDCDD',
      description: 'Looking back at the whole shift',
      questions: [
        {
          id: 'overall_feeling',
          type: 'select',
          label: 'How do you feel about this shift overall?',
          options: [
            { value: 'great', label: 'Great \u2014 confident and capable' },
            { value: 'good', label: 'Good \u2014 solid learning day' },
            { value: 'mixed', label: 'Mixed \u2014 some wins some struggles' },
            { value: 'tough', label: 'Tough \u2014 challenging shift' },
            { value: 'learning_moment', label: 'Learning moment \u2014 significant growth' },
          ],
        },
        {
          id: 'overall_strongest',
          type: 'textarea',
          label: 'What was your strongest moment?',
          placeholder: 'Describe your best moment from this shift...',
        },
        {
          id: 'overall_improve',
          type: 'textarea',
          label: 'One thing to improve for next shift?',
          placeholder: 'What would you focus on improving...',
        },
        {
          id: 'overall_key_learning',
          type: 'textarea',
          label: 'Key learning from this shift?',
          placeholder: 'What is the most important thing you learned...',
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------------
  // DRILL CATEGORIES (nursing practice areas)
  // ---------------------------------------------------------------------------
  drillCategories: [
    { id: 'clinical_skills', label: 'Clinical Skills', icon: 'medkit' },
    { id: 'pharmacology', label: 'Pharmacology', icon: 'pill' },
    { id: 'assessment', label: 'Assessment', icon: 'clipboard-text' },
    { id: 'communication', label: 'Communication', icon: 'message-text' },
    { id: 'critical_thinking', label: 'Critical Thinking', icon: 'lightbulb-outline' },
    { id: 'nclex_prep', label: 'NCLEX Prep', icon: 'school' },
  ],

  // ---------------------------------------------------------------------------
  // SKILL AREAS
  // ---------------------------------------------------------------------------
  skillAreas: [
    { id: 'assessment', label: 'Assessment' },
    { id: 'medication_administration', label: 'Medication Administration' },
    { id: 'iv_therapy', label: 'IV Therapy' },
    { id: 'wound_care', label: 'Wound Care' },
    { id: 'patient_education', label: 'Patient Education' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'communication', label: 'Communication' },
    { id: 'safety', label: 'Safety & Infection Control' },
    { id: 'critical_thinking', label: 'Critical Thinking' },
    { id: 'time_management', label: 'Time Management' },
  ],

  // ---------------------------------------------------------------------------
  // EVIDENCE CAPTURE
  // ---------------------------------------------------------------------------
  evidenceCapture: {
    primaryCapture: {
      id: 'activity_log',
      label: 'Activity Log',
      icon: 'list',
      type: 'activity_log',
      description: 'Structured tap-based activity logging during shift',
    },
    secondaryCapture: [
      {
        id: 'voice_memo',
        label: 'Voice Memo',
        icon: 'microphone',
        type: 'audio',
        description: 'Quick voice notes during shift',
      },
      {
        id: 'text_notes',
        label: 'Text Notes',
        icon: 'pencil',
        type: 'text',
        description: 'Written notes and observations',
      },
      {
        id: 'clinical_hours_timer',
        label: 'Clinical Hours Timer',
        icon: 'timer',
        type: 'timer',
        description: 'Auto-running clinical hours tracker',
      },
      {
        id: 'competency_attempt_markers',
        label: 'Competency Attempt Markers',
        icon: 'checkbox-marked-outline',
        type: 'activity_log',
        description: 'Mark competency attempts during shift',
      },
    ],
    privacyNote: 'HIPAA \u2014 No photos, video, or patient names. Reference patients by assigned number only.',
  },

  // ---------------------------------------------------------------------------
  // REFLECT CONFIG
  // ---------------------------------------------------------------------------
  reflectConfig: {
    segments: [
      { value: 'progress', label: 'Progress' },
      { value: 'racelog', label: 'Shift Log' },
      { value: 'profile', label: 'Profile' },
    ],
    progressStats: {
      eventsLabel: 'Shifts',
      hoursLabel: 'Clinical Hours',
      skillsLabel: 'Competencies',
      streakLabel: 'Shift Streak',
    },
  },

  // ---------------------------------------------------------------------------
  // Tile sections (visual grouping for config-driven rendering)
  // ---------------------------------------------------------------------------
  tileSections: {
    days_before: [
      {
        id: 'patient-care',
        label: 'Patient Care',
        subtitle: 'Patients, medications, and lab values',
        moduleIds: ['patient_overview', 'medications', 'lab_values'],
      },
      {
        id: 'clinical-prep',
        label: 'Clinical Prep',
        subtitle: 'Procedures, care plan, and objectives',
        moduleIds: ['procedures', 'care_plan', 'clinical_objectives'],
      },
      {
        id: 'team',
        label: 'Team',
        subtitle: 'Protocols, preceptor, and sharing',
        moduleIds: ['unit_protocols', 'preceptor_goals', 'share_with_preceptor'],
      },
    ],
    on_water: [
      {
        id: 'active-shift',
        label: 'Active Shift',
        subtitle: 'Patient status and clinical tasks',
        moduleIds: ['patient_overview', 'clinical_objectives', 'medications', 'time_log'],
      },
    ],
    after_race: [
      {
        id: 'shift-review',
        label: 'Shift Review',
        subtitle: 'Competencies, notes, and feedback',
        moduleIds: ['competency_log', 'learning_notes', 'preceptor_feedback', 'clinical_hours'],
      },
    ],
  },
};
