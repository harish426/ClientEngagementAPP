import { TrackPayload } from './types';

/**
 * Resilient event transport using sendBeacon with fetch fallback and queueing
 */
export class EventTransport {
  private endpoint: string;
  private debug: boolean;
  private queue: TrackPayload[] = [];
  private flushTimer: number | null = null;
  private batchIntervalMs: number;

  constructor(endpoint: string, batchIntervalMs: number = 3000, debug: boolean = false) {
    this.endpoint = endpoint;
    this.batchIntervalMs = batchIntervalMs;
    this.debug = debug;

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush(true));
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true);
        }
      });
    }
  }

  public send(payload: TrackPayload, immediate: boolean = false): void {
    this.queue.push(payload);

    if (this.debug) {
      console.log(`[B2B-Tracker] Queued event: ${payload.eventType}`, payload);
    }

    if (immediate) {
      this.flush(true);
      return;
    }

    if (!this.flushTimer) {
      this.flushTimer = window.setTimeout(() => this.flush(false), this.batchIntervalMs);
    }
  }

  public flush(isUnloading: boolean = false): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0) return;

    const eventsToSend = [...this.queue];
    this.queue = [];

    const bodyString = JSON.stringify({ events: eventsToSend });

    if (this.debug) {
      console.log(`[B2B-Tracker] Flushing ${eventsToSend.length} events to ${this.endpoint}`);
    }

    // Try Beacon API first (optimal for page unload / backgrounding)
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const blob = new Blob([bodyString], { type: 'application/json' });
        const success = navigator.sendBeacon(this.endpoint, blob);
        if (success) return;
      } catch (err) {
        if (this.debug) console.warn('[B2B-Tracker] Beacon failed, falling back to fetch', err);
      }
    }

    // Fallback to fetch with keepalive
    if (typeof fetch !== 'undefined') {
      fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bodyString,
        keepalive: isUnloading,
      }).catch((err) => {
        if (this.debug) console.error('[B2B-Tracker] Failed to send events', err);
        // On network failure during normal navigation, put events back
        if (!isUnloading) {
          this.queue.unshift(...eventsToSend);
        }
      });
    }
  }
}
