import { config } from '../../config/index.js';
import { getAiSummary, saveAiSummary } from '../../database/index.js';
import type { BugItem, SummaryDetail } from '../../types/index.js';

export const PRIVACY_NOTE_LOCAL =
  'Local Privacy-Safe Mode: This summary was generated entirely on your local machine using ' +
  'rule-based NLP analysis. No proprietary bug details or employee names were transmitted to any external AI service.';

export const PRIVACY_NOTE_AI =
  'OpenAI Cloud Mode: Generated using configured OpenAI API. Ensure that sharing this bug\'s data ' +
  'complies with your organization\'s data protection and confidentiality guidelines.';

export function generateLocalSummary(bug: BugItem): SummaryDetail {
  const shortSummary = `[${bug.page_name || 'Unclassified'}] ${bug.title}`;

  let actualIssue = '';
  if (bug.repro_steps) {
    const stepsLines = bug.repro_steps.split('\n').map(l => l.trim()).filter(Boolean);
    const observeLine = stepsLines.find(l => {
      const lower = l.toLowerCase();
      return lower.includes('observe') || lower.includes('error') || lower.includes('fails') || lower.includes('issue');
    });
    actualIssue = observeLine || stepsLines[stepsLines.length - 1] || bug.title;
  } else if (bug.description) {
    actualIssue = bug.description.split('.')[0] + '.';
  } else {
    actualIssue = `Reported issue: ${bug.title}`;
  }

  let expectedBehavior = '';
  if (bug.acceptance_criteria) {
    expectedBehavior = bug.acceptance_criteria;
  } else {
    expectedBehavior = `The ${bug.page_name || 'module'} should complete operations cleanly without errors, matching statutory and functional standards.`;
  }

  const sevStr = String(bug.severity || '').toLowerCase();
  const pri = bug.priority ?? 2;
  let impact = '';
  if (sevStr.includes('1') || sevStr.includes('critical')) {
    impact = `CRITICAL: High risk to workflow continuity and data integrity. Affects core ${bug.page_name || 'HRMS'} operations (Priority ${pri}).`;
  } else if (sevStr.includes('2') || sevStr.includes('high')) {
    impact = `HIGH: Degrades user experience or creates functional discrepancies in ${bug.page_name || 'HRMS'} (Priority ${pri}).`;
  } else {
    impact = `MODERATE / LOW: Non-blocking functional or UI defect in ${bug.page_name || 'HRMS'} (Priority ${pri}).`;
  }

  const testingSteps = [
    `1. Reproduce in staging environment for module: ${bug.page_name || 'HRMS'}.`,
    `2. Validate edge cases matching '${bug.title.slice(0, 50)}...'.`,
    '3. Verify browser network console for 4xx/5xx status codes or unhandled exceptions.',
    '4. Confirm state transition and database persistence after corrective patch.',
    '5. Execute regression suite on related HRMS dependency modules.',
  ];

  return {
    bug_id: bug.id,
    short_summary: shortSummary,
    actual_issue: actualIssue,
    expected_behavior: expectedBehavior,
    impact,
    suggested_testing_steps: testingSteps,
    source: 'Local Rule-based QA Engine (Privacy-Safe)',
    privacy_note: PRIVACY_NOTE_LOCAL,
  };
}

export async function summarizeBug(
  bug: BugItem,
  forceRefresh = false,
  useLocalOnly = false
): Promise<SummaryDetail> {
  // Check SQLite cache first
  if (!forceRefresh) {
    const cached = getAiSummary(bug.id);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return parsed as SummaryDetail;
      } catch {
        // invalid JSON in cache, continue
      }
    }
  }

  const aiAvailable = config.AI_ENABLED && Boolean(config.OPENAI_API_KEY);

  if (useLocalOnly || !aiAvailable) {
    const summary = generateLocalSummary(bug);
    saveAiSummary(bug.id, JSON.stringify(summary));
    return summary;
  }

  // Use OpenAI API
  try {
    const { OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });

    const prompt = `
You are a senior QA automation engineer and Azure DevOps bug specialist.
Analyze this HRMS bug strictly based on the provided details. DO NOT invent missing facts.
Clearly distinguish source information from AI-generated suggestions.

Bug Details:
- ID: ${bug.id}
- Title: ${bug.title}
- Module/Page: ${bug.page_name}
- State: ${bug.state}
- Severity: ${bug.severity}
- Priority: ${bug.priority}
- Description: ${bug.description}
- Repro Steps: ${bug.repro_steps}
- Acceptance Criteria: ${bug.acceptance_criteria || ''}

Return a valid JSON object strictly matching this schema:
{
  "short_summary": "1 concise sentence summarizing the bug",
  "actual_issue": "What is actually going wrong based strictly on the description or repro steps",
  "expected_behavior": "What should have happened (or state if not specified in source)",
  "impact": "Operational, business, or security impact based on severity and module",
  "suggested_testing_steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ...",
    "Step 4: ..."
  ]
}
`;

    const completion = await client.chat.completions.create({
      model: config.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a precise QA analyst. Output only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const data = JSON.parse(content);

    const summary: SummaryDetail = {
      bug_id: bug.id,
      short_summary: data.short_summary || bug.title,
      actual_issue: data.actual_issue || bug.description || bug.title,
      expected_behavior: data.expected_behavior || bug.acceptance_criteria || 'Standard functionality',
      impact: data.impact || `Severity: ${bug.severity}`,
      suggested_testing_steps: data.suggested_testing_steps || ['Verify reproduction steps in test environment.'],
      source: `OpenAI (${config.OPENAI_MODEL || 'gpt-4o-mini'})`,
      privacy_note: PRIVACY_NOTE_AI,
    };

    saveAiSummary(bug.id, JSON.stringify(summary));
    return summary;
  } catch (err: any) {
    // Graceful fallback to local engine
    const local = generateLocalSummary(bug);
    local.impact += ` (Note: OpenAI request failed: ${err.message}; fell back to local engine)`;
    saveAiSummary(bug.id, JSON.stringify(local));
    return local;
  }
}
