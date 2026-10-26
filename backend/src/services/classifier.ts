export const HRMS_PAGES: string[] = [
  'Login Page',
  'System Role Dashboard',
  'Generate Employee ID',
  'Organisation Master',
  'Map Weekly Off',
  'Weekly Off Planner',
  'Employee Data Master (EDM)',
  'Leave Module',
  'Payroll Module',
  'Attendance Module',
  'Query Module',
  'AI Chatbot',
  'Geolocation',
];

export const MODULE_PATTERNS: Record<string, RegExp[]> = {
  'Login Page': [
    /\blogin\b/i, /\bsignin\b/i, /\bauth\b/i, /\bauthentication\b/i, /\bsso\b/i,
    /\bpassword\b/i, /\bmfa\b/i, /\botp\b/i, /\bcredentials\b/i, /\blogout\b/i,
  ],
  'System Role Dashboard': [
    /\bsystem role\b/i, /\brole dashboard\b/i, /\broles?\b/i, /\bpermissions?\b/i,
    /\bacl\b/i, /\brbac\b/i, /\baccess control\b/i,
  ],
  'Generate Employee ID': [
    /\bgenerate employee id\b/i, /\bemp(loyee)? id gen\b/i, /\bemp id generation\b/i,
    /\bauto id\b/i, /\bemployee code\b/i,
  ],
  'Organisation Master': [
    /\borganisation master\b/i, /\borganization master\b/i, /\borg master\b/i,
    /\bdepartment\b/i, /\bdesignation\b/i, /\bcompany hierarchy\b/i, /\bbranch master\b/i,
  ],
  'Map Weekly Off': [
    /\bmap weekly off\b/i, /\bweekly off mapping\b/i, /\bshift weekly off\b/i,
    /\boff mapping\b/i,
  ],
  'Weekly Off Planner': [
    /\bweekly off planner\b/i, /\boff planner\b/i, /\broster planner\b/i,
    /\bweekend planner\b/i, /\bweekly off schedule\b/i,
  ],
  'Employee Data Master (EDM)': [
    /\bedm\b/i, /\bemployee data master\b/i, /\bemployee profile\b/i,
    /\bemployee master\b/i, /\bemployee details\b/i, /\bonboarding data\b/i,
  ],
  'Leave Module': [
    /\bleave\b/i, /\btimeoff\b/i, /\bvacation\b/i, /\bsick leave\b/i,
    /\bcasual leave\b/i, /\bleave balance\b/i, /\bleave approval\b/i, /\bleave policy\b/i,
  ],
  'Payroll Module': [
    /\bpayroll\b/i, /\bsalary\b/i, /\bpayslip\b/i, /\bsalary slip\b/i,
    /\bpf deduction\b/i, /\btax deduction\b/i, /\bctc\b/i, /\bcompensation\b/i, /\bwage\b/i,
  ],
  'Attendance Module': [
    /\battendance\b/i, /\bcheck[- ]?in\b/i, /\bcheck[- ]?out\b/i, /\bclock[- ]?in\b/i,
    /\btimesheet\b/i, /\bshift\b/i, /\bbiometric\b/i, /\blate mark\b/i,
  ],
  'Query Module': [
    /\bquery module\b/i, /\bhelpdesk\b/i, /\bticket\b/i, /\bgrievance\b/i,
    /\bhr query\b/i, /\bsupport ticket\b/i,
  ],
  'AI Chatbot': [
    /\bai chatbot\b/i, /\bbot\b/i, /\bvirtual assistant\b/i, /\bchat assistant\b/i,
    /\bconversational ai\b/i,
  ],
  'Geolocation': [
    /\bgeolocation\b/i, /\bgeo[- ]?fence\b/i, /\bgps\b/i, /\blocation tracking\b/i,
    /\bradius validation\b/i, /\bgeo tag\b/i,
  ],
};

const PRIORITY_ORDER: string[] = [
  'Geolocation',
  'Employee Data Master (EDM)',
  'Weekly Off Planner',
  'Map Weekly Off',
  'System Role Dashboard',
  'Generate Employee ID',
  'Organisation Master',
  'AI Chatbot',
  'Leave Module',
  'Payroll Module',
  'Login Page',
  'Attendance Module',
  'Query Module',
];

export function classifyBug(params: {
  area_path?: string;
  tags?: string;
  title?: string;
  description?: string;
  manual_override?: string | null;
}): string {
  const { area_path = '', tags = '', title = '', description = '', manual_override } = params;

  if (manual_override && HRMS_PAGES.includes(manual_override.trim())) {
    return manual_override.trim();
  }

  const titleLower = title.toLowerCase();
  const areaLower = area_path.toLowerCase();
  const tagsLower = tags.toLowerCase();

  // Step 1: Area Path check
  for (const page of HRMS_PAGES) {
    const cleanPage = page.toLowerCase().replace('module', '').replace('page', '').trim();
    if (areaLower.includes(cleanPage)) {
      return page;
    }
  }

  // Step 2: Direct HRMS Module Name check in title or tags
  for (const page of HRMS_PAGES) {
    if (titleLower.includes(page.toLowerCase()) || tagsLower.includes(page.toLowerCase())) {
      return page;
    }
    const cleanPage = page.toLowerCase().replace('module', '').replace('page', '').trim();
    if (!['query', 'role', 'leave'].includes(cleanPage) && cleanPage.length > 4) {
      const re = new RegExp(`\\b${cleanPage}\\b`, 'i');
      if (re.test(titleLower) || re.test(tagsLower)) {
        return page;
      }
    }
  }

  // Step 3: Title check with module patterns
  for (const page of PRIORITY_ORDER) {
    const patterns = MODULE_PATTERNS[page] || [];
    for (const pat of patterns) {
      if (pat.test(titleLower)) {
        return page;
      }
    }
  }

  // Step 4: Tags check with module patterns
  const tagList = tags.split(';').map(t => t.trim().toLowerCase()).filter(Boolean);
  for (const tag of tagList) {
    for (const page of PRIORITY_ORDER) {
      const patterns = MODULE_PATTERNS[page] || [];
      for (const pat of patterns) {
        if (pat.test(tag)) {
          return page;
        }
      }
    }
  }

  // Step 5: Description check
  const descLower = description.toLowerCase();
  for (const page of HRMS_PAGES) {
    if (descLower.includes(page.toLowerCase())) {
      return page;
    }
  }

  return 'Unclassified';
}
