import fs from 'fs';
import path from 'path';

function readAppFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');
}

describe('coach artifact review workflow guards', () => {
  it('requires in-review status before completion and surfaces next-step guidance', () => {
    const source = readAppFile('app/coach/artifact-review/[artifactId].tsx');

    expect(source).toContain("if (requestRow.status !== 'in_review')");
    expect(source).toContain('Start review before marking this request as completed.');
    expect(source).toContain("requestRow?.status === 'requested'");
    expect(source).toContain('Next step: start review to unlock completion.');
    expect(source).toContain("disabled={updatingStatus || requestRow?.status !== 'in_review'}");
  });

  it('shows signed-out queue guidance and request/in-review summary chips', () => {
    const source = readAppFile('app/coach/artifact-queue.tsx');

    expect(source).toContain('const signedOut = !user?.id;');
    expect(source).toContain('Sign in to view assigned artifact reviews.');
    expect(source).toContain("items.filter((row) => row.status === 'requested').length");
    expect(source).toContain("items.filter((row) => row.status === 'in_review').length");
  });
});
