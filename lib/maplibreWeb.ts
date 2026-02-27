export const MAPLIBRE_WEB_VERSION = '3.6.2';
export const MAPLIBRE_CSS_URL = `https://unpkg.com/maplibre-gl@${MAPLIBRE_WEB_VERSION}/dist/maplibre-gl.css`;
export const MAPLIBRE_JS_URL = `https://unpkg.com/maplibre-gl@${MAPLIBRE_WEB_VERSION}/dist/maplibre-gl.js`;
export const MAPLIBRE_JS_FALLBACK_URLS = [
  `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_WEB_VERSION}/dist/maplibre-gl.js`,
];

const MAPLIBRE_SCRIPT_TIMEOUT_MS = 8000;
const pendingScriptLoads = new Map<string, Promise<void>>();

const isMapLibreLoaded = (): boolean => {
  if (typeof window === 'undefined') return false;
  const maplibregl = (window as any).maplibregl;
  return Boolean(maplibregl);
};

export function ensureMapLibreCss(linkId: string): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = MAPLIBRE_CSS_URL;
  document.head.appendChild(link);
}

export async function ensureMapLibreScript(scriptId: string): Promise<void> {
  if (typeof document === 'undefined') return;
  if (isMapLibreLoaded()) return;
  const existingLoad = pendingScriptLoads.get(scriptId);
  if (existingLoad) return existingLoad;

  const loadPromise = (async () => {
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const candidateUrls = [MAPLIBRE_JS_URL, ...MAPLIBRE_JS_FALLBACK_URLS];

    if (existing) {
      await waitForExistingScript(existing);
      if (isMapLibreLoaded()) return;
      // Existing tag may be stale/blocked; continue with fallback sources.
      await loadFromCandidateUrls(scriptId, candidateUrls, true);
      return;
    }

    await loadFromCandidateUrls(scriptId, candidateUrls, false);
  })();

  pendingScriptLoads.set(scriptId, loadPromise);
  try {
    await loadPromise;
  } finally {
    pendingScriptLoads.delete(scriptId);
  }
}

async function waitForExistingScript(existing: HTMLScriptElement): Promise<void> {
  if (isMapLibreLoaded()) return;
  const readyState = (existing as any).readyState;
  if (readyState === 'complete' || readyState === 'loaded') return;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Existing CDN script timed out')), MAPLIBRE_SCRIPT_TIMEOUT_MS);
    const onLoad = () => {
      clearTimeout(timeout);
      resolve();
    };
    const onError = () => {
      clearTimeout(timeout);
      reject(new Error('Existing CDN script failed'));
    };

    if (typeof existing.addEventListener === 'function') {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const prevOnLoad = existing.onload;
    const prevOnError = existing.onerror;
    existing.onload = () => {
      prevOnLoad?.call(existing, new Event('load'));
      onLoad();
    };
    existing.onerror = (ev) => {
      prevOnError?.call(existing, ev as any);
      onError();
    };
  });
}

async function loadFromCandidateUrls(
  scriptId: string,
  urls: string[],
  useFallbackIds: boolean
): Promise<void> {
  let lastError: unknown = null;
  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    try {
      const id = useFallbackIds ? `${scriptId}-retry-${index + 1}` : scriptId;
      await loadScriptTag(id, url);
      if (isMapLibreLoaded()) {
        return;
      }
      // Some loads complete but don't expose the namespace.
      lastError = new Error('MapLibre namespace unavailable after script load');
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error('Failed to load MapLibre script');
}

function loadScriptTag(scriptId: string, src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    const timeout = setTimeout(() => reject(new Error('CDN script timed out')), MAPLIBRE_SCRIPT_TIMEOUT_MS);
    script.id = scriptId;
    script.src = src;
    script.async = true;
    script.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('CDN script failed'));
    };
    document.head.appendChild(script);
  });
}
