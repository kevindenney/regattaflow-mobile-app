import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('session builder route contract', () => {
  it('adds programs session builder screen with persisted metadata save path', () => {
    const source = readAppFile('app/programs/session-builder.tsx');
    expect(source).toContain('export default function SessionBuilderScreen()');
    expect(source).toContain('programService.updateProgramSession');
    expect(source).toContain('session_builder: {');
    expect(source).toContain('attendance: attendanceByParticipantId');
  });

  it('wires institution quick action to session-builder route', () => {
    const source = readAppFile('app/(tabs)/programs-experience.tsx');
    expect(source).toContain('/programs/session-builder?programId=');
  });
});
