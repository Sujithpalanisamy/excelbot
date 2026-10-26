import { config } from '../../config/index.js';
import { getSetting, getManualPage } from '../../database/index.js';
import { classifyBug } from '../../services/classifier.js';
import type { BugItem } from '../../types/index.js';

export const AZURE_API_VERSION = '7.1';
export const BATCH_SIZE = 200;

const HTML_TAG_REGEX = /<[^>]+>/g;
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function cleanHtml(rawHtml?: string | null): string {
  if (!rawHtml) return '';
  let text = rawHtml.replace(/<(br|p|div|li)[^>]*>/gi, '\n');
  text = text.replace(HTML_TAG_REGEX, '');
  for (const [entity, val] of Object.entries(HTML_ENTITIES)) {
    text = text.replaceAll(entity, val);
  }
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.join('\n').trim();
}

export const MOCK_BUGS: Record<number, Partial<BugItem>> = {
  101: {
    id: 101,
    title: 'Login fails with 500 internal server error when SSO session token expires',
    description: 'Users attempting to authenticate via Okta/SAML receive a blank screen and 500 error when the token exceeds 8 hours.',
    repro_steps: "1. Navigate to /login.\n2. Click 'Login with SSO'.\n3. Wait for token expiration (simulated).\n4. Observe 500 error instead of clean re-login prompt.",
    acceptance_criteria: "User should be seamlessly redirected to login page with message 'Session expired. Please sign in again.'",
    state: 'Active',
    reason: 'Investigating token refresh handshake',
    severity: '2 - High',
    priority: 1,
    assigned_to: 'Priya Sharma',
    assigned_to_email: 'priya.sharma@example.com',
    reporter: 'Amit Patel',
    created_date: '2026-10-10 09:30:00',
    changed_date: '2026-10-18 14:15:00',
    closed_date: '',
    area_path: 'HRMS\\Authentication',
    iteration_path: 'HRMS\\Sprint 24',
    tags: 'login; auth; sso; critical-path',
    project_name: 'HRMS Enterprise',
    page_name: 'Login Page',
  },
  102: {
    id: 102,
    title: 'Employee Data Master (EDM) bulk export crashes on datasets over 5,000 records',
    description: 'Exporting full employee database to CSV causes out-of-memory exception on backend worker.',
    repro_steps: "1. Open Employee Data Master (EDM).\n2. Filter by 'All Departments'.\n3. Click 'Export to Excel/CSV'.\n4. Worker crashes after 45 seconds.",
    acceptance_criteria: 'Export should stream data in batches of 1,000 without crashing worker.',
    state: 'Active',
    reason: 'Memory profiling in progress',
    severity: '1 - Critical',
    priority: 1,
    assigned_to: 'Rahul Verma',
    assigned_to_email: 'rahul.verma@example.com',
    reporter: 'Neha Gupta',
    created_date: '2026-10-12 11:00:00',
    changed_date: '2026-10-19 10:20:00',
    closed_date: '',
    area_path: 'HRMS\\EDM',
    iteration_path: 'HRMS\\Sprint 24',
    tags: 'edm; employee-master; performance',
    project_name: 'HRMS Enterprise',
    page_name: 'Employee Data Master (EDM)',
  },
  103: {
    id: 103,
    title: 'Payroll salary slip calculation mismatch in Provident Fund (PF) deduction for new joiners',
    description: 'PF calculation for employees joining mid-month does not prorate the employer contribution correctly.',
    repro_steps: '1. Add new joiner with joining date 15th of the month.\n2. Run payroll preview.\n3. Compare PF deduction with statutory sheet.',
    acceptance_criteria: 'PF deduction must prorate based on payable days.',
    state: 'New',
    reason: 'New bug reported by Finance QA',
    severity: '2 - High',
    priority: 2,
    assigned_to: 'Ananya Roy',
    assigned_to_email: 'ananya.roy@example.com',
    reporter: 'Suresh Nair',
    created_date: '2026-10-15 16:45:00',
    changed_date: '2026-10-15 16:45:00',
    closed_date: '',
    area_path: 'HRMS\\Payroll',
    iteration_path: 'HRMS\\Sprint 24',
    tags: 'payroll; salary; compliance; pf',
    project_name: 'HRMS Enterprise',
    page_name: 'Payroll Module',
  },
  104: {
    id: 104,
    title: 'Leave balance does not update after manager approves multi-day bereavement leave',
    description: "Approved leave requests remain in 'Pending Sync' status on employee dashboard.",
    repro_steps: '1. Apply for 3 days bereavement leave.\n2. Manager approves from portal.\n3. Employee checks balance; days still deducted only from annual leave.',
    acceptance_criteria: 'Balance should immediately deduct from Special Leave category.',
    state: 'Resolved',
    reason: 'Fixed event listener trigger',
    severity: '3 - Medium',
    priority: 2,
    assigned_to: 'Priya Sharma',
    assigned_to_email: 'priya.sharma@example.com',
    reporter: 'Deepak Joshi',
    created_date: '2026-10-08 14:10:00',
    changed_date: '2026-10-17 18:00:00',
    closed_date: '2026-10-17 18:00:00',
    area_path: 'HRMS\\Leave',
    iteration_path: 'HRMS\\Sprint 23',
    tags: 'leave; approval; workflow',
    project_name: 'HRMS Enterprise',
    page_name: 'Leave Module',
  },
  105: {
    id: 105,
    title: 'Attendance check-in geolocation radius validation bypassed on mock location GPS apps',
    description: 'Android users using GPS mock providers can clock in from outside designated office geo-fence.',
    repro_steps: "1. Enable Mock Locations on Android developer settings.\n2. Set coordinates to Office Tower.\n3. Click 'Check-In' on Attendance Module.\n4. System accepts check-in without mock detection check.",
    acceptance_criteria: 'App must inspect isFromMockProvider flag and reject check-in.',
    state: 'Active',
    reason: 'Security patch being tested',
    severity: '1 - Critical',
    priority: 1,
    assigned_to: 'Vikas Kulkarni',
    assigned_to_email: 'vikas.kulkarni@example.com',
    reporter: 'Security Audit Team',
    created_date: '2026-10-11 12:00:00',
    changed_date: '2026-10-18 11:30:00',
    closed_date: '',
    area_path: 'HRMS\\Attendance',
    iteration_path: 'HRMS\\Sprint 24',
    tags: 'attendance; geolocation; security; gps',
    project_name: 'HRMS Enterprise',
    page_name: 'Geolocation',
  },
  106: {
    id: 106,
    title: 'Map Weekly Off bulk update overrides custom holiday rosters for night shift employees',
    description: 'Selecting 50 employees to map weekend off wipes existing holiday exceptions.',
    repro_steps: '1. Open Map Weekly Off.\n2. Select Night Shift group.\n3. Apply Sunday/Monday off.\n4. Check holiday calendar: customized Diwali schedule wiped.',
    acceptance_criteria: 'Weekly off mapping must respect existing approved holiday overrides.',
    state: 'Closed',
    reason: 'Verified and released in hotfix v2.4.1',
    severity: '2 - High',
    priority: 2,
    assigned_to: 'Rahul Verma',
    assigned_to_email: 'rahul.verma@example.com',
    reporter: 'Sunil Mehta',
    created_date: '2026-09-28 10:15:00',
    changed_date: '2026-10-05 16:30:00',
    closed_date: '2026-10-05 16:30:00',
    area_path: 'HRMS\\Shifts',
    iteration_path: 'HRMS\\Sprint 23',
    tags: 'weekly-off; map-weekly-off; shifts',
    project_name: 'HRMS Enterprise',
    page_name: 'Map Weekly Off',
  },
  107: {
    id: 107,
    title: 'Weekly Off Planner calendar drag-and-drop roster glitch on Safari and iPadOS',
    description: 'Dragging an employee row between shift cards drops row into null container on Safari.',
    repro_steps: '1. Open Weekly Off Planner in Safari.\n2. Drag shift assignment card.\n3. Pointer events cancel midway.',
    acceptance_criteria: 'Drag and drop should use standard HTML5 drag events or touch polyfill.',
    state: 'Active',
    reason: 'WebKit touch-action fix required',
    severity: '3 - Medium',
    priority: 3,
    assigned_to: 'Ananya Roy',
    assigned_to_email: 'ananya.roy@example.com',
    reporter: 'Kavita Rao',
    created_date: '2026-10-14 15:20:00',
    changed_date: '2026-10-18 09:10:00',
    closed_date: '',
    area_path: 'HRMS\\Roster',
    iteration_path: 'HRMS\\Sprint 24',
    tags: 'weekly-off; planner; safari; ui-bug',
    project_name: 'HRMS Enterprise',
    page_name: 'Weekly Off Planner',
  },
  108: {
    id: 108,
    title: 'AI Chatbot repeats response twice when network connection is throttled or retried',
    description: 'Fast retries in HTTP client cause the chatbot stream to post duplicate messages in the chat panel.',
    repro_steps: "1. Throttle network to Slow 3G.\n2. Ask AI Chatbot 'How many leaves do I have left?'.\n3. Client sends duplicate request on socket timeout; both responses print.",
    acceptance_criteria: 'Chatbot request must pass unique idempotency key.',
    state: 'New',
    reason: 'Reported by Beta testers',
    severity: '3 - Medium',
    priority: 2,
    assigned_to: 'Vikas Kulkarni',
    assigned_to_email: 'vikas.kulkarni@example.com',
    reporter: 'Beta Test User',
    created_date: '2026-10-16 17:30:00',
    changed_date: '2026-10-16 17:30:00',
    closed_date: '',
    area_path: 'HRMS\\AI',
    iteration_path: 'HRMS\\Sprint 24',
    tags: 'ai-chatbot; bot; idempotency',
    project_name: 'HRMS Enterprise',
    page_name: 'AI Chatbot',
  },
  109: {
    id: 109,
    title: 'Organisation Master department hierarchy cyclic dependency error when reassigning parent unit',
    description: 'Setting Department A child of Department B when B is child of A triggers infinite recursion loop.',
    repro_steps: "1. Open Organisation Master.\n2. Edit 'Engineering - Core'.\n3. Set Parent to 'Product Engineering'.\n4. Tree component freezes with maximum call stack exceeded.",
    acceptance_criteria: 'Form must validate against directed acyclic graph before saving.',
    state: 'Active',
    reason: 'Tree DAG validator implementation',
    severity: '2 - High',
    priority: 1,
    assigned_to: 'Priya Sharma',
    assigned_to_email: 'priya.sharma@example.com',
    reporter: 'Deepak Joshi',
    created_date: '2026-10-13 13:40:00',
    changed_date: '2026-10-19 11:00:00',
    closed_date: '',
    area_path: 'HRMS\\OrgMaster',
    iteration_path: 'HRMS\\Sprint 24',
    tags: 'organisation-master; org; hierarchy; dag',
    project_name: 'HRMS Enterprise',
    page_name: 'Organisation Master',
  },
  110: {
    id: 110,
    title: 'System Role Dashboard permissions matrix check-all toggle misses granular audit logs permission',
    description: "Clicking 'Grant All' for HR Director role leaves 'Audit Log Export' unchecked.",
    repro_steps: "1. Open System Role Dashboard.\n2. Select 'HR Director' role.\n3. Click 'Select All'.\n4. Save and inspect role grants: audit logs grant is missing.",
    acceptance_criteria: 'Grant All must iterate through all permission nodes including audit sub-modules.',
    state: 'Resolved',
    reason: 'Fixed nested permission tree walk',
    severity: '3 - Medium',
    priority: 2,
    assigned_to: 'Rahul Verma',
    assigned_to_email: 'rahul.verma@example.com',
    reporter: 'Audit Officer',
    created_date: '2026-10-09 10:00:00',
    changed_date: '2026-10-16 15:00:00',
    closed_date: '2026-10-16 15:00:00',
    area_path: 'HRMS\\Roles',
    iteration_path: 'HRMS\\Sprint 24',
    tags: 'system-role; dashboard; rbac; permissions',
    project_name: 'HRMS Enterprise',
    page_name: 'System Role Dashboard',
  },
};

