-- ============================================================================
-- Seed: Nursing Courses & Lessons (24 lessons, 5 courses)
-- ============================================================================
-- Populates the betterat_courses and betterat_lessons tables with the
-- JHU MSN nursing curriculum aligned to the Med-Surg competency framework.
-- These lessons are pre-shift preparation tools — students review before
-- clinical shifts to prepare for competency demonstration.
-- ============================================================================

-- =============================================================================
-- 1. Insert 5 Nursing Courses
-- =============================================================================

INSERT INTO betterat_courses (id, interest_id, title, description, level, topic, sort_order, lesson_count, published)
VALUES
  ('d1000000-0000-0000-0000-000000000001', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Foundations of Patient Assessment',
   'Master the systematic approach to patient assessment — from head-to-toe surveys to focused system assessments using validated clinical tools.',
   'beginner', 'Assessment', 1, 7, true),

  ('d1000000-0000-0000-0000-000000000002', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Medication Administration',
   'Safe medication practices from the 6 Rights through IV administration. Build confidence before your first solo med pass.',
   'beginner', 'Medication', 2, 5, true),

  ('d1000000-0000-0000-0000-000000000003', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures',
   'Step-by-step procedural skills — catheterization, wound care, IV access, and specialty tube management.',
   'intermediate', 'Procedures', 3, 5, true),

  ('d1000000-0000-0000-0000-000000000004', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Patient Care Management',
   'From admission to discharge — documentation, handoff communication, care planning, and patient education.',
   'intermediate', 'Care Management', 4, 5, true),

  ('d1000000-0000-0000-0000-000000000005', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Reasoning & Emergency Response',
   'Recognize deterioration, prioritize multi-patient care, interpret labs, and respond to codes. The skills that define clinical judgment.',
   'advanced', 'Critical Thinking', 5, 4, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  lesson_count = EXCLUDED.lesson_count,
  published = EXCLUDED.published,
  updated_at = now();

-- =============================================================================
-- 2. Insert 24 Nursing Lessons
-- =============================================================================

-- ---------- Course 1: Foundations of Patient Assessment (7 lessons) ----------

INSERT INTO betterat_lessons (id, course_id, title, description, lesson_data, interactive_type, sort_order, published)
VALUES
  -- 1.1 Head-to-Toe Assessment
  ('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001',
   'The Head-to-Toe Assessment',
   'Master the systematic approach to comprehensive patient assessment. Learn the sequence, normal findings, and red flags for each body system.',
   '{
     "lessonId": "nursing-1-1",
     "competencyIds": [1],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "General Survey", "description": "Assess overall appearance, behavior, and vital signs before hands-on assessment.", "details": ["Level of consciousness and orientation", "Skin color, moisture, and temperature", "Posture, gait, and mobility", "Signs of distress or pain"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 2, "label": "Head & Neck", "description": "Inspect and palpate head, eyes, ears, nose, throat, and neck structures.", "details": ["PERRLA — pupils equal, round, reactive to light and accommodation", "Oral mucosa moisture and color", "Neck ROM, JVD assessment", "Lymph node palpation"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 3, "label": "Chest & Lungs", "description": "Auscultate lung sounds bilaterally in all fields.", "details": ["Anterior and posterior auscultation", "Normal: vesicular, bronchial, bronchovesicular", "Adventitious: crackles, wheezes, rhonchi, stridor", "Symmetry of chest expansion"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 4, "label": "Cardiovascular", "description": "Auscultate heart sounds at 5 anatomical landmarks.", "details": ["Aortic, pulmonic, Erb point, tricuspid, mitral", "S1 and S2 identification", "Check for murmurs, gallops, rubs", "Peripheral pulse assessment and capillary refill"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 5, "label": "Abdomen", "description": "Inspect, auscultate, percuss, and palpate all four quadrants.", "details": ["Always auscultate BEFORE palpation", "Bowel sounds: present, absent, hyperactive, hypoactive", "Tenderness, guarding, rigidity", "Liver and spleen assessment"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 6, "label": "Extremities & Neurological", "description": "Assess motor and sensory function, reflexes, and peripheral circulation.", "details": ["Muscle strength grading (0-5)", "Sensation to light touch", "Deep tendon reflexes", "Edema assessment (+1 to +4)", "Pulses: radial, pedal, posterior tibial"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 7, "label": "Documentation", "description": "Document findings systematically using your facility EHR template.", "details": ["Document normal AND abnormal findings", "Use objective, measurable terms", "Note patient-reported symptoms vs observed signs", "Flag critical findings for immediate provider notification"], "action": "DOCUMENT", "criticalAction": false, "competencyArea": "Assessment"}
     ]
   }'::jsonb,
   'body-assessment', 1, true),

  -- 1.2 Focused Respiratory Assessment
  ('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001',
   'Focused Respiratory Assessment',
   'Develop systematic auscultation skills. Learn stethoscope placement, normal vs adventitious breath sounds, and when to escalate.',
   '{
     "lessonId": "nursing-1-2",
     "competencyIds": [2],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Patient Positioning", "description": "Position patient upright (45-90 degrees) for optimal lung expansion.", "details": ["Expose posterior chest while maintaining dignity", "Ask patient to breathe deeply through mouth", "Compare bilateral findings"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 2, "label": "Posterior Auscultation", "description": "Listen to 6 paired positions on posterior chest, comparing side to side.", "details": ["Start at apices above scapulae", "Move down in zigzag pattern", "Listen for one full breath cycle per position", "Note: vesicular sounds are normal in periphery"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 3, "label": "Anterior Auscultation", "description": "Auscultate 4 paired positions on anterior chest.", "details": ["Apices above clavicles", "2nd-3rd intercostal spaces", "4th-5th intercostal spaces", "Bronchial sounds normal only over trachea"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 4, "label": "Identify Adventitious Sounds", "description": "Recognize abnormal breath sounds and their clinical significance.", "details": ["Crackles (fine/coarse): fluid, atelectasis", "Wheezes: bronchospasm, obstruction", "Rhonchi: secretions in large airways", "Stridor: upper airway obstruction — EMERGENCY", "Pleural friction rub: pleurisy"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Assessment"},
       {"stepNumber": 5, "label": "Respiratory Assessment Extras", "description": "Complete the respiratory picture with SpO2, rate, and work of breathing.", "details": ["SpO2 target >94% (unless COPD: >88%)", "Respiratory rate (normal 12-20)", "Use of accessory muscles", "Cough quality and sputum character"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Assessment"}
     ]
   }'::jsonb,
   'auscultation-simulator', 2, true),

  -- 1.3 Focused Cardiac Assessment
  ('d2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001',
   'Focused Cardiac Assessment',
   'Auscultate heart sounds at 5 key anatomical landmarks. Differentiate normal S1/S2 from murmurs, gallops, and rubs.',
   '{
     "lessonId": "nursing-1-3",
     "competencyIds": [3],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "5 Auscultation Points", "description": "Identify and auscultate at all 5 cardiac landmarks.", "details": ["Aortic: 2nd ICS, right sternal border", "Pulmonic: 2nd ICS, left sternal border", "Erb point: 3rd ICS, left sternal border", "Tricuspid: 4th ICS, left sternal border", "Mitral (apex): 5th ICS, midclavicular line"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 2, "label": "Normal Heart Sounds", "description": "Identify S1 (lub) and S2 (dub) and their normal characteristics.", "details": ["S1: closure of mitral and tricuspid valves — loudest at apex", "S2: closure of aortic and pulmonic valves — loudest at base", "Normal splitting of S2 during inspiration", "Rate and rhythm assessment"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 3, "label": "Abnormal Heart Sounds", "description": "Recognize murmurs, gallops (S3/S4), and pericardial friction rubs.", "details": ["S3 gallop: heart failure (ventricular overload)", "S4 gallop: stiff ventricle (hypertension, cardiomyopathy)", "Murmurs: grade I-VI, timing (systolic vs diastolic)", "Friction rub: pericarditis"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Assessment"},
       {"stepNumber": 4, "label": "Peripheral Vascular Assessment", "description": "Assess peripheral pulses, capillary refill, and signs of vascular insufficiency.", "details": ["Pulse strength: 0 (absent) to 3+ (bounding)", "Capillary refill: normal <3 seconds", "Edema grading: +1 (2mm) to +4 (8mm)", "JVD assessment at 45 degrees"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 5, "label": "Rhythm Strip Basics", "description": "Introduction to ECG rhythm interpretation for bedside monitoring.", "details": ["Normal sinus rhythm identification", "Sinus bradycardia and tachycardia", "Atrial fibrillation: irregularly irregular", "When to call a rapid response: new onset arrhythmia with symptoms"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Assessment"}
     ]
   }'::jsonb,
   'heart-sounds', 3, true),

  -- 1.4 Focused Neurological Assessment
  ('d2000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001',
   'Focused Neurological Assessment',
   'Perform a rapid neurological assessment using the Glasgow Coma Scale, pupil assessment, and motor/sensory screening.',
   '{
     "lessonId": "nursing-1-4",
     "competencyIds": [4],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Glasgow Coma Scale", "description": "Assess and score three components: Eye, Verbal, Motor.", "details": ["Eye opening: spontaneous (4), to voice (3), to pain (2), none (1)", "Verbal: oriented (5), confused (4), inappropriate words (3), incomprehensible (2), none (1)", "Motor: obeys commands (6), localizes pain (5), withdrawal (4), flexion (3), extension (2), none (1)", "Total GCS range: 3-15. Report as E_V_M_ format"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Assessment"},
       {"stepNumber": 2, "label": "Pupil Assessment", "description": "Assess pupil size, shape, equality, and reactivity to light.", "details": ["PERRLA documentation", "Normal pupil size: 2-6mm", "Anisocoria (unequal pupils): may indicate increased ICP", "Fixed, dilated pupils: neurological emergency"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Assessment"},
       {"stepNumber": 3, "label": "Motor & Sensory Screening", "description": "Assess strength, sensation, and coordination bilaterally.", "details": ["Hand grip and foot dorsiflexion bilaterally", "Muscle strength grading 0-5", "Light touch sensation in all extremities", "Pronator drift test for subtle weakness"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 4, "label": "Stroke Assessment (FAST)", "description": "Rapid stroke screening using FAST protocol plus additional signs.", "details": ["Face: ask to smile, look for asymmetry", "Arms: raise both, look for drift", "Speech: ask to repeat a sentence, note slurring", "Time: note symptom onset time — critical for tPA window", "Additional: sudden severe headache, vision changes, dizziness"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Assessment"}
     ]
   }'::jsonb,
   'gcs-calculator', 4, true),

  -- 1.5 Focused Abdominal Assessment
  ('d2000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001',
   'Focused Abdominal Assessment',
   'Systematic quadrant-by-quadrant abdominal assessment — inspection, auscultation, percussion, and palpation in the correct order.',
   '{
     "lessonId": "nursing-1-5",
     "competencyIds": [5],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Inspection", "description": "Visually assess the abdomen for contour, symmetry, and visible abnormalities.", "details": ["Flat, rounded, distended, or scaphoid", "Scars, striae, visible peristalsis", "Umbilicus: position, hernia", "Skin color changes"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 2, "label": "Auscultation", "description": "Listen in all 4 quadrants BEFORE palpation. Palpation can alter bowel sounds.", "details": ["Listen 5 seconds minimum per quadrant", "Normal: 5-35 clicks/gurgles per minute", "Hyperactive: high-pitched, frequent (diarrhea, early obstruction)", "Hypoactive/absent: listen full 5 minutes before documenting absent (ileus, post-op)"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Assessment"},
       {"stepNumber": 3, "label": "Percussion", "description": "Percuss to assess organ size and detect fluid or gas.", "details": ["Tympany: normal over gas-filled bowel", "Dullness: over solid organs (liver, spleen) or fluid", "Shifting dullness: suggests ascites", "Liver span: 6-12 cm at right MCL"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 4, "label": "Palpation", "description": "Light then deep palpation in all 4 quadrants. Save tender areas for last.", "details": ["Light palpation first: 1-2 cm depth", "Deep palpation: 4-6 cm depth", "Assess for tenderness, guarding, rigidity, rebound", "Rebound tenderness: suggests peritoneal irritation — notify provider immediately"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Assessment"}
     ]
   }'::jsonb,
   'abdomen-quadrants', 5, true),

  -- 1.6 Pain Assessment Tools
  ('d2000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000001',
   'Pain Assessment Tools',
   'Compare validated pain scales — Numeric Rating, Wong-Baker FACES, FLACC, and CPOT. Match the right tool to the right patient.',
   '{
     "lessonId": "nursing-1-6",
     "competencyIds": [6],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Numeric Rating Scale (NRS)", "description": "0-10 self-report scale for alert, oriented, communicative adults.", "details": ["0 = no pain, 10 = worst pain imaginable", "Ask: onset, location, duration, character, aggravating/alleviating factors", "Reassess within 30-60 min of intervention", "Document: pain level, intervention, reassessment result"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 2, "label": "Wong-Baker FACES Scale", "description": "Visual scale for pediatric patients (3+ years) or adults with communication barriers.", "details": ["6 faces from smiling (0) to crying (10)", "Patient points to face matching their pain", "Useful for language barriers, cognitive impairment", "Do not assume pain level from facial expression alone"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 3, "label": "FLACC Scale (Behavioral)", "description": "Observational scale for infants, preverbal children, or nonverbal patients.", "details": ["Face, Legs, Activity, Cry, Consolability", "Each category scored 0-2, total 0-10", "Used for post-surgical and procedural pain in pediatrics", "Requires 1-5 minutes of observation"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 4, "label": "CPOT (Critical Care)", "description": "Critical-Care Pain Observation Tool for intubated or sedated ICU patients.", "details": ["Facial expression, body movements, muscle tension, ventilator compliance (or vocalization)", "Each scored 0-2, total 0-8", "Score ≥3 suggests significant pain", "Essential for patients who cannot self-report"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 5, "label": "Choosing the Right Tool", "description": "Match assessment tool to patient population and clinical context.", "details": ["Alert adult → NRS", "Pediatric (3-7 yrs) or language barrier → FACES", "Infant/nonverbal → FLACC", "Intubated/sedated → CPOT", "Document: tool used, score, timing, intervention, reassessment"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Assessment"}
     ]
   }'::jsonb,
   'pain-scale-comparison', 6, true),

  -- 1.7 Fall Risk & Skin Assessment
  ('d2000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000001',
   'Fall Risk & Skin Assessment',
   'Use the Morse Fall Scale and Braden Scale to assess and mitigate patient safety risks. Auto-score patient scenarios.',
   '{
     "lessonId": "nursing-1-7",
     "competencyIds": [7, 8],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Morse Fall Scale", "description": "Score 6 risk factors to determine fall risk level.", "details": ["History of falling (25 pts)", "Secondary diagnosis (15 pts)", "Ambulatory aid (0-30 pts)", "IV/heparin lock (20 pts)", "Gait (0-20 pts)", "Mental status (0-15 pts)", "Score: 0-24 low, 25-44 moderate, ≥45 high"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 2, "label": "Fall Prevention Interventions", "description": "Implement appropriate interventions based on risk level.", "details": ["Low risk: standard precautions, orientation to room", "Moderate: fall risk bracelet, bed alarm, assist with ambulation", "High: all above + 1:1 sitter consideration, non-skid footwear, toileting schedule", "Document interventions and patient/family education"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 3, "label": "Braden Scale", "description": "Assess pressure injury risk across 6 subscales.", "details": ["Sensory perception (1-4)", "Moisture (1-4)", "Activity (1-4)", "Mobility (1-4)", "Nutrition (1-4)", "Friction and shear (1-3)", "Total: 6-23. ≤18 = at risk, ≤12 = high risk, ≤9 = very high risk"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Assessment"},
       {"stepNumber": 4, "label": "Skin Assessment & Staging", "description": "Identify and stage pressure injuries using NPUAP classification.", "details": ["Stage 1: nonblanchable erythema of intact skin", "Stage 2: partial-thickness skin loss (blister/shallow crater)", "Stage 3: full-thickness skin loss (visible fat)", "Stage 4: full-thickness tissue loss (exposed bone/tendon/muscle)", "Unstageable: base covered by slough or eschar", "Document: location, size, stage, wound bed, drainage, odor"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Assessment"}
     ]
   }'::jsonb,
   'fall-risk-braden-calculator', 7, true),

-- ---------- Course 2: Medication Administration (5 lessons) ----------

  -- 2.1 The 6 Rights
  ('d2000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000002',
   'The 6 Rights of Medication Administration',
   'The foundation of safe medication practice. Walk through verification of each Right and practice flagging errors in realistic scenarios.',
   '{
     "lessonId": "nursing-2-1",
     "competencyIds": [9],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Right Patient", "description": "Verify patient identity using two identifiers before EVERY medication.", "details": ["Ask patient to state full name and date of birth", "Scan wristband barcode", "Never use room number as identifier", "Alert patient in isolation still requires full verification"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 2, "label": "Right Medication", "description": "Verify the correct drug against the MAR and provider order.", "details": ["Check medication name (generic AND brand)", "Verify no allergy conflicts", "Check for look-alike/sound-alike confusion", "Three-check process: when pulling, when preparing, when administering"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 3, "label": "Right Dose", "description": "Verify dose calculation, concentration, and amount.", "details": ["Compare ordered dose to what you have in hand", "Calculate if necessary (weight-based dosing)", "When in doubt, have a second nurse verify", "High-alert medications always require independent double-check"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 4, "label": "Right Route", "description": "Verify administration route matches the order and formulation.", "details": ["PO, SL, IV, IM, SubQ, topical, rectal, inhaled", "Never crush enteric-coated or extended-release tablets", "Verify IV compatibility before mixing", "Check tube placement for enteral medications"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 5, "label": "Right Time", "description": "Administer within the facility-defined time window.", "details": ["Standard window: 30 minutes before or after scheduled time", "Time-critical meds: within 30 minutes (antibiotics, anticoagulants)", "PRN: verify interval since last dose", "Stat: administer immediately"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 6, "label": "Right Documentation", "description": "Document administration immediately after giving the medication.", "details": ["Document: medication, dose, route, time, site (for injections)", "Document patient response and any adverse reactions", "Never pre-chart medications", "If held or refused: document reason and notify provider"], "action": "DOCUMENT", "criticalAction": true, "competencyArea": "Medication"}
     ]
   }'::jsonb,
   'med-pass-walkthrough', 1, true),

  -- 2.2 Injection Techniques
  ('d2000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000002',
   'Injection Techniques',
   'Compare subcutaneous and intramuscular injection techniques. Learn site selection, angle, depth, and aspiration guidelines.',
   '{
     "lessonId": "nursing-2-2",
     "competencyIds": [10, 11],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Subcutaneous Injection", "description": "Technique for medications absorbed through fatty tissue.", "details": ["Sites: abdomen (preferred), upper arm, thigh", "Angle: 45-90 degrees depending on tissue depth", "Needle: 25-30 gauge, 3/8 to 5/8 inch", "Pinch 1 inch of skin, insert smoothly", "Do NOT aspirate for SubQ injections", "Common SubQ meds: insulin, heparin, enoxaparin"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Medication"},
       {"stepNumber": 2, "label": "Intramuscular Injection", "description": "Technique for medications requiring deeper tissue absorption.", "details": ["Sites: ventrogluteal (preferred), deltoid, vastus lateralis", "Angle: 90 degrees", "Needle: 21-25 gauge, 1 to 1.5 inch", "Spread skin taut or use Z-track technique", "Aspirate only for dorsogluteal site (rarely used)", "Common IM meds: vaccines, B12, antibiotics, antipsychotics"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Medication"},
       {"stepNumber": 3, "label": "Site Selection & Rotation", "description": "Choose appropriate injection site based on medication, volume, and patient factors.", "details": ["Deltoid: max 1mL volume", "Ventrogluteal: up to 3mL, safest IM site", "Vastus lateralis: up to 3mL, preferred for infants", "Rotate sites to prevent lipohypertrophy (insulin)", "Avoid scarred, bruised, or edematous tissue"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Medication"},
       {"stepNumber": 4, "label": "Safety & Complications", "description": "Recognize and prevent injection complications.", "details": ["Never recap needles — activate safety device immediately", "Nerve injury signs: sharp radiating pain, numbness", "Hematoma: apply pressure, monitor", "Abscess: redness, warmth, swelling — report to provider", "Anaphylaxis: know emergency protocol, keep epinephrine accessible"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"}
     ]
   }'::jsonb,
   'injection-comparison', 2, true),

  -- 2.3 IV Push & Piggyback
  ('d2000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000002',
   'IV Push & Piggyback Medications',
   'Master IV medication administration — dilution, rate calculations, compatibility checks, and the push vs piggyback decision.',
   '{
     "lessonId": "nursing-2-3",
     "competencyIds": [12, 13],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "IV Push Technique", "description": "Administer medication directly into IV line over specified time.", "details": ["Verify IV patency: flush with NS, assess for infiltration", "Check push rate in drug reference (e.g., Dilaudid 1mg over 2-3 min)", "Administer slowly, pausing to assess patient response", "Flush with NS after administration", "High-alert: always have second nurse verify"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 2, "label": "IV Piggyback (IVPB)", "description": "Infuse medication via secondary line over 30-60 minutes.", "details": ["Hang IVPB higher than primary bag", "Set correct infusion rate on pump", "Label with medication, dose, time, rate", "Monitor for adverse reactions during first 15 minutes", "Common IVPB: antibiotics, electrolyte replacements"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Medication"},
       {"stepNumber": 3, "label": "Compatibility & Safety", "description": "Verify drug compatibility before mixing or running together.", "details": ["Check IV compatibility reference before Y-site administration", "Incompatible drugs: flush between medications", "Never mix medications in same syringe without verification", "Monitor IV site for phlebitis: pain, redness, swelling along vein"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 4, "label": "Rate Calculations", "description": "Calculate drip rates for gravity and pump-controlled infusions.", "details": ["mL/hr = total volume / total time in hours", "gtts/min = (volume × drop factor) / time in minutes", "Common drop factors: 10, 15, 20 (macro), 60 (micro)", "Always double-check calculations for high-alert medications"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Medication"}
     ]
   }'::jsonb,
   'iv-administration', 3, true),

  -- 2.4 PRN Medication Decision-Making
  ('d2000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000002',
   'PRN Medication Decision-Making',
   'Clinical reasoning for as-needed medications. Assess, decide, administer, and reassess — the complete PRN cycle.',
   '{
     "lessonId": "nursing-2-4",
     "competencyIds": [14],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Assessment Before PRN", "description": "Perform focused assessment before administering any PRN medication.", "details": ["Pain: location, quality, intensity (use appropriate scale)", "Nausea: onset, triggers, last meal, bowel sounds", "Anxiety: precipitating factors, vital signs, breathing pattern", "Insomnia: time, environmental factors, pain, anxiety"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Medication"},
       {"stepNumber": 2, "label": "Decision Framework", "description": "Apply clinical reasoning to choose the appropriate PRN medication.", "details": ["Check: when was last dose given? Is interval met?", "Check: are there non-pharmacological alternatives to try first?", "Check: which PRN order best matches the assessment?", "Check: any contraindications based on current status?", "Escalation: if maximum PRN doses given without relief, notify provider"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 3, "label": "Administration", "description": "Administer the selected PRN medication using standard safety checks.", "details": ["Apply all 6 Rights", "Educate patient: what the medication is, expected effects, side effects", "Position appropriately (e.g., elevate HOB for anti-emetic)", "Set reassessment reminder"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Medication"},
       {"stepNumber": 4, "label": "Reassessment", "description": "Evaluate medication effectiveness within appropriate timeframe.", "details": ["PO pain medication: reassess in 30-60 minutes", "IV pain medication: reassess in 15-30 minutes", "Anti-emetic: reassess in 30 minutes", "Document: medication given, time, reassessment findings", "If ineffective: consider alternative PRN or notify provider"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Medication"}
     ]
   }'::jsonb,
   'prn-scenario-player', 4, true),

  -- 2.5 Dosage Calculations & Safety
  ('d2000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000002',
   'Dosage Calculations & Safety',
   'Practice weight-based dosing, concentration calculations, and drip rates. Step-by-step solutions build confidence for clinical math.',
   '{
     "lessonId": "nursing-2-5",
     "competencyIds": [],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Dimensional Analysis", "description": "Master the universal method for medication calculations.", "details": ["Set up: what you want / what you have", "Cancel units across fractions", "Example: Order 500mg, have 250mg/5mL → (500mg × 5mL) / 250mg = 10mL", "Always include units in every step"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Medication"},
       {"stepNumber": 2, "label": "Weight-Based Dosing", "description": "Calculate doses based on patient weight in kg.", "details": ["Convert lbs to kg: weight in lbs / 2.2", "Multiply: dose per kg × patient weight", "Example: Order 5mg/kg, patient 70kg → 350mg", "Check against maximum dose range", "Pediatric and critical care meds almost always weight-based"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Medication"},
       {"stepNumber": 3, "label": "IV Drip Rate Calculations", "description": "Calculate mL/hr and gtts/min for IV infusions.", "details": ["mL/hr = total volume (mL) / total time (hours)", "gtts/min = (volume × drop factor) / time (min)", "Concentration: mcg/kg/min calculations for critical drips", "Example: 500mL over 4 hours = 125 mL/hr", "Micro drip (60 gtts/mL): gtts/min = mL/hr"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Medication"},
       {"stepNumber": 4, "label": "High-Alert Medication Safety", "description": "Extra precautions for medications with high risk of harm.", "details": ["ISMP high-alert list: insulin, opioids, anticoagulants, chemotherapy", "Independent double-check required: two nurses verify calculation independently", "Tall Man lettering: DOBUTamine vs DOPamine", "Smart pump guardrails: never override without clinical justification", "If calculation seems wrong: STOP, recalculate, ask a colleague"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Medication"}
     ]
   }'::jsonb,
   'dosage-calculator', 5, true),

-- ---------- Course 3: Clinical Procedures (5 lessons) ----------

  -- 3.1 Foley Catheter
  ('d2000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000003',
   'Foley Catheter: Insertion & Removal',
   'Step-by-step sterile catheterization technique and safe removal procedure. Emphasis on infection prevention.',
   '{
     "lessonId": "nursing-3-1",
     "competencyIds": [15, 16],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Preparation & Sterile Field", "description": "Gather supplies and establish sterile technique.", "details": ["Explain procedure and obtain consent", "Perform hand hygiene, apply clean gloves for perineal care", "Clean perineal area thoroughly", "Open catheter kit maintaining sterile field", "Apply sterile gloves using open gloving technique"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Procedures"},
       {"stepNumber": 2, "label": "Insertion — Female", "description": "Identify landmarks and insert catheter using sterile technique.", "details": ["Non-dominant hand: spread labia (this hand is now contaminated)", "Dominant hand remains sterile throughout", "Cleanse: anterior to posterior, single swipe per swab", "Identify urethral meatus (above vaginal opening)", "Insert catheter 2-3 inches until urine flows", "Advance 1 additional inch after urine appears"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Procedures"},
       {"stepNumber": 3, "label": "Insertion — Male", "description": "Catheterization technique accounting for male anatomy.", "details": ["Hold penis at 90-degree angle to straighten urethra", "Retract foreskin if uncircumcised (replace after procedure)", "Cleanse: circular motion from meatus outward", "Insert catheter 6-8 inches until urine flows", "Resistance at prostate: gentle steady pressure, ask patient to breathe", "Never force — if unable to pass, stop and notify provider"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Procedures"},
       {"stepNumber": 4, "label": "Secure & Document", "description": "Inflate balloon, secure catheter, and connect drainage.", "details": ["Inflate balloon with 10mL sterile water (or per manufacturer)", "Gently tug to confirm seated at bladder neck", "Secure to inner thigh with securement device", "Hang drainage bag below bladder level, never on floor", "Document: catheter size, balloon volume, urine output, color, tolerance"], "action": "DOCUMENT", "criticalAction": false, "competencyArea": "Procedures"},
       {"stepNumber": 5, "label": "Removal", "description": "Safe catheter removal and post-removal monitoring.", "details": ["Deflate balloon completely (aspirate with syringe)", "Gently withdraw catheter", "Document time of removal", "Monitor: first void should occur within 6-8 hours", "Bladder scan if no void in 6 hours: >400mL may need re-catheterization"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Procedures"}
     ]
   }'::jsonb,
   'catheter-procedure', 1, true),

  -- 3.2 Wound Care
  ('d2000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000003',
   'Wound Care & Dressing Changes',
   'Wound assessment, classification, and evidence-based dressing selection. Documentation standards for wound care.',
   '{
     "lessonId": "nursing-3-2",
     "competencyIds": [17],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Wound Assessment", "description": "Systematically assess wound characteristics for documentation and treatment planning.", "details": ["Location and dimensions (length × width × depth in cm)", "Wound bed: granulation (red), slough (yellow), eschar (black)", "Edges: attached, rolled, undermining, tunneling", "Drainage: type (serous, sanguineous, purulent), amount, odor", "Periwound skin: intact, macerated, erythematous, indurated"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Procedures"},
       {"stepNumber": 2, "label": "Wound Classification", "description": "Classify wounds to determine appropriate treatment approach.", "details": ["Acute vs chronic", "Clean vs contaminated vs infected", "Partial vs full thickness", "Surgical: primary, secondary, or tertiary intention", "Pressure injury staging (I-IV, unstageable, DTPI)"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Procedures"},
       {"stepNumber": 3, "label": "Dressing Selection", "description": "Match dressing type to wound characteristics and healing goals.", "details": ["Dry wound: hydrogel to add moisture", "Moderate drainage: foam dressing", "Heavy drainage: alginate or hydrofiber", "Infected: silver-containing dressings", "Granulating: keep moist, protect (transparent film or hydrocolloid)", "Goal: moist wound environment promotes healing"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Procedures"},
       {"stepNumber": 4, "label": "Dressing Change Procedure", "description": "Perform sterile or clean dressing change based on wound type.", "details": ["Remove old dressing with clean gloves, note drainage", "Clean wound: center to periphery with prescribed solution", "Apply new dressing, secure with tape or secondary dressing", "Surgical wounds: strict sterile technique first 24-48 hours", "Chronic wounds: clean technique is often acceptable"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Procedures"}
     ]
   }'::jsonb,
   'wound-assessment', 2, true),

  -- 3.3 Blood Glucose Monitoring
  ('d2000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000003',
   'Blood Glucose Monitoring',
   'Point-of-care glucose testing, critical value recognition, and insulin sliding scale administration.',
   '{
     "lessonId": "nursing-3-3",
     "competencyIds": [18],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "POC Glucose Testing", "description": "Perform accurate point-of-care blood glucose measurement.", "details": ["Verify glucometer calibration and test strip expiration", "Clean site with alcohol, allow to dry completely", "Use lancet on side of fingertip (less nerve endings)", "Apply blood drop to test strip — do not squeeze finger excessively", "Record result immediately"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Procedures"},
       {"stepNumber": 2, "label": "Normal & Critical Values", "description": "Interpret glucose results and recognize critical values.", "details": ["Normal fasting: 70-100 mg/dL", "Target for hospitalized patients: 140-180 mg/dL", "Hypoglycemia: <70 mg/dL — treat immediately (Rule of 15)", "Severe hypoglycemia: <40 mg/dL — EMERGENCY", "Hyperglycemia: >250 mg/dL — check for ketones, notify provider", "Critical values require immediate provider notification"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Procedures"},
       {"stepNumber": 3, "label": "Insulin Sliding Scale", "description": "Apply sliding scale orders to administer correct insulin dose.", "details": ["Read sliding scale order carefully — they vary by patient", "Match current glucose to scale range", "Administer insulin SubQ (usually rapid-acting: lispro, aspart)", "Common timing: before meals (AC) and at bedtime (HS)", "Verify with second nurse for insulin doses"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Procedures"},
       {"stepNumber": 4, "label": "Hypoglycemia Management", "description": "Treat low blood glucose using the Rule of 15.", "details": ["Step 1: Give 15g fast-acting carbohydrate (4oz juice, 3-4 glucose tablets)", "Step 2: Recheck glucose in 15 minutes", "Step 3: If still <70, repeat treatment", "Step 4: When >70, give snack with protein", "If patient unconscious: D50 IV push or glucagon IM", "Document: glucose level, treatment, recheck results"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Procedures"}
     ]
   }'::jsonb,
   'glucose-monitoring', 3, true),

  -- 3.4 IV Access
  ('d2000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000003',
   'IV Access: Insertion & Venipuncture',
   'Vein selection, tourniquet placement, insertion technique, and securing the line. Practice before your first real stick.',
   '{
     "lessonId": "nursing-3-4",
     "competencyIds": [19, 20],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Vein Selection", "description": "Choose the best vein for cannulation based on purpose and patient factors.", "details": ["Start distal, move proximal with subsequent attempts", "Preferred: forearm cephalic or basilic veins", "Avoid: antecubital fossa (limits mobility), hand veins in elderly", "Avoid: affected side (mastectomy, AV fistula, stroke)", "Apply tourniquet 3-4 inches above intended site", "Palpate: bouncy, resilient vein is ideal"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Procedures"},
       {"stepNumber": 2, "label": "Site Preparation", "description": "Prepare insertion site using aseptic technique.", "details": ["Clean with chlorhexidine or alcohol in circular motion", "Allow to dry completely (30 seconds for chlorhexidine)", "Do not re-palpate after cleaning", "Stabilize vein by anchoring skin below insertion point", "Warn patient: sharp stick in 3, 2, 1"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Procedures"},
       {"stepNumber": 3, "label": "Insertion Technique", "description": "Insert catheter at correct angle and advance into vein.", "details": ["Insert bevel up at 15-30 degree angle", "Watch for blood flash in catheter chamber", "Lower angle and advance catheter 1-2mm more", "Advance catheter OFF needle into vein", "Release tourniquet before removing needle", "Activate safety device on needle immediately", "Connect extension set or flush with NS"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Procedures"},
       {"stepNumber": 4, "label": "Securing & Documentation", "description": "Secure catheter and document the procedure.", "details": ["Apply transparent dressing over site", "Label with date, time, gauge, your initials", "Flush with 3-10mL NS to verify patency", "Assess for infiltration: swelling, coolness, pain at site", "Document: gauge, location, number of attempts, patient tolerance", "Assess site every shift: signs of phlebitis (redness, pain, streak)"], "action": "DOCUMENT", "criticalAction": false, "competencyArea": "Procedures"}
     ]
   }'::jsonb,
   'vein-selection', 4, true),

  -- 3.5 NG Tube & Trach Care
  ('d2000000-0000-0000-0000-000000000017', 'd1000000-0000-0000-0000-000000000003',
   'NG Tube & Tracheostomy Care',
   'NG tube placement verification and management alongside tracheostomy suctioning and care protocols.',
   '{
     "lessonId": "nursing-3-5",
     "competencyIds": [21, 22],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "NG Tube Placement Verification", "description": "Verify correct placement before use — never assume position.", "details": ["Gold standard: chest X-ray confirmation", "pH testing of aspirate: gastric pH <5.5", "Do NOT use auscultation (air bolus) — unreliable", "Mark tube at naris and verify marking hasnt changed each shift", "Verify placement before each use (feeding, medication)"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Procedures"},
       {"stepNumber": 2, "label": "NG Tube Management", "description": "Ongoing care and troubleshooting for NG tubes.", "details": ["Secure to nose with tape or commercial device — prevent pressure injury", "Keep HOB elevated ≥30 degrees to prevent aspiration", "For suction: verify suction setting (usually low intermittent)", "For feeding: check residual volumes per protocol", "Irrigation: flush with 30mL water every 4-6 hours and before/after meds", "Document: output amount, color, consistency (for suction)"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Procedures"},
       {"stepNumber": 3, "label": "Tracheostomy Suctioning", "description": "Sterile suctioning technique to maintain airway patency.", "details": ["Pre-oxygenate with 100% O2 for 30 seconds", "Use sterile technique: sterile glove on dominant hand", "Insert catheter without suction, to resistance minus 1cm", "Apply suction while withdrawing, rotating catheter (max 10 seconds)", "Allow 20-30 seconds between passes", "Assess: breath sounds, SpO2, secretion color and consistency", "Maximum 3 suction passes per episode"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Procedures"},
       {"stepNumber": 4, "label": "Tracheostomy Care", "description": "Routine trach care to prevent infection and skin breakdown.", "details": ["Clean inner cannula with hydrogen peroxide then NS (or disposable)", "Clean stoma site with NS-soaked gauze", "Assess peristomal skin: redness, breakdown, granulation tissue", "Change trach ties: always keep one finger space, never remove ties without second person", "Keep emergency supplies at bedside: same size trach, one size smaller, obturator, Ambu bag"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Procedures"}
     ]
   }'::jsonb,
   'ng-trach-procedures', 5, true),

-- ---------- Course 4: Patient Care Management (5 lessons) ----------

  -- 4.1 Admission Assessment
  ('d2000000-0000-0000-0000-000000000018', 'd1000000-0000-0000-0000-000000000004',
   'Admission Assessment & Documentation',
   'Guide a complete patient admission — history, assessment, medication reconciliation, and EHR documentation.',
   '{
     "lessonId": "nursing-4-1",
     "competencyIds": [23],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Patient Identification & History", "description": "Verify identity, collect history, and establish rapport.", "details": ["Two patient identifiers", "Verify allergies — type of reaction, not just drug name", "Medical history, surgical history, current medications", "Advance directives: code status, healthcare proxy", "Social history: living situation, support system, substance use"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 2, "label": "Medication Reconciliation", "description": "Compare home medications with admission orders to identify discrepancies.", "details": ["List ALL home medications including OTC, supplements, herbals", "Compare with admission medication orders", "Flag discrepancies: missing meds, dose changes, new medications", "Clarify with provider before administering", "Document reconciliation completion"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Care Management"},
       {"stepNumber": 3, "label": "Head-to-Toe Assessment", "description": "Perform baseline admission assessment and document findings.", "details": ["Full systems assessment per facility protocol", "Document baseline vital signs with orthostatics if indicated", "Skin assessment: document any existing wounds or injuries", "Fall risk and pressure injury risk screening (Morse, Braden)", "Pain assessment using appropriate tool"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 4, "label": "Patient Orientation & Safety", "description": "Orient patient to room, call light, and safety protocols.", "details": ["Demonstrate call light and bed controls", "Explain rounding schedule and how to reach nurse", "Review fall prevention measures", "Discuss diet orders and any restrictions", "Identify patient education needs and preferred learning style"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"}
     ]
   }'::jsonb,
   'ehr-admission', 1, true),

  -- 4.2 Discharge Planning
  ('d2000000-0000-0000-0000-000000000019', 'd1000000-0000-0000-0000-000000000004',
   'Discharge Planning & Patient Education',
   'The teach-back method for effective discharge education. Ensure patients leave prepared, not just discharged.',
   '{
     "lessonId": "nursing-4-2",
     "competencyIds": [24],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Discharge Readiness Assessment", "description": "Evaluate whether patient is ready for safe discharge.", "details": ["Vital signs stable and trending appropriately", "Pain controlled with oral medications", "Patient can perform required self-care (or has support)", "Necessary equipment/services arranged (home health, DME)", "Follow-up appointments scheduled"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 2, "label": "Medication Education", "description": "Review all discharge medications using teach-back method.", "details": ["Review each medication: name, purpose, dose, timing, side effects", "Highlight changes from pre-admission medications", "Teach-back: ask patient to explain back to you in their own words", "Provide written medication list in patient-friendly language", "Ensure prescriptions are filled or patient knows how to fill them"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Care Management"},
       {"stepNumber": 3, "label": "Warning Signs Education", "description": "Teach patients when to seek emergency care vs call their provider.", "details": ["Condition-specific red flags (e.g., chest pain, shortness of breath, wound infection signs)", "Medication side effects requiring immediate attention", "When to call provider vs when to call 911", "Provide written instructions with phone numbers", "Teach-back: have patient repeat warning signs"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Care Management"},
       {"stepNumber": 4, "label": "Documentation & Handoff", "description": "Complete discharge documentation and coordinate transitions.", "details": ["Document all education provided and patient understanding", "Document discharge vitals, condition, mode of transport", "Fax/send discharge summary to PCP", "If transferring: provide verbal and written handoff to receiving facility", "Enter follow-up appointment details in patient portal"], "action": "DOCUMENT", "criticalAction": false, "competencyArea": "Care Management"}
     ]
   }'::jsonb,
   'teach-back-discharge', 2, true),

  -- 4.3 SBAR Shift Handoff
  ('d2000000-0000-0000-0000-000000000020', 'd1000000-0000-0000-0000-000000000004',
   'SBAR Shift Handoff',
   'Build structured shift handoff reports using SBAR format. Compare your handoff against expert versions.',
   '{
     "lessonId": "nursing-4-3",
     "competencyIds": [25],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Situation", "description": "Concisely state the patients current status and reason for hospitalization.", "details": ["Patient name, age, room number", "Admitting diagnosis and date", "Current condition in one sentence", "Code status", "Example: Mrs. Jones, 72, room 412, admitted 3 days ago with CHF exacerbation, currently stable, full code"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 2, "label": "Background", "description": "Provide relevant medical history and treatment context.", "details": ["Relevant medical/surgical history", "Current medications and any recent changes", "Allergies", "Significant lab results or diagnostic findings", "Procedures done during this shift"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 3, "label": "Assessment", "description": "Share your clinical assessment of the patient current state.", "details": ["Vital signs and trends", "Most recent assessment findings", "Pain level and management effectiveness", "IV access: site, fluid, rate", "Output: urine, drains", "Skin and wound status", "Your clinical impression: improving, stable, declining"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 4, "label": "Recommendation", "description": "Communicate outstanding tasks, pending items, and anticipated needs.", "details": ["Pending labs, imaging, or consults", "Medications due in next 1-2 hours", "Parameters to watch (e.g., if BP drops below 90, call provider)", "Expected plan for the shift (e.g., discharge planned for tomorrow AM)", "Family concerns or communication needs", "Allow time for questions from receiving nurse"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Care Management"}
     ]
   }'::jsonb,
   'sbar-builder', 3, true),

  -- 4.4 Care Plan Development
  ('d2000000-0000-0000-0000-000000000021', 'd1000000-0000-0000-0000-000000000004',
   'Care Plan Development',
   'Build individualized nursing care plans using NANDA-I diagnoses, outcomes, and evidence-based interventions.',
   '{
     "lessonId": "nursing-4-4",
     "competencyIds": [26],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Nursing Diagnosis", "description": "Formulate nursing diagnoses using NANDA-I three-part statement.", "details": ["Format: Problem related to Etiology as evidenced by Signs/Symptoms", "Example: Impaired gas exchange r/t alveolar-capillary membrane changes AEB SpO2 89%, dyspnea, crackles", "Focus on problems nursing can independently address", "Prioritize using Maslows hierarchy"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 2, "label": "Expected Outcomes", "description": "Define measurable, time-bound patient outcomes.", "details": ["SMART format: Specific, Measurable, Achievable, Relevant, Time-bound", "Example: Patient will maintain SpO2 >94% on room air by discharge", "Patient-centered: focus on what patient will do/demonstrate", "Include both short-term and long-term goals"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 3, "label": "Interventions", "description": "Select evidence-based nursing interventions to achieve outcomes.", "details": ["Independent interventions: positioning, education, monitoring", "Collaborative interventions: medications, treatments per order", "Include rationale for each intervention", "Prioritize by urgency and impact", "Consider patient preferences and resources"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 4, "label": "Evaluation", "description": "Evaluate progress toward outcomes and modify plan as needed.", "details": ["Compare current status to expected outcomes", "Met: document and continue or discontinue", "Partially met: revise timeline or interventions", "Not met: reassess diagnosis, change approach", "Document evaluation and any plan modifications", "Care plans are dynamic — update every shift"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Care Management"}
     ]
   }'::jsonb,
   'care-plan-builder', 4, true),

  -- 4.5 Patient/Family Education & Isolation
  ('d2000000-0000-0000-0000-000000000022', 'd1000000-0000-0000-0000-000000000004',
   'Patient/Family Education & Isolation Precautions',
   'Effective patient teaching techniques and PPE selection for contact, droplet, and airborne isolation precautions.',
   '{
     "lessonId": "nursing-4-5",
     "competencyIds": [27, 28],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Patient Education Principles", "description": "Apply adult learning principles to patient education.", "details": ["Assess readiness to learn: pain, anxiety, fatigue", "Assess health literacy: use plain language, avoid jargon", "Use teach-back: I want to make sure I explained clearly. Can you tell me...", "Multi-modal: verbal + written + visual/demonstration", "Include family/caregivers when appropriate"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Care Management"},
       {"stepNumber": 2, "label": "Contact Precautions", "description": "PPE and procedures for contact-transmitted organisms.", "details": ["Indications: MRSA, VRE, C. diff, scabies, wound infections", "PPE: gown and gloves for all room entry", "Dedicated equipment (stethoscope, BP cuff) in room", "C. diff special: soap and water for hand hygiene (not alcohol gel)", "Don: gown first, then gloves", "Doff: gloves first, then gown, then hand hygiene"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Care Management"},
       {"stepNumber": 3, "label": "Droplet Precautions", "description": "Protection from large respiratory droplets.", "details": ["Indications: influenza, pertussis, meningococcal disease, mumps", "PPE: surgical mask within 3 feet of patient (often required for room entry)", "Patient wears surgical mask during transport", "No special ventilation required", "Hand hygiene before and after patient contact"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Care Management"},
       {"stepNumber": 4, "label": "Airborne Precautions", "description": "Maximum respiratory protection for airborne-transmitted diseases.", "details": ["Indications: tuberculosis, measles, varicella, COVID-19 (aerosolizing procedures)", "PPE: N95 respirator (must be fit-tested annually)", "Negative pressure room with door closed", "Patient wears surgical mask during transport", "PAPR if N95 cannot achieve proper seal", "Donning order: gown → N95 → eye protection → gloves", "Doffing order: gloves → gown → exit room → eye protection → N95 → hand hygiene"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Care Management"}
     ]
   }'::jsonb,
   'ppe-simulator', 5, true),

-- ---------- Course 5: Clinical Reasoning & Emergency Response (4 lessons) ----------

  -- 5.1 Recognizing Clinical Deterioration
  ('d2000000-0000-0000-0000-000000000023', 'd1000000-0000-0000-0000-000000000005',
   'Recognizing Clinical Deterioration',
   'Use the NEWS2 early warning score to identify deteriorating patients. Learn the escalation decision tree.',
   '{
     "lessonId": "nursing-5-1",
     "competencyIds": [29],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "NEWS2 Scoring", "description": "Calculate the National Early Warning Score from 6 physiological parameters.", "details": ["Respiratory rate: score 0-3", "SpO2: score 0-3 (Scale 1 or 2 based on target range)", "Systolic BP: score 0-3", "Heart rate: score 0-3", "Temperature: score 0-3", "Level of consciousness: AVPU (Alert, Voice, Pain, Unresponsive) score 0-3", "NEW onset confusion: score 3 for any change"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Critical Thinking"},
       {"stepNumber": 2, "label": "Score Interpretation", "description": "Translate NEWS2 score into clinical response level.", "details": ["0-4 (low): routine monitoring", "5-6 or single parameter score 3 (medium): increase monitoring, inform charge nurse", "7+ (high): continuous monitoring, urgent provider notification, consider ICU", "Any parameter at extreme: immediate escalation regardless of total score", "Trend matters: rising score even within low range is concerning"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Critical Thinking"},
       {"stepNumber": 3, "label": "Clinical Deterioration Signs", "description": "Recognize subtle early warning signs beyond vital signs.", "details": ["Patient says I feel like something is wrong — always take seriously", "New confusion, agitation, or lethargy", "Decreasing urine output (<0.5mL/kg/hr)", "New-onset diaphoresis", "Mottled or cool extremities", "Increasing oxygen requirements", "Changes in level of consciousness"], "action": "OBSERVE", "criticalAction": true, "competencyArea": "Critical Thinking"},
       {"stepNumber": 4, "label": "Escalation Protocol", "description": "Communicate concerns effectively using chain of command.", "details": ["First: SBAR to primary provider", "If no response or patient worsening: charge nurse", "If still no adequate response: rapid response team", "Document: what you observed, who you notified, when, response", "Never let hierarchy prevent you from escalating a safety concern", "Trust your clinical instinct — if something feels wrong, act on it"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Critical Thinking"}
     ]
   }'::jsonb,
   'news2-calculator', 1, true),

  -- 5.2 Multi-Patient Prioritization
  ('d2000000-0000-0000-0000-000000000024', 'd1000000-0000-0000-0000-000000000005',
   'Multi-Patient Prioritization',
   'Manage competing demands with 4 patients using Maslow hierarchy and ABCs. Practice delegation decisions.',
   '{
     "lessonId": "nursing-5-2",
     "competencyIds": [30],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Prioritization Frameworks", "description": "Apply systematic frameworks to determine care order.", "details": ["ABCs: Airway → Breathing → Circulation → Disability → Exposure", "Maslows: physiological → safety → love/belonging → esteem → self-actualization", "Acute over chronic: new symptoms take priority over stable conditions", "Unstable over stable: deteriorating patients first", "Actual problem over potential risk: real issues before potential ones"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Critical Thinking"},
       {"stepNumber": 2, "label": "Beginning-of-Shift Assessment", "description": "Efficiently assess all patients to establish priorities.", "details": ["Quick safety round: check all patients within first 30 minutes", "Identify: who is most unstable? Who has time-sensitive needs?", "Check: any pending stat orders, overdue medications, procedures?", "Organize: create priority list for the first 2 hours", "Communicate: update charge nurse on any concerns"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Critical Thinking"},
       {"stepNumber": 3, "label": "Delegation", "description": "Delegate appropriate tasks to CNAs and other team members.", "details": ["RN cannot delegate: assessment, evaluation, patient education, medication administration", "CNA can: vital signs, hygiene, feeding, ambulation, I&O measurement, blood glucose check", "5 Rights of Delegation: right task, right circumstance, right person, right direction, right supervision", "Always follow up on delegated tasks", "Remain accountable for patient outcomes"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Critical Thinking"},
       {"stepNumber": 4, "label": "Dynamic Reprioritization", "description": "Adjust priorities in real-time as patient conditions change.", "details": ["New admission or post-procedure patient: reprioritize", "Patient condition change: drop current task if safety-critical", "Call light from multiple rooms: triage by urgency", "When overwhelmed: ask for help, notify charge nurse", "End-of-shift: ensure all critical tasks completed, nothing falls through handoff"], "action": "PERFORM", "criticalAction": false, "competencyArea": "Critical Thinking"}
     ]
   }'::jsonb,
   'triage-simulation', 2, true),

  -- 5.3 Lab Value Interpretation
  ('d2000000-0000-0000-0000-000000000025', 'd1000000-0000-0000-0000-000000000005',
   'Lab Value Interpretation & SBAR Communication',
   'Interpret common lab panels — CBC, BMP, coagulation — and communicate critical values to providers using SBAR.',
   '{
     "lessonId": "nursing-5-3",
     "competencyIds": [31],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Complete Blood Count (CBC)", "description": "Interpret key CBC values and their clinical significance.", "details": ["WBC (4.5-11.0): elevated = infection/inflammation, low = immunosuppression", "Hemoglobin (M: 13.5-17.5, F: 12.0-16.0): low = anemia, bleeding", "Hematocrit (M: 38-50%, F: 36-44%): tracks with hemoglobin", "Platelets (150-400K): low = bleeding risk, high = clotting risk", "Neutrophils: absolute neutrophil count <500 = neutropenic precautions"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Critical Thinking"},
       {"stepNumber": 2, "label": "Basic Metabolic Panel (BMP)", "description": "Interpret electrolytes, glucose, and kidney function markers.", "details": ["Sodium (136-145): hypo = confusion, seizures; hyper = dehydration", "Potassium (3.5-5.0): CRITICAL — hypo/hyper = cardiac arrhythmias", "Glucose (70-100 fasting): hypo = emergency; hyper = DKA risk", "BUN (7-20) and Creatinine (0.7-1.3): elevated = kidney impairment", "GFR: <60 = chronic kidney disease", "Calcium (8.5-10.5): low = tetany, Chvosteks/Trousseaus signs"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Critical Thinking"},
       {"stepNumber": 3, "label": "Coagulation Studies", "description": "Interpret PT/INR, PTT, and D-dimer for bleeding and clotting risk.", "details": ["PT (11-13.5 sec) / INR (0.8-1.1): monitors warfarin therapy", "Therapeutic INR for warfarin: 2.0-3.0 (varies by indication)", "INR >4.0: HIGH bleeding risk — hold warfarin, notify provider", "PTT (25-35 sec): monitors heparin therapy", "Therapeutic PTT: 1.5-2.5x normal", "D-dimer: elevated suggests clot breakdown (DVT, PE)"], "action": "VERIFY", "criticalAction": true, "competencyArea": "Critical Thinking"},
       {"stepNumber": 4, "label": "SBAR for Critical Values", "description": "Communicate abnormal lab values to providers effectively.", "details": ["Situation: I am calling about [patient] with a critical lab result", "Background: relevant diagnosis, current medications (especially anticoagulants, insulin)", "Assessment: the [lab] is [value], which is [high/low/critical]. Patient is currently [symptomatic/asymptomatic]", "Recommendation: I would like to request [specific order or intervention]", "Read-back: verify any verbal orders", "Document: time notified, provider name, orders received"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Critical Thinking"}
     ]
   }'::jsonb,
   'lab-interpreter', 3, true),

  -- 5.4 Rapid Response & Code Blue
  ('d2000000-0000-0000-0000-000000000026', 'd1000000-0000-0000-0000-000000000005',
   'Rapid Response & Code Blue',
   'Code team roles, BLS sequence, medication administration timeline, and structured post-code debrief.',
   '{
     "lessonId": "nursing-5-4",
     "competencyIds": [32],
     "kolbPhase": "thinking",
     "steps": [
       {"stepNumber": 1, "label": "Rapid Response Activation", "description": "Recognize when and how to activate the rapid response team.", "details": ["Criteria: acute change in heart rate, respiratory rate, BP, mental status, SpO2, urine output", "Also: staff member concern — if you are worried, call", "How to activate: call RRT number, state location and concern", "While waiting: ABCs, vital signs, IV access, collect chart info", "SBAR ready when team arrives"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Critical Thinking"},
       {"stepNumber": 2, "label": "Code Blue — Initial Response", "description": "First actions when you find an unresponsive patient.", "details": ["Check responsiveness: tap shoulders, shout Are you okay?", "Call for help: activate code blue, get crash cart and AED", "Check pulse: carotid, max 10 seconds", "No pulse: START CPR immediately", "Compressions: center of chest, 2 inches deep, 100-120/min", "Minimize interruptions: <10 seconds for pulse checks"], "action": "PERFORM", "criticalAction": true, "competencyArea": "Critical Thinking"},
       {"stepNumber": 3, "label": "Code Team Roles", "description": "Understand the roles and responsibilities during a code.", "details": ["Team leader: directs code, makes treatment decisions", "Compressor: high-quality CPR, rotate every 2 minutes", "Airway manager: bag-valve-mask, then advanced airway", "IV/IO access and medication administration", "Recorder/timekeeper: documents everything with timestamps", "Bedside nurse: provides patient history, SBAR to team leader", "As a student: assigned role is usually compressor or recorder"], "action": "OBSERVE", "criticalAction": false, "competencyArea": "Critical Thinking"},
       {"stepNumber": 4, "label": "Post-Code Debrief", "description": "Structured debrief after resuscitation events to process and learn.", "details": ["Immediate hot debrief: what went well, what to improve, any safety concerns", "Team performance: response time, CPR quality, medication timing", "Emotional processing: acknowledge the intensity of the experience", "Self-care: it is normal to feel shaken — talk to colleagues, use employee assistance", "Learning: what would you do differently? What did you learn?", "Document debrief occurrence and any system improvement identified"], "action": "VERIFY", "criticalAction": false, "competencyArea": "Critical Thinking"}
     ]
   }'::jsonb,
   'code-simulation', 4, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  lesson_data = EXCLUDED.lesson_data,
  interactive_type = EXCLUDED.interactive_type,
  sort_order = EXCLUDED.sort_order,
  published = EXCLUDED.published,
  updated_at = now();
