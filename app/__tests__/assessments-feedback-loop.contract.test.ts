import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('assessments feedback loop contract', () => {
  it('captures action-plan fields into assessment evidence payload', () => {
    const source = readAppFile('app/assessments.tsx');
    expect(source).toContain('const [newActionPlan, setNewActionPlan] = useState');
    expect(source).toContain('const [newNextCheckInAt, setNewNextCheckInAt] = useState');
    expect(source).toContain("{ action_plan: newActionPlan.trim() }");
    expect(source).toContain("{ next_check_in_at: newNextCheckInAt.trim() }");
  });

  it('renders persisted action-plan metadata in assessment record cards', () => {
    const source = readAppFile('app/assessments.tsx');
    expect(source).toContain('Action plan: {actionPlan}');
    expect(source).toContain('Next check-in: {nextCheckInAt}');
  });
});
