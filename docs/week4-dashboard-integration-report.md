# API-Sentinel â€” Week 4 Backend Integration, Detection Findings & End-to-End Validation Report

**Project:** API-Sentinel â€” Runtime BOLA & Shadow API Detection Engine
**Module:** SOC Dashboard, Gateway Integration & Documentation
**Engineer:** Lokesh (Frontend & Integration Specialist)
**Date:** October 28, 2026
**Repository Branch:** `feature/week4-dashboard-integration`
**Base Commit:** `c910e33` (Merged Weeks 2â€“3 on `sentinel/main`)
**Gateway URL:** `http://127.0.0.1:8000` | **Frontend URL:** `http://127.0.0.1:3000`

---

## 1. Executive Summary & Integration Status

During Week 4, API-Sentinel transitioned from independent frontend and backend prototypes into a fully integrated, live runtime security monitoring operations center. The React + Vite SOC dashboard now actively interfaces with the Python FastAPI backend gateway, ingesting normalized telemetry, rendering live time-series volume analytics, triaging Broken Object Level Authorization (BOLA) review candidates, and surfacing uncataloged Shadow API route observations with strict data integrity guarantees.

### Key Milestones Achieved
1. **Full Gateway Connectivity:** All 8 backend API contracts are live, documented, and tested (`/health`, `/metrics/summary`, `/events`, `/endpoints`, `/detections/shadow-apis`, `/detections/bola`, `/telemetry`, `/parser/run`).
2. **Authoritative Metric Consistency:** The dashboard summary KPI cards dynamically derive their counts directly from authoritative backend calculations. Across 4 parsed events, 100% mathematical consistency is verified across KPI cards, tables, and distribution charts.
3. **Structured BOLA Candidate Triage:** Connected `/api/v1/detections/bola` with structured candidate records (`BOLA-CANDIDATE-001`), preserving authenticated caller identity versus object owner context with remediation advisories.
4. **Catalog-Driven Shadow API Detection:** Connected `/api/v1/detections/shadow-apis` cross-referencing `Documented_endpoints.json` to categorize routes into documented endpoints versus uncataloged observation candidates.
5. **Dynamic Time-Series Telemetry:** Implemented `GET /api/v1/telemetry` returning bucketed traffic volumes (total, documented, shadow candidates, flagged queries) rendered live via Recharts in `TrafficChart.jsx`.
6. **PII and Credential Sanitization:** Added recursive sanitization (`sanitizeHeaders`, `sanitizePayload`) redacting Authorization tokens, cookies, API keys, and sensitive payload fields before display.
7. **Zero Silent Fallback Assurance:** If the backend is unreachable or contains zero events, the dashboard surfaces informative connection diagnostics or empty-state notices; mock data is never silently substituted in Backend Mode.
8. **Automated Verification:** 38 passing Python tests (`pytest`), 63 passing Node.js QA tests (`scripts/test-suite.js`), and clean production bundle compilation with Vite in 6.39 seconds.

---

## 2. Live Backend Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                              API-Sentinel Architecture                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [Network Traffic Log / Samples]                                                  |
|         â”‚                                                                         |
|         â–¼                                                                         |
|  [parser/traffic_parser.py] â”€â”€(Subprocess Dispatch / POST /parser/run)            |
|         â”‚                                                                         |
|         â–¼                                                                         |
|  [logs/parsed_events.json] â”€â”€(Normalized Schema Storage)                          |
|         â”‚                                                                         |
|         â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”              |
|         â–¼                             â–¼                            â–¼              |
|  [FastAPI Gateway Engine]     [Event Summary Engine]     [Catalog Matcher]        |
|  (backend/main.py)            (parser/event_summary.py)  (Documented_endpoints)   |
|         â”‚                                                          â”‚              |
|         â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜              |
|         â–¼                                                                         |
|  [REST API Service Layer] (CORS Enabled: port 3000 / 5173)                        |
|  â”œâ”€â”€ GET /api/v1/health                                                           |
|  â”œâ”€â”€ GET /api/v1/metrics/summary                                                  |
|  â”œâ”€â”€ GET /api/v1/events?limit=50&offset=0                                         |
|  â”œâ”€â”€ GET /api/v1/endpoints                                                        |
|  â”œâ”€â”€ GET /api/v1/detections/shadow-apis                                           |
|  â”œâ”€â”€ GET /api/v1/detections/bola                                                  |
|  â”œâ”€â”€ GET /api/v1/telemetry                                                        |
|  â””â”€â”€ POST /api/v1/parser/run                                                      |
|         â”‚                                                                         |
|         â–¼ (HTTP JSON Stream with Timeout & AbortController)                       |
|  [React Frontend Service Client] (src/services/api.js)                            |
|         â”‚                                                                         |
|         â–¼ (PII Masking & Event Adaptation)                                        |
|  [Event Adapter & Sanitizer] (src/services/eventAdapter.js)                       |
|         â”‚                                                                         |
|         â–¼ (State Management & Auto-Refresh Polling)                               |
|  [SOC Dashboard Component Tree] (src/pages/Dashboard.jsx)                         |
|  â”œâ”€â”€ [KPI Stat Cards] â”€â”€ (Authoritative Summary Metrics)                          |
|  â”œâ”€â”€ [Traffic Analytics] â”€â”€ (Time-Series AreaChart Visualization)                 |
|  â”œâ”€â”€ [Endpoint Table] â”€â”€ (Catalog Diff & Route Inventory)                         |
|  â”œâ”€â”€ [Security Alerts Table] â”€â”€ (BOLA & Shadow Incident Triage)                   |
|  â””â”€â”€ [Event Inspection Modal] â”€â”€ (Sanitized Headers, Body, Identity Discrepancy)  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Endpoint Implementation & Contract Specification

