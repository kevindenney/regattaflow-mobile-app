-- ============================================================================
-- Competency Tracking & Sign-Off Chain
--
-- Supports the full progression:
--   not_started → learning → practicing → checkoff_ready → validated → competent
--
-- Sign-off chain:
--   Student self-assesses → Preceptor validates → Faculty approves
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Competency Definitions (seeded per interest)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS betterat_competencies (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id         uuid        NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  category            text        NOT NULL,
  competency_number   integer     NOT NULL,
  title               text        NOT NULL,
  description         text,
  requires_supervision boolean    DEFAULT false,
  sort_order          integer     DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  UNIQUE (interest_id, competency_number)
);

CREATE INDEX IF NOT EXISTS idx_competencies_interest ON betterat_competencies(interest_id);

-- ---------------------------------------------------------------------------
-- 2. Student Progress (denormalized current status per competency)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS betterat_competency_progress (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_id       uuid        NOT NULL REFERENCES betterat_competencies(id) ON DELETE CASCADE,
  status              text        NOT NULL DEFAULT 'not_started'
                                  CHECK (status IN (
                                    'not_started', 'learning', 'practicing',
                                    'checkoff_ready', 'validated', 'competent'
                                  )),
  attempts_count      integer     DEFAULT 0,
  last_attempt_at     timestamptz,
  validated_by        uuid        REFERENCES auth.users(id),
  validated_at        timestamptz,
  approved_by         uuid        REFERENCES auth.users(id),
  approved_at         timestamptz,
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, competency_id)
);

CREATE INDEX IF NOT EXISTS idx_comp_progress_user ON betterat_competency_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_progress_status ON betterat_competency_progress(user_id, status);

-- ---------------------------------------------------------------------------
-- 3. Individual Attempt Records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS betterat_competency_attempts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competency_id       uuid        NOT NULL REFERENCES betterat_competencies(id) ON DELETE CASCADE,
  event_id            uuid,
  attempt_number      integer     NOT NULL DEFAULT 1,
  -- Student self-assessment
  self_rating         text        CHECK (self_rating IN (
                                    'needs_practice', 'developing', 'proficient', 'confident'
                                  )),
  self_notes          text,
  -- Preceptor evaluation
  preceptor_id        uuid        REFERENCES auth.users(id),
  preceptor_rating    text        CHECK (preceptor_rating IN (
                                    'not_observed', 'needs_improvement', 'satisfactory', 'excellent'
                                  )),
  preceptor_notes     text,
  preceptor_reviewed_at timestamptz,
  -- Context
  clinical_context    text,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_attempts_user ON betterat_competency_attempts(user_id, competency_id);
CREATE INDEX IF NOT EXISTS idx_comp_attempts_preceptor ON betterat_competency_attempts(preceptor_id);

-- ---------------------------------------------------------------------------
-- 4. Faculty Reviews (final sign-off)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS betterat_competency_reviews (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id         uuid        NOT NULL REFERENCES betterat_competency_progress(id) ON DELETE CASCADE,
  reviewer_id         uuid        NOT NULL REFERENCES auth.users(id),
  decision            text        NOT NULL CHECK (decision IN (
                                    'approved', 'needs_more_practice', 'remediation_required'
                                  )),
  notes               text,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comp_reviews_progress ON betterat_competency_reviews(progress_id);

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

ALTER TABLE betterat_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE betterat_competency_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE betterat_competency_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE betterat_competency_reviews ENABLE ROW LEVEL SECURITY;

-- Competency definitions: readable by all authenticated users
CREATE POLICY "competencies_read" ON betterat_competencies
  FOR SELECT TO authenticated USING (true);

-- Progress: students can read/write own, preceptors/faculty can read their students'
CREATE POLICY "progress_own_read" ON betterat_competency_progress
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "progress_own_insert" ON betterat_competency_progress
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress_own_update" ON betterat_competency_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Preceptors can read progress of students they've evaluated
CREATE POLICY "progress_preceptor_read" ON betterat_competency_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM betterat_competency_attempts a
      WHERE a.competency_id = betterat_competency_progress.competency_id
        AND a.user_id = betterat_competency_progress.user_id
        AND a.preceptor_id = auth.uid()
    )
  );

-- Preceptors can update progress (for validation)
CREATE POLICY "progress_preceptor_update" ON betterat_competency_progress
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM betterat_competency_attempts a
      WHERE a.competency_id = betterat_competency_progress.competency_id
        AND a.user_id = betterat_competency_progress.user_id
        AND a.preceptor_id = auth.uid()
    )
  );

-- Faculty can read all progress (users who have approved or validated any progress)
CREATE POLICY "progress_faculty_read" ON betterat_competency_progress
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM betterat_competency_progress p2
      WHERE (p2.validated_by = auth.uid() OR p2.approved_by = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM betterat_competency_reviews r
      WHERE r.reviewer_id = auth.uid()
    )
  );

