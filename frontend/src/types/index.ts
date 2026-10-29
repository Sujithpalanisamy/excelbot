export interface BugItem {
  id: number;
  work_item_type: string;
  title: string;
  description: string;
  repro_steps: string;
  acceptance_criteria?: string;
  state: string;
  reason?: string;
  severity: string;
  priority: number;
  assigned_to: string;
  assigned_to_email?: string;
  reporter: string;
  created_date: string;
  changed_date: string;
  closed_date?: string;
  area_path: string;
  iteration_path: string;
  tags: string;
  project_name: string;
  page_name: string;
  manual_page_override?: string;
  ai_summary?: string;
  bug_url: string;
  last_synced: string;
}

export interface SummaryDetail {
  bug_id: number;
  short_summary: string;
  actual_issue: string;
  expected_behavior: string;
  impact: string;
  suggested_testing_steps: string[];
  source: string;
  privacy_note: string;
}

export interface PageSummaryRow {
  page_name: string;
  total_bugs: number;
  open_bugs: number;
  active_bugs: number;
  closed_bugs: number;
  critical_bugs: number;
  high_priority_bugs: number;
}

export interface AssigneeSummaryRow {
  assigned_to: string;
  total_bugs: number;
  open_bugs: number;
  active_bugs: number;
  closed_bugs: number;
  critical_bugs: number;
}

export interface ReportSummary {
  generated_at: string;
  total_bugs: number;
  open_bugs: number;
  active_bugs: number;
  resolved_bugs: number;
  closed_bugs: number;
  critical_severity_bugs: number;
  high_priority_bugs: number;
  reopen_count?: number;
  reopen_rate_percent?: number;
  ui_count?: number;
  functional_count?: number;
  ui_percent?: number;
  functional_percent?: number;
  fix_rate_percent?: number;
  page_breakdown: PageSummaryRow[];
  assignee_breakdown: AssigneeSummaryRow[];
  severity_breakdown: Record<string, number>;
  priority_breakdown: Record<string, number>;
  state_breakdown: Record<string, number>;
}

export interface SettingsStatusResponse {
  server_url: string;
  organization: string;
  project: string;
  pat_configured: boolean;
  pat_masked: string;
  mock_mode: boolean;
  ai_enabled: boolean;
  ai_key_configured: boolean;
  excel_output_path: string;
  total_cached_bugs: number;
  database?: string;
}

export interface SettingsUpdateRequest {
  server_url?: string;
  organization?: string;
  project?: string;
  pat?: string;
  mock_mode?: boolean;
  ai_enabled?: boolean;
  openai_api_key?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action_type?: string;
  data?: any;
}

export interface ChatResponse {
  reply: string;
  action_type?: string;
  data?: any;
}

export const HRMS_PAGES: string[] = [
  "Login Page",
  "System Role Dashboard",
  "Generate Employee ID",
  "Organisation Master",
  "Map Weekly Off",
  "Weekly Off Planner",
  "Employee Data Master (EDM)",
  "Leave Module",
  "Payroll Module",
  "Attendance Module",
  "Query Module",
  "AI Chatbot",
  "Geolocation",
  "Unclassified"
];

export const STANDARD_STATES: string[] = [
  'New',
  'Active',
  'Committed',
  'Approved',
  'Resolved',
  'Done',
  'Closed'
];

export const STANDARD_SEVERITIES: string[] = [
  '1 - Critical',
  '2 - High',
  '3 - Medium',
  '4 - Low'
];

export interface ExcelSheetDef {
  id: number;
  name: string;
  category: 'core' | 'dashboard' | 'analytics' | 'scorecards' | 'release' | 'rules';
  description: string;
  status: 'active' | 'in_progress' | 'planned';
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  tierLabel: string;
  dataSource: string;
}

