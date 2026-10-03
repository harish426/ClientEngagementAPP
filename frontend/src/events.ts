import { EventType, TrackPayload } from './types';
import { IdentityManager } from './identity';
import { EventTransport } from './transport';

export class EventObserver {
  private transport: EventTransport;
  private identityManager: IdentityManager;
  private highIntentPatterns: (string | RegExp)[];
  private heartbeatIntervalMs: number;
  private heartbeatTimer: number | null = null;
  private pageStartTime: number = Date.now();
  private lastUrl: string = '';

  constructor(
    transport: EventTransport,
    identityManager: IdentityManager,
    highIntentPatterns: (string | RegExp)[] = ['/pricing', '/demo', '/contact', '/book', '/quote', '/checkout'],
    heartbeatIntervalMs: number = 30000
  ) {
    this.transport = transport;
    this.identityManager = identityManager;
    this.highIntentPatterns = highIntentPatterns;
    this.heartbeatIntervalMs = heartbeatIntervalMs;
  }

  public init(autoForms: boolean = true, autoClicks: boolean = true): void {
    this.lastUrl = window.location.href;
    this.trackPageView();
    this.startHeartbeat();
    this.observeSPARouting();

    if (autoForms) this.observeForms();
    if (autoClicks) this.observeHighIntentClicks();
  }

  private createBasePayload(eventType: EventType, customMetadata?: Record<string, unknown>): TrackPayload {
    const timeOnPage = Math.round((Date.now() - this.pageStartTime) / 1000);

    return {
      eventId: `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      eventType,
      timestamp: new Date().toISOString(),
      identity: this.identityManager.getProfile(),
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || '',
      title: document.title || '',
      screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      timeOnPageSeconds: timeOnPage,
      metadata: customMetadata || {},
    };
  }

  public trackPageView(): void {
    const isHighIntent = this.isHighIntentPath(window.location.pathname);
    const eventType: EventType = isHighIntent ? 'high_intent_view' : 'pageview';

    const payload = this.createBasePayload(eventType, {
      isHighIntent,
    });

    this.transport.send(payload, isHighIntent);
  }

  public trackCustom(eventName: string, metadata?: Record<string, unknown>): void {
    const payload = this.createBasePayload('custom', {
      customEventName: eventName,
      ...metadata,
    });
    this.transport.send(payload);
  }

  private isHighIntentPath(path: string): boolean {
    return this.highIntentPatterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return path.toLowerCase().includes(pattern.toLowerCase());
      }
      return pattern.test(path);
    });
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        const payload = this.createBasePayload('heartbeat');
        this.transport.send(payload);
      }
    }, this.heartbeatIntervalMs);
  }

  private observeSPARouting(): void {
    const handleRouteChange = () => {
      if (window.location.href !== this.lastUrl) {
        this.lastUrl = window.location.href;
        this.pageStartTime = Date.now();
        this.trackPageView();
      }
    };

    window.addEventListener('popstate', handleRouteChange);

    // Monkey-patch history pushState / replaceState for SPA frameworks
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleRouteChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleRouteChange();
    };
  }

  private observeForms(): void {
    document.addEventListener(
      'submit',
      (e) => {
        const form = e.target as HTMLFormElement;
        if (!form) return;

        // Try to capture email from form input without harvesting passwords/sensitive data
        const emailInput = form.querySelector('input[type="email"], input[name*="email"]') as HTMLInputElement;
        const nameInput = form.querySelector('input[name*="name"]') as HTMLInputElement;
        const companyInput = form.querySelector('input[name*="company"]') as HTMLInputElement;

        if (emailInput && emailInput.value) {
          this.identityManager.identify({
            email: emailInput.value.trim().toLowerCase(),
            companyName: companyInput ? companyInput.value.trim() : undefined,
          });
        }

        const payload = this.createBasePayload('form_submit', {
          formId: form.id || null,
          formAction: form.action || null,
          hasEmail: Boolean(emailInput && emailInput.value),
          contactNameCaptured: Boolean(nameInput && nameInput.value),
        });

        this.transport.send(payload, true);
      },
      true
    );
  }

  private observeHighIntentClicks(): void {
    document.addEventListener(
      'click',
      (e) => {
        const target = (e.target as HTMLElement).closest('a, button') as HTMLElement;
        if (!target) return;

        const text = (target.innerText || target.getAttribute('aria-label') || '').trim();
        const href = target.getAttribute('href') || '';

        const highIntentKeywords = ['demo', 'pricing', 'contact', 'book', 'talk to sales', 'schedule', 'free trial'];
        const isHighIntent = highIntentKeywords.some(
          (k) => text.toLowerCase().includes(k) || href.toLowerCase().includes(k)
        );

        if (isHighIntent) {
          const payload = this.createBasePayload('click', {
            elementText: text,
            targetHref: href,
            isHighIntentAction: true,
          });
          this.transport.send(payload, true);
        }
      },
      true
    );
  }
}