-- Faculty can update progress (users who have review records)
CREATE POLICY "progress_faculty_update" ON betterat_competency_progress
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM betterat_competency_reviews r
      WHERE r.reviewer_id = auth.uid()
    )
  );

-- Attempts: students can read/write own
CREATE POLICY "attempts_own_read" ON betterat_competency_attempts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "attempts_own_insert" ON betterat_competency_attempts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Preceptors can read/update attempts assigned to them
CREATE POLICY "attempts_preceptor_read" ON betterat_competency_attempts
  FOR SELECT TO authenticated
  USING (preceptor_id = auth.uid());

CREATE POLICY "attempts_preceptor_update" ON betterat_competency_attempts
  FOR UPDATE TO authenticated
  USING (preceptor_id = auth.uid());

-- Faculty can read all attempts (users who have review records)
CREATE POLICY "attempts_faculty_read" ON betterat_competency_attempts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM betterat_competency_reviews r
      WHERE r.reviewer_id = auth.uid()
    )
  );

-- Reviews: faculty can read/write
CREATE POLICY "reviews_faculty_read" ON betterat_competency_reviews
  FOR SELECT TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM betterat_competency_progress p
      WHERE p.id = betterat_competency_reviews.progress_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "reviews_faculty_insert" ON betterat_competency_reviews
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 6. Updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_competency_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_competency_progress_updated_at
  BEFORE UPDATE ON betterat_competency_progress
  FOR EACH ROW EXECUTE FUNCTION update_competency_progress_updated_at();


-- ============================================================================
-- 7. Seed: 32 Med-Surg Nursing Competencies
-- ============================================================================

