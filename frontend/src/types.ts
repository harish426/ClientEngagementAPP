/**
 * Tracker SDK Types & Interfaces
 */

export type Environment = 'development' | 'test' | 'production';

export type EventType =
  | 'pageview'
  | 'heartbeat'
  | 'click'
  | 'form_click'
  | 'form_submit'
  | 'connection_accepted'
  | 'high_intent_view'
  | 'custom';

export interface IdentityProfile {
  visitorId: string;
  email?: string | null;
  companyDomain?: string | null;
  companyName?: string | null;
  campaignLeadId?: string | null;
  lemlistCampaignId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
}

export interface TrackPayload {
  eventId: string;
  eventType: EventType;
  timestamp: string;
  identity: IdentityProfile;
  url: string;
  path: string;
  referrer: string;
  title: string;
  screenResolution: string;
  timeOnPageSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface TrackerConfig {
  endpoint: string;
  env?: Environment;
  debug?: boolean;
  heartbeatIntervalMs?: number;
  batchIntervalMs?: number;
  highIntentPatterns?: (string | RegExp)[];
  autoCaptureForms?: boolean;
  autoCaptureClicks?: boolean;
}
