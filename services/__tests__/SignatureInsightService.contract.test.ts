import fs from 'fs';
import path from 'path';

function readFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('SignatureInsightService contract', () => {
  it('exposes required persistence API methods', () => {
    const source = readFile('services/SignatureInsightService.ts');
    expect(source).toContain('class SignatureInsightService');
    expect(source).toContain('async findLatestSignatureInsightEvent(');
    expect(source).toContain('async logSignatureInsightEvent(');
    expect(source).toContain(".from('signature_insight_events')");
    expect(source).toContain('async listPrincipleMemory(');
    expect(source).toContain(".from('user_principle_memory')");
    expect(source).toContain('async applySignatureInsightOutcome(');
    expect(source).toContain("rpc('apply_signature_insight_outcome_v1'");
  });
});
