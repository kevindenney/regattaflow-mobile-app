import {
  MAPLIBRE_CSS_URL,
  MAPLIBRE_JS_FALLBACK_URLS,
  MAPLIBRE_JS_URL,
  ensureMapLibreCss,
  ensureMapLibreScript,
} from '@/lib/maplibreWeb';

type FakeElement = {
  id?: string;
  tagName?: string;
  readyState?: string;
  rel?: string;
  href?: string;
  src?: string;
  async?: boolean;
  onload?: () => void;
  onerror?: () => void;
  addEventListener?: (event: string, cb: () => void) => void;
};

function createFakeDom() {
  const elements = new Map<string, FakeElement>();
  const head = {
    appendChild: (el: FakeElement) => {
      if (el.id) {
        elements.set(el.id, el);
      }
      if (el.tagName === 'script' && typeof el.onload === 'function') {
        el.onload();
      }
      return el;
    },
  };

  const documentMock = {
    head,
    createElement: (tag: string): FakeElement => ({ tagName: tag }),
    getElementById: (id: string) => elements.get(id) || null,
  };

  return { documentMock, elements };
}

describe('maplibreWeb helpers', () => {
  const originalDocument = (globalThis as any).document;
  const originalWindow = (globalThis as any).window;

  afterEach(() => {
    if (typeof originalDocument === 'undefined') {
      delete (globalThis as any).document;
    } else {
      (globalThis as any).document = originalDocument;
    }

    if (typeof originalWindow === 'undefined') {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  });

  it('injects maplibre css link once', () => {
    const { documentMock, elements } = createFakeDom();
    (globalThis as any).document = documentMock;

    ensureMapLibreCss('maplibre-css-test');
    ensureMapLibreCss('maplibre-css-test');

    const link = elements.get('maplibre-css-test');
    expect(link).toBeDefined();
    expect(link?.rel).toBe('stylesheet');
    expect(link?.href).toBe(MAPLIBRE_CSS_URL);
    expect(elements.size).toBe(1);
  });

  it('does nothing for script load when maplibre is already on window', async () => {
    const { documentMock } = createFakeDom();
    const appendSpy = jest.spyOn(documentMock.head, 'appendChild');
    (globalThis as any).document = documentMock;
    (globalThis as any).window = { maplibregl: {} };

    await ensureMapLibreScript('maplibre-script-test');

    expect(appendSpy).not.toHaveBeenCalled();
  });

  it('loads script when no existing script tag is present', async () => {
    const { documentMock, elements } = createFakeDom();
    jest.spyOn(documentMock.head, 'appendChild').mockImplementation((el: FakeElement) => {
      if (el.id) {
        elements.set(el.id, el);
      }
      if (el.tagName === 'script') {
        (globalThis as any).window.maplibregl = { Map: function MockMap() {} };
        el.onload?.();
      }
      return el;
    });
    (globalThis as any).document = documentMock;
    (globalThis as any).window = {};

    await ensureMapLibreScript('maplibre-script-test');

    const script = elements.get('maplibre-script-test');
    expect(script).toBeDefined();
    expect(script?.src).toBe(MAPLIBRE_JS_URL);
    expect(script?.async).toBe(true);
  });

  it('awaits existing script load listener when script already exists', async () => {
    const { documentMock, elements } = createFakeDom();
    const existingScript: FakeElement = {
      id: 'maplibre-script-existing',
      tagName: 'script',
      addEventListener: (event, cb) => {
        if (event === 'load') {
          (globalThis as any).window.maplibregl = {};
          cb();
        }
      },
    };
    elements.set(existingScript.id!, existingScript);

    (globalThis as any).document = documentMock;
    (globalThis as any).window = {};

    await expect(ensureMapLibreScript('maplibre-script-existing')).resolves.toBeUndefined();
  });

  it('returns immediately when existing script is complete and maplibre is available', async () => {
    const { documentMock, elements } = createFakeDom();
    const existingScript: FakeElement = {
      id: 'maplibre-script-complete',
      tagName: 'script',
      readyState: 'complete',
      addEventListener: jest.fn(),
    };
    elements.set(existingScript.id!, existingScript);
    (globalThis as any).document = documentMock;
    (globalThis as any).window = { maplibregl: { Map: function MockMap() {} } };

    await expect(ensureMapLibreScript('maplibre-script-complete')).resolves.toBeUndefined();
    expect(existingScript.addEventListener).not.toHaveBeenCalled();
  });

  it('returns immediately when existing script is loaded and maplibre is available', async () => {
    const { documentMock, elements } = createFakeDom();
    const existingScript: FakeElement = {
      id: 'maplibre-script-loaded',
      tagName: 'script',
      readyState: 'loaded',
      addEventListener: jest.fn(),
    };
    elements.set(existingScript.id!, existingScript);
    (globalThis as any).document = documentMock;
    (globalThis as any).window = { maplibregl: { Map: function MockMap() {} } };

    await expect(ensureMapLibreScript('maplibre-script-loaded')).resolves.toBeUndefined();
    expect(existingScript.addEventListener).not.toHaveBeenCalled();
  });

  it('supports existing script without addEventListener', async () => {
    const { documentMock, elements } = createFakeDom();
    const existingScript: FakeElement = {
      id: 'maplibre-script-no-listeners',
      tagName: 'script',
    };
    elements.set(existingScript.id!, existingScript);
    (globalThis as any).document = documentMock;
    (globalThis as any).window = {};

    const pending = ensureMapLibreScript('maplibre-script-no-listeners');
    expect(typeof existingScript.onload).toBe('function');
    (globalThis as any).window.maplibregl = {};
    existingScript.onload?.();
    await expect(pending).resolves.toBeUndefined();
  });

  it('falls back to secondary CDN when primary fails', async () => {
    const { documentMock, elements } = createFakeDom();
    const appendSpy = jest.spyOn(documentMock.head, 'appendChild').mockImplementation((el: FakeElement) => {
      if (el.id) {
        elements.set(el.id, el);
      }
      if (el.tagName === 'script') {
        if (el.src === MAPLIBRE_JS_URL) {
          el.onerror?.();
        } else if (el.src === MAPLIBRE_JS_FALLBACK_URLS[0]) {
          (globalThis as any).window.maplibregl = { Map: function MockMap() {} };
          el.onload?.();
        }
      }
      return el;
    });

    (globalThis as any).document = documentMock;
    (globalThis as any).window = {};

    await expect(ensureMapLibreScript('maplibre-script-fallback')).resolves.toBeUndefined();
    expect(appendSpy).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent script loads per script id', async () => {
    const { documentMock } = createFakeDom();
    const appendSpy = jest.spyOn(documentMock.head, 'appendChild');
    appendSpy.mockImplementation((el: FakeElement) => {
      if (el.tagName === 'script') {
        (globalThis as any).window.maplibregl = { Map: function MockMap() {} };
        el.onload?.();
      }
      return el;
    });
    (globalThis as any).document = documentMock;
    (globalThis as any).window = {};

    await Promise.all([
      ensureMapLibreScript('maplibre-script-shared'),
      ensureMapLibreScript('maplibre-script-shared'),
    ]);

    expect(appendSpy).toHaveBeenCalledTimes(1);
  });
});
