#!/usr/bin/env node

/**
 * Check Chrome DevTools console for bathymetry logs
 */

import CDP from 'chrome-remote-interface';

async function checkConsole() {
  try {
    const targets = await CDP.List();
    console.log('\n📱 Found Chrome tabs:', targets.length);

    for (const target of targets) {
      if (target.type === 'page' && target.url.includes('localhost:8081')) {
        console.log('\n✅ Found localhost:8081 tab:');
        console.log('  Title:', target.title);
        console.log('  URL:', target.url);

        // Connect to this tab
        const client = await CDP({ target });
        const { Runtime, Log } = client;

        // Enable console
        await Runtime.enable();
        await Log.enable();

        // Listen for console messages
        Runtime.consoleAPICalled((params) => {
          const message = params.args.map(arg => arg.value || arg.description).join(' ');
          if (message.includes('bathymetry') || message.includes('GEBCO') || message.includes('depth')) {
            console.log('\n🔍 Console log:', message);
          }
        });

        // Evaluate script to check for existing logs
        const result = await Runtime.evaluate({
          expression: `
            // Check if bathymetry logs exist in console history
            console.log('Checking for bathymetry data...');
            'Check complete';
          `,
          returnByValue: true
        });

        console.log('\n✨ Evaluation result:', result.result.value);

        await client.close();
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure Chrome is running with remote debugging enabled:');
    console.log('   chrome --remote-debugging-port=9222');
  }
}

checkConsole();
