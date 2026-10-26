# Azure Bug Assistant 🚀
### Azure DevOps Boards & Microsoft Excel Integration Hub with AI Analysis

**Azure Bug Assistant** is a full-stack, production-grade application that bridges **Azure DevOps Boards** and **Microsoft Excel (`Azure_Bug_Assistant.xlsx`)**. It allows QA engineers, developers, and project managers to retrieve complete bug details by ID (single or bulk), organize them into page-wise HRMS reports, summarize issues using AI or local privacy-safe engines, and maintain an automated, formatted Excel workbook with duplicate prevention.

---

## 🌟 Key Features

1. **Azure DevOps Boards Integration (REST API v7.1)**
   - Fetch single bug details by ID.
   - Bulk fetch large ID lists automatically split into batches of $\le 200$ items (Azure DevOps API limit).
   - Read-only operations: never creates, modifies, or deletes work items in Azure DevOps.
   - Robust error handling for 401 Unauthorized, 403 Forbidden, 404 Not Found, and 429 Rate Throttling.
   - Sandbox / Mock Mode included out of the box for immediate testing with realistic HRMS bugs without requiring an active Azure subscription.

2. **Automated Excel Workbook (`output/Azure_Bug_Assistant.xlsx`)**
   - **Sheet 1 (`All Bugs`)**: Contains 19 complete fields (`Bug ID`, `Title`, `Description`, `Repro Steps`, `State`, `Severity`, `Priority`, `Assigned To`, `Reporter`, `Created Date`, `Changed Date`, `Closed Date`, `Area Path`, `Iteration Path`, `Tags`, `Page Name`, `AI Summary`, `Bug URL`, `Last Synced`).
     - **Duplicate Prevention**: Existing rows are updated in-place when re-fetched.
     - **Preservation**: Previously retrieved bugs are never lost when fetching new ones.
     - **Formatting**: Frozen header row (`A2`), auto-filter enabled, alternating zebra fills, and auto-fitted columns.
   - **Sheet 2 (`Page Summary`)**: Aggregates Total, Open, Active, Closed, Critical/High Severity, and High-Priority bugs grouped by HRMS module without double-counting.
   - **Sheet 3 (`Assignee Summary`)**: Workload distribution by team member.
   - **Sheet 4 (`Report`)**: Executive QA report with state and severity distributions.
   - **Dedicated Module Sheets**: Generate page-specific sheets (e.g., `Login Page Report`).

3. **Configurable HRMS Page Classification**
   - Built for enterprise HRMS suites covering 13 designated modules:
     - `Login Page`
     - `System Role Dashboard`
     - `Generate Employee ID`
     - `Organisation Master`
     - `Map Weekly Off`
     - `Weekly Off Planner`
     - `Employee Data Master (EDM)`
     - `Leave Module`
     - `Payroll Module`
     - `Attendance Module`
     - `Query Module`
     - `AI Chatbot`
     - `Geolocation`
   - Automated classification uses Area Path, Tags, and Title keywords.
   - **Persistent Manual Override**: Select any page from the table dropdown to reclassify; manual overrides are saved in SQLite and preserved across future refreshes.

4. **Dual-Mode AI & Privacy-Safe Summarization**
   - **Local Privacy-Safe Engine (Default)**: Runs 100% locally on your machine with zero external network requests.
   - **OpenAI GPT Mode (Optional)**: Can be activated with an OpenAI API key if authorized by your organization.
   - Generates structured QA breakdowns: Short summary, Actual issue, Expected behavior, Impact, and 5 suggested QA testing steps.
   - Built-in summary caching to prevent redundant requests.

5. **Natural Language Chatbot**
   - Natural language queries grounded strictly in retrieved data:
     - *"Fetch bug 101."*
     - *"Fetch bugs 101, 102, 103."*
     - *"Summarize bug 101."*
     - *"Show all open bugs."*
     - *"Show high-severity bugs."*
     - *"Generate a report for the Login Page."*
     - *"How many bugs are assigned to each person?"*

---

## 🔒 Security Best Practices

> [!IMPORTANT]
> **Data Confidentiality Notice**: Bug descriptions, reproduction steps, and employee names often contain proprietary company data.
> - Never commit `.env` or credentials to Git (enforced via `.gitignore`).
> - The application never exposes access tokens or API keys to the browser frontend.
> - Secrets are masked in UI and API status responses (e.g., `abc...xyz`).
> - Only authorize external cloud AI services if permitted by your organization's security policy.

### Where to Obtain Your Azure DevOps PAT
1. In Azure DevOps, go to **User Settings** (top right) $\rightarrow$ **Personal Access Tokens**.
2. Click **+ New Token**.
3. Under **Scopes**, select **Work Items (Read)** only. **Do NOT grant Full Access.**
4. Copy the generated token.

---

## 💻 Windows Setup & Installation

### Prerequisites
- **Node.js 18+** & **npm** (verified on Node v24)
- Zero Python runtime required!

### Folder Structure
```text
excel bot/
├── frontend/               # React 19 + TypeScript + Vite + Tailwind CSS v4
│   ├── src/                # UI components, types, services, hooks
│   ├── package.json        # Frontend scripts and dependencies
│   └── run_frontend.ps1    # Dedicated frontend launcher
├── backend/                # Node.js + Express + TypeScript + native SQLite
│   ├── src/                # Express routes, services, ExcelJS integrations
│   ├── dist/               # Compiled JavaScript bundle
│   ├── package.json        # Backend scripts and dependencies
│   └── run_backend.ps1     # Dedicated backend launcher
├── azure_bugs.db           # SQLite database preserving all 1,024 cached bugs
├── package.json            # Root workspace orchestrator
├── start_all.ps1           # One-click launcher for Windows PowerShell
├── start_demo.bat          # One-click launcher for Windows Command Prompt
└── setup_scheduler.ps1     # Windows Task Scheduler 15-min background sync
```