| HTTP Method | Route | Description | Query / Body Params | Response Key Fields |
|:---|:---|:---|:---|:---|
| `GET` | `/api/v1/health` | Gateway status, mode, and parser availability | None | `status`, `version`, `mode`, `parser_available`, `event_count` |
| `GET` | `/api/v1/metrics/summary` | Authoritative summary metrics across parsed events | None | `total_requests`, `methods`, `status_categories`, `success_rate`, `potential_auth_review_count`, `uncataloged_endpoint_count` |
| `GET` | `/api/v1/events` | Paginated normalized security telemetry events | `limit` (int), `offset` (int) | `success`, `total`, `count`, `offset`, `limit`, `events` |
| `GET` | `/api/v1/endpoints` | Observed route inventory reconciled with catalog | None | `success`, `count`, `endpoints` (`id`, `method`, `endpoint`, `requestCount`, `docStatus`, `riskStatus`) |
| `GET` | `/api/v1/detections/shadow-apis` | Undocumented API routes and 404 scans | None | `success`, `count`, `candidates` (`id`, `catalog_status`, `classification`, `severity`, `remediation`) |
| `GET` | `/api/v1/detections/bola` | Object-level authorization discrepancy candidates | None | `success`, `count`, `candidates` (`id`, `authenticated_user_id`, `object_owner_id`, `detection_type`, `remediation`) |
| `GET` | `/api/v1/telemetry` | Time-bucketed volume and anomaly time series | None | `success`, `count`, `series` (`time`, `total`, `documented`, `shadow`, `flagged`, `get`, `post`) |
| `POST` | `/api/v1/parser/run` | Triggers Python parser on sample events | None (Concurrency locked) | `success`, `message`, `total_events_loaded`, `output_file` |

---

## 4. BOLA Detection Engine Integration

### Ethical Finding Classification
In accordance with ethical security principles, identity mismatches observed in runtime HTTP telemetry are categorized as **Potential Authorization Review Candidates**, not confirmed vulnerabilities:
- An identity discrepancy occurs when `authenticated_user_id != object_owner_id` (e.g. `user_2` mutating an object owned by `user_1` on `POST /api/users`).
- In complex enterprise architectures, authorized cross-user actions occur legitimately (e.g., administrator delegates, shared organizational tenancy, support agents).
- The dashboard highlights this candidate for triage and recommends policy verification before raising severity to verified exploit status.

### Data Model & Payload Sample
```json
{
  "id": "BOLA-CANDIDATE-001",
  "event_id": "EVT-BOLA-001",
  "timestamp": "2026-10-09T10:00:15",
  "method": "POST",
  "endpoint": "/api/users",
  "status_code": 201,
  "source_ip": "127.0.0.1",
  "authenticated_user_id": "user_2",
  "object_owner_id": "user_1",
  "detection_type": "Potential Authorization Review Candidate",
  "severity": "HIGH",
  "status": "Under Review",
  "note": "Mismatched user context (auth: user_2, owner: user_1). Subject to authorization-policy verification.",
  "remediation": "Enforce object-level access control checks (ACL/RBAC) in route handlers before data mutation or retrieval."
}
```

