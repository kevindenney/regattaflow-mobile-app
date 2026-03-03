#!/usr/bin/env node

import { execSync } from 'node:child_process';

const repo = process.env.GH_REPO || 'kevindenney/regattaflow-mobile-app';
const requiredOptionalSecrets = [
  'INTEGRATION_AUTH_SAILING_BEARER',
  'INTEGRATION_AUTH_INSTITUTION_BEARER',
];

function getConfiguredSecrets(repoSlug) {
  try {
    const output = execSync(`gh secret list --repo ${repoSlug}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return new Set(
      output
        .split('\n')
        .map((line) => line.trim().split(/\s+/)[0])
        .filter(Boolean)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[check-auth-probe-gh-secrets] Unable to query GitHub secrets: ${message}`);
    process.exitCode = 1;
    return null;
  }
}

function run() {
  const configured = getConfiguredSecrets(repo);
  if (!configured) return;

  const missing = requiredOptionalSecrets.filter((name) => !configured.has(name));
  if (missing.length === 0) {
    console.log(`[check-auth-probe-gh-secrets] PASS repo=${repo} (all optional auth probe secrets configured)`);
    return;
  }

  console.log(`[check-auth-probe-gh-secrets] WARN repo=${repo}`);
  for (const secretName of missing) {
    console.log(`- missing: ${secretName}`);
  }
  console.log(
    '- Deployment smoke still passes without these, but authenticated domain probes remain disabled until configured.'
  );
}

run();

