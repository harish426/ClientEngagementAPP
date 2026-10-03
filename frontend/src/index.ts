import { B2BTracker } from './tracker';
import { TrackerConfig, Environment } from './types';

export * from './types';
export { B2BTracker };

declare global {
  interface Window {
    B2BTracker?: typeof B2BTracker;
    b2bTracker?: B2BTracker;
  }
}

// Auto-initialize if running directly in a browser <script> tag
if (typeof window !== 'undefined') {
  window.B2BTracker = B2BTracker;

  const currentScript =
    document.currentScript ||
    document.querySelector('script[data-b2b-endpoint]') ||
    document.querySelector('script[src*="tracker"]');

  if (currentScript) {
    const endpoint =
      currentScript.getAttribute('data-b2b-endpoint') ||
      currentScript.getAttribute('data-endpoint');

    if (endpoint) {
      const env = (currentScript.getAttribute('data-env') as Environment) || 'production';
      const debug = currentScript.getAttribute('data-debug') === 'true';

      const config: TrackerConfig = {
        endpoint,
        env,
        debug,
      };

      const instance = new B2BTracker(config);
      instance.init();
      window.b2bTracker = instance;
    }
  }
}