---

## 5. Shadow API Detection Engine Integration

### Catalog Reconciliation Mechanism
The gateway compares incoming runtime traffic against `Documented_endpoints.json`:
1. **Documented Routes:** Endpoints declared in the OpenAPI specification or routing catalog (supporting regex parameters such as `<int:user_id>`).
2. **Undocumented Active Routes:** Routes returning HTTP `2xx` or `3xx` absent from the catalog. Flagged with `severity: MEDIUM` and labeled `Undocumented Candidate`.
3. **Unknown Route Scans:** Routes returning HTTP `404` absent from the catalog. Flagged with `severity: LOW` and classified as `Unknown Route Scan / 404`.

### Data Model & Payload Sample
```json
{
  "id": "SHADOW-CANDIDATE-001",
  "event_id": "EVT-SHADOW-001",
  "timestamp": "2026-10-09T10:00:10",
  "method": "GET",
  "endpoint": "/api/unknown",
  "status_code": 404,
  "source_ip": "127.0.0.1",
  "detection_type": "Uncataloged Route Observation",
  "catalog_status": "Undocumented Candidate",
  "classification": "Unknown Route Scan / 404",
  "severity": "LOW",
  "status": "Under Review",
  "note": "HTTP 404 observed on uncataloged path /api/unknown. Requires OpenAPI schema verification.",
  "remediation": "Audit routing tables and compare against the official OpenAPI specification."
}
```

---

## 6. Metrics Consistency & Reconciliation Analysis

Authoritative summary statistics are calculated directly on the backend via `parser/event_summary.py` and served at `/api/v1/metrics/summary`. The dashboard binds its KPI cards directly to these authoritative metrics:

| Dashboard Card | Source Field in API | Expected Count | Table Cross-Check | Reconciliation Status |
|:---|:---|:---:|:---|:---:|
| **Total API Requests** | `summary.total_requests` | 4 | Sum of methods (`3 GET + 1 POST = 4`) | Verified Match (100%) |
| **Discovered Endpoints** | `summary.endpoints` (keys) / `endpoints.length` | 3 | `/api/users`, `/api/users/101`, `/api/unknown` | Verified Match (100%) |
| **Shadow API Candidates** | `shadowDetections.length` | 1 | 1 candidate in `/detections/shadow-apis` (`/api/unknown`) | Verified Match (100%) |
| **BOLA Review Candidates** | `bolaDetections.length` | 1 | 1 candidate in `/detections/bola` (`user_2` vs `user_1`) | Verified Match (100%) |
| **Success Rate** | `summary.success_rate` | 75.0% | 3 successful (`200`, `200`, `201`) / 4 total requests | Verified Match (100%) |
| **Error Count** | `summary.error_count` | 1 | 1 error (`404` on `/api/unknown`) | Verified Match (100%) |

---

## 7. Time-Series Telemetry & Visualization

### Telemetry Pipeline
The backend generates aggregated time buckets via `/api/v1/telemetry`:
```json
{
  "success": true,
  "count": 4,
  "series": [
    { "time": "10:00:00", "total": 1, "documented": 1, "shadow": 0, "flagged": 0, "get": 1, "post": 0 },
    { "time": "10:00:05", "total": 1, "documented": 1, "shadow": 0, "flagged": 0, "get": 1, "post": 0 },
    { "time": "10:00:10", "total": 1, "documented": 0, "shadow": 1, "flagged": 1, "get": 1, "post": 0 },
    { "time": "10:00:15", "total": 1, "documented": 1, "shadow": 0, "flagged": 1, "get": 0, "post": 1 }
  ]
}
```
In `TrafficChart.jsx`, the AreaChart dynamically binds to this series, plotting documented volume, candidate shadow pathways, and flagged security events over time with dark-mode hover tooltips.

---

## 8. Frontend User Experience, Request States & Lifecycle

1. **Connecting State:** Displays connecting status badge with attempt timestamp.
2. **Connected Live State:** Displays green "FastAPI Online" badge, live record count, "Refresh" button, and "Re-run Parser" button.
3. **Auto-Refresh Polling:** Runs a 15-second background interval when backend mode is active and connected, updating the "Last refreshed at HH:mm:ss" indicator.
4. **Offline / Error State:** Shows a high-visibility diagnostic banner detailing the unreachable URL (`http://localhost:8000`), connection failure reason, a manual retry action, and a quick switch button back to Demo Mode.
5. **Empty State:** If the backend has 0 events, an empty state card invites the user to run the parser or ingest traffic rather than displaying blank tables or substituting mock data.
6. **Strict Mode Isolation:** Demo Mode uses static mock datasets with an explicit disclaimer banner; Backend Mode strictly reflects the live FastAPI gateway.

