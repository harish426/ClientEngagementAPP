import { IdentityProfile, TrackerConfig } from './types';
import { IdentityManager } from './identity';
import { EventTransport } from './transport';
import { EventObserver } from './events';

export class B2BTracker {
  private config: TrackerConfig;
  private identityManager: IdentityManager;
  private transport: EventTransport;
  private eventObserver: EventObserver;
  private initialized: boolean = false;

  constructor(config: TrackerConfig) {
    this.config = {
      debug: false,
      batchIntervalMs: 3000,
      heartbeatIntervalMs: 30000,
      autoCaptureForms: true,
      autoCaptureClicks: true,
      ...config,
    };

    this.identityManager = new IdentityManager();
    this.transport = new EventTransport(
      this.config.endpoint,
      this.config.batchIntervalMs,
      this.config.debug
    );
    this.eventObserver = new EventObserver(
      this.transport,
      this.identityManager,
      this.config.highIntentPatterns,
      this.config.heartbeatIntervalMs
    );
  }

  public init(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (this.config.debug) {
      console.log(`[B2B-Tracker] Initialized in ${this.config.env || 'production'} mode -> Endpoint: ${this.config.endpoint}`);
    }

    this.eventObserver.init(
      this.config.autoCaptureForms,
      this.config.autoCaptureClicks
    );
  }

  /**
   * Explicitly identify a user (e.g., after login or signup in your web app)
   */
  public identify(attributes: Partial<IdentityProfile>): void {
    const updated = this.identityManager.identify(attributes);
    if (this.config.debug) {
      console.log('[B2B-Tracker] User identified:', updated);
    }
    // Fire an immediate pageview or custom event with the new identity
    this.eventObserver.trackCustom('user_identified', attributes);
  }

  /**
   * Track custom custom in-app action (e.g., "watched_demo_video", "clicked_roi_calculator")
   */
  public track(eventName: string, metadata?: Record<string, unknown>): void {
    this.eventObserver.trackCustom(eventName, metadata);
  }

  /**
   * Returns the current profile
   */
  public getIdentity(): IdentityProfile {
    return this.identityManager.getProfile();
  }
}
