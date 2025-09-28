import { useEffect } from 'react';
import { Platform } from 'react-native';

export function ScrollFix() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Inject CSS to fix scrolling
      const style = document.createElement('style');
      style.innerHTML = `
        html {
          height: 100%;
          overflow-y: scroll !important;
        }

        body {
          height: 100%;
          overflow-y: scroll !important;
          margin: 0;
        }

        #root, #__expo-root {
          height: auto !important;
          min-height: 100%;
          overflow: visible !important;
        }

        /* Fix for React Native Web ScrollView */
        div[dir="auto"] {
          height: auto !important;
          overflow: visible !important;
        }

        /* Target the main app container */
        div[style*="flex: 1"][style*="background-color"] {
          height: auto !important;
          min-height: 100vh;
        }

        /* Ensure components render with proper dimensions */
        div[style*="width: 0px"][style*="height: 0px"] {
          width: auto !important;
          height: auto !important;
          min-width: 100% !important;
          min-height: 400px !important;
        }

        /* Ensure the main content is scrollable */
        body > div {
          height: auto !important;
          min-height: 100%;
          overflow: visible !important;
        }

        /* Force body to be scrollable */
        body::-webkit-scrollbar {
          width: 12px;
        }

        body::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        body::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
      `;
      document.head.appendChild(style);

      // Log for debugging
      console.log('🔧 ScrollFix: Styles injected for scrolling');

      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return null;
}