// Sample data for the explorable data browser landing pages

export interface SampleTimelineStep {
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  detail?: string;
}

export interface SamplePersonalInterest {
  interestSlug: string;
  role?: string;
  timeline: SampleTimelineStep[];
}

export interface SamplePerson {
  name: string;
  role: string;
  timeline: SampleTimelineStep[];
  userId?: string;
  personalInterests?: SamplePersonalInterest[];
}

export interface SampleGroup {
  name: string;
  groupLabel?: string;
  people: SamplePerson[];
  subgroups?: SampleGroup[];
  fleetId?: string;
}

export interface SampleCapabilityGoal {
  name: string;
  people: SamplePerson[];
}

export interface SampleCohort {
  name: string;
  people: SamplePerson[];
}

export interface SampleOrganization {
  slug: string;
  name: string;
  groupLabel: string;
  groups: SampleGroup[];
  cohorts?: SampleCohort[];
  capabilityGoals?: SampleCapabilityGoal[];
}

export interface SampleProgram {
  slug: string;
  name: string;
  type: 'degree' | 'certification' | 'course' | 'training' | 'residency' | 'fellowship';
  description?: string;
  offeredBy: Array<{ orgSlug: string; role: string }>;
  samplePeople: SamplePerson[];
}

export interface SampleAffiliation {
  name: string;
  orgSlugs: string[];
}

export interface SampleInterest {
  slug: string;
  name: string;
  color: string;
  icon: string;
  organizations: SampleOrganization[];
  programs?: SampleProgram[];
  affiliations?: SampleAffiliation[];
  independentPractitioners?: SamplePerson[];
}

// Helper to build timelines quickly
function steps(labels: string[], currentIndex: number, details?: string[]): SampleTimelineStep[] {
  return labels.map((label, i) => ({
    label,
    status: i < currentIndex ? 'completed' : i === currentIndex ? 'current' : 'upcoming',
    detail: details?.[i],
  }));
}

// ── Nursing detail sets (based on real JHU curriculum) ──────────────

// MSN Entry into Nursing — JHU's pre-licensure pathway (5 semesters, 1000+ clinical hours)
const MSN_ENTRY_DETAILS = [
  'Health assessment foundations, nursing fundamentals, patient safety, simulation lab orientation',
  'Adult health nursing, medication administration, wound care, IV therapy, clinical rotations at JH Hospital',
  'Pediatric assessment, family-centered care, developmental milestones, clinical at Kennedy Krieger Institute',
  'Maternal-newborn care, prenatal assessment, labor & delivery, postpartum — clinical at JH Bayview',
  'Critical care nursing, ventilator management, hemodynamic monitoring, code response, ICU rotations',
  'Psychiatric & behavioral health nursing, therapeutic communication — clinical at MedStar Harbor',
  'Capstone clinical immersion integrating all competencies, NCLEX preparation, 95% pass rate',
];

// DNP Family NP track
const DNP_FNP_DETAILS = [
  'Advanced pathophysiology across the lifespan, cellular mechanisms, immune response',
  'Advanced pharmacology — prescribing guidelines, drug interactions, pharmacokinetics',
  'Comprehensive health assessment, differential diagnosis, clinical reasoning',
  'Evidence-based practice, quality improvement methods, translational research',
  'Primary care clinical practicum I — 200+ hours with preceptor, common presentations',
  'Primary care clinical practicum II — complex patients, chronic disease management',
  'DNP scholarly project — practice change implementation and outcomes evaluation',
];

// DNP PMHNP track
const DNP_PMHNP_DETAILS = [
  'Advanced psychopathology, neuroscience of mental illness, diagnostic frameworks',
  'Psychopharmacology — SSRIs, mood stabilizers, antipsychotics, medication management',
  'Therapeutic modalities — CBT, DBT, motivational interviewing, crisis intervention',
  'Psychiatric assessment across the lifespan, standardized screening tools',
  'Psychiatric clinical practicum I — outpatient behavioral health settings',
  'Psychiatric clinical practicum II — inpatient & crisis settings, complex cases',
  'DNP scholarly project focused on mental health outcomes or access improvement',
];

// Healthcare Organizational Leadership MSN
const HOL_DETAILS = [
  'Healthcare systems, organizational theory, nursing leadership frameworks',
  'Financial management in healthcare — budgeting, resource allocation, cost analysis',
  'Quality & safety science, evidence-based practice, performance improvement',
  'Health policy analysis, advocacy, regulatory environment, legislative process',
  'HOL Practicum I — 112 hours with nurse executive preceptor',
  'HOL Practicum II — 168 hours leading a quality improvement initiative',
  'HOL Practicum III — 224 hours, executive leadership capstone project',
];

// JH Hospital — clinical partner detail sets
const JH_HOSPITAL_ED_DETAILS = [
  'Triage certification — ESI 5-level acuity assessment',
  'Trauma nursing certification — TNCC protocols, rapid assessment',
  'ACLS provider — advanced cardiac life support, code team protocols',
  'Charge nurse leadership, unit throughput management, staff mentoring',
  'Clinical preceptor training — teaching evidence-based practice to students',
  'Quality improvement lead — fall prevention, sepsis bundle compliance',
];

const JH_HOSPITAL_ICU_DETAILS = [
  'CCRN certification prep — critical care nursing fundamentals',
  'Mechanical ventilation management — modes, weaning protocols, ABG interpretation',
  'Hemodynamic monitoring — arterial lines, Swan-Ganz, cardiac output',
  'CRRT management — continuous renal replacement therapy for acute kidney injury',
  'Preceptor certification — mentoring new graduate nurses in critical care',
];

const JH_HOSPITAL_ONCO_DETAILS = [
  'ONS chemotherapy/biotherapy certification — safe administration protocols',
  'Symptom management — pain, nausea, fatigue, mucositis assessment and intervention',
  'Central line care — PICC, port, tunneled catheter management and troubleshooting',
  'Bone marrow transplant nursing — conditioning regimens, engraftment monitoring',
  'Palliative care integration — goals of care conversations, advance directives',
  'Clinical trial coordination — protocol adherence, adverse event reporting',
];

// AACN Essentials competency domain details
const AACN_PERSON_CENTERED_DETAILS = [
  'Holistic assessment — physical, psychological, social, spiritual dimensions',
  'Therapeutic communication — motivational interviewing, health literacy adaptation',
  'Care coordination across settings — transitions, handoffs, discharge planning',
  'Cultural humility — addressing health disparities, implicit bias awareness',
  'Shared decision-making — patient preferences, informed consent, autonomy',
];

const AACN_QUALITY_SAFETY_DETAILS = [
  'QSEN competencies — patient-centered care, teamwork, EBP, QI, safety, informatics',
  'Root cause analysis and just culture — systems thinking for error prevention',
  'Clinical decision support — using evidence at the point of care',
  'Infection prevention — hand hygiene, isolation precautions, bundle compliance',
  'Medication safety — high-alert medications, double-check protocols, BCMA',
];

const AACN_INTERPROFESSIONAL_DETAILS = [
  'SBAR communication — structured handoffs with physicians, pharmacists, therapists',
  'Interprofessional rounding — contributing nursing perspective to care teams',
  'Collaborative practice — shared goals, mutual respect, role clarity',
  'Conflict resolution — navigating disagreements in high-stakes clinical settings',
  'Team-based quality improvement — participating in multidisciplinary projects',
];
// ── IIT Institute of Design detail sets (based on real ID curriculum) ──

// MDes Core — the foundational sequence all MDes students take
const MDES_CORE_DETAILS = [
  'Observation methods, interviewing techniques, contextual inquiry, diary studies',
  'Affinity clustering, insight development, frameworks, opportunity mapping',
  'Rapid prototyping, experience prototyping, concept development, storyboarding',
  'Systems mapping, stakeholder analysis, leverage points, causal loop diagrams',
  'Service blueprinting, journey mapping, touchpoint design, value exchange modeling',
  'Project framing, design criteria, team facilitation, client presentation',
];

// MDes Concentration: Design Research & Insight
const MDES_RESEARCH_DETAILS = [
  'Ethnographic methods — participant observation, cultural probes, photo/video analysis',
  'Generative research — co-creation sessions, participatory design, stakeholder workshops',
  'Behavioral research — A/B testing frameworks, analytics interpretation, behavioral nudges',
  'Synthesis methods — grounded theory coding, pattern finding, insight articulation',
  'Research strategy — planning studies, triangulation, mixed methods, research ops',
  'Research leadership — evangelizing insights, building research culture, mentoring',
];

// MDes Concentration: Product-Service Delivery
const MDES_PRODUCT_SERVICE_DETAILS = [
  'Physical prototyping — foam core, 3D printing, laser cutting, Arduino interfaces',
  'Digital prototyping — Figma, interactive flows, usability testing, design systems',
  'Service design — blueprinting, front-stage/back-stage mapping, orchestration',
  'Business modeling — value propositions, unit economics, go-to-market strategy',
  'Implementation planning — roadmaps, MVP scoping, stakeholder alignment',
  'Capstone — end-to-end product-service system with industry partner',
];

// MDes Concentration: Innovation Strategy
const MDES_INNOVATION_DETAILS = [
  'Design planning — strategic foresight, scenario development, landscape analysis',
  'Organizational design — culture mapping, change management, innovation metrics',
  'Platform strategy — ecosystem mapping, multi-sided markets, network effects',
  'Design-led venture — lean startup methods, pitch development, investor narratives',
  'Strategic communication — data storytelling, executive presentations, design rationale',
  'Capstone — strategic design initiative for organizational transformation',
];

