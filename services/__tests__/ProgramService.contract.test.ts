import fs from 'node:fs';
import path from 'node:path';

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('ProgramService CRUD + assignment contract', () => {
  it('exposes program/session/participant CRUD and assignment methods', () => {
    const source = readSource('services/ProgramService.ts');

    expect(source).toContain('async listPrograms(');
    expect(source).toContain('async getProgram(');
    expect(source).toContain('async createProgram(');

    expect(source).toContain('async listProgramSessions(');
    expect(source).toContain('async createProgramSession(');
    expect(source).toContain('async updateProgramSession(');

    expect(source).toContain('async listProgramParticipants(');
    expect(source).toContain('async listAssignedProgramIdsForStaff(');
    expect(source).toContain('async createProgramParticipant(');
    expect(source).toContain('async updateProgramParticipant(');
    expect(source).toContain('async removeProgramParticipant(');
  });
});
