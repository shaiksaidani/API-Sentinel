# API-Sentinel: Runtime BOLA & Shadow API Detection Engine
## Week 2 Deliverable — Dashboard, Event Inspector, Parser Adapter & API Client

---

### 1. Project Introduction
**API-Sentinel** is an API cybersecurity monitoring engine designed to protect modern cloud backends from unauthorized resource access and visibility blind spots. The core engine focuses on two critical OWASP API Security Top 10 categories:
- **Shadow API Discovery:** Identifying active endpoints exposed in network traffic that are absent from formal OpenAPI/Swagger specifications.
- **Runtime BOLA Detection:** Flagging Broken Object Level Authorization attempts where authenticated users manipulate path or query IDs to access data belonging to other tenants or users.

---

### 2. My Role in the Project
- **Assigned Module:** Frontend Dashboard & Documentation
- **Week 1 Scope:** Build an intuitive, responsive, SOC-themed static prototype that visualizes simulated API telemetry, endpoint inventories, and security events without relying on live backend services.
- **Week 2 Scope:** Enrich security events with HTTP Method, Source IP, and Status Code; develop deep SOC event inspection modal with masked payloads; build provisional parser event adapter (`eventAdapter.js`); implement centralized API client (`api.js`) for upcoming FastAPI backend; support toggling between Demo Mode and Backend API mode with explicit error handling.

---

### 3. Week 1 Objectives
- [x] Scaffold a fast, lightweight React application with Vite.
- [x] Design a dark navy-blue cybersecurity Security Operations Center (SOC) visual aesthetic.
- [x] Implement four key summary metric cards (`Total API Requests`, `Discovered Endpoints`, `Shadow API Candidates`, `BOLA Alert Candidates`).
- [x] Develop an interactive API Endpoint Inventory table with method badges, documentation status, and risk flags.
- [x] Develop a Security Events table with severity indicators (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) and heuristic notes.
- [x] Integrate interactive search and multi-criteria status filtering.
- [x] Render time-series API traffic volume and HTTP method distribution charts using Recharts.
- [x] Clearly distinguish simulated demo data with prominent `DEMO MODE` indicators and transparent disclaimers.

---

### 4. Technologies Used
- **Frontend Framework:** React 18
- **Build Tooling:** Vite 6
- **Styling:** Custom CSS3 with SOC Dark Navy Theme (`#0B1120`, `#111827`, `#172033`)
- **Iconography:** Lucide React (`lucide-react`)
- **Data Visualization:** Recharts (`recharts`)
- **Mock Data Layer:** Modular JavaScript ES Modules (`src/data/mockData.js`)

---

### 5. Folder Structure

```text
Axlero Project-1/
├── docs/
│   ├── week1-qa-report.md         # Week 1 QA validation report
│   └── week2-dashboard-report.md  # Week 2 architecture & QA report
├── public/
├── scripts/
│   └── test-suite.js              # Automated regression suite (39 assertions)
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx            # Brand identity, navigation tabs, status indicators
│   │   ├── Header.jsx             # Global search, data mode switcher (Demo / Backend API)
│   │   ├── StatCard.jsx           # Reusable metric card with badge and status indicators
│   │   ├── EndpointTable.jsx      # Discovered endpoint inventory with search and filters
│   │   ├── AlertTable.jsx         # Security alerts with method, IP, status, and Inspect action
│   │   ├── EventDetailModal.jsx   # Deep SOC event inspector with masked payload viewer
│   │   ├── TrafficChart.jsx       # Recharts time-series volume & HTTP verb distribution
│   │   └── DocumentationView.jsx  # In-app architectural documentation viewer
│   ├── data/
│   │   └── mockData.js            # Enriched simulated datasets & telemetry metrics
│   ├── services/
│   │   ├── api.js                 # Centralized API service layer with backend contracts
│   │   └── eventAdapter.js        # Parser event adapter with validation & sanitization
│   ├── pages/
│   │   └── Dashboard.jsx          # Main layout orchestrator, modal & backend error states
│   ├── App.jsx                    # Root component with state management
│   ├── index.css                  # Cybersecurity theme variables and responsive styles
│   └── main.jsx                   # React DOM root entry point
├── index.html                     # HTML5 template with modern fonts
├── package.json                   # Project metadata and dependencies
├── vite.config.js                 # Vite development and build configuration
└── README.md                      # Project and technical documentation
```

---

### 6. Installation Instructions

