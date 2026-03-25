export type NursingSubCompetencyV1 = {
  id: string;
  parentId: string;
  title: string;
  description: string;
};

export const NURSING_SUB_COMPETENCIES_V1: NursingSubCompetencyV1[] = [
  // ──────────────────────────────────────────────────────────────────
  // Domain: Knowledge for Nursing Practice
  // ──────────────────────────────────────────────────────────────────

  // Parent: Clinical Reasoning Foundations (nurs-kp-clinical-reasoning-foundations)
  { id: 'nurs-kp-crf-sc1', parentId: 'nurs-kp-clinical-reasoning-foundations', title: 'Pathophysiology integration', description: 'Uses knowledge of disease processes to explain clinical findings and guide interventions.' },
  { id: 'nurs-kp-crf-sc2', parentId: 'nurs-kp-clinical-reasoning-foundations', title: 'Cue clustering and pattern recognition', description: 'Groups assessment data into meaningful clusters to form early clinical hypotheses.' },
  { id: 'nurs-kp-crf-sc3', parentId: 'nurs-kp-clinical-reasoning-foundations', title: 'Hypothesis generation and testing', description: 'Generates plausible explanations for patient status and seeks confirming or refuting data.' },
  { id: 'nurs-kp-crf-sc4', parentId: 'nurs-kp-clinical-reasoning-foundations', title: 'Outcome prediction and monitoring', description: 'Anticipates expected patient responses and identifies when trajectories deviate.' },
  { id: 'nurs-kp-crf-sc5', parentId: 'nurs-kp-clinical-reasoning-foundations', title: 'Reasoning articulation under pressure', description: 'Explains clinical reasoning clearly to peers and providers during time-sensitive situations.' },

  // Parent: Prioritization Frameworks (nurs-kp-prioritization-frameworks)
  { id: 'nurs-kp-pf-sc1', parentId: 'nurs-kp-prioritization-frameworks', title: 'ABC-based acuity triage', description: 'Applies airway-breathing-circulation hierarchy to rank immediate patient needs.' },
  { id: 'nurs-kp-pf-sc2', parentId: 'nurs-kp-prioritization-frameworks', title: 'Time-sensitive intervention sequencing', description: 'Orders nursing actions based on urgency windows and clinical deadlines.' },
  { id: 'nurs-kp-pf-sc3', parentId: 'nurs-kp-prioritization-frameworks', title: 'Multi-patient workload balancing', description: 'Distributes attention across a patient assignment using risk-based prioritization.' },
  { id: 'nurs-kp-pf-sc4', parentId: 'nurs-kp-prioritization-frameworks', title: 'Dynamic re-prioritization', description: 'Adjusts task order in real time when patient conditions or unit demands change.' },
  { id: 'nurs-kp-pf-sc5', parentId: 'nurs-kp-prioritization-frameworks', title: 'Delegation within priority context', description: 'Delegates lower-priority tasks appropriately to maintain focus on critical needs.' },

  // Parent: Medication Knowledge Application (nurs-kp-medication-knowledge-application)
  { id: 'nurs-kp-mka-sc1', parentId: 'nurs-kp-medication-knowledge-application', title: 'Mechanism-of-action reasoning', description: 'Links drug mechanism to expected therapeutic and adverse effects in specific patients.' },
  { id: 'nurs-kp-mka-sc2', parentId: 'nurs-kp-medication-knowledge-application', title: 'Dose-response and titration awareness', description: 'Recognizes when dose adjustments are needed based on patient response or labs.' },
  { id: 'nurs-kp-mka-sc3', parentId: 'nurs-kp-medication-knowledge-application', title: 'Drug interaction identification', description: 'Screens for clinically significant interactions before administration.' },
  { id: 'nurs-kp-mka-sc4', parentId: 'nurs-kp-medication-knowledge-application', title: 'Patient-specific monitoring plans', description: 'Identifies parameters to monitor based on medication profile and patient factors.' },
  { id: 'nurs-kp-mka-sc5', parentId: 'nurs-kp-medication-knowledge-application', title: 'Medication education tailoring', description: 'Adapts medication teaching to patient literacy, language, and regimen complexity.' },

  // Parent: Lab and Diagnostic Interpretation (nurs-kp-lab-and-diagnostic-interpretation)
  { id: 'nurs-kp-ldi-sc1', parentId: 'nurs-kp-lab-and-diagnostic-interpretation', title: 'Critical value recognition', description: 'Identifies lab results requiring immediate notification and intervention.' },
  { id: 'nurs-kp-ldi-sc2', parentId: 'nurs-kp-lab-and-diagnostic-interpretation', title: 'Trend analysis across serial results', description: 'Tracks lab values over time to detect improvement, worsening, or new patterns.' },
  { id: 'nurs-kp-ldi-sc3', parentId: 'nurs-kp-lab-and-diagnostic-interpretation', title: 'Lab-to-symptom correlation', description: 'Connects abnormal results to observed clinical signs and symptoms.' },
  { id: 'nurs-kp-ldi-sc4', parentId: 'nurs-kp-lab-and-diagnostic-interpretation', title: 'Pre-analytic error prevention', description: 'Ensures proper specimen collection and handling to avoid false results.' },
  { id: 'nurs-kp-ldi-sc5', parentId: 'nurs-kp-lab-and-diagnostic-interpretation', title: 'Diagnostic preparation and follow-up', description: 'Prepares patients for procedures and follows up on pending diagnostic results.' },

  // Parent: Evidence-to-Bedside Linkage (nurs-kp-evidence-to-bedside-linkage)
  { id: 'nurs-kp-ebl-sc1', parentId: 'nurs-kp-evidence-to-bedside-linkage', title: 'Guideline application to individual patients', description: 'Adapts clinical practice guidelines to the unique context of each patient.' },
  { id: 'nurs-kp-ebl-sc2', parentId: 'nurs-kp-evidence-to-bedside-linkage', title: 'Research-to-practice translation', description: 'Explains how a research finding supports or changes a bedside intervention.' },
  { id: 'nurs-kp-ebl-sc3', parentId: 'nurs-kp-evidence-to-bedside-linkage', title: 'Rationale documentation in care plans', description: 'Records evidence-based justifications within nursing care plan entries.' },
  { id: 'nurs-kp-ebl-sc4', parentId: 'nurs-kp-evidence-to-bedside-linkage', title: 'Questioning outdated practices', description: 'Identifies routine practices lacking current evidence and raises concerns.' },
  { id: 'nurs-kp-ebl-sc5', parentId: 'nurs-kp-evidence-to-bedside-linkage', title: 'Peer knowledge sharing', description: 'Shares evidence-based insights with colleagues during huddles or in-services.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Person-Centered Care
  // ──────────────────────────────────────────────────────────────────

  // Parent: Therapeutic Communication (nurs-pcc-therapeutic-communication)
  { id: 'nurs-pcc-tc-sc1', parentId: 'nurs-pcc-therapeutic-communication', title: 'Active listening and presence', description: 'Demonstrates attentive listening with verbal and nonverbal cues of engagement.' },
  { id: 'nurs-pcc-tc-sc2', parentId: 'nurs-pcc-therapeutic-communication', title: 'Empathic response delivery', description: 'Validates patient emotions and concerns without dismissing or over-reassuring.' },
  { id: 'nurs-pcc-tc-sc3', parentId: 'nurs-pcc-therapeutic-communication', title: 'Open-ended questioning technique', description: 'Uses open-ended questions to elicit patient perspectives and concerns.' },
  { id: 'nurs-pcc-tc-sc4', parentId: 'nurs-pcc-therapeutic-communication', title: 'De-escalation and emotional safety', description: 'Responds to distress or agitation with calming, non-threatening communication.' },
  { id: 'nurs-pcc-tc-sc5', parentId: 'nurs-pcc-therapeutic-communication', title: 'Difficult conversation navigation', description: 'Engages in sensitive topics such as prognosis or goals of care with skill.' },

  // Parent: Shared Decision Support (nurs-pcc-shared-decision-support)
  { id: 'nurs-pcc-sds-sc1', parentId: 'nurs-pcc-shared-decision-support', title: 'Patient preference elicitation', description: 'Explores patient values, fears, and priorities before presenting options.' },
  { id: 'nurs-pcc-sds-sc2', parentId: 'nurs-pcc-shared-decision-support', title: 'Option framing without bias', description: 'Presents treatment choices in balanced language free from provider preference.' },
  { id: 'nurs-pcc-sds-sc3', parentId: 'nurs-pcc-shared-decision-support', title: 'Decisional conflict recognition', description: 'Identifies when patients feel uncertain or pressured about care decisions.' },
  { id: 'nurs-pcc-sds-sc4', parentId: 'nurs-pcc-shared-decision-support', title: 'Advance directive facilitation', description: 'Supports conversations about advance directives and documents preferences.' },
  { id: 'nurs-pcc-sds-sc5', parentId: 'nurs-pcc-shared-decision-support', title: 'Goal alignment documentation', description: 'Records how care plan reflects patient-stated goals and preferences.' },

  // Parent: Teach-Back Education (nurs-pcc-teach-back-education)
  { id: 'nurs-pcc-tbe-sc1', parentId: 'nurs-pcc-teach-back-education', title: 'Teach-back technique execution', description: 'Asks patients to restate instructions in their own words to confirm understanding.' },
  { id: 'nurs-pcc-tbe-sc2', parentId: 'nurs-pcc-teach-back-education', title: 'Health literacy assessment', description: 'Evaluates patient literacy and adjusts language complexity accordingly.' },
  { id: 'nurs-pcc-tbe-sc3', parentId: 'nurs-pcc-teach-back-education', title: 'Visual and written aid use', description: 'Supplements verbal teaching with diagrams, handouts, or digital resources.' },
  { id: 'nurs-pcc-tbe-sc4', parentId: 'nurs-pcc-teach-back-education', title: 'Discharge education completeness', description: 'Covers medications, warning signs, follow-up, and activity restrictions at discharge.' },
  { id: 'nurs-pcc-tbe-sc5', parentId: 'nurs-pcc-teach-back-education', title: 'Re-teaching and reinforcement', description: 'Identifies gaps in understanding and re-teaches using alternative approaches.' },

  // Parent: Cultural Humility in Care (nurs-pcc-cultural-humility-in-care)
  { id: 'nurs-pcc-chc-sc1', parentId: 'nurs-pcc-cultural-humility-in-care', title: 'Bias self-awareness', description: 'Recognizes personal assumptions that may influence clinical interactions.' },
  { id: 'nurs-pcc-chc-sc2', parentId: 'nurs-pcc-cultural-humility-in-care', title: 'Interpreter and language access', description: 'Uses professional interpreters and translated materials for non-English speakers.' },
  { id: 'nurs-pcc-chc-sc3', parentId: 'nurs-pcc-cultural-humility-in-care', title: 'Spiritual and religious sensitivity', description: 'Accommodates spiritual practices and dietary needs within the plan of care.' },
  { id: 'nurs-pcc-chc-sc4', parentId: 'nurs-pcc-cultural-humility-in-care', title: 'Social context inquiry', description: 'Asks about social determinants without stereotyping or making assumptions.' },
  { id: 'nurs-pcc-chc-sc5', parentId: 'nurs-pcc-cultural-humility-in-care', title: 'Culturally adapted care modifications', description: 'Adjusts interventions to respect cultural norms around modesty, food, and family.' },

  // Parent: Family Care Partnership (nurs-pcc-family-care-partnership)
  { id: 'nurs-pcc-fcp-sc1', parentId: 'nurs-pcc-family-care-partnership', title: 'Family role identification', description: 'Identifies key family members and their roles in the patient care network.' },
  { id: 'nurs-pcc-fcp-sc2', parentId: 'nurs-pcc-family-care-partnership', title: 'Family education and inclusion', description: 'Teaches family members relevant care skills for post-discharge support.' },
  { id: 'nurs-pcc-fcp-sc3', parentId: 'nurs-pcc-family-care-partnership', title: 'Confidentiality boundary management', description: 'Shares information with family only as authorized by the patient.' },
  { id: 'nurs-pcc-fcp-sc4', parentId: 'nurs-pcc-family-care-partnership', title: 'Caregiver burden recognition', description: 'Assesses family caregiver stress and connects them with support resources.' },
  { id: 'nurs-pcc-fcp-sc5', parentId: 'nurs-pcc-family-care-partnership', title: 'Family meeting participation', description: 'Contributes nursing perspective in family conferences about goals of care.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Population Health
  // ──────────────────────────────────────────────────────────────────

  // Parent: Risk Screening and Referral (nurs-ph-risk-screening-and-referral)
  { id: 'nurs-ph-rsr-sc1', parentId: 'nurs-ph-risk-screening-and-referral', title: 'SDOH screening tool use', description: 'Administers validated social determinants of health screens accurately.' },
  { id: 'nurs-ph-rsr-sc2', parentId: 'nurs-ph-risk-screening-and-referral', title: 'Fall and safety risk assessment', description: 'Completes fall risk and home safety evaluations with appropriate interventions.' },
  { id: 'nurs-ph-rsr-sc3', parentId: 'nurs-ph-risk-screening-and-referral', title: 'Mental health screening initiation', description: 'Uses PHQ-2/9 or similar tools to identify depression and anxiety concerns.' },
  { id: 'nurs-ph-rsr-sc4', parentId: 'nurs-ph-risk-screening-and-referral', title: 'Referral pathway activation', description: 'Initiates appropriate referrals to social work, case management, or specialists.' },
  { id: 'nurs-ph-rsr-sc5', parentId: 'nurs-ph-risk-screening-and-referral', title: 'Screening documentation and follow-up', description: 'Documents screening results and tracks referral completion status.' },

  // Parent: Health Equity Awareness (nurs-ph-health-equity-awareness)
  { id: 'nurs-ph-hea-sc1', parentId: 'nurs-ph-health-equity-awareness', title: 'Disparity pattern recognition', description: 'Identifies patterns of unequal outcomes across patient populations served.' },
  { id: 'nurs-ph-hea-sc2', parentId: 'nurs-ph-health-equity-awareness', title: 'Access barrier identification', description: 'Recognizes transportation, insurance, and literacy barriers to care.' },
  { id: 'nurs-ph-hea-sc3', parentId: 'nurs-ph-health-equity-awareness', title: 'Structural determinant awareness', description: 'Understands how policies and systems create health inequities.' },
  { id: 'nurs-ph-hea-sc4', parentId: 'nurs-ph-health-equity-awareness', title: 'Equity-focused care adjustments', description: 'Modifies care delivery to reduce disparities for marginalized patients.' },
  { id: 'nurs-ph-hea-sc5', parentId: 'nurs-ph-health-equity-awareness', title: 'Inclusive data collection', description: 'Collects demographic and social data respectfully to support equitable care.' },

  // Parent: Prevention and Health Promotion (nurs-ph-prevention-and-health-promotion)
  { id: 'nurs-ph-php-sc1', parentId: 'nurs-ph-prevention-and-health-promotion', title: 'Immunization education and support', description: 'Provides evidence-based vaccine information and addresses patient hesitancy.' },
  { id: 'nurs-ph-php-sc2', parentId: 'nurs-ph-prevention-and-health-promotion', title: 'Lifestyle modification counseling', description: 'Guides patients on nutrition, exercise, and substance cessation strategies.' },
  { id: 'nurs-ph-php-sc3', parentId: 'nurs-ph-prevention-and-health-promotion', title: 'Age-appropriate screening promotion', description: 'Educates patients about recommended cancer and chronic disease screenings.' },
  { id: 'nurs-ph-php-sc4', parentId: 'nurs-ph-prevention-and-health-promotion', title: 'Chronic disease self-management support', description: 'Teaches self-monitoring and action plans for conditions like diabetes or CHF.' },
  { id: 'nurs-ph-php-sc5', parentId: 'nurs-ph-prevention-and-health-promotion', title: 'Motivational interviewing basics', description: 'Uses MI techniques to explore ambivalence and support behavior change.' },

  // Parent: Transition of Care Planning (nurs-ph-transition-of-care-planning)
  { id: 'nurs-ph-tcp-sc1', parentId: 'nurs-ph-transition-of-care-planning', title: 'Discharge readiness evaluation', description: 'Assesses patient understanding, support system, and functional ability pre-discharge.' },
  { id: 'nurs-ph-tcp-sc2', parentId: 'nurs-ph-transition-of-care-planning', title: 'Medication reconciliation at transitions', description: 'Verifies medication lists are accurate and understood at each care transition.' },
  { id: 'nurs-ph-tcp-sc3', parentId: 'nurs-ph-transition-of-care-planning', title: 'Follow-up appointment coordination', description: 'Schedules and confirms follow-up visits before patient leaves the setting.' },
  { id: 'nurs-ph-tcp-sc4', parentId: 'nurs-ph-transition-of-care-planning', title: 'Inter-facility communication', description: 'Provides structured handoff information when patients transfer between facilities.' },
  { id: 'nurs-ph-tcp-sc5', parentId: 'nurs-ph-transition-of-care-planning', title: 'Readmission risk mitigation', description: 'Identifies and addresses factors that increase risk of hospital readmission.' },

  // Parent: Community Resource Navigation (nurs-ph-community-resource-navigation)
  { id: 'nurs-ph-crn-sc1', parentId: 'nurs-ph-community-resource-navigation', title: 'Local resource knowledge', description: 'Maintains awareness of food banks, shelters, and support services in the area.' },
  { id: 'nurs-ph-crn-sc2', parentId: 'nurs-ph-community-resource-navigation', title: 'Insurance and financial navigation', description: 'Helps patients understand coverage options and connects them with financial aid.' },
  { id: 'nurs-ph-crn-sc3', parentId: 'nurs-ph-community-resource-navigation', title: 'Home health and rehab referrals', description: 'Coordinates referrals to home health, PT, OT, and other outpatient services.' },
  { id: 'nurs-ph-crn-sc4', parentId: 'nurs-ph-community-resource-navigation', title: 'Support group and peer connections', description: 'Connects patients with condition-specific peer support and community groups.' },
  { id: 'nurs-ph-crn-sc5', parentId: 'nurs-ph-community-resource-navigation', title: 'Warm handoff to community partners', description: 'Facilitates direct introductions between patients and community providers.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Scholarship for the Nursing Discipline
  // ──────────────────────────────────────────────────────────────────

  // Parent: Clinical Question Formulation (nurs-sch-clinical-question-formulation)
  { id: 'nurs-sch-cqf-sc1', parentId: 'nurs-sch-clinical-question-formulation', title: 'PICO question construction', description: 'Structures clinical questions using population, intervention, comparison, outcome.' },
  { id: 'nurs-sch-cqf-sc2', parentId: 'nurs-sch-clinical-question-formulation', title: 'Background vs foreground distinction', description: 'Distinguishes general knowledge gaps from specific clinical practice questions.' },
  { id: 'nurs-sch-cqf-sc3', parentId: 'nurs-sch-clinical-question-formulation', title: 'Question refinement and scoping', description: 'Narrows broad clinical curiosities into searchable, answerable questions.' },
  { id: 'nurs-sch-cqf-sc4', parentId: 'nurs-sch-clinical-question-formulation', title: 'Practice trigger identification', description: 'Notices clinical events or patterns that should prompt evidence inquiry.' },
  { id: 'nurs-sch-cqf-sc5', parentId: 'nurs-sch-clinical-question-formulation', title: 'Database search strategy', description: 'Selects appropriate databases and search terms to find relevant evidence.' },

  // Parent: Evidence Appraisal Basics (nurs-sch-evidence-appraisal-basics)
  { id: 'nurs-sch-eab-sc1', parentId: 'nurs-sch-evidence-appraisal-basics', title: 'Level of evidence classification', description: 'Ranks sources by study design strength from systematic reviews to expert opinion.' },
  { id: 'nurs-sch-eab-sc2', parentId: 'nurs-sch-evidence-appraisal-basics', title: 'Bias and limitation identification', description: 'Identifies sample size, design, and conflict-of-interest limitations in studies.' },
  { id: 'nurs-sch-eab-sc3', parentId: 'nurs-sch-evidence-appraisal-basics', title: 'Clinical relevance judgment', description: 'Evaluates whether study findings apply to the current patient population.' },
  { id: 'nurs-sch-eab-sc4', parentId: 'nurs-sch-evidence-appraisal-basics', title: 'Guideline currency verification', description: 'Checks publication dates and updates to ensure evidence is current.' },
  { id: 'nurs-sch-eab-sc5', parentId: 'nurs-sch-evidence-appraisal-basics', title: 'Evidence summary communication', description: 'Summarizes key findings clearly for team discussion and care application.' },

  // Parent: Reflective Practice Depth (nurs-sch-reflective-practice-depth)
  { id: 'nurs-sch-rpd-sc1', parentId: 'nurs-sch-reflective-practice-depth', title: 'Critical incident analysis', description: 'Reviews significant clinical events to extract lessons and action items.' },
  { id: 'nurs-sch-rpd-sc2', parentId: 'nurs-sch-reflective-practice-depth', title: 'Assumption surfacing', description: 'Identifies personal assumptions that influenced clinical decisions.' },
  { id: 'nurs-sch-rpd-sc3', parentId: 'nurs-sch-reflective-practice-depth', title: 'Pattern recognition across experiences', description: 'Identifies recurring themes across multiple clinical encounters.' },
  { id: 'nurs-sch-rpd-sc4', parentId: 'nurs-sch-reflective-practice-depth', title: 'Emotional processing in reflection', description: 'Acknowledges emotional responses and their impact on clinical performance.' },
  { id: 'nurs-sch-rpd-sc5', parentId: 'nurs-sch-reflective-practice-depth', title: 'Action plan from reflection', description: 'Converts reflective insights into specific behavior change commitments.' },

  // Parent: Learning Goal Planning (nurs-sch-learning-goal-planning)
  { id: 'nurs-sch-lgp-sc1', parentId: 'nurs-sch-learning-goal-planning', title: 'SMART goal formulation', description: 'Writes learning goals that are specific, measurable, and time-bound.' },
  { id: 'nurs-sch-lgp-sc2', parentId: 'nurs-sch-learning-goal-planning', title: 'Gap-to-goal alignment', description: 'Links identified knowledge gaps to concrete learning objectives.' },
  { id: 'nurs-sch-lgp-sc3', parentId: 'nurs-sch-learning-goal-planning', title: 'Progress evidence collection', description: 'Gathers artifacts and examples that demonstrate goal achievement over time.' },
  { id: 'nurs-sch-lgp-sc4', parentId: 'nurs-sch-learning-goal-planning', title: 'Resource identification for learning', description: 'Identifies courses, simulations, and clinical experiences to support goals.' },
  { id: 'nurs-sch-lgp-sc5', parentId: 'nurs-sch-learning-goal-planning', title: 'Goal revision and iteration', description: 'Adjusts learning goals based on progress, feedback, and new priorities.' },

  // Parent: Practice Change Rationale (nurs-sch-practice-change-rationale)
  { id: 'nurs-sch-pcr-sc1', parentId: 'nurs-sch-practice-change-rationale', title: 'Evidence-based proposal development', description: 'Drafts a rationale for practice change supported by current literature.' },
  { id: 'nurs-sch-pcr-sc2', parentId: 'nurs-sch-practice-change-rationale', title: 'Stakeholder impact analysis', description: 'Identifies who is affected by a proposed change and anticipates concerns.' },
  { id: 'nurs-sch-pcr-sc3', parentId: 'nurs-sch-practice-change-rationale', title: 'Outcome metric selection', description: 'Chooses measurable indicators to evaluate whether a change achieved its aim.' },
  { id: 'nurs-sch-pcr-sc4', parentId: 'nurs-sch-practice-change-rationale', title: 'Barrier and facilitator mapping', description: 'Identifies factors that support or hinder successful implementation.' },
  { id: 'nurs-sch-pcr-sc5', parentId: 'nurs-sch-practice-change-rationale', title: 'Sustainability planning', description: 'Considers how a practice change will be maintained after initial adoption.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Quality and Safety
  // ──────────────────────────────────────────────────────────────────

  // Parent: Patient Safety Vigilance (nurs-qs-patient-safety-vigilance)
  { id: 'nurs-qs-psv-sc1', parentId: 'nurs-qs-patient-safety-vigilance', title: 'Patient identification verification', description: 'Uses two-identifier checks before medications, procedures, and specimens.' },
  { id: 'nurs-qs-psv-sc2', parentId: 'nurs-qs-patient-safety-vigilance', title: 'Environmental hazard scanning', description: 'Identifies and corrects fall risks, equipment issues, and clutter in care areas.' },
  { id: 'nurs-qs-psv-sc3', parentId: 'nurs-qs-patient-safety-vigilance', title: 'Deterioration early warning response', description: 'Recognizes early signs of clinical deterioration and activates rapid response.' },
  { id: 'nurs-qs-psv-sc4', parentId: 'nurs-qs-patient-safety-vigilance', title: 'Time-out and checklist participation', description: 'Engages actively in procedural pauses and safety verification checklists.' },
  { id: 'nurs-qs-psv-sc5', parentId: 'nurs-qs-patient-safety-vigilance', title: 'Situational awareness maintenance', description: 'Monitors the big picture of patient status and unit activity continuously.' },

  // Parent: Medication Safety Practices (nurs-qs-medication-safety-practices)
  { id: 'nurs-qs-msp-sc1', parentId: 'nurs-qs-medication-safety-practices', title: 'Rights verification consistency', description: 'Checks right patient, drug, dose, route, time, and documentation every time.' },
  { id: 'nurs-qs-msp-sc2', parentId: 'nurs-qs-medication-safety-practices', title: 'High-alert medication protocols', description: 'Applies independent double-checks for high-alert drugs like insulin and heparin.' },
  { id: 'nurs-qs-msp-sc3', parentId: 'nurs-qs-medication-safety-practices', title: 'Allergy and contraindication screening', description: 'Verifies allergy history and contraindications before each administration.' },
  { id: 'nurs-qs-msp-sc4', parentId: 'nurs-qs-medication-safety-practices', title: 'Smart pump and barcode compliance', description: 'Uses technology safeguards consistently without workaround shortcuts.' },
  { id: 'nurs-qs-msp-sc5', parentId: 'nurs-qs-medication-safety-practices', title: 'Post-administration monitoring', description: 'Monitors for expected and adverse effects within appropriate timeframes.' },

  // Parent: Infection Prevention Consistency (nurs-qs-infection-prevention-consistency)
  { id: 'nurs-qs-ipc-sc1', parentId: 'nurs-qs-infection-prevention-consistency', title: 'Hand hygiene compliance', description: 'Performs hand hygiene at all five WHO-indicated moments without exception.' },
  { id: 'nurs-qs-ipc-sc2', parentId: 'nurs-qs-infection-prevention-consistency', title: 'Sterile technique maintenance', description: 'Maintains sterile field integrity during catheter insertion and wound care.' },
  { id: 'nurs-qs-ipc-sc3', parentId: 'nurs-qs-infection-prevention-consistency', title: 'Isolation precaution adherence', description: 'Dons and doffs PPE correctly and follows isolation signage protocols.' },
  { id: 'nurs-qs-ipc-sc4', parentId: 'nurs-qs-infection-prevention-consistency', title: 'Central line and catheter bundle compliance', description: 'Follows CLABSI and CAUTI prevention bundles during insertion and maintenance.' },
  { id: 'nurs-qs-ipc-sc5', parentId: 'nurs-qs-infection-prevention-consistency', title: 'Environmental cleaning awareness', description: 'Ensures patient environment and shared equipment are properly disinfected.' },

  // Parent: Near-Miss Reporting (nurs-qs-near-miss-reporting)
  { id: 'nurs-qs-nmr-sc1', parentId: 'nurs-qs-near-miss-reporting', title: 'Near-miss identification', description: 'Recognizes events that could have caused harm but were caught in time.' },
  { id: 'nurs-qs-nmr-sc2', parentId: 'nurs-qs-near-miss-reporting', title: 'Reporting system navigation', description: 'Submits timely, complete incident reports through the institutional system.' },
  { id: 'nurs-qs-nmr-sc3', parentId: 'nurs-qs-near-miss-reporting', title: 'Just culture understanding', description: 'Distinguishes human error from at-risk behavior in safety event analysis.' },
  { id: 'nurs-qs-nmr-sc4', parentId: 'nurs-qs-near-miss-reporting', title: 'Root cause contribution', description: 'Participates in identifying system factors that contributed to safety events.' },
  { id: 'nurs-qs-nmr-sc5', parentId: 'nurs-qs-near-miss-reporting', title: 'Learning dissemination from events', description: 'Shares safety lessons with peers to prevent recurrence of similar events.' },

  // Parent: Improvement Cycle Participation (nurs-qs-improvement-cycle-participation)
  { id: 'nurs-qs-icp-sc1', parentId: 'nurs-qs-improvement-cycle-participation', title: 'Quality metric data collection', description: 'Collects accurate data on falls, infections, or other unit-level indicators.' },
  { id: 'nurs-qs-icp-sc2', parentId: 'nurs-qs-improvement-cycle-participation', title: 'PDSA cycle understanding', description: 'Describes Plan-Do-Study-Act steps and participates in small tests of change.' },
  { id: 'nurs-qs-icp-sc3', parentId: 'nurs-qs-improvement-cycle-participation', title: 'Process observation and mapping', description: 'Observes workflows to identify inefficiencies and variation in care delivery.' },
  { id: 'nurs-qs-icp-sc4', parentId: 'nurs-qs-improvement-cycle-participation', title: 'Outcome measurement and reporting', description: 'Tracks pre- and post-intervention data to evaluate improvement impact.' },
  { id: 'nurs-qs-icp-sc5', parentId: 'nurs-qs-improvement-cycle-participation', title: 'Team engagement in QI projects', description: 'Contributes ideas and effort to unit-based quality improvement initiatives.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Interprofessional Partnerships
  // ──────────────────────────────────────────────────────────────────

  // Parent: SBAR Handoff Clarity (nurs-ip-sbar-handoff-clarity)
  { id: 'nurs-ip-shc-sc1', parentId: 'nurs-ip-sbar-handoff-clarity', title: 'Situation summary precision', description: 'States the current problem or reason for communication in one clear sentence.' },
  { id: 'nurs-ip-shc-sc2', parentId: 'nurs-ip-sbar-handoff-clarity', title: 'Background relevance filtering', description: 'Includes pertinent history while omitting unnecessary detail in handoffs.' },
  { id: 'nurs-ip-shc-sc3', parentId: 'nurs-ip-sbar-handoff-clarity', title: 'Assessment with clinical reasoning', description: 'Shares nursing assessment and interpretation, not just raw data.' },
  { id: 'nurs-ip-shc-sc4', parentId: 'nurs-ip-sbar-handoff-clarity', title: 'Recommendation specificity', description: 'Proposes a clear next step or request when communicating with providers.' },
  { id: 'nurs-ip-shc-sc5', parentId: 'nurs-ip-sbar-handoff-clarity', title: 'Bedside shift report execution', description: 'Conducts bedside handoff with patient involvement and safety verification.' },

  // Parent: Closed-Loop Communication (nurs-ip-closed-loop-communication)
  { id: 'nurs-ip-clc-sc1', parentId: 'nurs-ip-closed-loop-communication', title: 'Order read-back verification', description: 'Repeats verbal orders back to the prescriber to confirm accuracy.' },
  { id: 'nurs-ip-clc-sc2', parentId: 'nurs-ip-closed-loop-communication', title: 'Task acknowledgment confirmation', description: 'Confirms receipt and understanding of delegated tasks verbally.' },
  { id: 'nurs-ip-clc-sc3', parentId: 'nurs-ip-closed-loop-communication', title: 'Call-out during emergencies', description: 'Uses clear call-out communication during codes and rapid responses.' },
  { id: 'nurs-ip-clc-sc4', parentId: 'nurs-ip-closed-loop-communication', title: 'Completion reporting', description: 'Reports back when a requested action has been completed or cannot be done.' },
  { id: 'nurs-ip-clc-sc5', parentId: 'nurs-ip-closed-loop-communication', title: 'Clarification seeking', description: 'Asks for clarification when orders or instructions are ambiguous or unclear.' },

  // Parent: Team Role Awareness (nurs-ip-team-role-awareness)
  { id: 'nurs-ip-tra-sc1', parentId: 'nurs-ip-team-role-awareness', title: 'Scope of practice understanding', description: 'Knows what each team member can and cannot do within their licensure.' },
  { id: 'nurs-ip-tra-sc2', parentId: 'nurs-ip-team-role-awareness', title: 'Appropriate consultation initiation', description: 'Identifies which discipline to consult based on the clinical question.' },
  { id: 'nurs-ip-tra-sc3', parentId: 'nurs-ip-team-role-awareness', title: 'Delegation with supervision', description: 'Delegates tasks to UAPs with clear instructions and timely follow-up.' },
  { id: 'nurs-ip-tra-sc4', parentId: 'nurs-ip-team-role-awareness', title: 'Interdisciplinary rounding contribution', description: 'Provides concise, relevant nursing updates during interdisciplinary rounds.' },
  { id: 'nurs-ip-tra-sc5', parentId: 'nurs-ip-team-role-awareness', title: 'Resource nurse and charge utilization', description: 'Seeks guidance from charge nurses and resource nurses appropriately.' },

  // Parent: Conflict Management (nurs-ip-conflict-management)
  { id: 'nurs-ip-cm-sc1', parentId: 'nurs-ip-conflict-management', title: 'Early tension recognition', description: 'Identifies interpersonal or team tension before it escalates to conflict.' },
  { id: 'nurs-ip-cm-sc2', parentId: 'nurs-ip-conflict-management', title: 'Assertive communication', description: 'States concerns directly and respectfully using I-statements.' },
  { id: 'nurs-ip-cm-sc3', parentId: 'nurs-ip-conflict-management', title: 'Perspective-taking in disagreements', description: 'Considers the other person\'s viewpoint before responding in disputes.' },
  { id: 'nurs-ip-cm-sc4', parentId: 'nurs-ip-conflict-management', title: 'Solution-focused redirection', description: 'Steers conflict discussions toward patient-centered resolution options.' },
  { id: 'nurs-ip-cm-sc5', parentId: 'nurs-ip-conflict-management', title: 'Appropriate escalation of unresolved issues', description: 'Brings persistent conflicts to leadership when direct resolution fails.' },

  // Parent: Interprofessional Care Planning (nurs-ip-interprofessional-care-planning)
  { id: 'nurs-ip-icp-sc1', parentId: 'nurs-ip-interprofessional-care-planning', title: 'Nursing priority articulation', description: 'Communicates nursing-specific concerns clearly within the interdisciplinary plan.' },
  { id: 'nurs-ip-icp-sc2', parentId: 'nurs-ip-interprofessional-care-planning', title: 'Shared goal development', description: 'Collaborates with the team to set patient goals that reflect all disciplines.' },
  { id: 'nurs-ip-icp-sc3', parentId: 'nurs-ip-interprofessional-care-planning', title: 'Care plan update communication', description: 'Ensures all team members are informed when the care plan changes.' },
  { id: 'nurs-ip-icp-sc4', parentId: 'nurs-ip-interprofessional-care-planning', title: 'Discharge planning collaboration', description: 'Works with case management and therapy to coordinate safe discharge.' },
  { id: 'nurs-ip-icp-sc5', parentId: 'nurs-ip-interprofessional-care-planning', title: 'Patient voice integration in team plans', description: 'Ensures patient preferences are represented in interdisciplinary discussions.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Systems-Based Practice
  // ──────────────────────────────────────────────────────────────────

  // Parent: Workflow and Throughput Awareness (nurs-sbp-workflow-and-throughput-awareness)
  { id: 'nurs-sbp-wta-sc1', parentId: 'nurs-sbp-workflow-and-throughput-awareness', title: 'Shift organization and time management', description: 'Plans shift activities to balance competing demands and deadlines.' },
  { id: 'nurs-sbp-wta-sc2', parentId: 'nurs-sbp-workflow-and-throughput-awareness', title: 'Admission and discharge flow awareness', description: 'Anticipates bed turnover needs and prepares for incoming patients.' },
  { id: 'nurs-sbp-wta-sc3', parentId: 'nurs-sbp-workflow-and-throughput-awareness', title: 'Task batching and clustering', description: 'Groups tasks by location or timing to minimize unnecessary trips and delays.' },
  { id: 'nurs-sbp-wta-sc4', parentId: 'nurs-sbp-workflow-and-throughput-awareness', title: 'Bottleneck identification', description: 'Recognizes workflow delays and communicates them to the charge nurse.' },
  { id: 'nurs-sbp-wta-sc5', parentId: 'nurs-sbp-workflow-and-throughput-awareness', title: 'Flexibility in assignment changes', description: 'Adapts smoothly when patient assignments or unit needs shift mid-shift.' },

  // Parent: Policy and Protocol Adherence (nurs-sbp-policy-and-protocol-adherence)
  { id: 'nurs-sbp-ppa-sc1', parentId: 'nurs-sbp-policy-and-protocol-adherence', title: 'Protocol location and access', description: 'Knows where to find current policies and clinical protocols quickly.' },
  { id: 'nurs-sbp-ppa-sc2', parentId: 'nurs-sbp-policy-and-protocol-adherence', title: 'Order set and pathway compliance', description: 'Follows standardized order sets and clinical pathways as designed.' },
  { id: 'nurs-sbp-ppa-sc3', parentId: 'nurs-sbp-policy-and-protocol-adherence', title: 'Variance documentation', description: 'Documents and reports when clinical circumstances require protocol deviation.' },
  { id: 'nurs-sbp-ppa-sc4', parentId: 'nurs-sbp-policy-and-protocol-adherence', title: 'Regulatory awareness', description: 'Understands Joint Commission and CMS requirements relevant to daily practice.' },
  { id: 'nurs-sbp-ppa-sc5', parentId: 'nurs-sbp-policy-and-protocol-adherence', title: 'Policy change adaptation', description: 'Adjusts practice promptly when new policies or protocols are implemented.' },

  // Parent: Escalation and Chain of Command (nurs-sbp-escalation-and-chain-of-command)
  { id: 'nurs-sbp-ecc-sc1', parentId: 'nurs-sbp-escalation-and-chain-of-command', title: 'Escalation threshold recognition', description: 'Identifies situations that require notification beyond the primary provider.' },
  { id: 'nurs-sbp-ecc-sc2', parentId: 'nurs-sbp-escalation-and-chain-of-command', title: 'Rapid response activation', description: 'Activates rapid response or code teams when clinical criteria are met.' },
  { id: 'nurs-sbp-ecc-sc3', parentId: 'nurs-sbp-escalation-and-chain-of-command', title: 'Chain of command utilization', description: 'Escalates through charge nurse, supervisor, and administration when needed.' },
  { id: 'nurs-sbp-ecc-sc4', parentId: 'nurs-sbp-escalation-and-chain-of-command', title: 'Documentation of escalation events', description: 'Records escalation attempts, responses, and outcomes in the medical record.' },
  { id: 'nurs-sbp-ecc-sc5', parentId: 'nurs-sbp-escalation-and-chain-of-command', title: 'Assertive advocacy in escalation', description: 'Persists in escalation when initial responses do not address patient safety.' },

  // Parent: Resource Stewardship (nurs-sbp-resource-stewardship)
  { id: 'nurs-sbp-rs-sc1', parentId: 'nurs-sbp-resource-stewardship', title: 'Supply and equipment conservation', description: 'Uses supplies appropriately and avoids unnecessary waste of materials.' },
  { id: 'nurs-sbp-rs-sc2', parentId: 'nurs-sbp-resource-stewardship', title: 'Diagnostic test appropriateness', description: 'Questions redundant or unnecessary diagnostic orders when appropriate.' },
  { id: 'nurs-sbp-rs-sc3', parentId: 'nurs-sbp-resource-stewardship', title: 'Staffing resource awareness', description: 'Recognizes staffing constraints and adjusts workflow to maintain safety.' },
  { id: 'nurs-sbp-rs-sc4', parentId: 'nurs-sbp-resource-stewardship', title: 'Cost-conscious care decisions', description: 'Considers cost implications when equivalent care options exist.' },
  { id: 'nurs-sbp-rs-sc5', parentId: 'nurs-sbp-resource-stewardship', title: 'Equipment maintenance reporting', description: 'Reports malfunctioning equipment promptly and removes it from service.' },

  // Parent: Documentation for Continuity (nurs-sbp-documentation-for-continuity)
  { id: 'nurs-sbp-dfc-sc1', parentId: 'nurs-sbp-documentation-for-continuity', title: 'Real-time documentation practice', description: 'Documents assessments and interventions close to the time they occur.' },
  { id: 'nurs-sbp-dfc-sc2', parentId: 'nurs-sbp-documentation-for-continuity', title: 'Problem-focused narrative clarity', description: 'Writes narrative notes that clearly describe the clinical situation and response.' },
  { id: 'nurs-sbp-dfc-sc3', parentId: 'nurs-sbp-documentation-for-continuity', title: 'Care plan currency', description: 'Updates care plans to reflect current problems, goals, and interventions.' },
  { id: 'nurs-sbp-dfc-sc4', parentId: 'nurs-sbp-documentation-for-continuity', title: 'Pending action documentation', description: 'Records outstanding tasks and follow-up items for the next shift.' },
  { id: 'nurs-sbp-dfc-sc5', parentId: 'nurs-sbp-documentation-for-continuity', title: 'Legal and regulatory documentation standards', description: 'Meets legal standards for timing, accuracy, and completeness of records.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Informatics and Healthcare Technologies
  // ──────────────────────────────────────────────────────────────────

  // Parent: EHR Documentation Quality (nurs-inf-ehr-documentation-quality)
  { id: 'nurs-inf-edq-sc1', parentId: 'nurs-inf-ehr-documentation-quality', title: 'Flowsheet accuracy and completeness', description: 'Enters vital signs, I&Os, and assessments into correct flowsheet fields.' },
  { id: 'nurs-inf-edq-sc2', parentId: 'nurs-inf-ehr-documentation-quality', title: 'Note template effective use', description: 'Uses EHR templates efficiently while adding individualized patient details.' },
  { id: 'nurs-inf-edq-sc3', parentId: 'nurs-inf-ehr-documentation-quality', title: 'Copy-forward error prevention', description: 'Reviews and updates auto-populated fields to prevent documentation errors.' },
  { id: 'nurs-inf-edq-sc4', parentId: 'nurs-inf-ehr-documentation-quality', title: 'Interdisciplinary communication via EHR', description: 'Uses messaging and task features to communicate with the care team.' },
  { id: 'nurs-inf-edq-sc5', parentId: 'nurs-inf-ehr-documentation-quality', title: 'Documentation timeliness', description: 'Completes charting within institutional timeframes to support care decisions.' },

  // Parent: Data Trend Recognition (nurs-inf-data-trend-recognition)
  { id: 'nurs-inf-dtr-sc1', parentId: 'nurs-inf-data-trend-recognition', title: 'Vital sign trend interpretation', description: 'Identifies meaningful changes in vital sign patterns over hours or days.' },
  { id: 'nurs-inf-dtr-sc2', parentId: 'nurs-inf-data-trend-recognition', title: 'Intake and output pattern analysis', description: 'Monitors fluid balance trends to detect overload or dehydration early.' },
  { id: 'nurs-inf-dtr-sc3', parentId: 'nurs-inf-data-trend-recognition', title: 'Pain and symptom trajectory tracking', description: 'Tracks symptom scores over time to evaluate intervention effectiveness.' },
  { id: 'nurs-inf-dtr-sc4', parentId: 'nurs-inf-data-trend-recognition', title: 'Early warning score interpretation', description: 'Uses NEWS, MEWS, or similar scores to identify deterioration trends.' },
  { id: 'nurs-inf-dtr-sc5', parentId: 'nurs-inf-data-trend-recognition', title: 'Graph and dashboard utilization', description: 'Uses EHR graphs and dashboards to visualize patient data trends.' },

  // Parent: Clinical Decision Support Use (nurs-inf-clinical-decision-support-use)
  { id: 'nurs-inf-cdsu-sc1', parentId: 'nurs-inf-clinical-decision-support-use', title: 'Alert triage and response', description: 'Evaluates CDS alerts critically rather than overriding them reflexively.' },
  { id: 'nurs-inf-cdsu-sc2', parentId: 'nurs-inf-clinical-decision-support-use', title: 'Order entry safety check use', description: 'Reviews system-generated safety checks during medication and order entry.' },
  { id: 'nurs-inf-cdsu-sc3', parentId: 'nurs-inf-clinical-decision-support-use', title: 'Drug reference tool navigation', description: 'Uses built-in drug databases to verify dosing, interactions, and monitoring.' },
  { id: 'nurs-inf-cdsu-sc4', parentId: 'nurs-inf-clinical-decision-support-use', title: 'Protocol-driven order set selection', description: 'Selects appropriate order sets based on clinical decision support guidance.' },
  { id: 'nurs-inf-cdsu-sc5', parentId: 'nurs-inf-clinical-decision-support-use', title: 'Alert fatigue awareness', description: 'Recognizes personal alert fatigue patterns and takes steps to stay vigilant.' },

  // Parent: Digital Professional Communication (nurs-inf-digital-professional-communication)
  { id: 'nurs-inf-dpc-sc1', parentId: 'nurs-inf-digital-professional-communication', title: 'Secure messaging etiquette', description: 'Sends clear, concise, and professional messages through secure platforms.' },
  { id: 'nurs-inf-dpc-sc2', parentId: 'nurs-inf-digital-professional-communication', title: 'Timely message response', description: 'Monitors and responds to clinical messages within expected timeframes.' },
  { id: 'nurs-inf-dpc-sc3', parentId: 'nurs-inf-digital-professional-communication', title: 'Appropriate channel selection', description: 'Chooses the right communication method based on urgency and content type.' },
  { id: 'nurs-inf-dpc-sc4', parentId: 'nurs-inf-digital-professional-communication', title: 'Telehealth communication skills', description: 'Communicates effectively with patients through video and phone encounters.' },
  { id: 'nurs-inf-dpc-sc5', parentId: 'nurs-inf-digital-professional-communication', title: 'Professional social media boundaries', description: 'Maintains professional standards in online presence and social media use.' },

  // Parent: Information Privacy and Security (nurs-inf-information-privacy-security)
  { id: 'nurs-inf-ips-sc1', parentId: 'nurs-inf-information-privacy-security', title: 'HIPAA compliance in daily practice', description: 'Protects PHI in conversations, screens, and printed materials consistently.' },
  { id: 'nurs-inf-ips-sc2', parentId: 'nurs-inf-information-privacy-security', title: 'Access control adherence', description: 'Logs out of systems, does not share passwords, and uses role-based access.' },
  { id: 'nurs-inf-ips-sc3', parentId: 'nurs-inf-information-privacy-security', title: 'Minimum necessary information sharing', description: 'Shares only the information needed for the clinical purpose at hand.' },
  { id: 'nurs-inf-ips-sc4', parentId: 'nurs-inf-information-privacy-security', title: 'Breach recognition and reporting', description: 'Identifies potential privacy breaches and reports them through proper channels.' },
  { id: 'nurs-inf-ips-sc5', parentId: 'nurs-inf-information-privacy-security', title: 'Device and data security practices', description: 'Follows policies for mobile devices, USB drives, and portable media.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Professionalism
  // ──────────────────────────────────────────────────────────────────

  // Parent: Ethical Practice Judgment (nurs-pro-ethical-practice-judgment)
  { id: 'nurs-pro-epj-sc1', parentId: 'nurs-pro-ethical-practice-judgment', title: 'Ethical dilemma recognition', description: 'Identifies situations where competing values create ethical tension.' },
  { id: 'nurs-pro-epj-sc2', parentId: 'nurs-pro-ethical-practice-judgment', title: 'ANA Code of Ethics application', description: 'References nursing ethical principles when making care decisions.' },
  { id: 'nurs-pro-epj-sc3', parentId: 'nurs-pro-ethical-practice-judgment', title: 'Informed consent verification', description: 'Ensures patients understand procedures and voluntarily consent before care.' },
  { id: 'nurs-pro-epj-sc4', parentId: 'nurs-pro-ethical-practice-judgment', title: 'End-of-life ethical navigation', description: 'Supports ethical decision-making around withdrawal of care and comfort measures.' },
  { id: 'nurs-pro-epj-sc5', parentId: 'nurs-pro-ethical-practice-judgment', title: 'Ethics consultation initiation', description: 'Requests ethics committee involvement when dilemmas cannot be resolved at bedside.' },

  // Parent: Accountability and Follow-Through (nurs-pro-accountability-and-follow-through)
  { id: 'nurs-pro-aft-sc1', parentId: 'nurs-pro-accountability-and-follow-through', title: 'Task ownership and completion', description: 'Takes responsibility for assigned tasks and completes them reliably.' },
  { id: 'nurs-pro-aft-sc2', parentId: 'nurs-pro-accountability-and-follow-through', title: 'Error disclosure and transparency', description: 'Reports own errors honestly and participates in corrective actions.' },
  { id: 'nurs-pro-aft-sc3', parentId: 'nurs-pro-accountability-and-follow-through', title: 'Follow-up loop closure', description: 'Tracks pending items and confirms they are resolved before end of shift.' },
  { id: 'nurs-pro-aft-sc4', parentId: 'nurs-pro-accountability-and-follow-through', title: 'Punctuality and reliability', description: 'Arrives on time, prepared, and ready to receive handoff consistently.' },
  { id: 'nurs-pro-aft-sc5', parentId: 'nurs-pro-accountability-and-follow-through', title: 'Outcome ownership', description: 'Evaluates results of own interventions and adjusts approach when needed.' },

  // Parent: Boundaries and Therapeutic Use of Self (nurs-pro-boundaries-and-therapeutic-use-of-self)
  { id: 'nurs-pro-btus-sc1', parentId: 'nurs-pro-boundaries-and-therapeutic-use-of-self', title: 'Professional boundary maintenance', description: 'Recognizes and avoids boundary crossings in nurse-patient relationships.' },
  { id: 'nurs-pro-btus-sc2', parentId: 'nurs-pro-boundaries-and-therapeutic-use-of-self', title: 'Appropriate self-disclosure', description: 'Shares personal information only when it serves the patient\'s therapeutic needs.' },
  { id: 'nurs-pro-btus-sc3', parentId: 'nurs-pro-boundaries-and-therapeutic-use-of-self', title: 'Gift and social media boundaries', description: 'Declines gifts and social connections that could compromise objectivity.' },
  { id: 'nurs-pro-btus-sc4', parentId: 'nurs-pro-boundaries-and-therapeutic-use-of-self', title: 'Therapeutic presence', description: 'Uses calm, focused presence to create safety and trust in care interactions.' },
  { id: 'nurs-pro-btus-sc5', parentId: 'nurs-pro-boundaries-and-therapeutic-use-of-self', title: 'Countertransference awareness', description: 'Recognizes personal emotional reactions that may affect clinical objectivity.' },

  // Parent: Advocacy for Patient Needs (nurs-pro-advocacy-for-patient-needs)
  { id: 'nurs-pro-apn-sc1', parentId: 'nurs-pro-advocacy-for-patient-needs', title: 'Speaking up for patient safety', description: 'Voices concerns when care decisions may compromise patient well-being.' },
  { id: 'nurs-pro-apn-sc2', parentId: 'nurs-pro-advocacy-for-patient-needs', title: 'Access barrier removal', description: 'Identifies and works to remove barriers to care, services, or information.' },
  { id: 'nurs-pro-apn-sc3', parentId: 'nurs-pro-advocacy-for-patient-needs', title: 'Patient rights protection', description: 'Ensures patients are informed of their rights and those rights are respected.' },
  { id: 'nurs-pro-apn-sc4', parentId: 'nurs-pro-advocacy-for-patient-needs', title: 'Vulnerable population advocacy', description: 'Provides extra vigilance and support for patients who cannot self-advocate.' },
  { id: 'nurs-pro-apn-sc5', parentId: 'nurs-pro-advocacy-for-patient-needs', title: 'System-level advocacy participation', description: 'Engages in unit or institutional efforts to improve care for patient groups.' },

  // Parent: Inclusive and Respectful Practice (nurs-pro-inclusive-and-respectful-practice)
  { id: 'nurs-pro-irp-sc1', parentId: 'nurs-pro-inclusive-and-respectful-practice', title: 'Pronoun and identity respect', description: 'Uses preferred names and pronouns consistently for all patients.' },
  { id: 'nurs-pro-irp-sc2', parentId: 'nurs-pro-inclusive-and-respectful-practice', title: 'Non-judgmental care delivery', description: 'Provides equitable care regardless of patient lifestyle or choices.' },
  { id: 'nurs-pro-irp-sc3', parentId: 'nurs-pro-inclusive-and-respectful-practice', title: 'Microaggression awareness', description: 'Recognizes subtle discriminatory behaviors and works to eliminate them.' },
  { id: 'nurs-pro-irp-sc4', parentId: 'nurs-pro-inclusive-and-respectful-practice', title: 'Dignity preservation in vulnerable moments', description: 'Maintains patient dignity during exams, hygiene, and sensitive procedures.' },
  { id: 'nurs-pro-irp-sc5', parentId: 'nurs-pro-inclusive-and-respectful-practice', title: 'Colleague respect and civility', description: 'Treats all team members with professionalism regardless of role or level.' },

  // ──────────────────────────────────────────────────────────────────
  // Domain: Personal, Professional, and Leadership Development
  // ──────────────────────────────────────────────────────────────────

  // Parent: Self-Assessment Accuracy (nurs-lpd-self-assessment-accuracy)
  { id: 'nurs-lpd-saa-sc1', parentId: 'nurs-lpd-self-assessment-accuracy', title: 'Strength identification with evidence', description: 'Names specific clinical strengths supported by concrete examples.' },
  { id: 'nurs-lpd-saa-sc2', parentId: 'nurs-lpd-self-assessment-accuracy', title: 'Gap acknowledgment without defensiveness', description: 'Identifies areas for growth honestly and without minimizing.' },
  { id: 'nurs-lpd-saa-sc3', parentId: 'nurs-lpd-self-assessment-accuracy', title: 'Self-assessment calibration', description: 'Compares self-ratings with preceptor and peer evaluations for accuracy.' },
  { id: 'nurs-lpd-saa-sc4', parentId: 'nurs-lpd-self-assessment-accuracy', title: 'Competence vs confidence distinction', description: 'Differentiates feeling confident from demonstrating verified competence.' },
  { id: 'nurs-lpd-saa-sc5', parentId: 'nurs-lpd-self-assessment-accuracy', title: 'Developmental trajectory awareness', description: 'Understands where they are on the novice-to-expert continuum.' },

  // Parent: Resilience and Stress Management (nurs-lpd-resilience-and-stress-management)
  { id: 'nurs-lpd-rsm-sc1', parentId: 'nurs-lpd-resilience-and-stress-management', title: 'Stress signal recognition', description: 'Identifies personal physical and emotional signs of accumulating stress.' },
  { id: 'nurs-lpd-rsm-sc2', parentId: 'nurs-lpd-resilience-and-stress-management', title: 'Coping strategy repertoire', description: 'Uses multiple healthy coping methods such as exercise, debriefing, or mindfulness.' },
  { id: 'nurs-lpd-rsm-sc3', parentId: 'nurs-lpd-resilience-and-stress-management', title: 'Work-life boundary setting', description: 'Maintains boundaries between clinical work and personal recovery time.' },
  { id: 'nurs-lpd-rsm-sc4', parentId: 'nurs-lpd-resilience-and-stress-management', title: 'Peer support engagement', description: 'Seeks and offers peer support after difficult clinical experiences.' },
  { id: 'nurs-lpd-rsm-sc5', parentId: 'nurs-lpd-resilience-and-stress-management', title: 'Professional help-seeking', description: 'Accesses EAP or counseling resources when stress exceeds personal coping.' },

  // Parent: Feedback Integration (nurs-lpd-feedback-integration)
  { id: 'nurs-lpd-fi-sc1', parentId: 'nurs-lpd-feedback-integration', title: 'Feedback receptivity', description: 'Receives constructive feedback without defensiveness or dismissal.' },
  { id: 'nurs-lpd-fi-sc2', parentId: 'nurs-lpd-feedback-integration', title: 'Feedback-to-action translation', description: 'Converts specific feedback into observable behavior changes in practice.' },
  { id: 'nurs-lpd-fi-sc3', parentId: 'nurs-lpd-feedback-integration', title: 'Proactive feedback seeking', description: 'Asks preceptors and peers for specific feedback on targeted skills.' },
  { id: 'nurs-lpd-fi-sc4', parentId: 'nurs-lpd-feedback-integration', title: 'Pattern identification across feedback', description: 'Identifies recurring themes across multiple feedback sources.' },
  { id: 'nurs-lpd-fi-sc5', parentId: 'nurs-lpd-feedback-integration', title: 'Progress demonstration after feedback', description: 'Shows measurable improvement in areas previously identified for growth.' },

  // Parent: Leadership in Micro-Moments (nurs-lpd-leadership-in-micro-moments)
  { id: 'nurs-lpd-lmm-sc1', parentId: 'nurs-lpd-leadership-in-micro-moments', title: 'Initiative in ambiguous situations', description: 'Steps forward to organize care when no clear leader is present.' },
  { id: 'nurs-lpd-lmm-sc2', parentId: 'nurs-lpd-leadership-in-micro-moments', title: 'Calm presence during urgency', description: 'Maintains composure and clear communication during emergent situations.' },
  { id: 'nurs-lpd-lmm-sc3', parentId: 'nurs-lpd-leadership-in-micro-moments', title: 'Peer mentoring and teaching', description: 'Shares knowledge with newer staff or students in supportive ways.' },
  { id: 'nurs-lpd-lmm-sc4', parentId: 'nurs-lpd-leadership-in-micro-moments', title: 'Positive unit culture contribution', description: 'Models professionalism and teamwork that elevates unit morale.' },
  { id: 'nurs-lpd-lmm-sc5', parentId: 'nurs-lpd-leadership-in-micro-moments', title: 'Followership and team support', description: 'Supports team leaders effectively and contributes without needing control.' },

  // Parent: Career Readiness Planning (nurs-lpd-career-readiness-planning)
  { id: 'nurs-lpd-crp-sc1', parentId: 'nurs-lpd-career-readiness-planning', title: 'Specialty interest exploration', description: 'Investigates clinical specialties through shadowing, reading, and mentorship.' },
  { id: 'nurs-lpd-crp-sc2', parentId: 'nurs-lpd-career-readiness-planning', title: 'Certification pathway awareness', description: 'Identifies relevant certifications and their requirements for career goals.' },
  { id: 'nurs-lpd-crp-sc3', parentId: 'nurs-lpd-career-readiness-planning', title: 'Professional portfolio development', description: 'Maintains a portfolio of clinical achievements, reflections, and evaluations.' },
  { id: 'nurs-lpd-crp-sc4', parentId: 'nurs-lpd-career-readiness-planning', title: 'Professional organization engagement', description: 'Participates in nursing organizations for networking and development.' },
  { id: 'nurs-lpd-crp-sc5', parentId: 'nurs-lpd-career-readiness-planning', title: 'Continuing education planning', description: 'Plans ongoing learning aligned with career trajectory and competency gaps.' },
];
