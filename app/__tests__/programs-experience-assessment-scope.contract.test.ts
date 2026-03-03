import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('programs experience assessment drill-down contract', () => {
  it('uses program-scoped assessment hrefs for institution active/completed actions', () => {
    const source = readAppFile('app/(tabs)/programs-experience.tsx');
    expect(source).toContain('buildProgramAssessmentHref');
    expect(source).toContain("label: isInstitutionWorkspace ? 'Record assessments' : 'Record finishes'");
    expect(source).toContain('programId: race.id');
    expect(source).toContain('programTitle: race.name');
  });
});