export class AzureDevOpsClient {
  public serverUrl: string;
  public org: string;
  public project: string;
  public pat: string;
  public mockMode: boolean;

  constructor() {
    this.serverUrl = getSetting('AZURE_DEVOPS_BASE_URL', config.AZURE_DEVOPS_BASE_URL).replace(/\/+$/, '');
    this.org = getSetting('AZURE_DEVOPS_ORG', config.AZURE_DEVOPS_ORG);
    this.project = getSetting('AZURE_DEVOPS_PROJECT', config.AZURE_DEVOPS_PROJECT);
    this.pat = getSetting('AZURE_DEVOPS_PAT', config.AZURE_DEVOPS_PAT);
    this.mockMode = getSetting('MOCK_MODE', String(config.MOCK_MODE)).toLowerCase() === 'true';
  }

  public getApiRoot(): string {
    if (this.serverUrl.startsWith('http://') || this.serverUrl.startsWith('https://')) {
      const collection = this.org || 'DefaultCollection';
      return `${this.serverUrl}/${collection}/${this.project}`;
    }
    const org = this.org || 'dev.azure.com';
    return `https://dev.azure.com/${org}/${this.project}`;
  }

  public getWebUrl(itemId: number): string {
    if (this.serverUrl.startsWith('http://') || this.serverUrl.startsWith('https://')) {
      const collection = this.org || 'DefaultCollection';
      return `${this.serverUrl}/${collection}/${this.project}/_workitems/edit/${itemId}`;
    }
    const org = this.org || 'dev.azure.com';
    return `https://dev.azure.com/${org}/${this.project}/_workitems/edit/${itemId}`;
  }

