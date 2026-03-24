/**
 * Sub-competency Types
 *
 * Sub-competencies break down each AACN competency into 5-6 granular
 * skills that can be individually tracked and mapped to programs.
 */

export interface SubCompetency {
  id: string;
  competency_id: string;
  organization_id?: string | null;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProgramCompetency {
  id: string;
  program_id: string;
  competency_id: string;
  is_required: boolean;
  sort_order: number;
}

export interface ProgramSubCompetency {
  id: string;
  program_id: string;
  sub_competency_id: string;
  is_required: boolean;
  sort_order: number;
}
