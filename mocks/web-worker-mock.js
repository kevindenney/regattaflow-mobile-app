/**
 * Mock for web-worker package
 * web-worker uses Node.js dynamic imports that don't work in React Native
 * This stub allows the build to complete - geotiff functionality will be limited
 */

class Worker {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.onmessage = null;
    this.onerror = null;
  }

  postMessage(message) {
    // No-op in React Native
    console.warn('web-worker: postMessage called but workers are not supported in React Native');
  }

  terminate() {
    // No-op
  }

  addEventListener(type, listener) {
    if (type === 'message') {
      this.onmessage = listener;
    } else if (type === 'error') {
      this.onerror = listener;
    }
  }

  removeEventListener(type, listener) {
    if (type === 'message' && this.onmessage === listener) {
      this.onmessage = null;
    } else if (type === 'error' && this.onerror === listener) {
      this.onerror = null;
    }
  }
}

module.exports = Worker;
module.exports.default = Worker;