---

## 9. Data Sanitization, Security & PII Protection

To protect sensitive operational data in the SOC interface, `src/services/eventAdapter.js` provides automatic sanitization prior to rendering:
- **Header Masking:** All headers containing `auth`, `token`, `cookie`, `secret`, `password`, `key`, `credential`, or `jwt` (case-insensitive) are masked to `[REDACTED_SENSITIVE_CREDENTIAL]`.
- **Payload Sanitization:** JSON bodies containing sensitive keys (`password`, `secret`, `token`, `credit_card`, `ssn`, `api_key`) are recursively replaced with `[REDACTED_PII]`.
- **Inspected Header Verification:** Safe headers (`Host`, `User-Agent`, `Accept`) remain readable for network diagnostics.

---

## 10. Automated Testing & Quality Assurance

### Python Test Suite (`backend/test_backend.py`)
- **Framework:** `unittest` + `starlette.testclient.TestClient` + `pytest`
- **Total Tests:** 38 tests
- **Passing:** 38 (100%)
- **Failing:** 0
- **Duration:** 0.58s
- **Coverage Areas:**
  - `GET /api/v1/health`: Gateway availability and parser verification
  - `GET /api/v1/metrics/summary`: Mathematical summary accuracy and category isolation
  - `GET /api/v1/events`: Pagination (`limit`, `offset`) and event array schema
  - `GET /api/v1/endpoints`: Reconciled inventory derived from traffic
  - `GET /api/v1/detections/shadow-apis`: Uncataloged route classification
  - `GET /api/v1/detections/bola`: Identity mismatch triage and remediation fields
  - `GET /api/v1/telemetry`: Bucketed time series output verification
  - `POST /api/v1/parser/run`: Subprocess execution and concurrency lock
  - `OPTIONS /api/v1/health`: CORS preflight header validation

### Node.js Frontend Test Suite (`scripts/test-suite.js`)
- **Total Tests:** 63 tests
- **Passing:** 63 (100%)
- **Failing:** 0
- **Duration:** 0.08s
- **Test Groups:**
  - Group 1: Mock Data Integrity & Cross-Component Consistency (6 tests)
  - Group 2: Endpoint Inventory Filtering Logic (9 tests)
  - Group 3: Security Alerts Filtering Logic (6 tests)
  - Group 4: Traffic Telemetry Data Structure (1 test)
  - Group 5: Week 2 Event Schema & Inspection Integrity (5 tests)
  - Group 6: Python Parser Event Adapter (10 tests)
  - Group 7: Backend API Service Contracts (2 tests)
  - Group 8: Week 3 Python Parser & Backend Integration (10 tests)
  - Group 9: Week 4 Live Findings, Telemetry Rollup & Security Hardening (14 tests)

---

## 11. Build Verification & Bundle Diagnostics

- **Build Tool:** Vite v6.4.4
- **Modules Transformed:** 2,549 modules
- **Build Duration:** 6.39 seconds
- **Output Files:**
  - `dist/index.html`: 0.92 kB (gzip: 0.49 kB)
  - `dist/assets/index-Cpb0W6Na.css`: 18.57 kB (gzip: 3.99 kB)
  - `dist/assets/index-D4o0ayM7.js`: 617.50 kB (gzip: 176.95 kB)
- **Bundle Diagnostics:** Single chunk warning on Recharts + Lucide-react bundle (> 500 kB). Build passes cleanly with exit code 0. Manual code-splitting is scheduled for the Week 5 roadmap.

---

## 12. End-to-End Validation & Verification Matrix

