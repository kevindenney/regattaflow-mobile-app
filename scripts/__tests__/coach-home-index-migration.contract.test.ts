import fs from 'node:fs';
import path from 'node:path';

describe('coach-home index migration contract', () => {
  it('defines composite/partial indexes for coach-home hot query paths', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20260303133000_add_coach_home_query_indexes.sql'
    );
    const source = fs.readFileSync(migrationPath, 'utf8');

    expect(source).toContain('idx_assessment_records_org_eval_status_created_desc');
    expect(source).toContain('idx_assessment_records_org_program_created_desc');
    expect(source).toContain('idx_assessment_records_org_eval_assessed_created_desc');
    expect(source).toContain('idx_assessment_records_org_program_competency_assessed_desc');
    expect(source).toContain('idx_communication_threads_org_archived_program_updated_desc');
    expect(source).toContain('idx_communication_messages_org_created_desc');
    expect(source).toContain('idx_communication_messages_org_thread_created_desc');
    expect(source).toContain('idx_communication_thread_reads_org_user_thread_last_read');
    expect(source).toContain('idx_program_participants_org_program_status');
  });
});
