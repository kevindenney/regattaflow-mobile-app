#!/usr/bin/env node

/**
 * Check Chrome console for bathymetry logs using Claude MCP
 */

import { spawn } from 'child_process';

async function checkChromeConsole() {
  console.log('🔍 Checking Chrome DevTools for bathymetry logs...\n');

  // Try to get Chrome tabs via the MCP server
  const claude = spawn('claude', ['mcp', 'list']);

  claude.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  claude.stderr.on('data', (data) => {
    console.error('Error:', data.toString());
  });

  claude.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ MCP connection verified');
      console.log('\n💡 To check console logs manually:');
      console.log('   1. Open Chrome DevTools (Cmd+Option+I)');
      console.log('   2. Go to Console tab');
      console.log('   3. Filter for "bathymetry"');
      console.log('   4. Look for "Adding bathymetry deck layers"');
    }
  });
}

checkChromeConsole();