1. **Prerequisites:**
   Ensure [Node.js](https://nodejs.org/) (version 18 or higher) and `npm` are installed on your machine.
   Verify by running:
   ```bash
   node -v
   npm -v
   ```

2. **Clone / Open Workspace:**
   Open a terminal in the project directory:
   ```bash
   cd "Axlero Project-1"
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```
   *(Note for Windows PowerShell users: if running scripts is restricted by policy, invoke `npm.cmd install`)*

---

### 7. Commands to Start the Application

- **Start Local Development Server:**
  ```bash
  npm run dev
  ```
  *(or `npm.cmd run dev`)*
  The Vite dev server will start at `http://localhost:3000` (or `http://localhost:5173`).

- **Run Automated QA & Validation Test Suite:**
  ```bash
  node scripts/test-suite.js
  ```
  Runs 39 automated integrity assertions across mock metrics, filters, parser adapter normalization, API service contracts, security masking, and build artifacts.

- **Create a Production Build:**
  ```bash
  npm run build
  ```

- **Preview the Production Build:**
  ```bash
  npm run preview
  ```

---

### 8. Dashboard Features

| Feature | Description |
| :--- | :--- |
| **SOC Dark Navy Theme** | Tailored with `#0B1120` main background, `#172033` card containers, and `#3B82F6` primary blue accents. |
| **Interactive Navigation** | Switch views across *Overview*, *API Endpoints*, *Security Alerts*, *Traffic Analytics*, and *Documentation*. |
| **Four Core Metrics** | Highlights 1,284 Total Requests, 18 Discovered Endpoints, 3 Shadow Candidates, and 5 BOLA Flags. |
| **Search & Multi-Filtering** | Instant filtering across endpoints (by method, doc status, risk) and alerts (by severity, event type, method, IP, status code). |
| **Deep SOC Event Inspector** | Modal inspection view showing detection heuristics, remediation advice, sanitized headers, and payload view. |
| **Payload Security Masking** | Request payloads are masked by default (`••••••••••••`) to protect sensitive PII with a toggle to reveal. |
| **Data Mode Switcher** | Instant toggle between `DEMO MODE` (mock data) and `BACKEND API` (FastAPI). Never silently falls back. |
| **Transparent Error Banner** | If backend is offline in Backend mode, displays an informative connection-refused banner with retry controls. |
| **Provisional Parser Adapter** | `src/services/eventAdapter.js` normalizes telemetry logs from Saidani's Python eBPF parser. |
| **Centralized API Client** | `src/services/api.js` with timeout handling and typed contracts for FastAPI integration. |

---

### 9. Current Limitations & Boundary

- **Live Backend Offline:** When toggled to `BACKEND API`, the UI requires the Python FastAPI service to be running on `http://localhost:8000`.
- **Parser Decoupling:** Saidani's Python parser telemetry file (`logs/parsed_events.json`) is developed in a separate repository; the frontend utilizes `src/services/eventAdapter.js` for validation and schema translation.
- **In-Memory Demonstration:** In `DEMO MODE`, data is served via validated ES module datasets (`mockData.js`).

---

### 10. Completed & Upcoming Milestones

#### Week 1 (Completed):
- [x] React 18 + Vite SOC dashboard scaffolding
- [x] Core metric cards, endpoint inventory, and security alert tables
- [x] Recharts volume and HTTP method distribution charts
- [x] Initial QA report and automated test runner

#### Week 2 (Completed):
- [x] Enriched security alerts with Method, Source IP, and Status Code
- [x] Deep SOC event detail modal inspector with heuristic analysis and mitigation guidance
- [x] Request payload security masking by default with analyst reveal toggle
- [x] Centralized API service layer (`src/services/api.js`) targeting FastAPI backend
- [x] Provisional parser event adapter (`src/services/eventAdapter.js`) for Saidani's telemetry
- [x] Data mode switcher (`DEMO MODE` vs `BACKEND API`) with honest connection-refused diagnostics
- [x] Expanded automated test suite (39 assertions, 100% pass rate)
- [x] Week 2 QA and technical architecture report (`docs/week2-dashboard-report.md`)

#### Week 3 (Backend Integration):
- Connect `src/services/api.js` to live FastAPI endpoints:
  - `GET /api/v1/metrics/summary`
  - `GET /api/v1/endpoints`
  - `GET /api/v1/events`
  - `GET /api/v1/detections/shadow-apis`
  - `GET /api/v1/detections/bola`
- Ingest real-time telemetry from Saidani's eBPF kernel network monitoring agent.
