/**
 * Console logger injection script
 * Paste this into Chrome DevTools Console to capture bathymetry logs
 */

(function() {
  console.log('🔍 Bathymetry Log Capture Active\n');
  console.log('Monitoring for: "bathymetry", "GEBCO", "synthetic"\n');
  console.log('---\n');

  // Store original console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  // Intercept console.log
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('bathymetry') ||
        message.includes('GEBCO') ||
        message.includes('synthetic') ||
        message.includes('Adding bathymetry') ||
        message.includes('depth')) {
      originalLog.call(console, '🎯 CAPTURED:', ...args);
    } else {
      originalLog.apply(console, args);
    }
  };

  // Intercept console.warn
  console.warn = function(...args) {
    const message = args.join(' ');
    if (message.includes('bathymetry') ||
        message.includes('GEBCO') ||
        message.includes('synthetic')) {
      originalWarn.call(console, '⚠️ CAPTURED WARNING:', ...args);
    } else {
      originalWarn.apply(console, args);
    }
  };

  // Intercept console.error
  console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('bathymetry') ||
        message.includes('GEBCO') ||
        message.includes('synthetic')) {
      originalError.call(console, '❌ CAPTURED ERROR:', ...args);
    } else {
      originalError.apply(console, args);
    }
  };

  console.log('✅ Logger installed. Now toggle the Depth layer in the UI.');
})();