export const ALL_27_SHEETS: ExcelSheetDef[] = [
  { id: 1, name: "All Bugs", category: 'core', description: "Exported bug table with ID, Title, Repro Steps, State, Severity, Assignee", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Azure DevOps REST API' },
  { id: 2, name: "Dashboard", category: 'dashboard', description: "Executive Project Development & QA Quality Dashboard", status: 'active', tier: 'Tier 3', tierLabel: 'Governance & Dynamic Releases', dataSource: 'Azure Metrics + Dynamic Deployments' },
  { id: 3, name: "Page Tracker", category: 'analytics', description: "Page & module delivery tracking matrix", status: 'active', tier: 'Tier 3', tierLabel: 'Project Baseline Scope', dataSource: 'Project Governance Baseline (260 Pages)' },
  { id: 4, name: "Azure Import", category: 'core', description: "Live sync table where Azure DevOps work items are imported", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Azure DevOps REST API' },
  { id: 5, name: "Bug Tracker", category: 'core', description: "Comprehensive bug tracking matrix with status reconciliation", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Live Bugs Database' },
  { id: 6, name: "Deployment Tracker", category: 'release', description: "Deployment items, release dates, and developer tracking", status: 'active', tier: 'Tier 3', tierLabel: 'Release & Deployment Log', dataSource: 'Azure Closed Bugs + Manual UI Entry' },
  { id: 7, name: "Deployment History", category: 'release', description: "Historical deployment log", status: 'active', tier: 'Tier 3', tierLabel: 'Historical Baseline', dataSource: 'Excel Deployment Archive' },
  { id: 8, name: "Bug Lifecycle", category: 'core', description: "Lifecycle tracking (synced from Bug Tracker & Deployments)", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Live Bug State Transitions' },
  { id: 9, name: "Developer Scorecard", category: 'scorecards', description: "Developer defect fix accuracy & turnaround metrics", status: 'active', tier: 'Tier 2', tierLabel: '100% Live Calculated', dataSource: 'Engine Quality Algorithms' },
  { id: 10, name: "Reopen Analysis", category: 'analytics', description: "Analysis on reopened bugs & fix quality", status: 'active', tier: 'Tier 2', tierLabel: '100% Live Calculated', dataSource: 'Engine Reopen Detector' },
  { id: 11, name: "QA Scorecard", category: 'scorecards', description: "QA testing volume, accuracy, and defect detection rate", status: 'active', tier: 'Tier 2', tierLabel: '100% Live Calculated', dataSource: 'Engine Quality Algorithms' },
  { id: 12, name: "Module Quality", category: 'analytics', description: "Defect density matrix per HRMS module", status: 'active', tier: 'Tier 2', tierLabel: '100% Live Calculated', dataSource: 'Engine Quality Algorithms' },
  { id: 13, name: "Bug Aging", category: 'analytics', description: "Aging duration calculation for unresolved bugs", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Live Bugs Age Buckets' },
  { id: 14, name: "Lists", category: 'rules', description: "Master dropdowns (Severities, Priorities, States, Complexity)", status: 'active', tier: 'Tier 3', tierLabel: 'Master Configuration', dataSource: 'Project Dictionaries' },
  { id: 15, name: "Instructions", category: 'rules', description: "Guide on how to navigate and use the workbook", status: 'active', tier: 'Tier 3', tierLabel: 'Documentation SOP', dataSource: 'Project SOP' },
  { id: 16, name: "Priority tasks", category: 'release', description: "Priority QA tasks, blockers, and notes", status: 'active', tier: 'Tier 3', tierLabel: 'Project Governance', dataSource: 'PM Blocker Task Register' },
  { id: 17, name: "Gantt", category: 'release', description: "Basic module & page delivery timeline", status: 'active', tier: 'Tier 3', tierLabel: 'Milestone Schedule', dataSource: 'Page Delivery Gantt Timeline' },
  { id: 18, name: "miscellaneous", category: 'rules', description: "Miscellaneous notes and admin fields", status: 'active', tier: 'Tier 3', tierLabel: 'Admin Governance', dataSource: 'Admin Config Notes' },
  { id: 19, name: "CR", category: 'release', description: "Change Request (CR) register", status: 'active', tier: 'Tier 3', tierLabel: 'Scope Governance', dataSource: 'Change Request Register' },
  { id: 20, name: "Feedback", category: 'release', description: "Feedback notes and review points", status: 'active', tier: 'Tier 3', tierLabel: 'Review Log', dataSource: 'Client & QA Review Log' },
  { id: 21, name: "Reports", category: 'dashboard', description: "Module reports catalog", status: 'active', tier: 'Tier 3', tierLabel: 'Specifications', dataSource: 'HRMS Reports Catalog' },
  { id: 22, name: "Mapping", category: 'rules', description: "Auto-classification rules (keywords -> Page names)", status: 'active', tier: 'Tier 2', tierLabel: 'Rule Engine', dataSource: 'Auto-Classifier Dictionary' },
  { id: 23, name: "Module UI vs Functional", category: 'analytics', description: "Auto-calculated UI vs Functional defect ratio", status: 'active', tier: 'Tier 2', tierLabel: '100% Live Calculated', dataSource: 'Heuristic Keyword Classifier' },
  { id: 24, name: "Pending With Developer", category: 'core', description: "Filtered view of bugs in New / Approved / Committed states", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Live Open Bugs' },
  { id: 25, name: "Page Summary", category: 'analytics', description: "Summary of bugs aggregated by Page / Module", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Live Bugs Aggregated by Page' },
  { id: 26, name: "Assignee Summary", category: 'scorecards', description: "Summary of bugs aggregated by Developer / Assignee", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Live Bugs Aggregated by Developer' },
  { id: 27, name: "Report", category: 'dashboard', description: "Executive summary report generated by the Assistant", status: 'active', tier: 'Tier 1', tierLabel: '100% Live Auto-Synced', dataSource: 'Executive Rollup' },
];

export interface DashboardExcelData {
  asOfDate: string;
  projectKpis: Array<{ label: string; value: string | number; meaning: string; isProgress?: boolean; progressPercent?: number; liveValue?: string | number }>;
  qualityKpis: Array<{ label: string; value: string | number; meaning: string; liveValue?: string | number }>;
  bugStatus: Array<{ status: string; count: number; isTotal?: boolean; liveCount?: number }>;
  severity: Array<{ severity: string; count: number; liveCount?: number }>;
  developerScorecard: Array<{ developer: string; devAccuracy: string; fixAccuracy: string; finalScore: string }>;
  moduleQuality: Array<{ module: string; progress: string; accuracy: string }>;
  deploymentSummary: {
    dates: Array<{ date: string; bugsDeployed: number; tasksDeployed: number; total: number }>;
    total: { bugsDeployed: number; tasksDeployed: number; total: number };
  };
  bugQaStatus: Array<{ status: string; count: number }>;
  bugPriority: Array<{ priority: string; count: number }>;
  devAgeingMatrix: {
    headers: string[];
    rows: Array<{ developer: string; d0_7: number; d8_15: number; d16_30: number; d31_45: number; d46_60: number; d60_plus: number; total: number }>;
    total: { d0_7: number; d8_15: number; d16_30: number; d31_45: number; d46_60: number; d60_plus: number; total: number };
  };
  moduleAgeingMatrix: {
    headers: string[];
    rows: Array<{ module: string; d0_7: number; d8_15: number; d16_30: number; d31_45: number; d46_60: number; d60_plus: number; total: number }>;
    total: { d0_7: number; d8_15: number; d16_30: number; d31_45: number; d46_60: number; d60_plus: number; total: number };
  };
  bugsCategory: {
    headers: string[];
    rows: Array<{ module: string; uiBugs: number; functionalBugs: number; totalBugs: number }>;
    total: { uiBugs: number; functionalBugs: number; totalBugs: number };
  };
  dailyTimeline?: Array<{ date: string; raised: number; reopened: number; closed: number; pending: number }>;
  p1Issues?: { totalBugs: number; fixed: number; pending: number };
  oct15Release?: { totalBugs: number; closed: number; reopened: number; pending: number };
  quickStats?: { yesterday: number; pendingFromQa: number; pendingFromDev: number };
}

export interface PendingDeveloperRow {
  developer: string;
  newCount: number;
  approvedCount: number;
  committedCount: number;
  totalPending: number;
  uiPending: number;
  functionalPending: number;
  reopenedPending: number;
  pctOfAllPending: string;
}

export interface PendingModuleRow {
  module: string;
  newCount: number;
  approvedCount: number;
  committedCount: number;
  totalPending: number;
  uiPending: number;
  functionalPending: number;
  reopenedPending: number;
  pctOfAllPending: string;
}

export interface PendingBugItem {
  id: number;
  title: string;
  module: string;
  assigned_to: string;
  state: string;
  severity: string;
  priority: number;
  created_date: string;
  age_days: number;
  age_bucket: string;
  bug_nature: 'UI' | 'Functional';
  reopened: 'Yes' | 'No';
}

export interface PendingWithDeveloperData {
  totalPending: number;
  developers: string[];
  modules: string[];
  table1: PendingDeveloperRow[];
  table2: PendingModuleRow[];
  table3: Array<Record<string, any>>;
  pendingBugs: PendingBugItem[];
}

export interface BugLifecycleItem {
  bug_id: number;
  module: string;
  severity: string;
  priority: string;
  date_raised: string;
  released_to_qa: string;
  qa_release_date: string;
  reopened: string;
  no_of_reopens: number;
  date_closed: string;
  status: string;
  first_deployment_date: string;
  last_deployment_date: string;
  total_deployments: number;
  days_open: number;
}

export interface BugLifecycleData {
  totalBugs: number;
  avgDaysOpen: number;
  reopenedCount: number;
  firstPassRate: string;
  records: BugLifecycleItem[];
}

export interface AzureImportItem {
  id: number;
  work_item_type: string;
  title: string;
  assigned_to: string;
  state: string;
  tags: string;
  created_date: string;
  assignee_clean: string;
  developer: string;
  module: string;
  bug_nature: string;
  status_group: string;
  is_pending: string;
  is_reopened: string;
  in_bug_tracker: string;
  search_text: string;
}

export interface BugTrackerItem {
  bug_id: number;
  parent_bug_id: number | null;
  bug_type: string;
  internal_bug: string;
  module: string;
  bug_summary: string;
  component: string;
  original_developer: string;
  fix_developer: string;
  qa_raised_by: string;
  severity: string;
  priority: string;
  date_raised: string;
  date_closed: string;
  status: string;
  released_to_qa: string;
  qa_release_date: string;
  qa_comments: string;
  reported_sprint: string;
  fixed_sprint: string;
  deferred_sprint: string;
  reopened: string;
  no_of_reopens: number;
  root_cause: string;
  resolution_hours: number;
  valid_bug: string;
  notes: string;
  azure_state: string;
  sync_check: 'OK' | 'Pending' | 'Check';
  azure_assignee: string;
  bug_nature: string;
  age_days: number;
  age_bucket: string;
  dev_pending: string;
}

export interface ReopenAnalysisRow {
  developer: string;
  bugsAssigned: number;
  closedBugs: number;
  reopenedCount: number;
  reworkPct: string;
  criticalReopens: number;
  fixAccuracyPct: string;
  actionRequired: string;
}

export interface ReopenAnalysisData {
  totalAssigned: number;
  totalClosed: number;
  totalReopened: number;
  totalCritReopens: number;
  totalReworkPct: string;
  totalFixAccuracy: string;
  rows: ReopenAnalysisRow[];
}

export interface ModuleQualityRow {
  module: string;
  pages: number;
  completedPages: number;
  averageProgress: string;
  bugs: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  internalBugs: number;
  moduleAccuracy: string;
}

export interface ModuleQualityData {
  rows: ModuleQualityRow[];
  total: {
    pages: number;
    completedPages: number;
    averageProgress: string;
    bugs: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    internalBugs: number;
    moduleAccuracy: string;
  };
}

export interface BugAgingItem {
  bug_id: number;
  parent_bug_id: number | null;
  module: string;
  page_name: string;
  original_developer: string;
  fix_developer: string;
  severity: string;
  date_raised: string;
  status: string;
  days_open: number;
  aging_bucket: string;
}

export interface BugAgingData {
  totalBugs: number;
  bucketCounts: {
    '0-7 Days': number;
    '8-15 Days': number;
    '16-30 Days': number;
    '31-45 Days': number;
    '46-60 Days': number;
    '60+ Days': number;
  };
  items: BugAgingItem[];
}

export interface ModuleUiVsFunctionalRow {
  module: string;
  uiTotal: number;
  functionalTotal: number;
  allBugs: number;
  uiPending: number;
  functionalPending: number;
  pendingTotal: number;
  uiClosed: number;
  functionalClosed: number;
  closedTotal: number;
  uiPctOfModule: string;
}

export interface ModuleUiVsFunctionalData {
  rows: ModuleUiVsFunctionalRow[];
  total: {
    uiTotal: number;
    functionalTotal: number;
    allBugs: number;
    uiPending: number;
    functionalPending: number;
    pendingTotal: number;
    uiClosed: number;
    functionalClosed: number;
    closedTotal: number;
    uiPctOfModule: string;
  };
}

export interface PageSummaryData {
  generated_at: string;
  total_bugs: number;
  open_bugs: number;
  active_bugs: number;
  closed_bugs: number;
  critical_bugs: number;
  high_priority_bugs: number;
  rows: PageSummaryRow[];
}

export interface DeveloperScorecardRow {
  developer: string;
  uiAssigned: number;
  apiAssigned: number;
  spAssigned: number;
  dbAssigned: number;
  bindingAssigned: number;
  componentsCompleted: number;
  originalBugs: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  developmentAccuracy: string;
  fixBugsAssigned: number;
  fixReopens: number;
  fixAccuracy: string;
  finalScore: string;
}

export interface DeveloperScorecardData {
  rows: DeveloperScorecardRow[];
  total: {
    uiAssigned: number;
    apiAssigned: number;
    spAssigned: number;
    dbAssigned: number;
    bindingAssigned: number;
    componentsCompleted: number;
    originalBugs: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    developmentAccuracy: string;
    fixBugsAssigned: number;
    fixReopens: number;
    fixAccuracy: string;
    finalScore: string;
  };
}

export interface QaScorecardRow {
  qa: string;
  pagesTested: number;
  bugsRaised: number;
  validBugs: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  rejectedDuplicate: number;
  missedBugs: number;
  qaAccuracy: string;
  bugFindRate: string;
  finalQaScore: string;
}

export interface QaScorecardData {
  rows: QaScorecardRow[];
  total: {
    pagesTested: number;
    bugsRaised: number;
    validBugs: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    rejectedDuplicate: number;
    missedBugs: number;
    qaAccuracy: string;
    bugFindRate: string;
    finalQaScore: string;
  };
}

export interface AssigneeSummaryItem {
  assignedTo: string;
  totalBugs: number;
  openBugs: number;
  activeBugs: number;
  closedBugs: number;
  criticalHighSeverity: number;
  pctOfTotal: string;
}

export interface AssigneeSummaryData {
  totalBugs: number;
  rows: AssigneeSummaryItem[];
  total: {
    totalBugs: number;
    openBugs: number;
    activeBugs: number;
    closedBugs: number;
    criticalHighSeverity: number;
    pctOfTotal: string;
  };
}

export interface PageTrackerItem {
  pageId: number;
  module: string;
  release: string;
  pageName: string;
  complexity: string;
  uiDev: string;
  apiDev: string;
  spDev: string;
  dbDev: string;
  bindingDev: string;
  qa: string;
  plannedStart: string;
  plannedEnd: string;
  actualEnd: string;
  overallStatus: string;
  firstPass: string;
  progress: string;
}

export interface PageTrackerData {
  totalPages: number;
  completedPages: number;
  inProgressPages: number;
  avgProgress: string;
  modules: string[];
  pages: PageTrackerItem[];
}

export interface DeploymentTrackerItem {
  type: string;
  id: number;
  deploymentDate: string;
  itemName: string;
  developers: string;
  severity: string;
  priority: string;
  status: string;
  qaStatus: string;
  qaAssigned: string;
  workedDate: string;
}

export interface DeploymentTrackerData {
  totalDeployments: number;
  bugsDeployed: number;
  tasksDeployed: number;
  dates: string[];
  deployments: DeploymentTrackerItem[];
}

export interface DeploymentHistoryItem {
  type: string;
  id: number;
  itemName: string;
  deploymentDate: string;
  status: string;
  qaStatus: string;
  qaAssigned: string;
  notes: string;
}

export interface DeploymentHistoryData {
  totalItems: number;
  history: DeploymentHistoryItem[];
}

export interface PriorityTaskItem {
  id: number;
  taskName: string;
  notes: string;
}

export interface PriorityTasksData {
  totalTasks: number;
  tasks: PriorityTaskItem[];
}

export interface GanttItem {
  pageId: number;
  module: string;
  pageName: string;
  plannedStart: string;
  plannedEnd: string;
  progress: string;
  status: string;
}

export interface GanttData {
  timelineStart: string;
  modules: string[];
  items: GanttItem[];
}

export interface CrItem {
  id: number;
  module: string;
  summary: string;
  status: string;
}

export interface CrData {
  totalCr: number;
  modules: string[];
  crList: CrItem[];
}

export interface FeedbackItem {
  id: number;
  module: string;
  issue: string;
  reportedBy: string;
}

export interface FeedbackData {
  totalFeedback: number;
  modules: string[];
  feedbackList: FeedbackItem[];
}

export interface ListsData {
  complexities: string[];
  pageStatuses: string[];
  severities: string[];
  priorities: string[];
  bugStatuses: string[];
  rootCauses: string[];
  components: string[];
  bugTypes: string[];
  developers: string[];
  qaTeam: string[];
  sprints: string[];
}

export interface InstructionStep {
  step: string;
  guidance: string;
}

export interface ColorCodeItem {
  role: string;
  code: string;
  desc: string;
}

export interface InstructionsData {
  title: string;
  steps: InstructionStep[];
  colorCodes: ColorCodeItem[];
  rules: string[];
}

export interface MiscItem {
  item: string;
  notes: string;
}

export interface MiscData {
  nurtureManage: MiscItem[];
  pwAdmin: MiscItem[];
  fields: MiscItem[];
}

export interface DeveloperMappingItem {
  azureAssignee: string;
  cleanName: string;
}

export interface ModuleKeywordItem {
  keyword: string;
  module: string;
}

export interface MappingData {
  developerMappings: DeveloperMappingItem[];
  moduleKeywords: ModuleKeywordItem[];
  uiKeywords: string[];
  defaultModule: string;
  defaultNature: string;
  reportModules: string[];
  reportDevelopers: string[];
}



