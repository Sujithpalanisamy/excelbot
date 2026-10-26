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