  public getHeaders(useBearer = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.pat) {
      if (useBearer) {
        headers['Authorization'] = `Bearer ${this.pat}`;
      } else {
        const encoded = Buffer.from(`:${this.pat}`).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      }
    }
    return headers;
  }

  public getApiVersion(): string {
    if (this.serverUrl.startsWith('http://') || this.serverUrl.startsWith('https://')) {
      return '5.1';
    }
    return AZURE_API_VERSION;
  }

  public parseWorkItem(itemJson: any): BugItem {
    const fields = itemJson.fields || {};
    const itemId = Number(itemJson.id || 0);

    const title = fields['System.Title'] || `Work Item #${itemId}`;
    const desc = cleanHtml(fields['System.Description']);
    const repro = cleanHtml(fields['Microsoft.VSTS.TCM.ReproSteps']);
    const ac = cleanHtml(fields['Microsoft.VSTS.Common.AcceptanceCriteria']);

    const state = fields['System.State'] || 'New';
    const reason = fields['System.Reason'] || '';
    const severity = fields['Microsoft.VSTS.Common.Severity'] || '3 - Medium';
    const priority = Number(fields['Microsoft.VSTS.Common.Priority'] ?? 2);

    let assignedTo = 'Unassigned';
    let assignedToEmail = '';
    const assignedObj = fields['System.AssignedTo'];
    if (assignedObj && typeof assignedObj === 'object') {
      assignedTo = assignedObj.displayName || 'Unassigned';
      assignedToEmail = assignedObj.uniqueName || '';
    } else if (typeof assignedObj === 'string') {
      assignedTo = assignedObj;
    }

    let reporter = 'Unknown';
    const createdObj = fields['System.CreatedBy'];
    if (createdObj && typeof createdObj === 'object') {
      reporter = createdObj.displayName || 'Unknown';
    } else if (typeof createdObj === 'string') {
      reporter = createdObj;
    }

    const createdDate = fields['System.CreatedDate'] || '';
    const changedDate = fields['System.ChangedDate'] || '';
    const closedDate = fields['Microsoft.VSTS.Common.ClosedDate'] || '';

    const areaPath = fields['System.AreaPath'] || '';
    const iterationPath = fields['System.IterationPath'] || '';
    const tags = fields['System.Tags'] || '';
    const projectName = fields['System.TeamProject'] || this.project || 'HRMS';

    const manualOverride = getManualPage(itemId);
    const pageName = classifyBug({
      area_path: areaPath,
      tags,
      title,
      description: desc,
      manual_override: manualOverride,
    });

    const bugUrl = this.getWebUrl(itemId);

    return {
      id: itemId,
      work_item_type: fields['System.WorkItemType'] || 'Bug',
      title,
      description: desc,
      repro_steps: repro,
      acceptance_criteria: ac,
      state,
      reason,
      severity: String(severity),
      priority,
      assigned_to: assignedTo,
      assigned_to_email: assignedToEmail,
      reporter,
      created_date: createdDate,
      changed_date: changedDate,
      closed_date: closedDate,
      area_path: areaPath,
      iteration_path: iterationPath,
      tags,
      project_name: projectName,
      page_name: pageName,
      bug_url: bugUrl,
      last_synced: '',
    };
  }

  public getMockBug(bugId: number): BugItem {
    if (MOCK_BUGS[bugId]) {
      const data = { ...MOCK_BUGS[bugId] };
      const manual = getManualPage(bugId);
      if (manual) {
        data.page_name = manual;
      }
      data.bug_url = this.getWebUrl(bugId);
      return data as BugItem;
    }

    return {
      id: bugId,
      work_item_type: 'Bug',
      title: `Sample HRMS Work Item #${bugId}: Verification and UI Regression`,
      description: `Detailed log for simulated work item ${bugId} in HRMS test environment.`,
      repro_steps: `1. Navigate to target HRMS view.\n2. Trigger action for ID ${bugId}.\n3. Verify response status.`,
      acceptance_criteria: 'System executes without regression.',
      state: 'New',
      reason: 'Simulated Record',
      severity: '3 - Medium',
      priority: 2,
      assigned_to: 'Quality Assurance',
      assigned_to_email: 'qa@example.com',
      reporter: 'Test Automation',
      created_date: '2026-10-18 10:00:00',
      changed_date: '2026-10-19 09:00:00',
      closed_date: '',
      area_path: 'HRMS\\General',
      iteration_path: 'HRMS\\Sprint 24',
      tags: 'simulated; test',
      project_name: this.project || 'HRMSEcoSystem',
      page_name: getManualPage(bugId) || 'Unclassified',
      bug_url: this.getWebUrl(bugId),
      last_synced: '',
    };
  }

  public async fetchSingleBug(bugId: number): Promise<[BugItem | null, string | null]> {
    if (this.mockMode || !this.pat) {
      return [this.getMockBug(bugId), null];
    }

    const apiRoot = this.getApiRoot();
    const apiVer = this.getApiVersion();
    const url = apiVer === '5.1'
      ? `${apiRoot}/_apis/wit/workitems/${bugId}?api-version=${apiVer}`
      : `${apiRoot}/_apis/wit/workitems/${bugId}?$expand=all&api-version=${apiVer}`;

    try {
      let resp = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(false),
        signal: AbortSignal.timeout(25000),
      });

      if (resp.status === 401) {
        resp = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(true),
          signal: AbortSignal.timeout(25000),
        });
      }

      if (resp.status === 400) {
        const text = await resp.text();
        if (text.toLowerCase().includes('version') || text.toLowerCase().includes('nullable')) {
          const fallbackUrl = `${apiRoot}/_apis/wit/workitems/${bugId}?api-version=5.1`;
          resp = await fetch(fallbackUrl, {
            method: 'GET',
            headers: this.getHeaders(false),
            signal: AbortSignal.timeout(25000),
          });
          if (resp.status === 401) {
            resp = await fetch(fallbackUrl, {
              method: 'GET',
              headers: this.getHeaders(true),
              signal: AbortSignal.timeout(25000),
            });
          }
        }
      }

      if (resp.ok) {
        const data = await resp.json();
        return [this.parseWorkItem(data), null];
      } else if (resp.status === 401) {
        return [null, `Azure DevOps Authentication failed (401). Verify Personal Access Token (PAT) for project '${this.project}'.`];
      } else if (resp.status === 403) {
        return [null, `Permission denied (403) accessing work item #${bugId} in project '${this.project}'.`];
      } else if (resp.status === 404) {
        return [null, `Work Item #${bugId} was not found in project '${this.project}'.`];
      } else if (resp.status === 429) {
        return [null, 'Azure DevOps API rate limit exceeded (429 Throttling). Please wait a moment.'];
      } else {
        const body = await resp.text();
        return [null, `Azure DevOps API error (status ${resp.status}): ${body.slice(0, 200)}`];
      }
    } catch (exc: any) {
      return [null, `Network error connecting to Azure DevOps (${this.serverUrl}): ${exc.message}`];
    }
  }

  public async fetchBulkBugs(bugIds: number[]): Promise<[BugItem[], Array<{ id: number; error: string }>]> {
    const uniqueIds = Array.from(new Set(bugIds));
    if (uniqueIds.length === 0) return [[], []];

    if (this.mockMode || !this.pat) {
      return [uniqueIds.map(id => this.getMockBug(id)), []];
    }

    const successfulBugs: BugItem[] = [];
    const failedRecords: Array<{ id: number; error: string }> = [];

    const chunks: number[][] = [];
    for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
      chunks.push(uniqueIds.slice(i, i + BATCH_SIZE));
    }

    const apiRoot = this.getApiRoot();
    const apiVer = this.getApiVersion();
    const url = `${apiRoot}/_apis/wit/workitemsbatch?api-version=${apiVer}`;

    for (const chunk of chunks) {
      const payload: any = { ids: chunk };
      if (apiVer !== '5.1') {
        payload['$expand'] = 'all';
      }

      try {
        let resp = await fetch(url, {
          method: 'POST',
          headers: this.getHeaders(false),
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(45000),
        });

        if (resp.status === 401) {
          resp = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(true),
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(45000),
          });
        }

        if (resp.status === 400) {
          const text = await resp.text();
          if (text.toLowerCase().includes('version') || text.toLowerCase().includes('nullable')) {
            const fallbackUrl = `${apiRoot}/_apis/wit/workitemsbatch?api-version=5.1`;
            resp = await fetch(fallbackUrl, {
              method: 'POST',
              headers: this.getHeaders(false),
              body: JSON.stringify({ ids: chunk }),
              signal: AbortSignal.timeout(45000),
            });
            if (resp.status === 401) {
              resp = await fetch(fallbackUrl, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ ids: chunk }),
                signal: AbortSignal.timeout(45000),
              });
            }
          }
        }

        if (resp.ok) {
          const data = (await resp.json()) as any;
          const values = data.value || [];
          const returnedIds = new Set<number>();

          for (const itemData of values) {
            try {
              const bug = this.parseWorkItem(itemData);
              successfulBugs.push(bug);
              returnedIds.add(bug.id);
            } catch (err: any) {
              failedRecords.push({ id: itemData.id || 0, error: `Failed parsing item: ${err.message}` });
            }
          }

          for (const reqId of chunk) {
            if (!returnedIds.has(reqId)) {
              failedRecords.push({ id: reqId, error: 'Work item not found or deleted.' });
            }
          }
        } else if (resp.status === 401) {
          for (const reqId of chunk) {
            failedRecords.push({ id: reqId, error: 'Azure DevOps Authentication failed (401).' });
          }
        } else if (resp.status === 403) {
          for (const reqId of chunk) {
            failedRecords.push({ id: reqId, error: 'Permission denied (403).' });
          }
        } else {
          for (const reqId of chunk) {
            failedRecords.push({ id: reqId, error: `Azure API returned status ${resp.status}.` });
          }
        }
      } catch (exc: any) {
        for (const reqId of chunk) {
          failedRecords.push({ id: reqId, error: `Network error: ${exc.message}` });
        }
      }
    }

    return [successfulBugs, failedRecords];
  }
}
