export const NURSING_CORE_V1_CATALOG_ID = 'nursing-core-v1' as const;

export const NURSING_AACN_DOMAINS = [
  {id: 'knowledge-for-nursing-practice', title: 'Knowledge for Nursing Practice'},
  {id: 'person-centered-care', title: 'Person-Centered Care'},
  {id: 'population-health', title: 'Population Health'},
  {id: 'scholarship-for-the-nursing-discipline', title: 'Scholarship for the Nursing Discipline'},
  {id: 'quality-and-safety', title: 'Quality and Safety'},
  {id: 'interprofessional-partnerships', title: 'Interprofessional Partnerships'},
  {id: 'systems-based-practice', title: 'Systems-Based Practice'},
  {id: 'informatics-and-healthcare-technologies', title: 'Informatics and Healthcare Technologies'},
  {id: 'professionalism', title: 'Professionalism'},
  {id: 'personal-professional-and-leadership-development', title: 'Personal, Professional, and Leadership Development'},
] as const;

export type NursingAacnDomainId = typeof NURSING_AACN_DOMAINS[number]['id'];

export type NursingCoreV1Capability = {
  id: string;
  domain: NursingAacnDomainId;
  title: string;
  shortDescription: string;
};

export const NURSING_CORE_V1_CAPABILITIES: NursingCoreV1Capability[] = [
  {id: 'nurs-kp-clinical-reasoning-foundations', domain: 'knowledge-for-nursing-practice', title: 'Clinical Reasoning Foundations', shortDescription: 'Integrates pathophysiology, pharmacology, and assessment data to explain decisions.'},
  {id: 'nurs-kp-prioritization-frameworks', domain: 'knowledge-for-nursing-practice', title: 'Prioritization Frameworks', shortDescription: 'Applies ABCs, urgency, and risk to rank nursing actions in complex shifts.'},
  {id: 'nurs-kp-medication-knowledge-application', domain: 'knowledge-for-nursing-practice', title: 'Medication Knowledge Application', shortDescription: 'Links medication purpose, mechanisms, and monitoring to individualized care.'},
  {id: 'nurs-kp-lab-and-diagnostic-interpretation', domain: 'knowledge-for-nursing-practice', title: 'Lab and Diagnostic Interpretation', shortDescription: 'Interprets key trends and connects results to patient condition and next steps.'},
  {id: 'nurs-kp-evidence-to-bedside-linkage', domain: 'knowledge-for-nursing-practice', title: 'Evidence-to-Bedside Linkage', shortDescription: 'Uses current guidance to justify bedside interventions and adaptations.'},
  {id: 'nurs-pcc-therapeutic-communication', domain: 'person-centered-care', title: 'Therapeutic Communication', shortDescription: 'Builds trust through respectful, empathetic, and clear patient-centered communication.'},
  {id: 'nurs-pcc-shared-decision-support', domain: 'person-centered-care', title: 'Shared Decision Support', shortDescription: 'Supports informed choices by aligning care plans with patient goals and values.'},
  {id: 'nurs-pcc-teach-back-education', domain: 'person-centered-care', title: 'Teach-Back Education', shortDescription: 'Uses teach-back to confirm understanding of medications, plans, and warning signs.'},
  {id: 'nurs-pcc-cultural-humility-in-care', domain: 'person-centered-care', title: 'Cultural Humility in Care', shortDescription: 'Adapts communication and interventions to cultural, linguistic, and social context.'},
  {id: 'nurs-pcc-family-care-partnership', domain: 'person-centered-care', title: 'Family Care Partnership', shortDescription: 'Engages families and support persons appropriately while protecting autonomy.'},
  {id: 'nurs-ph-risk-screening-and-referral', domain: 'population-health', title: 'Risk Screening and Referral', shortDescription: 'Identifies social and clinical risks and initiates timely referral pathways.'},
  {id: 'nurs-ph-health-equity-awareness', domain: 'population-health', title: 'Health Equity Awareness', shortDescription: 'Recognizes inequities and adjusts care coordination to reduce access barriers.'},
  {id: 'nurs-ph-prevention-and-health-promotion', domain: 'population-health', title: 'Prevention and Health Promotion', shortDescription: 'Integrates prevention counseling and health promotion in routine encounters.'},
  {id: 'nurs-ph-transition-of-care-planning', domain: 'population-health', title: 'Transition of Care Planning', shortDescription: 'Coordinates discharge readiness, follow-up, and continuity across settings.'},
  {id: 'nurs-ph-community-resource-navigation', domain: 'population-health', title: 'Community Resource Navigation', shortDescription: 'Connects patients with community supports aligned to needs and preferences.'},
  {id: 'nurs-sch-clinical-question-formulation', domain: 'scholarship-for-the-nursing-discipline', title: 'Clinical Question Formulation', shortDescription: 'Frames focused questions to guide evidence searches and practice improvement.'},
  {id: 'nurs-sch-evidence-appraisal-basics', domain: 'scholarship-for-the-nursing-discipline', title: 'Evidence Appraisal Basics', shortDescription: 'Appraises source quality, relevance, and limitations before applying findings.'},
  {id: 'nurs-sch-reflective-practice-depth', domain: 'scholarship-for-the-nursing-discipline', title: 'Reflective Practice Depth', shortDescription: 'Uses structured reflection to identify insight, patterns, and improvement goals.'},
  {id: 'nurs-sch-learning-goal-planning', domain: 'scholarship-for-the-nursing-discipline', title: 'Learning Goal Planning', shortDescription: 'Sets specific learning goals and tracks progress through documented evidence.'},
  {id: 'nurs-sch-practice-change-rationale', domain: 'scholarship-for-the-nursing-discipline', title: 'Practice Change Rationale', shortDescription: 'Proposes care adjustments grounded in reflection and evidence.'},
  {id: 'nurs-qs-patient-safety-vigilance', domain: 'quality-and-safety', title: 'Patient Safety Vigilance', shortDescription: 'Anticipates harm risks and uses safety checks consistently in care delivery.'},
  {id: 'nurs-qs-medication-safety-practices', domain: 'quality-and-safety', title: 'Medication Safety Practices', shortDescription: 'Applies rights, double-checks, and monitoring to reduce medication errors.'},
  {id: 'nurs-qs-infection-prevention-consistency', domain: 'quality-and-safety', title: 'Infection Prevention Consistency', shortDescription: 'Demonstrates reliable aseptic and isolation practices in varied scenarios.'},
  {id: 'nurs-qs-near-miss-reporting', domain: 'quality-and-safety', title: 'Near-Miss Reporting', shortDescription: 'Reports and analyzes near misses to strengthen system learning and prevention.'},
  {id: 'nurs-qs-improvement-cycle-participation', domain: 'quality-and-safety', title: 'Improvement Cycle Participation', shortDescription: 'Contributes to PDSA-style improvement work with measurable outcomes.'},
  {id: 'nurs-ip-sbar-handoff-clarity', domain: 'interprofessional-partnerships', title: 'SBAR Handoff Clarity', shortDescription: 'Delivers concise handoffs with key risks, priorities, and pending actions.'},
  {id: 'nurs-ip-closed-loop-communication', domain: 'interprofessional-partnerships', title: 'Closed-Loop Communication', shortDescription: 'Uses confirmation and read-back behaviors to reduce team communication errors.'},
  {id: 'nurs-ip-team-role-awareness', domain: 'interprofessional-partnerships', title: 'Team Role Awareness', shortDescription: 'Identifies team member roles and escalates issues through proper channels.'},
  {id: 'nurs-ip-conflict-management', domain: 'interprofessional-partnerships', title: 'Conflict Management', shortDescription: 'Handles disagreement professionally while maintaining patient-centered focus.'},
  {id: 'nurs-ip-interprofessional-care-planning', domain: 'interprofessional-partnerships', title: 'Interprofessional Care Planning', shortDescription: 'Coordinates plans with nursing, medicine, therapy, and support services.'},
  {id: 'nurs-sbp-workflow-and-throughput-awareness', domain: 'systems-based-practice', title: 'Workflow and Throughput Awareness', shortDescription: 'Balances patient needs with unit workflow, task timing, and resource limits.'},
  {id: 'nurs-sbp-policy-and-protocol-adherence', domain: 'systems-based-practice', title: 'Policy and Protocol Adherence', shortDescription: 'Applies institutional standards while identifying when escalation is needed.'},
  {id: 'nurs-sbp-escalation-and-chain-of-command', domain: 'systems-based-practice', title: 'Escalation and Chain of Command', shortDescription: 'Escalates concerns promptly using clear rationale and documented context.'},
  {id: 'nurs-sbp-resource-stewardship', domain: 'systems-based-practice', title: 'Resource Stewardship', shortDescription: 'Uses supplies, diagnostics, and consultations responsibly and effectively.'},
  {id: 'nurs-sbp-documentation-for-continuity', domain: 'systems-based-practice', title: 'Documentation for Continuity', shortDescription: 'Documents clearly so plans are actionable for the next care team.'},
  {id: 'nurs-inf-ehr-documentation-quality', domain: 'informatics-and-healthcare-technologies', title: 'EHR Documentation Quality', shortDescription: 'Produces accurate, timely, and organized EHR documentation for safe care.'},
  {id: 'nurs-inf-data-trend-recognition', domain: 'informatics-and-healthcare-technologies', title: 'Data Trend Recognition', shortDescription: 'Uses flowsheets and monitoring data to recognize change early.'},
  {id: 'nurs-inf-clinical-decision-support-use', domain: 'informatics-and-healthcare-technologies', title: 'Clinical Decision Support Use', shortDescription: 'Uses alerts and order support appropriately without alert fatigue shortcuts.'},
  {id: 'nurs-inf-digital-professional-communication', domain: 'informatics-and-healthcare-technologies', title: 'Digital Professional Communication', shortDescription: 'Communicates in secure systems with clarity, timeliness, and professionalism.'},
  {id: 'nurs-inf-information-privacy-security', domain: 'informatics-and-healthcare-technologies', title: 'Information Privacy and Security', shortDescription: 'Protects patient privacy and follows secure handling of sensitive data.'},
  {id: 'nurs-pro-ethical-practice-judgment', domain: 'professionalism', title: 'Ethical Practice Judgment', shortDescription: 'Identifies ethical tensions and chooses actions aligned with nursing ethics.'},
  {id: 'nurs-pro-accountability-and-follow-through', domain: 'professionalism', title: 'Accountability and Follow-Through', shortDescription: 'Owns tasks, closes loops, and documents outcomes reliably.'},
  {id: 'nurs-pro-boundaries-and-therapeutic-use-of-self', domain: 'professionalism', title: 'Boundaries and Therapeutic Use of Self', shortDescription: 'Maintains professional boundaries while preserving therapeutic presence.'},
  {id: 'nurs-pro-advocacy-for-patient-needs', domain: 'professionalism', title: 'Advocacy for Patient Needs', shortDescription: 'Advocates for safety, dignity, and access when barriers affect care.'},
  {id: 'nurs-pro-inclusive-and-respectful-practice', domain: 'professionalism', title: 'Inclusive and Respectful Practice', shortDescription: 'Demonstrates respectful, non-discriminatory behaviors across care contexts.'},
  {id: 'nurs-lpd-self-assessment-accuracy', domain: 'personal-professional-and-leadership-development', title: 'Self-Assessment Accuracy', shortDescription: 'Evaluates strengths and gaps realistically using evidence from practice.'},
  {id: 'nurs-lpd-resilience-and-stress-management', domain: 'personal-professional-and-leadership-development', title: 'Resilience and Stress Management', shortDescription: 'Uses coping and recovery routines to sustain safe performance.'},
  {id: 'nurs-lpd-feedback-integration', domain: 'personal-professional-and-leadership-development', title: 'Feedback Integration', shortDescription: 'Incorporates preceptor and peer feedback into measurable behavior changes.'},
  {id: 'nurs-lpd-leadership-in-micro-moments', domain: 'personal-professional-and-leadership-development', title: 'Leadership in Micro-Moments', shortDescription: 'Shows initiative and calm coordination during routine and urgent events.'},
  {id: 'nurs-lpd-career-readiness-planning', domain: 'personal-professional-and-leadership-development', title: 'Career Readiness Planning', shortDescription: 'Builds a documented progression plan for advanced responsibility and roles.'},
];