---

## 🚀 Running the Application

### Option A: One Command from Workspace Root (Easiest)
From the root directory:
```powershell
npm run dev
```
*This starts both the Express backend (`http://localhost:8000`) and the Vite frontend (`http://localhost:5173`) concurrently.*

### Option B: One-Click Desktop Launchers
- **PowerShell**: Double-click or run `.\start_all.ps1`
- **Batch**: Double-click or run `.\start_demo.bat`

### Option C: Run Folders Individually

**Terminal 1 — Backend (`backend/`):**
```powershell
cd backend
npm run dev
```
*Backend runs on `http://localhost:8000` (Health check: `http://localhost:8000/api/health`)*

**Terminal 2 — Frontend (`frontend/`):**
```powershell
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## ⚙️ Configuration & Credential Setup

You have two convenient ways to configure your Azure DevOps credentials:

### Method 1: Through the Web UI (Easiest)
1. Open the dashboard at `http://localhost:5173`.
2. Click the **Settings** button in the top-right navbar.
3. Enter:
   - **Organization Name**: e.g., `your-org` (from `https://dev.azure.com/your-org`)
   - **Project Name**: e.g., `HRMS-Enterprise`
   - **Personal Access Token (PAT)**: Your Azure token
   - **Sandbox / Mock Mode**: Toggle OFF to connect to real Azure DevOps, or keep ON for offline testing.
   - **AI Summarization**: Toggle ON/OFF and optionally provide an OpenAI API key.
4. Click **Save Settings**. Changes apply immediately without restarting.

### Method 2: Through the `.env` File
Copy `.env.example` to `.env` in the project root:
```ini
AZURE_DEVOPS_ORG=your-organization-name
AZURE_DEVOPS_PROJECT=your-project-name
AZURE_DEVOPS_PAT=your-azure-devops-pat-token
MOCK_MODE=false
AI_ENABLED=false
OPENAI_API_KEY=
```

---

## 🧪 Running Automated Tests

Run the backend pytest suite covering Azure batching, error codes, duplicate prevention, and Excel generation:
```powershell
python -m pytest backend/tests -v
```
*(All 29 tests pass with isolated test databases).*

Validate the frontend TypeScript build:
```powershell
cd frontend
npm run build
cd ..
```

---

## 📁 Project Structure

```
excel-bot/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, routes mounting, health check
│   │   ├── config.py            # Pydantic Settings and secret masking
│   │   ├── database.py          # SQLite schema, bug upsert, and override persistence
│   │   ├── models.py            # Pydantic models for bugs, reports, and AI summaries
│   │   ├── azure_client.py      # Azure REST API v7.1 client, batching <= 200, mock fallback
│   │   ├── classifier.py        # HRMS 13-module rule-based classifier
│   │   ├── excel_service.py     # openpyxl workbook generator (All Bugs, Summaries, Reports)
│   │   ├── ai_service.py        # Dual-mode AI & local privacy-safe QA summarizer
│   │   ├── report_service.py    # Metric aggregations without double-counting
│   │   ├── chat_service.py      # Grounded natural language query processor
│   │   └── routes/              # Modular API endpoints
│   ├── tests/                   # 29 Automated unit and integration tests
│   ├── requirements.txt         # Pinned Python dependencies
│   └── run_backend.ps1          # Backend launch script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Brand, environment badge, export buttons
│   │   │   ├── MetricsOverview.tsx  # 5 interactive KPI cards
│   │   │   ├── BugInputPanel.tsx    # Single/bulk ID input, quick sample chips
│   │   │   ├── BugTable.tsx         # Filterable table with inline module reclassification
│   │   │   ├── BugDetailsModal.tsx  # Complete work item details and AI summary tabs
│   │   │   ├── ChatPanel.tsx        # Grounded chatbot with prompt chips
│   │   │   ├── ReportModal.tsx      # Page-wise report generator and sheet exporter
│   │   │   └── SettingsModal.tsx    # Azure and AI credentials configuration
│   │   ├── services/api.ts          # Type-safe API client
│   │   ├── types/index.ts           # Shared TypeScript interfaces
│   │   ├── App.tsx                  # Main application orchestrator
│   │   └── index.css                # Dark slate design system and glassmorphism
│   ├── package.json
│   ├── vite.config.ts
│   └── run_frontend.ps1             # Frontend launch script
├── output/
│   └── Azure_Bug_Assistant.xlsx # Generated Excel workbook
├── start_all.ps1                # Master one-click startup script
├── .env.example                 # Environment configuration template
├── .gitignore                   # Ignore node_modules, .env, *.db, *.xlsx
└── README.md                    # Documentation
```

---

## 🛠️ Troubleshooting

- **PowerShell Execution Policy Error**:
  If PowerShell blocks running scripts (`cannot be loaded because running scripts is disabled`):
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```
  Or pass `-ExecutionPolicy Bypass` when executing:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\start_all.ps1
  ```
- **Port Conflict (8000 or 5173 already in use)**:
  Find and terminate the process holding the port:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess | Stop-Process -Force
  ```
- **Azure DevOps 401 Unauthorized**:
  Verify your Personal Access Token is active and has the `Work Items (Read)` scope. Re-enter it in the UI Settings modal.
- **Excel Workbook Locked**:
  If `Azure_Bug_Assistant.xlsx` is open in Microsoft Excel, close the file so openpyxl can write updates.