// MS Strategic Design Leadership (formerly MDM)
const MS_SDL_DETAILS = [
  'Design thinking foundations — problem framing, divergent/convergent methods',
  'Organizational systems — complexity theory, adaptive leadership, team dynamics',
  'Evidence-based design — metrics, impact measurement, decision frameworks',
  'Strategic planning — portfolio management, innovation pipeline, resource allocation',
  'Leadership practicum — leading cross-functional design initiative in own organization',
  'Capstone — strategic design transformation project with measurable outcomes',
];

// PhD in Design
const PHD_DESIGN_DETAILS = [
  'Design theory — epistemology of design, Schön, Simon, Buchanan, design as discipline',
  'Research methods — qualitative, quantitative, mixed methods, research design',
  'Doctoral seminar I — literature review, theoretical framework development',
  'Doctoral seminar II — methodology, pilot studies, IRB protocols',
  'Dissertation proposal — committee formation, defense, research plan approval',
  'Dissertation research — data collection, analysis, writing, peer review',
  'Dissertation defense — public defense, revisions, contribution to design knowledge',
];

// ID capability goal detail sets
const ID_HUMAN_CENTERED_DETAILS = [
  'Empathic research — deep listening, perspective-taking, cultural awareness',
  'Inclusive design — accessibility, universal design principles, co-design with communities',
  'Participatory methods — stakeholder engagement, power dynamics, democratic design',
  'Ethical practice — informed consent, data privacy, responsible innovation',
  'Impact assessment — outcomes measurement, unintended consequences, equity audit',
];

const ID_SYSTEMS_THINKING_DETAILS = [
  'System mapping — identifying actors, flows, feedback loops, boundaries',
  'Complexity navigation — emergence, nonlinearity, adaptive systems',
  'Multi-stakeholder analysis — power mapping, interest alignment, coalition building',
  'Transition design — sociotechnical transitions, pathways, vision development',
  'Systemic intervention — leverage points, prototyping at system scale',
];

const ID_MAKING_PROTOTYPING_DETAILS = [
  'Physical making — model shop skills, materials exploration, form studies',
  'Digital fabrication — 3D printing, laser cutting, CNC, parametric design',
  'Experience prototyping — bodystorming, Wizard of Oz, service staging',
  'Interactive prototyping — microcontrollers, sensors, connected objects',
  'Design communication — visual storytelling, presentation craft, portfolio development',
];

const DRAWING_FOUNDATION_DETAILS = [
  'Blind contour, cross-contour, continuous line exercises',
  '1-point, 2-point, atmospheric perspective studies',
  'Value scales, cast shadows, reflected light observation',
  'Rule of thirds, golden ratio, visual weight balance',
  'Gesture drawing, proportion, anatomical landmarks',
  'Curated body of work demonstrating all fundamentals',
];
const SAILING_SEASON_DETAILS = [
  'Light air practice races, crew coordination drills',
  'Mid-fleet positioning, mark rounding technique refinement',
  'Full regatta weekend — 6 races, varied conditions',
  'Heavy air strategy, current-aware tactical decisions',
  'Short course racing, cold-weather boat handling',
  'National championship qualifier series',
];
const SAILING_SKILLS_DETAILS = [
  'Sail trim basics, points of sail, safety procedures',
  'Tacking, gybing, spinnaker sets and douses',
  'Port/starboard approach, timing, acceleration technique',
  'Laylines, wind shifts, strategic side of the course',
  'VMG angles, wave riding, gybe timing on runs',
  'Combining all skills under match-race pressure',
  'Multi-day championship regatta performance',
];

