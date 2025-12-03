/**
 * RegattaFlow Embeddable Widget Script
 * 
 * Usage:
 * <div id="regattaflow-widget" 
 *      data-club-id="your-club-id"
 *      data-type="calendar|results|standings|notices|schedule"
 *      data-regatta-id="optional-regatta-id"
 *      data-theme="light|dark|auto">
 * </div>
 * <script src="https://widgets.regattaflow.com/embed.js" async></script>
 */

(function() {
  'use strict';

  const WIDGET_BASE_URL = 'https://regattaflow.com';
  const API_BASE_URL = 'https://regattaflow.com/api/public';
  
  // Widget types and their default heights
  const WIDGET_CONFIGS = {
    calendar: { height: 400, minHeight: 300 },
    results: { height: 500, minHeight: 400 },
    standings: { height: 450, minHeight: 350 },
    notices: { height: 350, minHeight: 250 },
    schedule: { height: 400, minHeight: 300 },
    entry_list: { height: 400, minHeight: 300 },
    countdown: { height: 150, minHeight: 100 },
    weather: { height: 200, minHeight: 150 },
  };

  // Styles for widget container
  const injectStyles = () => {
    if (document.getElementById('regattaflow-widget-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'regattaflow-widget-styles';
    style.textContent = `
      .regattaflow-widget-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .regattaflow-widget-container.loading {
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .regattaflow-widget-container.error {
        background: #fef2f2;
        color: #991b1b;
        padding: 16px;
        text-align: center;
      }
      .regattaflow-widget-frame {
        width: 100%;
        border: none;
        display: block;
      }
      .regattaflow-loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e5e7eb;
        border-top-color: #0ea5e9;
        border-radius: 50%;
        animation: regattaflow-spin 0.8s linear infinite;
      }
      @keyframes regattaflow-spin {
        to { transform: rotate(360deg); }
      }
      .regattaflow-branding {
        background: #f9fafb;
        padding: 8px 12px;
        text-align: center;
        font-size: 11px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
      }
      .regattaflow-branding a {
        color: #0ea5e9;
        text-decoration: none;
      }
      .regattaflow-branding a:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  };

  // Create loading placeholder
  const createLoader = (height) => {
    const loader = document.createElement('div');
    loader.className = 'regattaflow-widget-container loading';
    loader.style.height = height + 'px';
    loader.innerHTML = '<div class="regattaflow-loading-spinner"></div>';
    return loader;
  };

  // Create error message
  const createError = (message) => {
    const error = document.createElement('div');
    error.className = 'regattaflow-widget-container error';
    error.innerHTML = `
      <strong>Widget Error</strong>
      <p style="margin:8px 0 0;font-size:13px;">${message}</p>
    `;
    return error;
  };

  // Build widget iframe URL
  const buildWidgetUrl = (config) => {
    const params = new URLSearchParams();
    
    if (config.clubId) params.set('club', config.clubId);
    if (config.regattaId) params.set('regatta', config.regattaId);
    if (config.theme) params.set('theme', config.theme);
    if (config.accentColor) params.set('accent', config.accentColor);
    if (config.showBranding === false) params.set('branding', '0');
    
    // Pass any filter options
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        params.set(`filter_${key}`, value);
      });
    }
    
    return `${WIDGET_BASE_URL}/embed/${config.type}?${params.toString()}`;
  };

  // Initialize a single widget
  const initWidget = async (element) => {
    // Parse configuration from data attributes
    const config = {
      type: element.dataset.type || 'calendar',
      clubId: element.dataset.clubId || element.dataset.club,
      regattaId: element.dataset.regattaId || element.dataset.regatta,
      theme: element.dataset.theme || 'light',
      accentColor: element.dataset.accentColor || element.dataset.accent,
      showBranding: element.dataset.branding !== 'false',
      height: parseInt(element.dataset.height) || null,
      filters: {},
    };

    // Parse filter attributes
    Object.keys(element.dataset).forEach(key => {
      if (key.startsWith('filter')) {
        const filterKey = key.replace('filter', '').toLowerCase();
        config.filters[filterKey] = element.dataset[key];
      }
    });

    // Validate required fields
    if (!config.type || !WIDGET_CONFIGS[config.type]) {
      element.replaceWith(createError(`Invalid widget type: ${config.type}`));
      return;
    }

    if (!config.clubId && !config.regattaId) {
      element.replaceWith(createError('Missing required attribute: data-club-id or data-regatta-id'));
      return;
    }

    // Get height configuration
    const widgetConfig = WIDGET_CONFIGS[config.type];
    const height = config.height || widgetConfig.height;

    // Show loader
    const loader = createLoader(height);
    element.replaceWith(loader);

    try {
      // Create container
      const container = document.createElement('div');
      container.className = 'regattaflow-widget-container';
      container.setAttribute('data-regattaflow-widget', config.type);

      // Create iframe
      const iframe = document.createElement('iframe');
      iframe.className = 'regattaflow-widget-frame';
      iframe.src = buildWidgetUrl(config);
      iframe.style.height = height + 'px';
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allowtransparency', 'true');
      iframe.setAttribute('title', `RegattaFlow ${config.type} widget`);
      
      // Allow fullscreen for results/standings
      if (['results', 'standings'].includes(config.type)) {
        iframe.setAttribute('allowfullscreen', 'true');
      }

      container.appendChild(iframe);

      // Add branding footer if enabled
      if (config.showBranding) {
        const branding = document.createElement('div');
        branding.className = 'regattaflow-branding';
        branding.innerHTML = 'Powered by <a href="https://regattaflow.com" target="_blank" rel="noopener">RegattaFlow</a>';
        container.appendChild(branding);
      }

      // Handle iframe messages for dynamic height
      window.addEventListener('message', (event) => {
        if (event.origin !== new URL(WIDGET_BASE_URL).origin) return;
        
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          
          if (data.type === 'regattaflow:resize' && data.widgetId === config.type) {
            iframe.style.height = Math.max(data.height, widgetConfig.minHeight) + 'px';
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      });

      // Replace loader with widget
      loader.replaceWith(container);

      // Track impression
      trackImpression(config);

    } catch (error) {
      console.error('RegattaFlow widget error:', error);
      loader.replaceWith(createError('Failed to load widget'));
    }
  };

  // Track widget impression for analytics
  const trackImpression = async (config) => {
    try {
      // Fire and forget - don't block widget loading
      fetch(`${API_BASE_URL}/widgets/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: config.type,
          clubId: config.clubId,
          regattaId: config.regattaId,
          domain: window.location.hostname,
          path: window.location.pathname,
        }),
      }).catch(() => {}); // Silently ignore errors
    } catch (e) {
      // Ignore
    }
  };

  // Initialize all widgets on page
  const initAllWidgets = () => {
    injectStyles();
    
    // Find all widget containers
    const widgets = document.querySelectorAll(
      '[data-regattaflow], [id^="regattaflow-"], .regattaflow-widget'
    );
    
    widgets.forEach(widget => {
      // Skip already initialized
      if (widget.hasAttribute('data-regattaflow-initialized')) return;
      widget.setAttribute('data-regattaflow-initialized', 'true');
      
      initWidget(widget);
    });
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllWidgets);
  } else {
    initAllWidgets();
  }

  // Also watch for dynamically added widgets
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            if (node.matches && (
              node.matches('[data-regattaflow]') || 
              node.matches('[id^="regattaflow-"]') ||
              node.matches('.regattaflow-widget')
            )) {
              initWidget(node);
            }
            // Also check descendants
            const descendants = node.querySelectorAll && node.querySelectorAll(
              '[data-regattaflow], [id^="regattaflow-"], .regattaflow-widget'
            );
            if (descendants) {
              descendants.forEach(w => {
                if (!w.hasAttribute('data-regattaflow-initialized')) {
                  w.setAttribute('data-regattaflow-initialized', 'true');
                  initWidget(w);
                }
              });
            }
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Expose API for manual initialization
  window.RegattaFlow = window.RegattaFlow || {};
  window.RegattaFlow.initWidget = initWidget;
  window.RegattaFlow.initAllWidgets = initAllWidgets;

})();

