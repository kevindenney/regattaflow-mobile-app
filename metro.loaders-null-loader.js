/**
 * Minimal stub equivalent to @loaders.gl/core/dist/null-loader.js
 * Metro struggles to resolve the original relative import when bundling for web,
 * so we provide a compatible implementation that mirrors the upstream module.
 */

const VERSION = 'dev-null';

function parseSync(_arrayBuffer, _options, _context) {
  return null;
}

export const NullWorkerLoader = {
  dataType: null,
  batchType: null,
  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  worker: true,
  mimeTypes: ['application/x.empty'],
  extensions: ['null'],
  tests: [() => false],
  options: {
    null: {}
  }
};

export const NullLoader = {
  dataType: null,
  batchType: null,
  name: 'Null loader',
  id: 'null',
  module: 'core',
  version: VERSION,
  mimeTypes: ['application/x.empty'],
  extensions: ['null'],
  parse: async (arrayBuffer, options, context) =>
    parseSync(arrayBuffer, options || {}, context),
  parseSync,
  async *parseInBatches(asyncIterator, options, context) {
    for await (const batch of asyncIterator) {
      yield parseSync(batch, options, context);
    }
  },
  tests: [() => false],
  options: {
    null: {}
  }
};

export default {
  NullLoader,
  NullWorkerLoader
};