| Verification Check | Target Component | Method | Result | Evidence |
|:---|:---|:---|:---:|:---|
| Backend Gateway Health | Port 8000 | HTTP GET `/api/v1/health` | PASS | `{"status":"ok","mode":"live_backend","event_count":4}` |
| Parser Subprocess Trigger | Gateway + Parser | HTTP POST `/api/v1/parser/run` | PASS | Subprocess completes cleanly in < 1s; 4 events loaded |
| Telemetry Ingestion | Frontend + Gateway | HTTP GET `/api/v1/telemetry` | PASS | 4 time buckets rendered in Recharts |
| BOLA Alert Presentation | Alert Table + Modal | HTTP GET `/api/v1/detections/bola` | PASS | Discrepancy between user_2 and user_1 triaged as candidate |
| Shadow API Presentation | Endpoint Table | HTTP GET `/api/v1/detections/shadow-apis` | PASS | `/api/unknown` flagged as Undocumented Candidate |
| Mode Toggle Isolation | Header Toggle | UI Toggle DEMO <-> BACKEND | PASS | Clean mode separation; no mock bleed |
| Header & PII Redaction | EventDetailModal | Adapter Sanitizer | PASS | Bearer tokens and passwords masked to `[REDACTED_...]` |
| Auto-Refresh Cycle | Dashboard Polling | 15s Timer Hook | PASS | Automatic refresh runs without memory leak |

---

## 13. Cross-Platform Runtime Analysis (Windows vs. Linux eBPF)

### Kernel Telemetry Differences
- **Linux Runtime:** The full API-Sentinel engine utilizes eBPF probes (`scripts/tcp_monitor.bt` and `monitoring/ebpf_tcp_accept.py`) hooking the `sys_enter_accept4` and `tcp_v4_connect` tracepoints to capture raw kernel socket telemetry with nanosecond latency.
- **Windows Local Workspace:** The Windows NT kernel does not support native Linux BPF bytecode compilation without WSL2 or eBPF for Windows preview drivers.
- **Honest Telemetry Simulation:** To preserve engineering integrity, the local Windows development environment ingests parsed HTTP application telemetry from `parser/sample_events.json` and `logs/parsed_events.json`. We strictly avoid fabricating fake eBPF socket events or misrepresenting synthetic data as kernel captures.

---

## 14. Git Repository & Branch Hygiene

- **Current Branch:** `feature/week4-dashboard-integration`
- **Base Upstream Branch:** `sentinel/main` (commit `c910e33`)
- **Working Tree:** Pristine and clean; no uncommitted drift, no merge conflict markers, no trailing whitespace violations (`git diff --check` passes).
- **Safety Compliance:** No forced pushes (`--force`), no destructive resets (`git reset --hard`), and all existing commits and comments preserved.

---

## 15. Architectural Risks, Limitations & Caveats

1. **Subprocess Concurrency:** Parser runs are protected by `asyncio.Lock()`, returning HTTP 429 if overlapping execution is attempted.
2. **File Size Scaling:** `logs/parsed_events.json` is currently read in memory. For high-volume production traffic (> 100,000 events/sec), migration to SQLite or ClickHouse is recommended.
3. **Frontend Bundle Size:** The vendor bundle is 617 kB due to Recharts SVG plotting primitives; dynamic chunking will optimize load times on mobile SOC clients.

---

## 16. Teammate Handoff & Collaborative Interfaces

- **For Saidani (Traffic Parser & Ingestion Lead):**
  - The gateway expects parser outputs written to `logs/parsed_events.json`.
  - The normalized schema with `authenticated_user_id` and `object_owner_id` is seamlessly consumed by both the metrics engine and the dashboard.
- **For Backend & DevOps Integrators:**
  - Launch command: `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000`
  - CORS origins are pre-configured for `http://localhost:3000` and `http://127.0.0.1:3000`.

---

## 17. Production Readiness & Deployment Checklist

- [x] CORS configuration restricted to authorized origins
- [x] Request timeouts enforced via `AbortController` (6,000 ms)
- [x] Concurrency locking on administrative subprocess executions
- [x] Input validation on all incoming telemetry events
- [x] PII and credential masking on inspected headers and bodies
- [x] Responsive layout across tablet and desktop SOC viewports
- [x] Automated test suites integrated into CI pipeline (`python-app.yml`)
- [x] Build passes without compilation errors

---

## 18. Week 5 Roadmap & Future Enhancements

1. **Vite Dynamic Code-Splitting:** Extract Recharts and Lucide into lazy-loaded vendor chunks via `build.rollupOptions.output.manualChunks`.
2. **WebSocket Telemetry Stream:** Replace 15-second polling with WebSocket `/api/v1/ws/telemetry` for live sub-second event streaming.
3. **Automated OpenAPI Spec Import:** Add a UI upload modal allowing SOC analysts to upload OpenAPI v3 (`openapi.yaml` / `.json`) specs to re-catalog endpoints at runtime.
4. **BOLA Remediation Playbooks:** Export verified incident triage reports directly to Jira / ServiceNow ticketing formats.
