import { B2BTracker } from './tracker';

// Initialize embedded tracker instance
const tracker = new B2BTracker({
  endpoint: (import.meta as any).env?.VITE_API_ENDPOINT || 'http://localhost:8000/api/v1/track',
  env: ((import.meta as any).env?.MODE as 'development' | 'production' | 'test') || 'development',
  debug: (import.meta as any).env?.DEV ?? true,
  autoCaptureForms: true,
  autoCaptureClicks: true,
});
tracker.init();

// Helper date formatters
function formatExactTimestamp(date: Date = new Date()): string {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function formatShortTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

function getRelativeTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Interfaces
export type EventCategory =
  | 'form_click'
  | 'form_submit'
  | 'connection_accepted'
  | 'connection_sent'
  | 'email_click'
  | 'email_reply'
  | 'pageview';

export interface TaskAuditItem {
  id: string;
  task: string;
  category: EventCategory;
  points: number;
  timestamp: string;
  rawDate: Date;
  timeAgo: string;
  icon: string;
  metaDetails?: string;
}

export interface EngagingPerson {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  domain: string;
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  status: string;
  linkedinUrl: string;
  avatarInitials: string;
  committeeSize: number;
  lastFormClickAt?: string;
  lastFormSubmitAt?: string;
  connectionAcceptedAt?: string;
  lastActiveAt: string;
  tasks: TaskAuditItem[];
}

export interface ApolloProspect {
  id: string;
  name: string;
  title: string;
  company: string;
  domain: string;
  email: string;
  headcount: string;
  location: string;
  linkedinUrl: string;
  verified: boolean;
  status: 'Queued' | 'Enrolled in Lemlist' | 'Email Sent' | 'LinkedIn Connected' | 'Form Clicked';
  lastActivityTimestamp?: string;
  connectionAcceptedAt?: string;
  smartLink: string;
}

// Baseline timestamps for initial mock data
const now = Date.now();
const m = 60 * 1000;
const h = 60 * m;
const d = 24 * h;

// Initial State Data
let apolloQueriedLeads: ApolloProspect[] = [];

let savedProspects: ApolloProspect[] = [
  {
    id: 'prop_1',
    name: 'David Hoffman',
    title: 'Co-Founder & CEO',
    company: 'CloudPulse Analytics',
    domain: 'cloudpulse.io',
    email: 'david@cloudpulse.io',
    headcount: '51-200',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/davidhoffman-demo',
    verified: true,
    status: 'LinkedIn Connected',
    connectionAcceptedAt: formatExactTimestamp(new Date(now - 10 * m)),
    lastActivityTimestamp: formatExactTimestamp(new Date(now - 10 * m)),
    smartLink: 'https://clientengagement.app/demo?email=david@cloudpulse.io&lid=lem_001',
  },
  {
    id: 'prop_2',
    name: 'Elena Rostova',
    title: 'Head of Growth & Outbound',
    company: 'FinStack Global',
    domain: 'finstack.com',
    email: 'elena.r@finstack.com',
    headcount: '11-50',
    location: 'Austin, TX',
    linkedinUrl: 'https://linkedin.com/in/elenarostova-demo',
    verified: true,
    status: 'Email Sent',
    connectionAcceptedAt: formatExactTimestamp(new Date(now - 3 * h)),
    lastActivityTimestamp: formatExactTimestamp(new Date(now - 25 * m)),
    smartLink: 'https://clientengagement.app/demo?email=elena.r@finstack.com&lid=lem_002',
  },
  {
    id: 'prop_3',
    name: 'Marcus Sterling',
    title: 'VP of Revenue Operations',
    company: 'DataVelocity Labs',
    domain: 'datavelocity.io',
    email: 'marcus@datavelocity.io',
    headcount: '201-500',
    location: 'New York, NY',
    linkedinUrl: 'https://linkedin.com/in/marcussterling-demo',
    verified: true,
    status: 'Queued',
    lastActivityTimestamp: formatExactTimestamp(new Date(now - 1 * d)),
    smartLink: 'https://clientengagement.app/demo?email=marcus@datavelocity.io&lid=lem_003',
  },
];

let engagingPeople: EngagingPerson[] = [
  {
    id: 'eng_1',
    name: 'David Hoffman',
    email: 'david@cloudpulse.io',
    title: 'Co-Founder & CEO',
    company: 'CloudPulse Analytics',
    domain: 'cloudpulse.io',
    score: 95,
    tier: 'hot',
    status: 'Ready for Direct Outreach',
    linkedinUrl: 'https://linkedin.com/in/davidhoffman-demo',
    avatarInitials: 'DH',
    committeeSize: 2,
    connectionAcceptedAt: formatExactTimestamp(new Date(now - 10 * m)),
    lastFormClickAt: formatExactTimestamp(new Date(now - 38 * m)),
    lastFormSubmitAt: formatExactTimestamp(new Date(now - 35 * m)),
    lastActiveAt: formatExactTimestamp(new Date(now - 10 * m)),
    tasks: [
      {
        id: 't_dh_1',
        task: 'Accepted LinkedIn connection request from outreach campaign',
        category: 'connection_accepted',
        points: 10,
        timestamp: formatExactTimestamp(new Date(now - 10 * m)),
        rawDate: new Date(now - 10 * m),
        timeAgo: '10 mins ago',
        icon: '🤝',
        metaDetails: 'LinkedIn Sales Navigator: Accepted invite with note from SDR',
      },
      {
        id: 't_dh_2',
        task: 'Submitted "Book 1-on-1 Consultation" Form',
        category: 'form_submit',
        points: 45,
        timestamp: formatExactTimestamp(new Date(now - 35 * m)),
        rawDate: new Date(now - 35 * m),
        timeAgo: '35 mins ago',
        icon: '📩',
        metaDetails: 'Form: Demo Consultation • Fields: Name, Work Email, Outbound Volume (2k-10k)',
      },
      {
        id: 't_dh_3',
        task: 'Clicked & focused input fields on "Book Consultation" Form',
        category: 'form_click',
        points: 5,
        timestamp: formatExactTimestamp(new Date(now - 38 * m)),
        rawDate: new Date(now - 38 * m),
        timeAgo: '38 mins ago',
        icon: '📝',
        metaDetails: 'Form interaction: Focused email input & selected monthly outbound tier',
      },
      {
        id: 't_dh_4',
        task: 'Browsed /pricing page and spent 3m 42s',
        category: 'pageview',
        points: 25,
        timestamp: formatExactTimestamp(new Date(now - 1 * h)),
        rawDate: new Date(now - 1 * h),
        timeAgo: '1 hour ago',
        icon: '👁️',
        metaDetails: 'High-Intent URL: /pricing • Session Duration: 222s • Scroll Depth: 95%',
      },
      {
        id: 't_dh_5',
        task: 'Clicked Smart Tracking Link from Lemlist Email Step 1',
        category: 'email_click',
        points: 15,
        timestamp: formatExactTimestamp(new Date(now - 2 * h)),
        rawDate: new Date(now - 2 * h),
        timeAgo: '2 hours ago',
        icon: '🔗',
        metaDetails: 'Smart Link: ?email=david@cloudpulse.io&lid=lem_001 • Visitor stitched',
      },
    ],
  },
  {
    id: 'eng_2',
    name: 'Elena Rostova',
    email: 'elena.r@finstack.com',
    title: 'Head of Growth',
    company: 'FinStack Global',
    domain: 'finstack.com',
    score: 80,
    tier: 'hot',
    status: 'Replied to Outreach',
    linkedinUrl: 'https://linkedin.com/in/elenarostova-demo',
    avatarInitials: 'ER',
    committeeSize: 1,
    connectionAcceptedAt: formatExactTimestamp(new Date(now - 3 * h)),
    lastFormClickAt: undefined,
    lastActiveAt: formatExactTimestamp(new Date(now - 25 * m)),
    tasks: [
      {
        id: 't_er_1',
        task: 'Replied directly to Lemlist email: "Let us discuss pricing next Tuesday"',
        category: 'email_reply',
        points: 40,
        timestamp: formatExactTimestamp(new Date(now - 25 * m)),
        rawDate: new Date(now - 25 * m),
        timeAgo: '25 mins ago',
        icon: '✉️',
        metaDetails: 'Lemlist Inbound Reply Webhook: Positive sentiment detected (Score boost)',
      },
      {
        id: 't_er_2',
        task: 'Visited /demo and /features comparison page',
        category: 'pageview',
        points: 25,
        timestamp: formatExactTimestamp(new Date(now - 2 * h)),
        rawDate: new Date(now - 2 * h),
        timeAgo: '2 hours ago',
        icon: '👁️',
        metaDetails: 'High-Intent URL: /demo • Viewed Feature matrix',
      },
      {
        id: 't_er_3',
        task: 'Accepted LinkedIn connection request from outreach campaign',
        category: 'connection_accepted',
        points: 10,
        timestamp: formatExactTimestamp(new Date(now - 3 * h)),
        rawDate: new Date(now - 3 * h),
        timeAgo: '3 hours ago',
        icon: '🤝',
        metaDetails: 'LinkedIn Automated Touch: Connection confirmed via API sync',
      },
      {
        id: 't_er_4',
        task: 'Clicked campaign link in Email Step 2',
        category: 'email_click',
        points: 15,
        timestamp: formatExactTimestamp(new Date(now - 4 * h)),
        rawDate: new Date(now - 4 * h),
        timeAgo: '4 hours ago',
        icon: '🔗',
        metaDetails: 'Smart Link: ?email=elena.r@finstack.com&lid=lem_002',
      },
    ],
  },
  {
    id: 'eng_3',
    name: 'Sarah Jenkins',
    email: 'sarah.j@techscale.co',
    title: 'VP of Sales',
    company: 'TechScale Corp',
    domain: 'techscale.co',
    score: 60,
    tier: 'warm',
    status: 'Engaging Content',
    linkedinUrl: 'https://linkedin.com/in/sarahjenkins-demo',
    avatarInitials: 'SJ',
    committeeSize: 2,
    connectionAcceptedAt: formatExactTimestamp(new Date(now - 5 * h)),
    lastFormClickAt: formatExactTimestamp(new Date(now - 2 * h)),
    lastActiveAt: formatExactTimestamp(new Date(now - 2 * h)),
    tasks: [
      {
        id: 't_sj_1',
        task: 'Clicked & focused input fields on "Book Consultation" Form',
        category: 'form_click',
        points: 5,
        timestamp: formatExactTimestamp(new Date(now - 2 * h)),
        rawDate: new Date(now - 2 * h),
        timeAgo: '2 hours ago',
        icon: '📝',
        metaDetails: 'Form field interaction: Clicked Full Name input • Incomplete submission',
      },
      {
        id: 't_sj_2',
        task: 'Visited /pricing and /integrations page (>2 mins on site)',
        category: 'pageview',
        points: 25,
        timestamp: formatExactTimestamp(new Date(now - 3 * h)),
        rawDate: new Date(now - 3 * h),
        timeAgo: '3 hours ago',
        icon: '👁️',
        metaDetails: 'Heartbeat active session (>2 mins on site)',
      },
      {
        id: 't_sj_3',
        task: 'Accepted LinkedIn connection request from outreach campaign',
        category: 'connection_accepted',
        points: 10,
        timestamp: formatExactTimestamp(new Date(now - 5 * h)),
        rawDate: new Date(now - 5 * h),
        timeAgo: '5 hours ago',
        icon: '🤝',
        metaDetails: 'LinkedIn Network Connection established',
      },
      {
        id: 't_sj_4',
        task: 'Clicked outbound case study link from Lemlist Step 1',
        category: 'email_click',
        points: 15,
        timestamp: formatExactTimestamp(new Date(now - 1 * d)),
        rawDate: new Date(now - 1 * d),
        timeAgo: '1 day ago',
        icon: '🔗',
        metaDetails: 'Email Subject: "Scaling your pipeline with Apollo + Lemlist"',
      },
    ],
  },
  {
    id: 'eng_4',
    name: 'Alex Vance',
    email: 'alex@novasoft.ai',
    title: 'Product Director',
    company: 'NovaSoft AI',
    domain: 'novasoft.ai',
    score: 25,
    tier: 'cold',
    status: 'Initial Clicks',
    linkedinUrl: 'https://linkedin.com/in/alexvance-demo',
    avatarInitials: 'AV',
    committeeSize: 1,
    connectionAcceptedAt: undefined,
    lastFormClickAt: undefined,
    lastActiveAt: formatExactTimestamp(new Date(now - 1 * d)),
    tasks: [
      {
        id: 't_av_1',
        task: 'Clicked documentation link from introductory outreach',
        category: 'email_click',
        points: 20,
        timestamp: formatExactTimestamp(new Date(now - 1 * d)),
        rawDate: new Date(now - 1 * d),
        timeAgo: '1 day ago',
        icon: '🔗',
        metaDetails: 'URL: /docs/architecture-overview',
      },
      {
        id: 't_av_2',
        task: 'Opened cold outreach email in Lemlist Sequence',
        category: 'email_click',
        points: 5,
        timestamp: formatExactTimestamp(new Date(now - 2 * d)),
        rawDate: new Date(now - 2 * d),
        timeAgo: '2 days ago',
        icon: '✉️',
        metaDetails: 'Email Client: Chrome on macOS • IP: 104.28.19.42',
      },
    ],
  },
];

// Sample Mock Apollo Prospects for Query Simulation
const MOCK_APOLLO_DB: ApolloProspect[] = [
  {
    id: 'ap_1',
    name: 'Jonathan Miller',
    title: 'Chief Technology Officer',
    company: 'Apex Data Systems',
    domain: 'apexdata.com',
    email: 'j.miller@apexdata.com',
    headcount: '51-200',
    location: 'Boston, MA',
    linkedinUrl: 'https://linkedin.com/in/jonathanmiller-demo',
    verified: true,
    status: 'Queued',
    smartLink: 'https://clientengagement.app/demo?email=j.miller@apexdata.com&lid=lem_101',
  },
  {
    id: 'ap_2',
    name: 'Claire Beauchamp',
    title: 'VP of Commercial Sales',
    company: 'Vanguard Cyber',
    domain: 'vanguardcyber.io',
    email: 'claire@vanguardcyber.io',
    headcount: '51-200',
    location: 'Seattle, WA',
    linkedinUrl: 'https://linkedin.com/in/clairebeauchamp-demo',
    verified: true,
    status: 'Queued',
    smartLink: 'https://clientengagement.app/demo?email=claire@vanguardcyber.io&lid=lem_102',
  },
  {
    id: 'ap_3',
    name: 'Robert Zhang',
    title: 'Founder & CEO',
    company: 'Synapse Flow',
    domain: 'synapseflow.ai',
    email: 'robert@synapseflow.ai',
    headcount: '11-50',
    location: 'San Jose, CA',
    linkedinUrl: 'https://linkedin.com/in/robertzhang-demo',
    verified: true,
    status: 'Queued',
    smartLink: 'https://clientengagement.app/demo?email=robert@synapseflow.ai&lid=lem_103',
  },
  {
    id: 'ap_4',
    name: 'Jessica Reynolds',
    title: 'Head of Revenue Operations',
    company: 'ScaleMetric Inc',
    domain: 'scalemetric.com',
    email: 'jreynolds@scalemetric.com',
    headcount: '51-200',
    location: 'Chicago, IL',
    linkedinUrl: 'https://linkedin.com/in/jreynolds-demo',
    verified: true,
    status: 'Queued',
    smartLink: 'https://clientengagement.app/demo?email=jreynolds@scalemetric.com&lid=lem_104',
  },
];

// Helper to get category badge HTML
function getCategoryBadge(category: EventCategory): string {
  switch (category) {
    case 'form_click':
      return `<span class="badge badge-form-click">📝 Form Click</span>`;
    case 'form_submit':
      return `<span class="badge badge-success">📩 Form Submit</span>`;
    case 'connection_accepted':
      return `<span class="badge badge-linkedin">🤝 LinkedIn Accepted</span>`;
    case 'connection_sent':
      return `<span class="badge badge-purple">📤 Invite Sent</span>`;
    case 'email_reply':
      return `<span class="badge badge-flame">✉️ Email Reply</span>`;
    case 'email_click':
      return `<span class="badge badge-cyan">🔗 Link Click</span>`;
    case 'pageview':
      return `<span class="badge badge-accent">👁️ High Intent View</span>`;
    default:
      return `<span class="badge badge-accent">⚡ Activity</span>`;
  }
}

// UI Controller
class AppController {
  public init(): void {
    this.bindTabNavigation();
    this.bindApolloSearch();
    this.bindSavedLeadsActions();
    this.bindScoringAccordion();
    this.bindContactForm();
    this.bindSimulators();
    this.renderSavedLeads();
    this.renderEngagingLeads();
    this.updateStats();
  }

  // 1. Tab Switching
  private bindTabNavigation(): void {
    const tabs = document.querySelectorAll<HTMLButtonElement>('.nav-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        if (!targetTab) return;

        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.tab-section').forEach((sec) => {
          sec.classList.remove('active');
        });

        const targetSection = document.getElementById(`section-${targetTab}`);
        if (targetSection) {
          targetSection.classList.add('active');
        }

        // Track tab switch via tracker.js
        tracker.track('navigation_tab_switched', { tab: targetTab });
      });
    });
  }

  // 2. Apollo Search & Query Simulation
  private bindApolloSearch(): void {
    const form = document.getElementById('apollo-search-form') as HTMLFormElement;
    const btnQuickIcp = document.getElementById('btn-quick-fill-icp');
    const resultsContainer = document.getElementById('apollo-results-container');
    const leadsGrid = document.getElementById('apollo-leads-grid');
    const btnSaveAll = document.getElementById('btn-save-all-queried');

    if (btnQuickIcp) {
      btnQuickIcp.addEventListener('click', () => {
        (document.getElementById('filter-title') as HTMLInputElement).value = 'Founder, Co-Founder, CEO, VP Sales';
        (document.getElementById('filter-industry') as HTMLInputElement).value = 'B2B SaaS, Software, AI Automation';
        (document.getElementById('filter-geo') as HTMLInputElement).value = 'United States, Canada';
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-query-apollo') as HTMLButtonElement;
        const origText = btn.innerHTML;
        btn.innerHTML = `<span>Querying Apollo API...</span>`;
        btn.disabled = true;

        setTimeout(() => {
          apolloQueriedLeads = [...MOCK_APOLLO_DB];
          btn.innerHTML = origText;
          btn.disabled = false;

          if (resultsContainer && leadsGrid) {
            resultsContainer.style.display = 'block';
            leadsGrid.innerHTML = apolloQueriedLeads
              .map(
                (lead) => `
                <div class="prospect-card">
                  <div class="prospect-name">${lead.name}</div>
                  <div class="prospect-title">${lead.title}</div>
                  <div class="prospect-meta">
                    <div>🏢 <strong>${lead.company}</strong> (${lead.domain})</div>
                    <div>✉️ ${lead.email} <span class="badge badge-success">Verified</span></div>
                    <div>📍 ${lead.location} • 👥 ${lead.headcount}</div>
                  </div>
                  <button class="btn btn-secondary btn-sm btn-block btn-save-single" data-id="${lead.id}">
                    + Save to Engagement Queue
                  </button>
                </div>
              `
              )
              .join('');

            // Bind single save buttons
            leadsGrid.querySelectorAll('.btn-save-single').forEach((btnSingle) => {
              btnSingle.addEventListener('click', (ev) => {
                const targetId = (ev.currentTarget as HTMLElement).dataset.id;
                const found = apolloQueriedLeads.find((l) => l.id === targetId);
                if (found && !savedProspects.some((s) => s.email === found.email)) {
                  savedProspects.push({
                    ...found,
                    lastActivityTimestamp: formatExactTimestamp(),
                  });
                  this.renderSavedLeads();
                  this.updateStats();
                  (ev.currentTarget as HTMLButtonElement).innerText = '✓ Saved in Queue';
                  (ev.currentTarget as HTMLButtonElement).disabled = true;
                }
              });
            });
          }
        }, 600);
      });
    }

    if (btnSaveAll) {
      btnSaveAll.addEventListener('click', () => {
        apolloQueriedLeads.forEach((lead) => {
          if (!savedProspects.some((s) => s.email === lead.email)) {
            savedProspects.push({
              ...lead,
              lastActivityTimestamp: formatExactTimestamp(),
            });
          }
        });
        this.renderSavedLeads();
        this.updateStats();
        btnSaveAll.innerHTML = `<span>✓ All Saved to Queue</span>`;
        btnSaveAll.classList.replace('btn-success', 'btn-secondary');
      });
    }
  }

  // 3. Render Saved Prospects Table
  private renderSavedLeads(): void {
    const tbody = document.getElementById('saved-leads-tbody');
    if (!tbody) return;

    tbody.innerHTML = savedProspects
      .map(
        (p) => `
        <tr>
          <td>
            <strong>${p.name}</strong>
            <div style="font-size:0.75rem; color:var(--text-secondary); font-family:var(--font-mono);">${p.email}</div>
          </td>
          <td>
            <strong>${p.company}</strong>
            <div style="font-size:0.75rem; color:var(--accent-cyan);">${p.domain}</div>
          </td>
          <td>${p.title}</td>
          <td>
            <div class="channel-pills">
              <span class="badge badge-accent">Email</span>
              <span class="badge badge-purple">LinkedIn</span>
            </div>
          </td>
          <td>
            <div class="status-cell-wrap">
              <span class="badge ${
                p.status === 'LinkedIn Connected'
                  ? 'badge-linkedin'
                  : p.status === 'Enrolled in Lemlist'
                  ? 'badge-success'
                  : p.status === 'Email Sent'
                  ? 'badge-cyan'
                  : p.status === 'Form Clicked'
                  ? 'badge-form-click'
                  : 'badge-accent'
              }">${p.status}</span>
              ${
                p.connectionAcceptedAt
                  ? `<div class="timestamp-subtext">🤝 Connected: <strong>${p.connectionAcceptedAt}</strong></div>`
                  : p.lastActivityTimestamp
                  ? `<div class="timestamp-subtext">🕒 Updated: <strong>${p.lastActivityTimestamp}</strong></div>`
                  : ''
              }
            </div>
          </td>
          <td>
            <code style="font-size:0.72rem; color:#a5b4fc; background:rgba(0,0,0,0.3); padding:2px 6px; border-radius:4px; display:inline-block;">
              ?email=${p.email}&lid=${p.id}
            </code>
          </td>
          <td class="text-right">
            <div class="row-action-btns">
              <button class="btn btn-secondary btn-xs btn-simulate-accept" data-email="${p.email}" data-name="${p.name}" data-company="${p.company}" title="Simulate when person accepts LinkedIn connection with timestamp">
                🤝 Accept Conn
              </button>
              <button class="btn btn-secondary btn-xs btn-simulate-form-click" data-email="${p.email}" data-name="${p.name}" data-company="${p.company}" title="Simulate person clicking form inputs with timestamp">
                📝 Click Form
              </button>
              <button class="btn btn-primary btn-xs btn-simulate-click" data-email="${p.email}" data-name="${p.name}" data-company="${p.company}" title="Simulate smart link click">
                🔗 Click Link
              </button>
            </div>
          </td>
        </tr>
      `
      )
      .join('');

    // Bind row action simulation buttons
    tbody.querySelectorAll('.btn-simulate-click').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const email = target.dataset.email!;
        const name = target.dataset.name!;
        const company = target.dataset.company!;
        this.recordPersonAction(
          email,
          name,
          company,
          'email_click',
          `Clicked Smart Personalized Campaign Link (?email=${email})`,
          15,
          '🔗'
        );
      });
    });

    tbody.querySelectorAll('.btn-simulate-accept').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const email = target.dataset.email!;
        const name = target.dataset.name!;
        const company = target.dataset.company!;
        this.recordPersonAction(
          email,
          name,
          company,
          'connection_accepted',
          `Accepted LinkedIn connection request from outreach campaign`,
          10,
          '🤝'
        );
        // update savedProspect status
        const p = savedProspects.find((s) => s.email.toLowerCase() === email.toLowerCase());
        if (p) {
          p.status = 'LinkedIn Connected';
          p.connectionAcceptedAt = formatExactTimestamp();
          this.renderSavedLeads();
        }
      });
    });

    tbody.querySelectorAll('.btn-simulate-form-click').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const email = target.dataset.email!;
        const name = target.dataset.name!;
        const company = target.dataset.company!;
        this.recordPersonAction(
          email,
          name,
          company,
          'form_click',
          `Clicked & focused form field "Work Email" on Book Consultation Form`,
          5,
          '📝'
        );
        const p = savedProspects.find((s) => s.email.toLowerCase() === email.toLowerCase());
        if (p) {
          p.status = 'Form Clicked';
          p.lastActivityTimestamp = formatExactTimestamp();
          this.renderSavedLeads();
        }
      });
    });
  }

  private bindSavedLeadsActions(): void {
    const btnPush = document.getElementById('btn-push-all-lemlist');
    if (btnPush) {
      btnPush.addEventListener('click', () => {
        const timestamp = formatExactTimestamp();
        savedProspects = savedProspects.map((p) => ({
          ...p,
          status: 'Enrolled in Lemlist',
          lastActivityTimestamp: timestamp,
        }));
        this.renderSavedLeads();
        alert('🚀 All ready leads pushed to Lemlist Multichannel Campaign with Dynamic Smart Links!');
      });
    }
  }

  // 4. Render Engaging Leads & Expandable Task Audit Dropdown
  private renderEngagingLeads(): void {
    const container = document.getElementById('engaging-leads-container');
    if (!container) return;

    const filterSelect = document.getElementById('score-filter-tier') as HTMLSelectElement;
    const currentFilter = filterSelect ? filterSelect.value : 'all';

    const filtered = engagingPeople.filter((p) => {
      if (currentFilter === 'hot') return p.score >= 70;
      if (currentFilter === 'warm') return p.score >= 30 && p.score < 70;
      if (currentFilter === 'cold') return p.score < 30;
      return true;
    });

    container.innerHTML = filtered
      .map(
        (person) => `
        <div class="lead-accordion-item is-${person.tier}" id="accordion-${person.id}">
          <!-- Clickable Header / Summary -->
          <div class="lead-accordion-summary" data-id="${person.id}">
            <div class="lead-profile-col">
              <div class="avatar-circle">${person.avatarInitials}</div>
              <div>
                <div class="lead-name-row">
                  <span class="lead-name-text">${person.name}</span>
                  <span class="lead-title-tag">${person.title}</span>
                </div>
                <div class="lead-email-text">${person.email} • <strong>${person.company}</strong></div>
              </div>
            </div>

            <!-- Key Touchpoint Timestamp Badges -->
            <div class="lead-milestones-col">
              ${
                person.connectionAcceptedAt
                  ? `<div class="milestone-badge milestone-linkedin" title="Exact timestamp when LinkedIn connection was accepted">
                      <span class="milestone-icon">🤝</span>
                      <span class="milestone-label">Conn Accepted:</span>
                      <strong class="milestone-time">${person.connectionAcceptedAt}</strong>
                    </div>`
                  : `<div class="milestone-badge milestone-pending">
                      <span class="milestone-icon">📤</span>
                      <span class="milestone-label">LinkedIn:</span>
                      <span class="milestone-time">Invite Pending</span>
                    </div>`
              }
              ${
                person.lastFormClickAt
                  ? `<div class="milestone-badge milestone-form" title="Exact timestamp when person clicked or focused the form">
                      <span class="milestone-icon">📝</span>
                      <span class="milestone-label">Form Clicked:</span>
                      <strong class="milestone-time">${person.lastFormClickAt}</strong>
                    </div>`
                  : `<div class="milestone-badge milestone-subtle">
                      <span class="milestone-icon">📝</span>
                      <span class="milestone-label">Form:</span>
                      <span class="milestone-time">No clicks yet</span>
                    </div>`
              }
            </div>

            <div class="lead-status-col">
              <span class="badge ${person.tier === 'hot' ? 'badge-flame' : person.tier === 'warm' ? 'badge-accent' : 'badge-cyan'}">
                ${person.status}
              </span>
              ${
                person.committeeSize > 1
                  ? `<span class="badge badge-purple" title="Buying Committee: ${person.committeeSize} stakeholders active">👥 Committee ${person.committeeSize}x</span>`
                  : ''
              }
            </div>

            <div class="score-display-col">
              <div class="score-pill-huge ${person.tier}">
                ${person.tier === 'hot' ? '🔥' : '⚡'} ${person.score} <span style="font-size:0.75rem; font-weight:600; opacity:0.8;">/ 100</span>
              </div>
              <svg class="accordion-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <!-- Dropdown: Detailed Timestamped Task & Behavior Audit Trail -->
          <div class="lead-tasks-dropdown">
            <div class="task-timeline-header">
              <div class="task-timeline-title">
                <span>📋 Timestamped Activity & Intent Audit Log (${person.tasks.length} events recorded)</span>
              </div>
              <div class="timeline-quick-legend">
                <span class="legend-item"><span class="legend-dot dot-form"></span> Form Interaction</span>
                <span class="legend-item"><span class="legend-dot dot-linkedin"></span> LinkedIn Acceptance</span>
                <span class="legend-item"><span class="legend-dot dot-email"></span> Outreach Response</span>
              </div>
            </div>

            <div class="timeline-list">
              ${person.tasks
                .map(
                  (t) => `
                <div class="timeline-item item-${t.category}">
                  <div class="timeline-left">
                    <div class="timeline-icon-box">${t.icon}</div>
                    <div class="timeline-details-group">
                      <div class="timeline-title-row">
                        ${getCategoryBadge(t.category)}
                        <span class="timeline-task-desc">${t.task}</span>
                      </div>
                      ${
                        t.metaDetails
                          ? `<div class="timeline-meta-text">${t.metaDetails}</div>`
                          : ''
                      }
                    </div>
                  </div>

                  <div class="timeline-right">
                    <div class="timeline-timestamp-box">
                      <div class="exact-timestamp">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>${t.timestamp}</span>
                      </div>
                      <span class="relative-timestamp">(${t.timeAgo})</span>
                    </div>
                    <span class="timeline-points-badge">+${t.points} pts</span>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>

            <div class="timeline-actions-bar">
              <div class="timeline-insights-tip">
                <span class="tip-icon">💡</span>
                <span><strong>Sales Recommendation:</strong> Prospect showed high engagement. Last active at <code>${person.lastActiveAt}</code>.</span>
              </div>
              <a href="${person.linkedinUrl}" target="_blank" class="btn btn-secondary btn-sm">
                Open LinkedIn Profile
              </a>
              <a href="mailto:${person.email}" class="btn btn-primary btn-sm btn-glow">
                Reach Out 1-on-1 Now
              </a>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    // Accordion Toggle Handlers
    container.querySelectorAll('.lead-accordion-summary').forEach((summary) => {
      summary.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).dataset.id;
        const item = document.getElementById(`accordion-${id}`);
        if (item) {
          item.classList.toggle('open');
        }
      });
    });
  }

  private bindScoringAccordion(): void {
    const filterSelect = document.getElementById('score-filter-tier');
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        this.renderEngagingLeads();
      });
    }
  }

  // 5. Contact Form with Live Tracker Integration & Field Focus / Click Tracking
  private bindContactForm(): void {
    const form = document.getElementById('contact-demo-form') as HTMLFormElement;
    const alertSuccess = document.getElementById('contact-success-alert');

    if (form) {
      // Track input clicks / focus in real-time
      const formInputs = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        'input, textarea, select'
      );

      let formClickTrackedForSession = false;

      formInputs.forEach((input) => {
        input.addEventListener('focus', () => {
          const fieldLabel = input.closest('.form-group')?.querySelector('label')?.innerText || input.id;
          const email = (document.getElementById('contact-email') as HTMLInputElement).value || 'visitor@live-test.com';
          const name = (document.getElementById('contact-name') as HTMLInputElement).value || 'Live Web Visitor';
          const company = (document.getElementById('contact-company') as HTMLInputElement).value || 'Prospect Corp';

          tracker.track('form_click', {
            field: fieldLabel,
            fieldId: input.id,
            timestamp: new Date().toISOString(),
          });

          if (!formClickTrackedForSession) {
            formClickTrackedForSession = true;
            this.recordPersonAction(
              email,
              name,
              company,
              'form_click',
              `Clicked & focused form input "${fieldLabel}" on Consultation Form`,
              5,
              '📝'
            );
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = (document.getElementById('contact-name') as HTMLInputElement).value || 'Sarah Jenkins';
        const email = (document.getElementById('contact-email') as HTMLInputElement).value || 'sarah.j@techscale.co';
        const company = (document.getElementById('contact-company') as HTMLInputElement).value || 'TechScale Corp';

        // 1. Send via tracker.js
        tracker.identify({
          email,
          companyName: company,
        });

        tracker.track('form_submit', {
          formName: 'Book 1-on-1 Consultation',
          leadName: name,
        });

        // 2. Add / Update in Engaging Leads list with exact submission timestamp
        this.recordPersonAction(
          email,
          name,
          company,
          'form_submit',
          'Submitted "Book 1-on-1 Consultation" Demo Form',
          45,
          '📩'
        );

        if (alertSuccess) {
          alertSuccess.style.display = 'block';
          alertSuccess.innerHTML = `
            <strong>🎉 Timestamped Event Captured!</strong> Lead <code>${email}</code> submitted the form at <strong>${formatExactTimestamp()}</strong> (+45 pts). Check Tab 2 to view the live updated audit timeline!
          `;
          setTimeout(() => {
            alertSuccess.style.display = 'none';
          }, 8000);
        }

        form.reset();
        formClickTrackedForSession = false;
      });
    }
  }

  // 6. Simulator Actions with explicit timestamps
  private bindSimulators(): void {
    const btnPricing = document.getElementById('sim-btn-pricing');
    const btnReply = document.getElementById('sim-btn-reply');
    const btnAcceptConn = document.getElementById('sim-btn-accept-conn');
    const btnFormClick = document.getElementById('sim-btn-form-click');

    if (btnPricing) {
      btnPricing.addEventListener('click', () => {
        tracker.track('high_intent_view', { path: '/pricing', durationSeconds: 120 });
        this.recordPersonAction(
          'david@cloudpulse.io',
          'David Hoffman',
          'CloudPulse Analytics',
          'pageview',
          'Viewed /pricing comparison table for 2m 10s',
          25,
          '👁️'
        );
        alert(`🔥 Event Fired [${formatExactTimestamp()}]: Visited /pricing (+25 pts). Lead Score Updated!`);
      });
    }

    if (btnReply) {
      btnReply.addEventListener('click', () => {
        this.recordPersonAction(
          'elena.r@finstack.com',
          'Elena Rostova',
          'FinStack Global',
          'email_reply',
          'Replied to Lemlist Email: "Can we talk tomorrow morning?"',
          40,
          '✉️'
        );
        alert(`✉️ Event Fired [${formatExactTimestamp()}]: Lemlist Email Replied (+40 pts). Lead Score Updated!`);
      });
    }

    if (btnAcceptConn) {
      btnAcceptConn.addEventListener('click', () => {
        this.recordPersonAction(
          'sarah.j@techscale.co',
          'Sarah Jenkins',
          'TechScale Corp',
          'connection_accepted',
          'Accepted LinkedIn connection request from outreach campaign',
          10,
          '🤝'
        );
        alert(`🤝 Event Fired [${formatExactTimestamp()}]: Sarah Jenkins accepted LinkedIn connection (+10 pts). Milestone & Timestamp logged!`);
      });
    }

    if (btnFormClick) {
      btnFormClick.addEventListener('click', () => {
        this.recordPersonAction(
          'elena.r@finstack.com',
          'Elena Rostova',
          'FinStack Global',
          'form_click',
          'Clicked & focused "Project Requirements" field on Consultation Form',
          5,
          '📝'
        );
        alert(`📝 Event Fired [${formatExactTimestamp()}]: Elena Rostova clicked form field (+5 pts). Timestamp logged!`);
      });
    }
  }

  // Unified method to dynamically log timestamped person actions
  public recordPersonAction(
    email: string,
    name: string,
    company: string,
    category: EventCategory,
    taskTitle: string,
    pointsAwarded: number = 15,
    icon: string = '⚡'
  ): void {
    const timestampNow = formatExactTimestamp();
    let existing = engagingPeople.find((p) => p.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      existing.score = Math.min(100, existing.score + pointsAwarded);
      existing.tier = existing.score >= 70 ? 'hot' : existing.score >= 30 ? 'warm' : 'cold';
      existing.lastActiveAt = timestampNow;

      if (category === 'connection_accepted') {
        existing.connectionAcceptedAt = timestampNow;
        existing.status = 'LinkedIn Connected';
      } else if (category === 'form_click') {
        existing.lastFormClickAt = timestampNow;
      } else if (category === 'form_submit') {
        existing.lastFormSubmitAt = timestampNow;
        existing.lastFormClickAt = timestampNow;
        existing.status = 'Ready for Direct Outreach';
      } else if (category === 'email_reply') {
        existing.status = 'Replied to Outreach';
      }

      existing.tasks.unshift({
        id: `evt_${Date.now()}`,
        task: taskTitle,
        category,
        points: pointsAwarded,
        timestamp: timestampNow,
        rawDate: new Date(),
        timeAgo: 'Just now',
        icon,
        metaDetails: `Logged live at ${formatShortTime()} via interactive engine`,
      });
    } else {
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

      const newLead: EngagingPerson = {
        id: `eng_${Date.now()}`,
        name,
        email,
        title: 'Decision Maker',
        company,
        domain: email.split('@')[1] || 'company.com',
        score: pointsAwarded,
        tier: pointsAwarded >= 70 ? 'hot' : pointsAwarded >= 30 ? 'warm' : 'cold',
        status: category === 'form_submit' ? 'Ready for Direct Outreach' : 'Engaging on Website',
        linkedinUrl: 'https://linkedin.com',
        avatarInitials: initials || 'LK',
        committeeSize: 1,
        connectionAcceptedAt: category === 'connection_accepted' ? timestampNow : undefined,
        lastFormClickAt: category === 'form_click' || category === 'form_submit' ? timestampNow : undefined,
        lastFormSubmitAt: category === 'form_submit' ? timestampNow : undefined,
        lastActiveAt: timestampNow,
        tasks: [
          {
            id: `evt_${Date.now()}`,
            task: taskTitle,
            category,
            points: pointsAwarded,
            timestamp: timestampNow,
            rawDate: new Date(),
            timeAgo: 'Just now',
            icon,
            metaDetails: `Logged live at ${formatShortTime()} via interactive engine`,
          },
        ],
      };
      engagingPeople.unshift(newLead);
    }

    this.renderEngagingLeads();
    this.updateStats();
  }

  private updateStats(): void {
    const hotCount = engagingPeople.filter((p) => p.score >= 70).length;
    const badgeHot = document.getElementById('badge-hot-leads');
    if (badgeHot) badgeHot.innerText = `${hotCount} HOT`;

    const savedCount = savedProspects.length;
    const badgeProspects = document.getElementById('badge-prospects');
    const statSaved = document.getElementById('stat-saved-count');
    if (badgeProspects) badgeProspects.innerText = `${savedCount}`;
    if (statSaved) statSaved.innerText = `${savedCount}`;
  }
}

// Bootstrap UI
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
});
