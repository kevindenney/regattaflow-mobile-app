import fs from 'node:fs';
import path from 'node:path';

function readSource(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('secondary packs canonical contract', () => {
  it('locks canonical list to drawing and golf', () => {
    const source = readSource('docs/secondary-packs-canonical.md');
    expect(source).toContain('1. `drawing`');
    expect(source).toContain('2. `golf`');
    expect(source).toContain('workspace domain `drawing`');
    expect(source).toContain('workspace domain `fitness`');
  });
});
