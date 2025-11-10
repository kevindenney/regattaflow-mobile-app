#!/usr/bin/env node

/**
 * Generate draft Anthropic Skill content from a source PDF.
 *
 * Usage:
 *   node scripts/generate-skills-from-pdf.mjs --pdf /path/to/file.pdf \
 *     --slug regattaflow-playbook-tactics --title "RegattaFlow Playbook Tactics Core Concepts"
 *
 * The script will:
 *   1. Extract raw text from the PDF (via pdf-parse).
 *   2. Split the text into tactical segments using heading + word-count heuristics.
 *   3. Create a draft skill folder under skills/generated/<slug>/ containing:
 *        - source.txt (full raw text)
 *        - segment-XX.draft.md files for each extracted topic
 *        - outline.json with segment metadata
 *
 * You can then refine the drafts into final SKILL.md files before uploading.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printUsage() {
  console.log(`Usage:
  node scripts/generate-skills-from-pdf.mjs --pdf /path/to/file.pdf [options]

Options:
  --slug <slug>          Slug for the generated skill folder (default: derived from file name)
  --title <title>        Title to use in generated drafts (default: derived from file name)
  --description <text>   Optional description added to each draft's frontmatter
  --source <text>        Source attribution stored in metadata (default: PDF file name)
  --maxWords <num>       Maximum words per segment before splitting (default: 350)
  --minWords <num>       Minimum words required to create a segment (default: 120)
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = value;
    }
  }
  return args;
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isLikelyHeading(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Treat clear uppercase lines or numbered headings as section markers
  const upperCaseCandidate =
    trimmed.length >= 4 &&
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed) &&
    !/[.?!]/.test(trimmed);

  const numberedHeading = /^[0-9IVX]+\s*[-.)\s]+[A-Z]/.test(trimmed);
  const keywordHeading = /^(chapter|section|part|strategy|tactic)/i.test(trimmed);

  return upperCaseCandidate || numberedHeading || keywordHeading;
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function splitIntoSegments(rawText, { maxWords = 350, minWords = 120 } = {}) {
  const lines = rawText.split(/\r?\n/);
  const segments = [];
  let currentTitle = null;
  let buffer = [];

  const pushSegment = (title, content) => {
    const cleaned = content.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!cleaned) return;

    if (wordCount(cleaned) < minWords) {
      return;
    }

    segments.push({
      title: title || `Segment ${segments.length + 1}`,
      text: cleaned
    });
  };

  const flushBuffer = () => {
    if (!buffer.length) return;
    const combined = buffer.join('\n');

    if (wordCount(combined) <= maxWords) {
      pushSegment(currentTitle, buffer);
    } else {
      let chunk = [];
      for (const paragraph of buffer) {
        chunk.push(paragraph);
        if (wordCount(chunk.join('\n')) >= maxWords) {
          pushSegment(currentTitle, chunk);
          chunk = [];
          // After the first chunk, treat remaining pieces as spillover with no heading
          currentTitle = null;
        }
      }
      if (chunk.length) {
        pushSegment(currentTitle, chunk);
      }
    }
    buffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (isLikelyHeading(line)) {
      flushBuffer();
      currentTitle = line.trim();
      continue;
    }
    buffer.push(line);
  }

  flushBuffer();
  return segments;
}

function buildDraftFile({ slug, baseTitle, description, source, segment, index }) {
  const segmentSlug = `${slug}-${index + 1}`;
  const title = segment.title.replace(/\s+/g, ' ').trim();

  return `---
name: ${segmentSlug}
description: ${description || `Draft tactic extracted from ${source}`}
source: ${source}
status: draft
---

# ${baseTitle}

## Focus
> ${title}

## Source Highlights (auto-extracted)

${segment.text}

## Conversion Checklist
- [ ] Translate the highlights into teachable tactical guidance
- [ ] Add practical on-water scenarios/examples
- [ ] Include quantifiable decision triggers (angles, speeds, timing)
- [ ] Define pre-race checks and in-race callouts
- [ ] Update frontmatter description before publishing
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.pdf) {
    printUsage();
    process.exit(1);
  }

  const pdfPath = path.resolve(args.pdf);
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF not found: ${pdfPath}`);
    process.exit(1);
  }

  const rawFileName = path.basename(pdfPath, path.extname(pdfPath));
  const slug = args.slug ? slugify(args.slug) : slugify(rawFileName);
  const baseTitle = args.title || rawFileName.replace(/[-_]/g, ' ');
  const source = args.source || rawFileName;
  const description = args.description;

  const outDir = path.join(__dirname, '..', 'skills', 'generated', slug);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`📘 Extracting ${pdfPath}`);
  const pdfBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: pdfBuffer });
  const pdfData = await parser.getText();
  await parser.destroy();
  const rawText = pdfData.text;

  const rawTextPath = path.join(outDir, 'source.txt');
  fs.writeFileSync(rawTextPath, rawText);
  console.log(`   ↳ Raw text written to ${path.relative(process.cwd(), rawTextPath)}`);

  const maxWords = args.maxWords ? Number(args.maxWords) : 350;
  const minWords = args.minWords ? Number(args.minWords) : 120;
  const segments = splitIntoSegments(rawText, { maxWords, minWords });

  if (!segments.length) {
    console.warn('⚠️  No segments detected. Check the PDF formatting or adjust --minWords/--maxWords.');
    return;
  }

  const outline = [];

  segments.forEach((segment, index) => {
    const draftFile = path.join(outDir, `segment-${String(index + 1).padStart(2, '0')}.draft.md`);
    fs.writeFileSync(
      draftFile,
      buildDraftFile({ slug, baseTitle, description, source, segment, index })
    );

    outline.push({
      index: index + 1,
      draftFile: path.basename(draftFile),
      heading: segment.title,
      words: wordCount(segment.text)
    });
  });

  const outlinePath = path.join(outDir, 'outline.json');
  fs.writeFileSync(outlinePath, JSON.stringify(outline, null, 2));

  console.log(`   ↳ Generated ${segments.length} draft segment(s) under skills/generated/${slug}/`);
  console.log('   Next: curate each draft into a final SKILL.md, then run the uploader.');
}

main().catch((err) => {
  console.error('❌ Failed to generate skill drafts:', err);
  process.exit(1);
});
