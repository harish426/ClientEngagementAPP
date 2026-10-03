import { IdentityProfile } from './types';

const STORAGE_KEY = '_b2b_trk_identity';

/**
 * Generates a unique anonymous visitor ID
 */
export function generateVisitorId(): string {
  const randomStr = Math.random().toString(36).substring(2, 10);
  const timeStr = Date.now().toString(36);
  return `vid_${timeStr}_${randomStr}`;
}

/**
 * Extracts query parameters from URL (e.g. from Lemlist cold emails or campaigns)
 */
export function extractUrlParams(url: string): Partial<IdentityProfile> {
  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;

    const email = params.get('email') || params.get('lead_email') || params.get('user_email');
    const companyDomain = params.get('domain') || params.get('company_domain');
    const companyName = params.get('company') || params.get('company_name');
    const campaignLeadId = params.get('lid') || params.get('lead_id') || params.get('lemlist_lead_id');
    const lemlistCampaignId = params.get('cid') || params.get('campaign_id');

    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmContent = params.get('utm_content');
    const utmTerm = params.get('utm_term');

    const profile: Partial<IdentityProfile> = {};

    if (email) {
      profile.email = email.trim().toLowerCase();
      if (!companyDomain && email.includes('@')) {
        const domainCandidate = email.split('@')[1];
        // Ignore generic mail domains
        const genericDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
        if (!genericDomains.includes(domainCandidate.toLowerCase())) {
          profile.companyDomain = domainCandidate.toLowerCase();
        }
      }
    }

    if (companyDomain) profile.companyDomain = companyDomain.trim().toLowerCase();
    if (companyName) profile.companyName = companyName.trim();
    if (campaignLeadId) profile.campaignLeadId = campaignLeadId.trim();
    if (lemlistCampaignId) profile.lemlistCampaignId = lemlistCampaignId.trim();

    if (utmSource) profile.utmSource = utmSource;
    if (utmMedium) profile.utmMedium = utmMedium;
    if (utmCampaign) profile.utmCampaign = utmCampaign;
    if (utmContent) profile.utmContent = utmContent;
    if (utmTerm) profile.utmTerm = utmTerm;

    return profile;
  } catch {
    return {};
  }
}

/**
 * Manages Identity resolution and persistence
 */
export class IdentityManager {
  private profile: IdentityProfile;

  constructor() {
    this.profile = this.loadOrCreate();
  }

  private loadOrCreate(): IdentityProfile {
    let stored: Partial<IdentityProfile> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        stored = JSON.parse(raw);
      }
    } catch {
      // LocalStorage access may fail in private mode
    }

    const visitorId = stored.visitorId || generateVisitorId();
    const urlExtracted = typeof window !== 'undefined' ? extractUrlParams(window.location.href) : {};

    const merged: IdentityProfile = {
      visitorId,
      email: urlExtracted.email || stored.email || null,
      companyDomain: urlExtracted.companyDomain || stored.companyDomain || null,
      companyName: urlExtracted.companyName || stored.companyName || null,
      campaignLeadId: urlExtracted.campaignLeadId || stored.campaignLeadId || null,
      lemlistCampaignId: urlExtracted.lemlistCampaignId || stored.lemlistCampaignId || null,
      utmSource: urlExtracted.utmSource || stored.utmSource || null,
      utmMedium: urlExtracted.utmMedium || stored.utmMedium || null,
      utmCampaign: urlExtracted.utmCampaign || stored.utmCampaign || null,
      utmContent: urlExtracted.utmContent || stored.utmContent || null,
      utmTerm: urlExtracted.utmTerm || stored.utmTerm || null,
    };

    this.save(merged);
    return merged;
  }

  public identify(attributes: Partial<IdentityProfile>): IdentityProfile {
    this.profile = {
      ...this.profile,
      ...attributes,
      visitorId: this.profile.visitorId, // visitorId is immutable
    };
    this.save(this.profile);
    return this.profile;
  }

  public getProfile(): IdentityProfile {
    return { ...this.profile };
  }

  private save(profile: IdentityProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage errors
    }
  }
}