INSERT INTO betterat_competencies (id, interest_id, category, competency_number, title, description, requires_supervision, sort_order)
VALUES
  -- Assessment Skills (1-8)
  ('c0000000-0001-0000-0000-000000000001', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Assessment Skills', 1, 'Head-to-toe physical assessment',
   'Perform a complete, systematic head-to-toe assessment on an adult patient, documenting findings accurately.',
   false, 1),

  ('c0000000-0001-0000-0000-000000000002', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Assessment Skills', 2, 'Focused respiratory assessment',
   'Assess respiratory status including rate, rhythm, depth, breath sounds, SpO2, and use of accessory muscles.',
   false, 2),

  ('c0000000-0001-0000-0000-000000000003', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Assessment Skills', 3, 'Focused cardiac assessment',
   'Assess cardiovascular status including heart sounds, rhythm, peripheral pulses, capillary refill, and edema.',
   false, 3),

  ('c0000000-0001-0000-0000-000000000004', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Assessment Skills', 4, 'Focused neurological assessment',
   'Perform neurological assessment including GCS, pupil reactivity, cranial nerves, motor/sensory function, and LOC.',
   false, 4),

  ('c0000000-0001-0000-0000-000000000005', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Assessment Skills', 5, 'Focused abdominal assessment',
   'Assess abdomen using inspection, auscultation, percussion, and palpation in correct sequence. Document bowel sounds and findings.',
   false, 5),

  ('c0000000-0001-0000-0000-000000000006', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Assessment Skills', 6, 'Pain assessment using validated tools',
   'Assess pain using appropriate validated tools (NRS, Wong-Baker FACES, FLACC, CPOT) based on patient population and condition.',
   false, 6),

  ('c0000000-0001-0000-0000-000000000007', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Assessment Skills', 7, 'Fall risk assessment (Morse scale)',
   'Complete Morse Fall Scale assessment, implement appropriate fall prevention interventions based on risk level.',
   false, 7),

  ('c0000000-0001-0000-0000-000000000008', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Assessment Skills', 8, 'Skin/wound assessment (Braden scale)',
   'Perform Braden Scale assessment for pressure injury risk. Document wound characteristics including size, depth, drainage, and staging.',
   false, 8),

  -- Medication Administration (9-14)
  ('c0000000-0001-0000-0000-000000000009', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Medication Administration', 9, 'Oral medication administration',
   'Safely administer oral medications following the 6 Rights. Verify allergies, check interactions, and assess ability to swallow.',
   false, 9),

  ('c0000000-0001-0000-0000-000000000010', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Medication Administration', 10, 'Subcutaneous injection',
   'Administer subcutaneous injections using correct technique, site selection, and angle of insertion. Document site rotation.',
   false, 10),

  ('c0000000-0001-0000-0000-000000000011', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Medication Administration', 11, 'Intramuscular injection',
   'Administer intramuscular injections using correct technique, site selection (deltoid, vastus lateralis, ventrogluteal), and Z-track method.',
   false, 11),

  ('c0000000-0001-0000-0000-000000000012', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Medication Administration', 12, 'IV push medication',
   'Administer IV push medications at correct rate with appropriate monitoring. Verify compatibility and patency.',
   true, 12),

  ('c0000000-0001-0000-0000-000000000013', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Medication Administration', 13, 'IV piggyback medication',
   'Set up and administer IV piggyback medications. Program infusion pump, verify rate, and monitor for reactions.',
   false, 13),

  ('c0000000-0001-0000-0000-000000000014', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Medication Administration', 14, 'PRN medication assessment and administration',
   'Assess appropriateness of PRN medication, administer, and reassess effectiveness within appropriate timeframe.',
   false, 14),

  -- Clinical Procedures (15-22)
  ('c0000000-0001-0000-0000-000000000015', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures', 15, 'Foley catheter insertion',
   'Insert indwelling urinary catheter using sterile technique. Verify placement, secure, and document.',
   true, 15),

  ('c0000000-0001-0000-0000-000000000016', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures', 16, 'Foley catheter removal',
   'Remove indwelling urinary catheter. Monitor voiding pattern and document output.',
   false, 16),

  ('c0000000-0001-0000-0000-000000000017', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures', 17, 'Wound care and dressing change',
   'Perform wound care and dressing changes using appropriate technique. Assess wound healing and select appropriate dressings.',
   false, 17),

  ('c0000000-0001-0000-0000-000000000018', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures', 18, 'Blood glucose monitoring',
   'Perform point-of-care glucose testing. Recognize critical values, administer insulin per sliding scale, and document.',
   false, 18),

  ('c0000000-0001-0000-0000-000000000019', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures', 19, 'Peripheral IV insertion',
   'Insert peripheral IV catheter. Select appropriate vein and catheter size, maintain sterile technique, secure and flush.',
   true, 19),

  ('c0000000-0001-0000-0000-000000000020', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures', 20, 'Blood draw / venipuncture',
   'Perform venipuncture for blood specimen collection. Select appropriate tubes, label correctly, and transport per protocol.',
   false, 20),

  ('c0000000-0001-0000-0000-000000000021', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures', 21, 'Nasogastric tube care',
   'Manage nasogastric tube including placement verification (pH, x-ray), irrigation, medication administration, and removal.',
   false, 21),

  ('c0000000-0001-0000-0000-000000000022', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Clinical Procedures', 22, 'Tracheostomy care',
   'Perform tracheostomy care including suctioning, inner cannula cleaning, site care, and tie changes. Monitor for complications.',
   true, 22),

  -- Patient Care (23-28)
  ('c0000000-0001-0000-0000-000000000023', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Patient Care', 23, 'Admission assessment and documentation',
   'Complete admission assessment including history, physical, allergy verification, medication reconciliation, and care plan initiation.',
   false, 23),

  ('c0000000-0001-0000-0000-000000000024', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Patient Care', 24, 'Discharge planning and patient education',
   'Develop and implement discharge plan including medication teaching, follow-up appointments, warning signs, and community resources.',
   false, 24),

  ('c0000000-0001-0000-0000-000000000025', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Patient Care', 25, 'Shift handoff report (SBAR format)',
   'Deliver structured handoff report using SBAR format. Include all critical patient information and pending tasks.',
   false, 25),

  ('c0000000-0001-0000-0000-000000000026', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Patient Care', 26, 'Care plan development',
   'Develop nursing care plan using NANDA-I diagnoses, appropriate outcomes (NOC), and evidence-based interventions (NIC).',
   false, 26),

  ('c0000000-0001-0000-0000-000000000027', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Patient Care', 27, 'Patient/family education session',
   'Conduct patient and family education using teach-back method. Assess learning readiness, barriers, and comprehension.',
   false, 27),

  ('c0000000-0001-0000-0000-000000000028', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Patient Care', 28, 'Isolation precautions (contact/droplet/airborne)',
   'Implement appropriate isolation precautions. Don and doff PPE correctly. Educate patient and visitors on requirements.',
   false, 28),

  -- Critical Thinking (29-32)
  ('c0000000-0001-0000-0000-000000000029', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Critical Thinking', 29, 'Recognize and respond to clinical deterioration',
   'Identify early warning signs of deterioration using NEWS2 or similar scoring. Escalate appropriately and initiate interventions.',
   false, 29),

  ('c0000000-0001-0000-0000-000000000030', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Critical Thinking', 30, 'Prioritize care for 3+ patients',
   'Manage and prioritize care for multiple patients using clinical judgment, Maslow hierarchy, and ABCs framework.',
   false, 30),

  ('c0000000-0001-0000-0000-000000000031', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Critical Thinking', 31, 'Interpret lab values and communicate to provider',
   'Interpret common lab panels (CBC, BMP, coagulation), identify critical values, and communicate findings to provider using SBAR.',
   false, 31),

  ('c0000000-0001-0000-0000-000000000032', 'bec249c5-6412-4d16-bb84-bfcfb887ff67',
   'Critical Thinking', 32, 'Respond to a rapid response / code blue',
   'Participate effectively in rapid response or code blue. Understand team roles, BLS sequence, and post-event documentation.',
   false, 32)

ON CONFLICT (interest_id, competency_number) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  requires_supervision = EXCLUDED.requires_supervision,
  sort_order = EXCLUDED.sort_order;