export const SAMPLE_INTERESTS: SampleInterest[] = [
  {
    slug: 'nursing',
    name: 'Nursing',
    color: '#0097A7',
    icon: 'medkit',
    organizations: [
      {
        slug: 'johns-hopkins',
        name: 'Johns Hopkins School of Nursing',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'MSN Entry into Nursing',
            people: [
              {
                name: 'Dr. Marie Nolan',
                role: 'Executive Vice Dean',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  6, MSN_ENTRY_DETAILS,
                ),
                personalInterests: [
                  {
                    interestSlug: 'drawing',
                    role: 'Hobbyist',
                    timeline: steps(
                      ['Line & Contour', 'Perspective', 'Light & Shadow', 'Composition'],
                      2,
                      [
                        'Exploring contour drawing and basic line work in a weekly sketchbook practice',
                        'Learning one-point and two-point perspective for architectural sketching',
                        'Studying value, shading techniques, and cast shadows',
                        'Composing scenes with rule of thirds and focal points',
                      ],
                    ),
                  },
                  {
                    interestSlug: 'health-and-fitness',
                    role: 'Self-directed',
                    timeline: steps(
                      ['Baseline Assessment', 'Strength Foundations', 'Cardio Endurance', 'Flexibility & Mobility', 'Training Plan'],
                      1,
                      [
                        'Initial fitness assessment — resting heart rate, flexibility test, baseline lifts',
                        'Building fundamental strength with compound movements 3x/week',
                        'Progressive cardio program — running, rowing, cycling intervals',
                        'Yoga and mobility work for injury prevention and recovery',
                        'Structured 12-week periodized training plan',
                      ],
                    ),
                  },
                ],
              },
              {
                name: 'Aisha Williams',
                role: 'Student — Semester 4',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  3, MSN_ENTRY_DETAILS,
                ),
              },
              {
                name: 'Carlos Mendez',
                role: 'Student — Semester 2',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  1, MSN_ENTRY_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'DNP — Family NP',
            people: [
              {
                name: 'Dr. Jason Farley',
                role: 'PhD Program Director',
                timeline: steps(
                  ['Adv Pathophysiology', 'Adv Pharmacology', 'Adv Health Assessment', 'EBP & QI', 'Clinical Practicum I', 'Clinical Practicum II', 'Scholarly Project'],
                  6, DNP_FNP_DETAILS,
                ),
              },
              {
                name: 'Priya Sharma',
                role: 'DNP Student',
                timeline: steps(
                  ['Adv Pathophysiology', 'Adv Pharmacology', 'Adv Health Assessment', 'EBP & QI', 'Clinical Practicum I', 'Clinical Practicum II', 'Scholarly Project'],
                  4, DNP_FNP_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'DNP — Psych Mental Health NP',
            people: [
              {
                name: 'Dr. Deborah Gross',
                role: 'Endowed Chair, Psych Nursing',
                timeline: steps(
                  ['Adv Psychopathology', 'Psychopharmacology', 'Therapeutic Modalities', 'Psych Assessment', 'Psych Clinical I', 'Psych Clinical II', 'Scholarly Project'],
                  6, DNP_PMHNP_DETAILS,
                ),
              },
              {
                name: 'James Okafor',
                role: 'DNP Student',
                timeline: steps(
                  ['Adv Psychopathology', 'Psychopharmacology', 'Therapeutic Modalities', 'Psych Assessment', 'Psych Clinical I', 'Psych Clinical II', 'Scholarly Project'],
                  3, DNP_PMHNP_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'MSN — Healthcare Organizational Leadership',
            people: [
              {
                name: 'Dr. Sarah Szanton',
                role: 'Dean',
                timeline: steps(
                  ['Healthcare Systems', 'Financial Mgmt', 'Quality & Safety', 'Health Policy', 'HOL Practicum I', 'HOL Practicum II', 'HOL Practicum III'],
                  6, HOL_DETAILS,
                ),
              },
              {
                name: 'Maria Chen',
                role: 'MSN Student',
                timeline: steps(
                  ['Healthcare Systems', 'Financial Mgmt', 'Quality & Safety', 'Health Policy', 'HOL Practicum I', 'HOL Practicum II', 'HOL Practicum III'],
                  3, HOL_DETAILS,
                ),
              },
            ],
          },
        ],
        cohorts: [
          {
            name: 'MSN Entry — Fall 2025 Cohort (Semester 4)',
            people: [
              {
                name: 'Aisha Williams',
                role: 'Student',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  3, MSN_ENTRY_DETAILS,
                ),
              },
              {
                name: 'David Osei',
                role: 'Student',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  3, MSN_ENTRY_DETAILS,
                ),
              },
              {
                name: 'Lauren Kim',
                role: 'Student',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  3, MSN_ENTRY_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'MSN Entry — Spring 2026 Cohort (Semester 2)',
            people: [
              {
                name: 'Carlos Mendez',
                role: 'Student',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  1, MSN_ENTRY_DETAILS,
                ),
              },
              {
                name: 'Sarah Mitchell',
                role: 'Student',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  1, MSN_ENTRY_DETAILS,
                ),
              },
              {
                name: 'Rajesh Patel',
                role: 'Student',
                timeline: steps(
                  ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
                  1, MSN_ENTRY_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'DNP Family NP — 2024 Cohort',
            people: [
              {
                name: 'Priya Sharma',
                role: 'DNP Student',
                timeline: steps(
                  ['Adv Pathophysiology', 'Adv Pharmacology', 'Adv Health Assessment', 'EBP & QI', 'Clinical Practicum I', 'Clinical Practicum II', 'Scholarly Project'],
                  4, DNP_FNP_DETAILS,
                ),
              },
              {
                name: 'Michael Torres',
                role: 'DNP Student',
                timeline: steps(
                  ['Adv Pathophysiology', 'Adv Pharmacology', 'Adv Health Assessment', 'EBP & QI', 'Clinical Practicum I', 'Clinical Practicum II', 'Scholarly Project'],
                  4, DNP_FNP_DETAILS,
                ),
              },
            ],
          },
        ],
        capabilityGoals: [
          {
            name: 'Person-Centered Care (AACN Domain 2)',
            people: [
              {
                name: 'Aisha Williams',
                role: 'MSN Entry Student',
                timeline: steps(
                  ['Holistic Assessment', 'Therapeutic Comm', 'Care Coordination', 'Cultural Humility', 'Shared Decision-Making'],
                  3, AACN_PERSON_CENTERED_DETAILS,
                ),
              },
              {
                name: 'Priya Sharma',
                role: 'DNP Student',
                timeline: steps(
                  ['Holistic Assessment', 'Therapeutic Comm', 'Care Coordination', 'Cultural Humility', 'Shared Decision-Making'],
                  4, AACN_PERSON_CENTERED_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'Quality & Safety (AACN Domain 5)',
            people: [
              {
                name: 'Carlos Mendez',
                role: 'MSN Entry Student',
                timeline: steps(
                  ['QSEN Competencies', 'Root Cause Analysis', 'Clinical Decision Support', 'Infection Prevention', 'Medication Safety'],
                  1, AACN_QUALITY_SAFETY_DETAILS,
                ),
              },
              {
                name: 'James Okafor',
                role: 'DNP Student',
                timeline: steps(
                  ['QSEN Competencies', 'Root Cause Analysis', 'Clinical Decision Support', 'Infection Prevention', 'Medication Safety'],
                  3, AACN_QUALITY_SAFETY_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'Interprofessional Partnerships (AACN Domain 6)',
            people: [
              {
                name: 'Aisha Williams',
                role: 'MSN Entry Student',
                timeline: steps(
                  ['SBAR Communication', 'IP Rounding', 'Collaborative Practice', 'Conflict Resolution', 'Team-Based QI'],
                  2, AACN_INTERPROFESSIONAL_DETAILS,
                ),
              },
              {
                name: 'Maria Chen',
                role: 'HOL Student',
                timeline: steps(
                  ['SBAR Communication', 'IP Rounding', 'Collaborative Practice', 'Conflict Resolution', 'Team-Based QI'],
                  4, AACN_INTERPROFESSIONAL_DETAILS,
                ),
              },
            ],
          },
        ],
      },
      {
        slug: 'jh-hospital',
        name: 'Johns Hopkins Hospital',
        groupLabel: 'Departments',
        groups: [
          {
            name: 'Emergency Department',
            people: [
              {
                name: 'Rachel Torres',
                role: 'Nurse Manager',
                timeline: steps(
                  ['Triage Cert (ESI)', 'Trauma Cert (TNCC)', 'ACLS Provider', 'Charge Nurse', 'Preceptor Cert', 'QI Lead'],
                  5, JH_HOSPITAL_ED_DETAILS,
                ),
              },
              {
                name: 'David Kim',
                role: 'Staff Nurse',
                timeline: steps(
                  ['Triage Cert (ESI)', 'Trauma Cert (TNCC)', 'ACLS Provider', 'Charge Nurse', 'Preceptor Cert', 'QI Lead'],
                  2, JH_HOSPITAL_ED_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'Medical ICU',
            people: [
              {
                name: 'Amanda Foster',
                role: 'Charge Nurse',
                timeline: steps(
                  ['CCRN Prep', 'Ventilator Mgmt', 'Hemodynamics', 'CRRT', 'Preceptor Cert'],
                  4, JH_HOSPITAL_ICU_DETAILS,
                ),
              },
              {
                name: 'Marcus Reed',
                role: 'New Grad Resident',
                timeline: steps(
                  ['CCRN Prep', 'Ventilator Mgmt', 'Hemodynamics', 'CRRT', 'Preceptor Cert'],
                  1, JH_HOSPITAL_ICU_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'Oncology / BMT',
            people: [
              {
                name: 'Linda Tran',
                role: 'Clinical Nurse Specialist',
                timeline: steps(
                  ['Chemo/Bio Cert', 'Symptom Mgmt', 'Central Line Care', 'BMT Nursing', 'Palliative Integration', 'Clinical Trials'],
                  5, JH_HOSPITAL_ONCO_DETAILS,
                ),
              },
              {
                name: 'Nathan Brooks',
                role: 'Staff Nurse',
                timeline: steps(
                  ['Chemo/Bio Cert', 'Symptom Mgmt', 'Central Line Care', 'BMT Nursing', 'Palliative Integration', 'Clinical Trials'],
                  2, JH_HOSPITAL_ONCO_DETAILS,
                ),
              },
            ],
          },
        ],
      },
      {
        slug: 'jh-bayview',
        name: 'Johns Hopkins Bayview Medical Center',
        groupLabel: 'Units',
        groups: [
          {
            name: 'Labor & Delivery',
            people: [
              {
                name: 'Keisha Brown',
                role: 'Charge Nurse',
                timeline: steps(
                  ['L&D Orientation', 'Fetal Monitoring Cert', 'High-Risk OB', 'C-Section Circulator', 'Preceptor', 'Unit Educator'],
                  4,
                ),
              },
              {
                name: 'Emily Sato',
                role: 'Staff Nurse',
                timeline: steps(
                  ['L&D Orientation', 'Fetal Monitoring Cert', 'High-Risk OB', 'C-Section Circulator', 'Preceptor', 'Unit Educator'],
                  1,
                ),
              },
            ],
          },
          {
            name: 'Medicine Unit',
            people: [
              {
                name: 'Robert Williams',
                role: 'Nurse Manager',
                timeline: steps(
                  ['Med-Surg Cert', 'Telemetry', 'Charge Nurse', 'Unit Leadership', 'Magnet Champion', 'Nurse Residency Mentor'],
                  5,
                ),
              },
            ],
          },
        ],
      },
      {
        slug: 'kennedy-krieger',
        name: 'Kennedy Krieger Institute',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'Pediatric Rehabilitation',
            people: [
              {
                name: 'Dr. Lisa Park',
                role: 'Nursing Director',
                timeline: steps(
                  ['Peds Rehab Orientation', 'Feeding & Swallowing', 'Neurodevelopmental Care', 'Family Education', 'Discharge Planning', 'Program Evaluation'],
                  5,
                ),
              },
              {
                name: 'Jordan Ellis',
                role: 'Clinical Nurse',
                timeline: steps(
                  ['Peds Rehab Orientation', 'Feeding & Swallowing', 'Neurodevelopmental Care', 'Family Education', 'Discharge Planning', 'Program Evaluation'],
                  2,
                ),
              },
            ],
          },
        ],
      },
    ],
    programs: [
      {
        slug: 'msn-entry',
        name: 'MSN Entry into Nursing',
        type: 'degree',
        description: 'Pre-licensure pathway for career changers — 5 semesters, 1000+ clinical hours, 95% NCLEX pass rate.',
        offeredBy: [
          { orgSlug: 'johns-hopkins', role: 'School' },
          { orgSlug: 'jh-hospital', role: 'Clinical site' },
          { orgSlug: 'jh-bayview', role: 'Clinical site' },
        ],
        samplePeople: [
          {
            name: 'Aisha Williams',
            role: 'Student — Semester 4',
            timeline: steps(
              ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
              3, MSN_ENTRY_DETAILS,
            ),
          },
          {
            name: 'Carlos Mendez',
            role: 'Student — Semester 2',
            timeline: steps(
              ['Fundamentals', 'Adult Health', 'Pediatrics', 'OB/Maternal', 'Critical Care', 'Psych/Behavioral', 'Capstone & NCLEX'],
              1, MSN_ENTRY_DETAILS,
            ),
          },
        ],
      },
      {
        slug: 'dnp-fnp',
        name: 'DNP Family Nurse Practitioner',
        type: 'degree',
        description: 'Doctoral preparation for primary care practice — advanced clinical reasoning, prescribing, and scholarly inquiry.',
        offeredBy: [
          { orgSlug: 'johns-hopkins', role: 'School' },
        ],
        samplePeople: [
          {
            name: 'Priya Sharma',
            role: 'DNP Student',
            timeline: steps(
              ['Adv Pathophysiology', 'Adv Pharmacology', 'Adv Health Assessment', 'EBP & QI', 'Clinical Practicum I', 'Clinical Practicum II', 'Scholarly Project'],
              4, DNP_FNP_DETAILS,
            ),
          },
          {
            name: 'Dr. Jason Farley',
            role: 'Faculty',
            timeline: steps(
              ['Adv Pathophysiology', 'Adv Pharmacology', 'Adv Health Assessment', 'EBP & QI', 'Clinical Practicum I', 'Clinical Practicum II', 'Scholarly Project'],
              6, DNP_FNP_DETAILS,
            ),
          },
        ],
      },
      {
        slug: 'dnp-pmhnp',
        name: 'DNP Psychiatric Mental Health NP',
        type: 'degree',
        description: 'Specialized doctoral track for psychiatric and behavioral health advanced practice.',
        offeredBy: [
          { orgSlug: 'johns-hopkins', role: 'School' },
        ],
        samplePeople: [
          {
            name: 'James Okafor',
            role: 'DNP Student',
            timeline: steps(
              ['Adv Psychopathology', 'Psychopharmacology', 'Therapeutic Modalities', 'Psych Assessment', 'Psych Clinical I', 'Psych Clinical II', 'Scholarly Project'],
              3, DNP_PMHNP_DETAILS,
            ),
          },
        ],
      },
      {
        slug: 'peds-rehab-residency',
        name: 'Pediatric Rehabilitation Nursing',
        type: 'residency',
        description: 'Specialty residency in pediatric rehabilitation — neurodevelopmental care, feeding, and family education.',
        offeredBy: [
          { orgSlug: 'kennedy-krieger', role: 'Host' },
        ],
        samplePeople: [
          {
            name: 'Jordan Ellis',
            role: 'Clinical Nurse',
            timeline: steps(
              ['Peds Rehab Orientation', 'Feeding & Swallowing', 'Neurodevelopmental Care', 'Family Education', 'Discharge Planning', 'Program Evaluation'],
              2,
            ),
          },
        ],
      },
    ],
    affiliations: [
      {
        name: 'Johns Hopkins',
        orgSlugs: ['johns-hopkins', 'jh-hospital', 'jh-bayview', 'kennedy-krieger'],
      },
    ],
    independentPractitioners: [
      {
        name: 'Tomeka Sanders',
        role: 'Family Nurse Practitioner — Independent Practice',
        timeline: steps(
          ['Board Certification', 'Practice Setup', 'Patient Panel', 'CE Requirements', 'Specialty Cert', 'Mentoring'],
          3,
          [
            'AANP board certification — Family Nurse Practitioner',
            'Establishing independent NP practice — state licensing, malpractice, EHR setup',
            'Building patient panel — 800+ patients, chronic disease management focus',
            'Annual continuing education — 25 CE hours, pharmacology requirement',
            'Diabetes management specialty certification',
            'Precepting NP students from local programs',
          ],
        ),
      },
      {
        name: 'Brian Whitfield',
        role: 'Travel Nurse — Critical Care',
        timeline: steps(
          ['CCRN Cert', 'Agency Onboarding', 'Assignment 1', 'Assignment 2', 'Perm Placement', 'Charge Nurse'],
          3,
          [
            'Critical Care Registered Nurse certification',
            'Travel agency credentialing, multi-state compact license',
            'First 13-week assignment — Level I Trauma ICU, Houston',
            'Second assignment — Cardiac ICU, Denver, rapid-response team',
            'Evaluating permanent positions at academic medical centers',
            'Goal: charge nurse leadership at a Magnet-designated hospital',
          ],
        ),
      },
      {
        name: 'Lucia Fernandez',
        role: 'School Nurse — Public Health',
        timeline: steps(
          ['RN License', 'School Nurse Cert', 'IEP Management', 'Health Ed Programs', 'District Leadership'],
          2,
          [
            'Registered Nurse license — pediatric experience in community health',
            'National Board Certification for School Nurses (NBCSN)',
            'Managing individualized education plans for students with chronic conditions',
            'Developing health education curriculum — mental health, nutrition, safety',
            'District-wide school nurse coordinator role',
          ],
        ),
      },
    ],
  },
  {
    slug: 'drawing',
    name: 'Drawing',
    color: '#E64A19',
    icon: 'color-palette',
    organizations: [
      {
        slug: 'circle-line',
        name: 'Circle Line Art School',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'Foundation Drawing',
            people: [
              {
                name: 'Tom McPherson',
                role: 'Instructor',
                timeline: steps(['Line & Contour', 'Perspective', 'Light & Shadow', 'Composition', 'Figure Drawing', 'Portfolio'], 5, DRAWING_FOUNDATION_DETAILS),
              },
              {
                name: 'Anna Kowalski',
                role: 'Student',
                timeline: steps(['Line & Contour', 'Perspective', 'Light & Shadow', 'Composition', 'Figure Drawing', 'Portfolio'], 2, DRAWING_FOUNDATION_DETAILS),
              },
              {
                name: 'Jake Morrison',
                role: 'Student',
                timeline: steps(['Line & Contour', 'Perspective', 'Light & Shadow', 'Composition', 'Figure Drawing', 'Portfolio'], 3, DRAWING_FOUNDATION_DETAILS),
              },
            ],
          },
          {
            name: 'Advanced Illustration',
            people: [
              {
                name: 'Claire Dubois',
                role: 'Instructor',
                timeline: steps(['Digital Tools', 'Character Design', 'Environment Art', 'Narrative Illustration', 'Client Projects'], 4),
              },
              {
                name: 'Sam Patel',
                role: 'Student',
                timeline: steps(['Digital Tools', 'Character Design', 'Environment Art', 'Narrative Illustration', 'Client Projects'], 1),
              },
            ],
          },
        ],
      },
    ],
    programs: [
      {
        slug: 'foundation-drawing',
        name: 'Foundation Drawing',
        type: 'course',
        description: 'Structured 6-module course covering line, perspective, light, composition, figure drawing, and portfolio development.',
        offeredBy: [{ orgSlug: 'circle-line', role: 'School' }],
        samplePeople: [
          {
            name: 'Anna Kowalski',
            role: 'Student',
            timeline: steps(['Line & Contour', 'Perspective', 'Light & Shadow', 'Composition', 'Figure Drawing', 'Portfolio'], 2, DRAWING_FOUNDATION_DETAILS),
          },
          {
            name: 'Jake Morrison',
            role: 'Student',
            timeline: steps(['Line & Contour', 'Perspective', 'Light & Shadow', 'Composition', 'Figure Drawing', 'Portfolio'], 3, DRAWING_FOUNDATION_DETAILS),
          },
        ],
      },
      {
        slug: 'advanced-illustration',
        name: 'Advanced Illustration',
        type: 'course',
        description: 'Digital illustration pipeline — tools, character design, environments, narrative work, and client projects.',
        offeredBy: [{ orgSlug: 'circle-line', role: 'School' }],
        samplePeople: [
          {
            name: 'Sam Patel',
            role: 'Student',
            timeline: steps(['Digital Tools', 'Character Design', 'Environment Art', 'Narrative Illustration', 'Client Projects'], 1),
          },
        ],
      },
    ],
    independentPractitioners: [
      {
        name: 'Maya Reeves',
        role: 'Plein Air Artist — Self-taught',
        timeline: steps(
          ['Sketchbook Practice', 'Value Studies', 'Color Mixing', 'Plein Air Outings', 'Exhibition'],
          3,
          [
            'Daily sketchbook habit — 30-min observational drawing sessions',
            'Charcoal and graphite value studies from still life and landscape',
            'Watercolor and gouache color mixing, limited palette exercises',
            'Weekly plein air painting sessions — parks, urban scenes, coastline',
            'First solo exhibition at a local gallery',
          ],
        ),
      },
      {
        name: 'Darius Cole',
        role: 'Digital Concept Artist — Freelance',
        timeline: steps(
          ['Fundamentals', 'Digital Painting', 'Concept Art', 'Portfolio', 'Client Work'],
          3,
          [
            'Traditional drawing fundamentals — anatomy, perspective, gesture',
            'Procreate and Photoshop digital painting techniques',
            'Concept art for games and film — environments, props, creatures',
            'Building professional portfolio and ArtStation presence',
            'Freelance concept art commissions for indie studios',
          ],
        ),
      },
    ],
  },
  {
    slug: 'sail-racing',
    name: 'Sail Racing',
    color: '#003DA5',
    icon: 'boat',
    organizations: [
      {
        slug: 'rhkyc',
        name: 'Royal Hong Kong Yacht Club',
        groupLabel: 'Fleets',
        groups: [
          {
            name: 'Dragons Fleet',
            people: [
              {
                name: 'Mike Stevens',
                role: 'Fleet Captain',
                timeline: steps(['Spring Series', 'Mid-Season', 'Summer Regatta', 'Autumn Cup', 'Winter Series', 'Nationals'], 3, SAILING_SEASON_DETAILS),
              },
              {
                name: 'Wei Chen',
                role: 'Sailor',
                timeline: steps(['Spring Series', 'Mid-Season', 'Summer Regatta', 'Autumn Cup', 'Winter Series', 'Nationals'], 2, SAILING_SEASON_DETAILS),
              },
              {
                name: 'Sophie Laurent',
                role: 'Sailor',
                timeline: steps(['Spring Series', 'Mid-Season', 'Summer Regatta', 'Autumn Cup', 'Winter Series', 'Nationals'], 4, SAILING_SEASON_DETAILS),
              },
            ],
          },
          {
            name: 'Etchells Fleet',
            people: [
              {
                name: 'James Thornton',
                role: 'Coach',
                timeline: steps(['Fundamentals', 'Boat Handling', 'Starts', 'Upwind Tactics', 'Downwind', 'Race Craft', 'Championship'], 5, SAILING_SKILLS_DETAILS),
              },
              {
                name: 'Kai Nakamura',
                role: 'Sailor',
                timeline: steps(['Fundamentals', 'Boat Handling', 'Starts', 'Upwind Tactics', 'Downwind', 'Race Craft', 'Championship'], 3, SAILING_SKILLS_DETAILS),
              },
            ],
          },
        ],
      },
      {
        slug: 'abc-sailing',
        name: 'Aberdeen Boat Club',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'Youth Sailing',
            people: [
              {
                name: 'Helen Chow',
                role: 'Head Coach',
                timeline: steps(['Level 1', 'Level 2', 'Level 3', 'Racing Intro', 'Team Racing', 'Regatta'], 5),
              },
              {
                name: 'Tommy Lee',
                role: 'Sailor',
                timeline: steps(['Level 1', 'Level 2', 'Level 3', 'Racing Intro', 'Team Racing', 'Regatta'], 2),
              },
            ],
          },
        ],
      },
    ],
    programs: [
      {
        slug: 'youth-learn-to-sail',
        name: 'Youth Learn to Sail',
        type: 'training',
        description: 'Progressive 6-level youth sailing program — from first tiller to regatta competition.',
        offeredBy: [{ orgSlug: 'abc-sailing', role: 'Club' }],
        samplePeople: [
          {
            name: 'Tommy Lee',
            role: 'Sailor',
            timeline: steps(['Level 1', 'Level 2', 'Level 3', 'Racing Intro', 'Team Racing', 'Regatta'], 2),
          },
        ],
      },
      {
        slug: 'keelboat-racing',
        name: 'Keelboat Racing',
        type: 'training',
        description: 'Season-long fleet racing — Dragons and Etchells classes, from spring series through nationals.',
        offeredBy: [
          { orgSlug: 'rhkyc', role: 'Host club' },
        ],
        samplePeople: [
          {
            name: 'Wei Chen',
            role: 'Sailor',
            timeline: steps(['Spring Series', 'Mid-Season', 'Summer Regatta', 'Autumn Cup', 'Winter Series', 'Nationals'], 2, SAILING_SEASON_DETAILS),
          },
          {
            name: 'Kai Nakamura',
            role: 'Sailor',
            timeline: steps(['Fundamentals', 'Boat Handling', 'Starts', 'Upwind Tactics', 'Downwind', 'Race Craft', 'Championship'], 3, SAILING_SKILLS_DETAILS),
          },
        ],
      },
      {
        slug: 'race-officer-cert',
        name: 'Race Officer Certification',
        type: 'certification',
        description: 'World Sailing–recognized certification for race management — rules, course setting, and protest procedures.',
        offeredBy: [
          { orgSlug: 'rhkyc', role: 'Training center' },
          { orgSlug: 'abc-sailing', role: 'Training center' },
        ],
        samplePeople: [
          {
            name: 'Mike Stevens',
            role: 'Fleet Captain',
            timeline: steps(
              ['Rules & Regs', 'Course Design', 'Starting Procedures', 'Scoring', 'Protest Management', 'Principal Race Officer'],
              4,
              [
                'Racing Rules of Sailing — Part 2, definitions, protest-eligible situations',
                'Course geometry, mark placement, windward-leeward and trapezoid layouts',
                'Starting sequence flags, timing, recalls, black flag procedures',
                'Low-point and high-point scoring, handicap systems, series management',
                'Protest committee procedures, redress, rule 69 hearings',
                'Principal Race Officer qualification — managing full regatta operations',
              ],
            ),
          },
        ],
      },
    ],
    independentPractitioners: [
      {
        name: 'Elena Vasquez',
        role: 'Solo Offshore Sailor',
        timeline: steps(
          ['Coastal Cruising', 'Offshore Cert', 'Solo Passages', 'Ocean Race Qualifier', 'Transatlantic'],
          2,
          [
            'Coastal cruising experience — 2,000+ nm logged, day/night sailing',
            'RYA Yachtmaster Offshore certification — celestial nav, heavy weather',
            'Solo passages — 500 nm qualifying legs, self-sufficiency systems',
            'Mini Transat qualifier series — solo offshore racing preparation',
            'Goal: complete solo transatlantic race',
          ],
        ),
      },
      {
        name: 'Tom Hayward',
        role: 'Dinghy Sailor — Club Racer',
        timeline: steps(
          ['Learn to Sail', 'Club Racing', 'Traveller Series', 'National Squad', 'Worlds'],
          3,
          [
            'RYA Level 2 dinghy sailing certification',
            'Weekly club racing in Laser class — 40+ races per season',
            'Regional traveller series — top 10 finishes, open meetings',
            'National squad selection — training camps, international regattas',
            'Goal: represent at Laser World Championships',
          ],
        ),
      },
    ],
  },
  {
    slug: 'design',
    name: 'Design',
    color: '#7B1FA2',
    icon: 'brush',
    organizations: [
      {
        slug: 'iit-id',
        name: 'IIT Institute of Design',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'MDes — Master of Design',
            groupLabel: 'Concentrations',
            subgroups: [
              {
                name: 'Core Curriculum',
                people: [
                  {
                    name: 'Tomoko Ichikawa',
                    role: 'Teaching Professor, Visual Communication',
                    timeline: steps(
                      ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                      5, MDES_CORE_DETAILS,
                    ),
                  },
                  {
                    name: 'Martin Thaler',
                    role: 'Professor, Product & Environment Design',
                    timeline: steps(
                      ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                      5, MDES_CORE_DETAILS,
                    ),
                  },
                  {
                    name: 'Noa Vardi',
                    role: 'MDes Student — Year 1',
                    timeline: steps(
                      ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                      2, MDES_CORE_DETAILS,
                    ),
                  },
                ],
              },
              {
                name: 'Design Research & Insight',
                people: [
                  {
                    name: 'Kim Erwin',
                    role: 'Assoc. Professor, Healthcare Design & Methods',
                    timeline: steps(
                      ['Ethnographic Methods', 'Generative Research', 'Behavioral Research', 'Synthesis Methods', 'Research Strategy', 'Research Leadership'],
                      5, MDES_RESEARCH_DETAILS,
                    ),
                  },
                  {
                    name: 'Ruth Schmidt',
                    role: 'Assoc. Professor, Behavioral Design',
                    timeline: steps(
                      ['Ethnographic Methods', 'Generative Research', 'Behavioral Research', 'Synthesis Methods', 'Research Strategy', 'Research Leadership'],
                      5, MDES_RESEARCH_DETAILS,
                    ),
                  },
                  {
                    name: 'Priya Kapoor',
                    role: 'MDes Student — Year 2',
                    timeline: steps(
                      ['Ethnographic Methods', 'Generative Research', 'Behavioral Research', 'Synthesis Methods', 'Research Strategy', 'Research Leadership'],
                      3, MDES_RESEARCH_DETAILS,
                    ),
                  },
                  {
                    name: 'Jordan Blake',
                    role: 'MDes Student — Year 1',
                    timeline: steps(
                      ['Ethnographic Methods', 'Generative Research', 'Behavioral Research', 'Synthesis Methods', 'Research Strategy', 'Research Leadership'],
                      1, MDES_RESEARCH_DETAILS,
                    ),
                  },
                ],
              },
              {
                name: 'Product-Service Delivery',
                people: [
                  {
                    name: 'Zach Pino',
                    role: 'Assoc. Professor, Product Design',
                    timeline: steps(
                      ['Physical Prototyping', 'Digital Prototyping', 'Service Design', 'Business Modeling', 'Implementation', 'Capstone'],
                      5, MDES_PRODUCT_SERVICE_DETAILS,
                    ),
                  },
                  {
                    name: 'Maura Shea',
                    role: 'Assoc. Industry Professor, Community Design',
                    timeline: steps(
                      ['Physical Prototyping', 'Digital Prototyping', 'Service Design', 'Business Modeling', 'Implementation', 'Capstone'],
                      5, MDES_PRODUCT_SERVICE_DETAILS,
                    ),
                  },
                  {
                    name: 'Marcus Oyelaran',
                    role: 'MDes Student — Year 2',
                    timeline: steps(
                      ['Physical Prototyping', 'Digital Prototyping', 'Service Design', 'Business Modeling', 'Implementation', 'Capstone'],
                      4, MDES_PRODUCT_SERVICE_DETAILS,
                    ),
                  },
                  {
                    name: 'Lena Torres',
                    role: 'MDes Student — Year 1',
                    timeline: steps(
                      ['Physical Prototyping', 'Digital Prototyping', 'Service Design', 'Business Modeling', 'Implementation', 'Capstone'],
                      1, MDES_PRODUCT_SERVICE_DETAILS,
                    ),
                  },
                ],
              },
              {
                name: 'Innovation Strategy',
                people: [
                  {
                    name: 'Carlos Teixeira',
                    role: 'Charles L. Owen Professor of Systems Design',
                    timeline: steps(
                      ['Design Planning', 'Organizational Design', 'Platform Strategy', 'Design-Led Venture', 'Strategic Communication', 'Capstone'],
                      5, MDES_INNOVATION_DETAILS,
                    ),
                  },
                  {
                    name: 'Alex Rivera',
                    role: 'MDes Student — Year 2',
                    timeline: steps(
                      ['Design Planning', 'Organizational Design', 'Platform Strategy', 'Design-Led Venture', 'Strategic Communication', 'Capstone'],
                      3, MDES_INNOVATION_DETAILS,
                    ),
                  },
                ],
              },
            ],
            people: [],
          },
          {
            name: 'MS Strategic Design Leadership (formerly MDM)',
            people: [
              {
                name: 'Matt Mayfield',
                role: 'Assoc. Dean of Academics, MDes/MS-SDL Director',
                timeline: steps(
                  ['Design Thinking', 'Organizational Systems', 'Evidence-Based Design', 'Strategic Planning', 'Leadership Practicum', 'Capstone'],
                  5, MS_SDL_DETAILS,
                ),
              },
              {
                name: 'Anita Velasco',
                role: 'MS-SDL Student, VP Product at Accenture',
                timeline: steps(
                  ['Design Thinking', 'Organizational Systems', 'Evidence-Based Design', 'Strategic Planning', 'Leadership Practicum', 'Capstone'],
                  3, MS_SDL_DETAILS,
                ),
              },
              {
                name: 'David Okonkwo',
                role: 'MS-SDL Student, Design Director at Deloitte',
                timeline: steps(
                  ['Design Thinking', 'Organizational Systems', 'Evidence-Based Design', 'Strategic Planning', 'Leadership Practicum', 'Capstone'],
                  2, MS_SDL_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'MDes + MBA Dual Degree',
            people: [
              {
                name: 'Anijo Mathew',
                role: 'Dean, Institute of Design',
                timeline: steps(
                  ['Design Core', 'Business Foundations', 'Design Research', 'Marketing & Finance', 'Innovation Lab', 'Integrated Capstone'],
                  5,
                ),
              },
              {
                name: 'Sophie Lindgren',
                role: 'MDes+MBA Student — Year 2',
                timeline: steps(
                  ['Design Core', 'Business Foundations', 'Design Research', 'Marketing & Finance', 'Innovation Lab', 'Integrated Capstone'],
                  3,
                ),
              },
            ],
          },
          {
            name: 'PhD in Design',
            people: [
              {
                name: 'Carlos Teixeira',
                role: 'PhD Program Director',
                timeline: steps(
                  ['Design Theory', 'Research Methods', 'Doctoral Seminar I', 'Doctoral Seminar II', 'Dissertation Proposal', 'Dissertation Research', 'Defense'],
                  6, PHD_DESIGN_DETAILS,
                ),
              },
              {
                name: 'Weslynne Ashton',
                role: 'Professor, Environmental Mgmt & Sustainability',
                timeline: steps(
                  ['Design Theory', 'Research Methods', 'Doctoral Seminar I', 'Doctoral Seminar II', 'Dissertation Proposal', 'Dissertation Research', 'Defense'],
                  6, PHD_DESIGN_DETAILS,
                ),
              },
              {
                name: 'Ji-Yeon Kim',
                role: 'PhD Candidate — Year 4',
                timeline: steps(
                  ['Design Theory', 'Research Methods', 'Doctoral Seminar I', 'Doctoral Seminar II', 'Dissertation Proposal', 'Dissertation Research', 'Defense'],
                  5, PHD_DESIGN_DETAILS,
                ),
              },
              {
                name: 'Ravi Deshmukh',
                role: 'PhD Student — Year 2',
                timeline: steps(
                  ['Design Theory', 'Research Methods', 'Doctoral Seminar I', 'Doctoral Seminar II', 'Dissertation Proposal', 'Dissertation Research', 'Defense'],
                  2, PHD_DESIGN_DETAILS,
                ),
              },
            ],
          },
        ],
        cohorts: [
          {
            name: 'MDes — Fall 2025 Cohort (Year 2)',
            people: [
              {
                name: 'Priya Kapoor',
                role: 'Design Research Concentration',
                timeline: steps(
                  ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                  4, MDES_CORE_DETAILS,
                ),
              },
              {
                name: 'Marcus Oyelaran',
                role: 'Product-Service Concentration',
                timeline: steps(
                  ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                  4, MDES_CORE_DETAILS,
                ),
              },
              {
                name: 'Alex Rivera',
                role: 'Innovation Strategy Concentration',
                timeline: steps(
                  ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                  4, MDES_CORE_DETAILS,
                ),
              },
              {
                name: 'Hana Takahashi',
                role: 'Design Research Concentration',
                timeline: steps(
                  ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                  5, MDES_CORE_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'MDes — Fall 2026 Cohort (Year 1)',
            people: [
              {
                name: 'Noa Vardi',
                role: 'Foundation Sequence',
                timeline: steps(
                  ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                  2, MDES_CORE_DETAILS,
                ),
              },
              {
                name: 'Jordan Blake',
                role: 'Foundation Sequence',
                timeline: steps(
                  ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                  1, MDES_CORE_DETAILS,
                ),
              },
              {
                name: 'Lena Torres',
                role: 'Foundation Sequence',
                timeline: steps(
                  ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                  1, MDES_CORE_DETAILS,
                ),
              },
              {
                name: 'Ethan Okafor',
                role: 'Foundation Sequence',
                timeline: steps(
                  ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
                  2, MDES_CORE_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'MS-SDL — 2025 Cohort',
            people: [
              {
                name: 'Anita Velasco',
                role: 'VP Product, Accenture',
                timeline: steps(
                  ['Design Thinking', 'Organizational Systems', 'Evidence-Based Design', 'Strategic Planning', 'Leadership Practicum', 'Capstone'],
                  3, MS_SDL_DETAILS,
                ),
              },
              {
                name: 'David Okonkwo',
                role: 'Design Director, Deloitte',
                timeline: steps(
                  ['Design Thinking', 'Organizational Systems', 'Evidence-Based Design', 'Strategic Planning', 'Leadership Practicum', 'Capstone'],
                  2, MS_SDL_DETAILS,
                ),
              },
              {
                name: 'Rachel Nguyen',
                role: 'Sr. UX Manager, Google',
                timeline: steps(
                  ['Design Thinking', 'Organizational Systems', 'Evidence-Based Design', 'Strategic Planning', 'Leadership Practicum', 'Capstone'],
                  4, MS_SDL_DETAILS,
                ),
              },
            ],
          },
        ],
        capabilityGoals: [
          {
            name: 'Human-Centered Design',
            people: [
              {
                name: 'Priya Kapoor',
                role: 'MDes Year 2',
                timeline: steps(
                  ['Empathic Research', 'Inclusive Design', 'Participatory Methods', 'Ethical Practice', 'Impact Assessment'],
                  3, ID_HUMAN_CENTERED_DETAILS,
                ),
              },
              {
                name: 'Jordan Blake',
                role: 'MDes Year 1',
                timeline: steps(
                  ['Empathic Research', 'Inclusive Design', 'Participatory Methods', 'Ethical Practice', 'Impact Assessment'],
                  1, ID_HUMAN_CENTERED_DETAILS,
                ),
              },
              {
                name: 'Anita Velasco',
                role: 'MS-SDL Student',
                timeline: steps(
                  ['Empathic Research', 'Inclusive Design', 'Participatory Methods', 'Ethical Practice', 'Impact Assessment'],
                  3, ID_HUMAN_CENTERED_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'Systems Thinking & Complexity',
            people: [
              {
                name: 'Alex Rivera',
                role: 'MDes Year 2',
                timeline: steps(
                  ['System Mapping', 'Complexity Navigation', 'Stakeholder Analysis', 'Transition Design', 'Systemic Intervention'],
                  3, ID_SYSTEMS_THINKING_DETAILS,
                ),
              },
              {
                name: 'Ji-Yeon Kim',
                role: 'PhD Candidate',
                timeline: steps(
                  ['System Mapping', 'Complexity Navigation', 'Stakeholder Analysis', 'Transition Design', 'Systemic Intervention'],
                  4, ID_SYSTEMS_THINKING_DETAILS,
                ),
              },
              {
                name: 'Marcus Oyelaran',
                role: 'MDes Year 2',
                timeline: steps(
                  ['System Mapping', 'Complexity Navigation', 'Stakeholder Analysis', 'Transition Design', 'Systemic Intervention'],
                  2, ID_SYSTEMS_THINKING_DETAILS,
                ),
              },
            ],
          },
          {
            name: 'Making & Prototyping',
            people: [
              {
                name: 'Noa Vardi',
                role: 'MDes Year 1',
                timeline: steps(
                  ['Physical Making', 'Digital Fabrication', 'Experience Prototyping', 'Interactive Prototyping', 'Design Communication'],
                  1, ID_MAKING_PROTOTYPING_DETAILS,
                ),
              },
              {
                name: 'Lena Torres',
                role: 'MDes Year 1',
                timeline: steps(
                  ['Physical Making', 'Digital Fabrication', 'Experience Prototyping', 'Interactive Prototyping', 'Design Communication'],
                  1, ID_MAKING_PROTOTYPING_DETAILS,
                ),
              },
              {
                name: 'Marcus Oyelaran',
                role: 'MDes Year 2',
                timeline: steps(
                  ['Physical Making', 'Digital Fabrication', 'Experience Prototyping', 'Interactive Prototyping', 'Design Communication'],
                  4, ID_MAKING_PROTOTYPING_DETAILS,
                ),
              },
            ],
          },
        ],
      },
    ],
    programs: [
      {
        slug: 'mdes',
        name: 'Master of Design (MDes)',
        type: 'degree',
        description: 'Two-year graduate program with concentrations in design research, product-service delivery, and innovation strategy.',
        offeredBy: [{ orgSlug: 'iit-id', role: 'School' }],
        samplePeople: [
          {
            name: 'Noa Vardi',
            role: 'MDes Student — Year 1',
            timeline: steps(
              ['Observation & Inquiry', 'Synthesis & Framing', 'Prototyping & Testing', 'Systems & Complexity', 'Service Design', 'Design Planning'],
              2, MDES_CORE_DETAILS,
            ),
          },
          {
            name: 'Priya Kapoor',
            role: 'MDes Student — Year 2',
            timeline: steps(
              ['Ethnographic Methods', 'Generative Research', 'Behavioral Research', 'Synthesis Methods', 'Research Strategy', 'Research Leadership'],
              3, MDES_RESEARCH_DETAILS,
            ),
          },
        ],
      },
      {
        slug: 'ms-sdl',
        name: 'MS Strategic Design Leadership',
        type: 'degree',
        description: 'Part-time graduate program for working professionals — design thinking applied to organizational leadership.',
        offeredBy: [{ orgSlug: 'iit-id', role: 'School' }],
        samplePeople: [
          {
            name: 'Anita Velasco',
            role: 'MS-SDL Student, VP Product at Accenture',
            timeline: steps(
              ['Design Thinking', 'Organizational Systems', 'Evidence-Based Design', 'Strategic Planning', 'Leadership Practicum', 'Capstone'],
              3, MS_SDL_DETAILS,
            ),
          },
        ],
      },
      {
        slug: 'phd-design',
        name: 'PhD in Design',
        type: 'degree',
        description: 'Doctoral research program advancing design theory, methods, and knowledge — 4-5 years, dissertation-based.',
        offeredBy: [{ orgSlug: 'iit-id', role: 'School' }],
        samplePeople: [
          {
            name: 'Ji-Yeon Kim',
            role: 'PhD Candidate — Year 4',
            timeline: steps(
              ['Design Theory', 'Research Methods', 'Doctoral Seminar I', 'Doctoral Seminar II', 'Dissertation Proposal', 'Dissertation Research', 'Defense'],
              5, PHD_DESIGN_DETAILS,
            ),
          },
        ],
      },
    ],
    independentPractitioners: [
      {
        name: 'Nia Okafor',
        role: 'UX Design Lead — Freelance',
        timeline: steps(
          ['Bootcamp', 'Junior Designer', 'Mid-Level IC', 'Senior / Lead', 'Independent Practice'],
          4,
          [
            'UX/UI design bootcamp — research methods, Figma, prototyping fundamentals',
            'Junior product designer at a startup — shipping features, user testing',
            'Mid-level IC at a design agency — leading projects, mentoring juniors',
            'Senior UX lead — design systems, strategy, cross-functional leadership',
            'Independent UX consulting practice — healthcare and civic tech clients',
          ],
        ),
      },
      {
        name: 'Rafael Mendes',
        role: 'Service Designer — Social Impact',
        timeline: steps(
          ['Design Foundations', 'Community Research', 'Service Blueprinting', 'Policy Design', 'Systems Change'],
          2,
          [
            'Design thinking foundations — workshops, facilitation, human-centered methods',
            'Community-based participatory research — co-design with underserved populations',
            'Service blueprinting for municipal services — permitting, transit, social services',
            'Policy design — translating research insights into actionable policy recommendations',
            'Systems change initiatives — multi-stakeholder coalitions, collective impact',
          ],
        ),
      },
    ],
  },
  {
    slug: 'golf',
    name: 'Golf',
    color: '#1B5E20',
    icon: 'golf',
    organizations: [
      {
        slug: 'pga-academy',
        name: 'PGA Tour Academy',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'Junior Development',
            people: [
              {
                name: 'Coach Martinez',
                role: 'Head Pro',
                timeline: steps(['Grip & Stance', 'Short Game', 'Iron Play', 'Driving', 'Course Management', 'Tournament Prep'], 5),
              },
              {
                name: 'Ryan Park',
                role: 'Student',
                timeline: steps(['Grip & Stance', 'Short Game', 'Iron Play', 'Driving', 'Course Management', 'Tournament Prep'], 3),
              },
              {
                name: 'Mia Thompson',
                role: 'Student',
                timeline: steps(['Grip & Stance', 'Short Game', 'Iron Play', 'Driving', 'Course Management', 'Tournament Prep'], 2),
              },
            ],
          },
          {
            name: 'Adult Clinics',
            people: [
              {
                name: 'Sarah Collins',
                role: 'Instructor',
                timeline: steps(['Fundamentals', 'Putting', 'Chipping', 'Approach Shots', 'Full Swing', 'Playing Lessons'], 4),
              },
              {
                name: 'Greg Foster',
                role: 'Student',
                timeline: steps(['Fundamentals', 'Putting', 'Chipping', 'Approach Shots', 'Full Swing', 'Playing Lessons'], 1),
              },
            ],
          },
        ],
      },
    ],
    programs: [
      {
        slug: 'junior-development',
        name: 'Junior Development Program',
        type: 'training',
        description: 'Structured junior golf pathway — grip fundamentals through tournament preparation and competitive play.',
        offeredBy: [{ orgSlug: 'pga-academy', role: 'Academy' }],
        samplePeople: [
          {
            name: 'Ryan Park',
            role: 'Student',
            timeline: steps(['Grip & Stance', 'Short Game', 'Iron Play', 'Driving', 'Course Management', 'Tournament Prep'], 3),
          },
          {
            name: 'Mia Thompson',
            role: 'Student',
            timeline: steps(['Grip & Stance', 'Short Game', 'Iron Play', 'Driving', 'Course Management', 'Tournament Prep'], 2),
          },
        ],
      },
      {
        slug: 'adult-clinics',
        name: 'Adult Group Clinics',
        type: 'course',
        description: 'Beginner-to-intermediate group instruction — fundamentals, short game, full swing, and on-course play.',
        offeredBy: [{ orgSlug: 'pga-academy', role: 'Academy' }],
        samplePeople: [
          {
            name: 'Greg Foster',
            role: 'Student',
            timeline: steps(['Fundamentals', 'Putting', 'Chipping', 'Approach Shots', 'Full Swing', 'Playing Lessons'], 1),
          },
        ],
      },
    ],
    independentPractitioners: [
      {
        name: 'James Whitaker',
        role: 'Amateur Golfer — Handicap Tracker',
        timeline: steps(
          ['First Round', 'Handicap Index', 'Breaking 100', 'Breaking 90', 'Club Championship'],
          3,
          [
            'First full 18-hole round — learning etiquette and basic rules',
            'Established GHIN handicap index — tracking rounds and progress',
            'Consistently breaking 100 — improved short game and course management',
            'Working toward breaking 90 — iron consistency and putting drills',
            'Goal: compete in annual club championship',
          ],
        ),
      },
      {
        name: 'Priya Nair',
        role: 'Golf Fitness & Mental Game',
        timeline: steps(
          ['Flexibility Screen', 'Golf Fitness', 'Mental Game', 'Performance Tracking', 'Competition Prep'],
          2,
          [
            'TPI movement screen — identifying physical limitations affecting swing',
            'Golf-specific fitness program — rotational power, hip mobility, core stability',
            'Mental performance coaching — pre-shot routines, pressure management',
            'Tracking stats with Arccos — strokes gained analysis, practice priorities',
            'Preparing for USGA amateur qualifying events',
          ],
        ),
      },
    ],
  },
  {
    slug: 'health-and-fitness',
    name: 'Health & Fitness',
    color: '#2E7D32',
    icon: 'barbell',
    organizations: [
      // ── Exercise ──────────────────────────────────────────────
      {
        slug: 'ironworks-gym',
        name: 'Ironworks Performance Gym',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'Strength & Conditioning',
            people: [
              {
                name: 'Coach Davis',
                role: 'Head Coach',
                timeline: steps(['Assessment', 'Foundation Phase', 'Build Phase', 'Peak Phase', 'Competition', 'Recovery'], 4),
              },
              {
                name: 'Tanya Brooks',
                role: 'Athlete',
                timeline: steps(['Assessment', 'Foundation Phase', 'Build Phase', 'Peak Phase', 'Competition', 'Recovery'], 2),
              },
              {
                name: 'Derek Huang',
                role: 'Athlete',
                timeline: steps(['Assessment', 'Foundation Phase', 'Build Phase', 'Peak Phase', 'Competition', 'Recovery'], 3),
              },
            ],
          },
          {
            name: 'CrossFit Program',
            people: [
              {
                name: 'Jessica Morales',
                role: 'Coach',
                timeline: steps(['Foundations', 'Skill Work', 'MetCon', 'Gymnastics', 'Olympic Lifting', 'Competition'], 5),
              },
              {
                name: 'Tyler Ross',
                role: 'Athlete',
                timeline: steps(['Foundations', 'Skill Work', 'MetCon', 'Gymnastics', 'Olympic Lifting', 'Competition'], 1),
              },
            ],
          },
        ],
      },
      // ── Food & Nutrition ──────────────────────────────────────
      {
        slug: 'nourish-collective',
        name: 'Nourish Collective',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'Whole-Foods Nutrition',
            people: [
              {
                name: 'Dr. Amara Osei',
                role: 'Registered Dietitian',
                timeline: steps(['Intake Assessment', 'Meal Planning', 'Habit Building', 'Maintenance', 'Advanced Coaching'], 4),
              },
              {
                name: 'Liam Chen',
                role: 'Member',
                timeline: steps(['Intake Assessment', 'Meal Planning', 'Habit Building', 'Maintenance', 'Advanced Coaching'], 2),
              },
            ],
          },
          {
            name: 'Plant-Based Cooking',
            people: [
              {
                name: 'Chef Rosa Delgado',
                role: 'Instructor',
                timeline: steps(['Kitchen Basics', 'Seasonal Meals', 'Meal Prep Mastery', 'Fermentation', 'Teaching Others'], 4),
              },
              {
                name: 'Maya Patel',
                role: 'Student',
                timeline: steps(['Kitchen Basics', 'Seasonal Meals', 'Meal Prep Mastery', 'Fermentation', 'Teaching Others'], 1),
              },
            ],
          },
        ],
      },
      // ── Social Health ─────────────────────────────────────────
      {
        slug: 'harbor-community-center',
        name: 'Harbor Community Center',
        groupLabel: 'Groups',
        groups: [
          {
            name: 'Men\'s Wellness Circle',
            people: [
              {
                name: 'James Adler',
                role: 'Facilitator',
                timeline: steps(['Welcome Session', 'Story Sharing', 'Vulnerability Practice', 'Accountability Partners', 'Peer Leadership'], 4),
              },
              {
                name: 'Marcus Johnson',
                role: 'Member',
                timeline: steps(['Welcome Session', 'Story Sharing', 'Vulnerability Practice', 'Accountability Partners', 'Peer Leadership'], 2),
              },
            ],
          },
          {
            name: 'Intergenerational Connection',
            people: [
              {
                name: 'Eleanor Kim',
                role: 'Program Director',
                timeline: steps(['Orientation', 'Paired Activities', 'Community Projects', 'Storytelling Events', 'Ongoing Mentorship'], 3),
              },
              {
                name: 'David Okonkwo',
                role: 'Volunteer Mentor',
                timeline: steps(['Orientation', 'Paired Activities', 'Community Projects', 'Storytelling Events', 'Ongoing Mentorship'], 2),
              },
            ],
          },
        ],
      },
      // ── Spiritual Health ──────────────────────────────────────
      {
        slug: 'still-point-retreat',
        name: 'Still Point Retreat Center',
        groupLabel: 'Programs',
        groups: [
          {
            name: 'Mindfulness & Meditation',
            people: [
              {
                name: 'Roshi Anne Takahashi',
                role: 'Teacher',
                timeline: steps(['Breath Basics', 'Sitting Practice', 'Walking Meditation', 'Retreat Intensive', 'Daily Integration'], 4),
              },
              {
                name: 'Sam Rivera',
                role: 'Student',
                timeline: steps(['Breath Basics', 'Sitting Practice', 'Walking Meditation', 'Retreat Intensive', 'Daily Integration'], 1),
              },
            ],
          },
          {
            name: 'Contemplative Movement',
            people: [
              {
                name: 'Yuki Tanabe',
                role: 'Instructor',
                timeline: steps(['Gentle Yoga', 'Tai Chi Foundations', 'Qi Gong', 'Nature Walks', 'Silent Retreat'], 3),
              },
              {
                name: 'Grace Hernandez',
                role: 'Participant',
                timeline: steps(['Gentle Yoga', 'Tai Chi Foundations', 'Qi Gong', 'Nature Walks', 'Silent Retreat'], 2),
              },
            ],
          },
        ],
      },
    ],
    affiliations: [
      { name: 'Exercise', orgSlugs: ['ironworks-gym'] },
      { name: 'Food & Nutrition', orgSlugs: ['nourish-collective'] },
      { name: 'Social Health', orgSlugs: ['harbor-community-center'] },
      { name: 'Spiritual Health', orgSlugs: ['still-point-retreat'] },
    ],
    programs: [
      {
        slug: 'strength-conditioning',
        name: 'Strength & Conditioning',
        type: 'training',
        description: 'Periodized training program — assessment through competition, with structured build, peak, and recovery phases.',
        offeredBy: [{ orgSlug: 'ironworks-gym', role: 'Gym' }],
        samplePeople: [
          {
            name: 'Tanya Brooks',
            role: 'Athlete',
            timeline: steps(['Assessment', 'Foundation Phase', 'Build Phase', 'Peak Phase', 'Competition', 'Recovery'], 2),
          },
          {
            name: 'Derek Huang',
            role: 'Athlete',
            timeline: steps(['Assessment', 'Foundation Phase', 'Build Phase', 'Peak Phase', 'Competition', 'Recovery'], 3),
          },
        ],
      },
      {
        slug: 'crossfit-program',
        name: 'CrossFit Program',
        type: 'training',
        description: 'Functional fitness — foundations, gymnastics, Olympic lifting, and metabolic conditioning for competition readiness.',
        offeredBy: [{ orgSlug: 'ironworks-gym', role: 'Gym' }],
        samplePeople: [
          {
            name: 'Tyler Ross',
            role: 'Athlete',
            timeline: steps(['Foundations', 'Skill Work', 'MetCon', 'Gymnastics', 'Olympic Lifting', 'Competition'], 1),
          },
        ],
      },
      {
        slug: 'whole-foods-nutrition',
        name: 'Whole-Foods Nutrition',
        type: 'training',
        description: 'Guided nutrition journey — assessment, meal planning, habit building, and long-term maintenance with a registered dietitian.',
        offeredBy: [{ orgSlug: 'nourish-collective', role: 'Nutrition Center' }],
        samplePeople: [
          {
            name: 'Liam Chen',
            role: 'Member',
            timeline: steps(['Intake Assessment', 'Meal Planning', 'Habit Building', 'Maintenance', 'Advanced Coaching'], 2),
          },
        ],
      },
      {
        slug: 'mindfulness-meditation',
        name: 'Mindfulness & Meditation',
        type: 'training',
        description: 'From breath basics through retreat-level practice — a structured path to daily mindfulness integration.',
        offeredBy: [{ orgSlug: 'still-point-retreat', role: 'Retreat Center' }],
        samplePeople: [
          {
            name: 'Sam Rivera',
            role: 'Student',
            timeline: steps(['Breath Basics', 'Sitting Practice', 'Walking Meditation', 'Retreat Intensive', 'Daily Integration'], 1),
          },
        ],
      },
    ],
    independentPractitioners: [
      {
        name: 'Keiko Tanaka',
        role: 'Marathon Runner — Self-coached',
        timeline: steps(
          ['Base Building', '5K Race', 'Half Marathon', 'Marathon Training', 'BQ Attempt'],
          3,
          [
            'Aerobic base building — 30 mpw, easy runs, heart rate zone training',
            'First 5K race — 24:30, establishing race pacing and fueling strategy',
            'Half marathon training — 40 mpw, tempo runs, long run progression',
            'Marathon-specific block — 50+ mpw, MP workouts, nutrition dialed in',
            'Goal: Boston qualifying time at Chicago Marathon',
          ],
        ),
      },
      {
        name: 'Andre Williams',
        role: 'Home Gym — Powerlifting',
        timeline: steps(
          ['Starting Strength', 'Intermediate Program', 'Meet Prep', 'First Meet', 'Advanced Programming'],
          2,
          [
            'Starting Strength linear progression — squat, bench, deadlift 3x/week',
            'Intermediate programming — Texas Method, weekly periodization, accessory work',
            'Meet preparation — peaking cycle, attempt selection, competition commands',
            'First USAPL sanctioned meet — 3 lifts, weight class debut',
            'Advanced programming — conjugate and block periodization, coaching others',
          ],
        ),
      },
      {
        name: 'Sofia Reyes',
        role: 'Yoga & Mobility — Wellness Coach',
        timeline: steps(
          ['Personal Practice', 'Teacher Training', 'Specialty Certs', 'Studio Launch', 'Online Programs'],
          3,
          [
            'Consistent daily yoga practice — Vinyasa and Yin, 2 years of dedicated study',
            '200-hour RYT teacher training — anatomy, sequencing, philosophy, teaching practicum',
            'Specialty certifications — prenatal yoga, trauma-sensitive yoga, mobility coaching',
            'Launching small studio — class programming, community building, workshops',
            'Goal: online mobility programs for desk workers and athletes',
          ],
        ),
      },
      {
        name: 'Priya Sharma',
        role: 'Holistic Wellness — Nutrition & Meditation',
        timeline: steps(
          ['Food Journal', 'Elimination Diet', 'Meditation Practice', 'Ayurvedic Study', 'Wellness Coaching'],
          3,
          [
            'Tracking food intake, energy levels, and mood patterns for 30 days',
            'Identifying food sensitivities — systematic elimination and reintroduction protocol',
            'Daily meditation practice — 20 minutes Vipassana, journaling insights',
            'Studying Ayurvedic nutrition principles — seasonal eating, dosha-based meal plans',
            'Goal: guiding others through holistic food and mindfulness wellness',
          ],
        ),
      },
    ],
  },
];

export function getInterest(slug: string): SampleInterest | undefined {
  return SAMPLE_INTERESTS.find((i) => i.slug === slug);
}

export function getOrganization(interestSlug: string, orgSlug: string): SampleOrganization | undefined {
  const interest = getInterest(interestSlug);
  return interest?.organizations.find((o) => o.slug === orgSlug);
}

/** Generate a URL-friendly slug from a person's name */
export function personSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Find a person across all sample data by name slug.
 *  Returns the person plus all interest/org contexts they appear in. */
export interface PersonSearchResult {
  person: SamplePerson;
  contexts: Array<{
    interestSlug: string;
    interestName: string;
    interestColor: string;
    orgSlug?: string;       // undefined = personal interest
    orgName?: string;
    role?: string;          // role within this context
    timeline?: SampleTimelineStep[]; // per-interest timeline (for personal interests)
    isPersonal?: boolean;
  }>;
}

export function findPersonBySlug(slug: string): PersonSearchResult | undefined {
  let matchedPerson: SamplePerson | undefined;
  const contexts: PersonSearchResult['contexts'] = [];

  for (const interest of SAMPLE_INTERESTS) {
    for (const org of interest.organizations) {
      const allPeople: SamplePerson[] = [];

      // Collect from groups
      for (const group of org.groups) {
        allPeople.push(...group.people);
        if (group.subgroups) {
          for (const sub of group.subgroups) {
            allPeople.push(...sub.people);
          }
        }
      }
      // Collect from cohorts
      if (org.cohorts) {
        for (const cohort of org.cohorts) {
          allPeople.push(...cohort.people);
        }
      }
      // Collect from capability goals
      if (org.capabilityGoals) {
        for (const goal of org.capabilityGoals) {
          allPeople.push(...goal.people);
        }
      }

      for (const person of allPeople) {
        if (personSlug(person.name) === slug) {
          if (!matchedPerson) matchedPerson = person;
          // Avoid duplicate contexts (same person may appear in groups + cohorts of same org)
          if (!contexts.some((c) => c.interestSlug === interest.slug && c.orgSlug === org.slug)) {
            contexts.push({
              interestSlug: interest.slug,
              interestName: interest.name,
              interestColor: interest.color,
              orgSlug: org.slug,
              orgName: org.name,
              role: person.role,
            });
          }
        }
      }
    }

    // Search programs
    if (interest.programs) {
      for (const program of interest.programs) {
        for (const person of program.samplePeople) {
          if (personSlug(person.name) === slug) {
            if (!matchedPerson) matchedPerson = person;
            if (!contexts.some((c) => c.interestSlug === interest.slug && c.orgName === program.name)) {
              contexts.push({
                interestSlug: interest.slug,
                interestName: interest.name,
                interestColor: interest.color,
                orgName: program.name,
                role: person.role,
              });
            }
          }
        }
      }
    }

    // Search independent practitioners
    if (interest.independentPractitioners) {
      for (const person of interest.independentPractitioners) {
        if (personSlug(person.name) === slug) {
          if (!matchedPerson) matchedPerson = person;
          if (!contexts.some((c) => c.interestSlug === interest.slug && !c.orgSlug && !c.isPersonal)) {
            contexts.push({
              interestSlug: interest.slug,
              interestName: interest.name,
              interestColor: interest.color,
              role: person.role,
            });
          }
        }
      }
    }
  }

  if (!matchedPerson) return undefined;

  // Add personal interests as contexts (no org)
  if (matchedPerson.personalInterests) {
    for (const pi of matchedPerson.personalInterests) {
      const interest = SAMPLE_INTERESTS.find((i) => i.slug === pi.interestSlug);
      if (interest) {
        contexts.push({
          interestSlug: interest.slug,
          interestName: interest.name,
          interestColor: interest.color,
          role: pi.role,
          timeline: pi.timeline,
          isPersonal: true,
        });
      }
    }
  }

  return { person: matchedPerson, contexts };
}
