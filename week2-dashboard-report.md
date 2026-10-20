# API-Sentinel — Week 2 Technical & Quality Assurance Report

**Project:** API-Sentinel (Runtime BOLA & Shadow API Detection Engine)  
**Deliverable:** Week 2 — Dashboard Enrichment, Parser Event Adapter, Backend Service Layer & Detail Inspector  
**Assigned Module:** Frontend Dashboard & Documentation  
**Date of Assessment:** October 18, 2026  
**Environment:** Local Windows Dev Environment (Node.js v24.19.0, Vite v6.4.4, React v18.3.1)  
**Target Dev Server:** `http://127.0.0.1:3000` / `http://localhost:3000`  
**Git Base Commit:** `6dc7998` (branch: `main`)

---

## 1. Executive Summary

During Week 2, the **API-Sentinel** frontend dashboard was advanced from a static exploratory prototype (Week 1) into an extensible, security-grade SOC console equipped with:
1. **Centralized Backend Service Layer (`src/services/api.js`)**: An asynchronous client pre-configured with timeout controls, typed REST endpoints, error boundaries, and environment-configurable base URL (`VITE_API_BASE_URL`, defaulting to `http://localhost:8000`).
2. **Provisional Parser Event Adapter (`src/services/eventAdapter.js`)**: An adapter designed to consume, validate, and normalize raw telemetry logs emitted by Saidani's Python parser (`logs/parsed_events.json`).
3. **Enriched Security Event Inventory (`src/components/AlertTable.jsx`)**: The alerts view was expanded with HTTP Method, Source IP, and HTTP Status Code columns, along with multi-attribute search across all fields.
4. **Deep Event Inspector Modal (`src/components/EventDetailModal.jsx`)**: An interactive SOC inspector providing detection heuristics, mitigation recommendations, sanitized headers (redacted JWT/bearer credentials), and a masked-by-default payload viewer.
5. **Data Source Mode Switcher & Honest Error Handling (`src/components/Header.jsx` & `src/pages/Dashboard.jsx`)**: Users can toggle between `DEMO MODE` (using local mock data) and `BACKEND API` mode. If the backend is unavailable, the application **never** silently substitutes mock data; it displays an explicit connection-refused diagnostic banner with retry controls.
6. **Comprehensive Automated Test Suite (`scripts/test-suite.js`)**: Expanded from 22 to **39 assertions** across 7 test groups, validating metrics, adapter edge-cases, data masking, and build integrity.

---

## 2. Workspace & Parser Schema Inspection

### 2.1 Inspection Findings for `logs/parsed_events.json`
- An automated and manual file search across the entire workspace confirmed that `logs/parsed_events.json` is **not present** in this frontend repository.
- **Root Cause & Team Boundary**: As noted in project coordination, Saidani's Python eBPF parser is developed in a separate module/repository.
- **Architectural Solution**: Rather than blocking frontend development or faking parser files, a robust provisional adapter layer was implemented at `src/services/eventAdapter.js`. This adapter defines the agreed-upon interface contract, validates incoming records, handles schema drift, and seamlessly translates raw parser events into dashboard-compatible models.

### 2.2 Parser Adapter Schema Specification
The provisional adapter handles the following normalized mapping:

| Parser Field (`rawEvent`) | Frontend Target | Normalization / Fallback |
| :--- | :--- | :--- |
| `event_id` / `id` | `id` | Generates `EVT-AUTO-<timestamp>` if omitted |
| `timestamp` / `time` | `timestamp` | Converts ISO-8601 strings, UNIX epoch seconds/ms to relative times (e.g., "5m ago") |
| `http_method` / `method` | `method` | Upper-cases string; validates against `GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD` |
| `url_path` / `endpoint` / `path` | `endpoint` | Prepends `/` if missing; defaults to `"/unknown"` |
| `client_ip` / `source_ip` / `ip` | `sourceIp` | Defaults to `"0.0.0.0"` |
| `response_status` / `status_code` | `statusCode` | Casts to integer; defaults to `200` |
| `detection_label` / `event_type` | `eventType` | Maps `"BOLA"` -> `"BOLA Suspicion"`, `"SHADOW_API"` -> `"Shadow API Candidate"` |
| `risk_level` / `severity` | `severity` | Maps to `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` (case-insensitive) |
| `details` / `description` | `simulationNote` | Populates heuristic detection description |
| `extracted_headers` / `headers` | `requestHeaders` | Automatically redacts `Authorization`, `Cookie`, `X-Api-Key` tokens |
| `request_body` / `payload` | `requestBody` | Safely formatted or stringified |
| `mitigation` / `remediation` | `mitigation` | SOC remediation checklist |

### 2.3 Adapter Robustness & Edge-Case Handling
`src/services/eventAdapter.js` provides:
- **`validateParserEvent(raw)`**: Validates that required payload keys exist. Returns `{ valid: false, errors: [...] }` if the record is null or missing an endpoint path.
- **`adaptParserEvents(rawList)`**: Safely processes arrays of raw parser events, skipping invalid/malformed entries without throwing runtime exceptions or crashing the UI.
- **Graceful Null-Safety**: Sanitizes headers and masks authorization credentials (`Bearer [REDACTED_JWT_TOKEN]`).

---

## 3. Centralized API Service Layer

Implemented at `src/services/api.js`, the API client manages all communication with the forthcoming FastAPI backend.

### 3.1 Service Features
- **Configurable Base URL**: Reads `import.meta.env.VITE_API_BASE_URL` with a reliable fallback to `http://localhost:8000`.
- **Request Timeout**: Imposes a 6,000ms timeout using `AbortController` to prevent indefinite UI hangs on slow networks.
- **Standardized Error Handling**: Throws structured errors (`ApiError`) containing HTTP status codes and endpoint context.
- **Contract Methods**:
  - `checkBackendHealth()`: Queries `/api/v1/health`
  - `fetchSummaryStats()`: Queries `/api/v1/metrics/summary`
  - `fetchEndpoints()`: Queries `/api/v1/endpoints`
  - `fetchSecurityAlerts()`: Queries `/api/v1/events`
  - `fetchTrafficAnalytics()`: Queries `/api/v1/telemetry`
  - `fetchShadowApiDetections()`: Queries `/api/v1/detections/shadow-apis`
  - `fetchBolaDetections()`: Queries `/api/v1/detections/bola`

### 3.2 Proposed Backend REST API Contract (Week 3 Target)

| Method | Proposed Endpoint | Purpose & Expected Payload |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status (`{ status: "ok", version: "1.0.0" }`) |
| `GET` | `/api/v1/metrics/summary` | Aggregated dashboard KPI counters (`totalRequests`, `endpoints`, `shadowCount`, `bolaCount`) |
| `GET` | `/api/v1/endpoints` | List of cataloged & discovered endpoints with documentation and risk tags |
| `GET` | `/api/v1/events` | Stream of security detection events (BOLA flags, Shadow candidates, anomalous verbs) |
| `GET` | `/api/v1/detections/shadow-apis` | Dedicated query for undocumented routes observed in live network traffic |
| `GET` | `/api/v1/detections/bola` | Dedicated query for object identifier tampering events |
| `GET` | `/api/v1/telemetry` | Time-series traffic history and HTTP verb breakdown |

### 3.3 Honest Error Presentation (No Fake Fallbacks)
When the user toggles the data source to **Backend API**:
1. The dashboard immediately verifies backend connectivity via `apiService.checkBackendHealth()`.
2. If `http://localhost:8000` is offline or refuses the connection, the application displays a prominent **Diagnostic Connection Banner**:
   - Explicitly states: *"Backend API Connection Refused: Unable to connect to FastAPI backend at http://localhost:8000"*.
   - Explains that the backend service has not yet been started.
   - Provides a direct **"Retry Connection"** button and a **"Switch to Demo Mode"** button.
   - **Crucially, does not silently fall back to mock data while claiming live status**, upholding SOC transparency.

---

## 4. Enhanced Event Table & Deep Modal Inspector

### 4.1 Alerts Table Column Enrichment (`src/components/AlertTable.jsx`)
The alerts table was augmented with three security-critical columns:
1. **HTTP Method**: Styled with distinctive badges (`GET` blue, `POST` emerald, `PUT` amber, `DELETE` rose).
2. **Source IP**: Displays client origin (e.g., `192.168.1.105`, `10.0.4.15`) in monospace typography.
3. **Status Code**: Formatted with HTTP status category styling (`200 OK`, `401 Unauthorized`, `403 Forbidden`).
4. **Inspect Action Button**: Added to each row, providing instant one-click access to the event modal.
5. **Search Expansion**: Global and local search now match across Method, Source IP, and Status Code in addition to Event ID, Endpoint, Severity, and Notes.

### 4.2 Deep Event Inspector Modal (`src/components/EventDetailModal.jsx`)
Selecting **"Inspect"** on any alert launches a focused SOC investigation modal containing:
- **Header**: Event ID, Severity badge, and Event Type badge.
- **Primary Request Metadata**: Method, Status Code, Source IP, Relative Timestamp, and Target Endpoint URI.
- **Detection Heuristics & Analysis**: Detailed security explanation of why the event triggered (e.g., ID manipulation across tenant boundaries, uncataloged route parameters).
- **Recommended Mitigation**: Concrete SOC remediation steps (e.g., implement row-level ownership checks, update API catalog, rate-limit client IP).
- **Sanitized Request Headers**: Key-value display with sensitive tokens safely masked (`Bearer [REDACTED_JWT_TOKEN]`).
- **Guarded Request Payload Viewer**:
  - Request body payloads are **masked by default** (`•••••••••••• (Payload masked for security)`) to prevent accidental visual exposure of PII or sensitive parameters.
  - An interactive **"Reveal Payload" / "Mask Payload"** toggle button allows analysts to inspect the formatted JSON payload when authorized.
- **Accessibility & UX**: Includes keyboard navigation (`Escape` key closes modal), backdrop click-to-dismiss, and sticky header controls.

---

## 5. Comprehensive Test Matrix & Results

An expanded automated regression suite (`scripts/test-suite.js`) was executed to verify all Week 1 and Week 2 capabilities.

```text
============================================================
  API-Sentinel Automated Test Suite (Week 2 QA Validation)
============================================================

[GROUP 1] Data Integrity & Math Assertions
  ✔ Total API Requests math integrity (1284 === sum of methods)
  ✔ Discovered Endpoints count (18 routes in dataset)
  ✔ Shadow API Candidates count (3 undocumented routes)
  ✔ BOLA Alert Candidates count (5 BOLA events)
  ✔ Method distribution percentages total 100%
  ✔ Total simulated alerts in dataset equals 9

[GROUP 2] Week 2 Mock Data Enrichment Assertions
  ✔ All events have valid HTTP methods
  ✔ All events have valid IPv4 source IPs
  ✔ All events have valid HTTP status codes
  ✔ All events have requestHeaders object
  ✔ All events have requestBody defined
  ✔ All events have mitigation guidance defined

[GROUP 3] Filtering & Search Assertions
  ✔ GET method filter returns exactly 9 routes
  ✔ POST method filter returns exactly 7 routes
  ✔ Documented filter returns 15 routes
  ✔ Undocumented filter returns 3 routes
  ✔ Normal risk filter returns 12 routes
  ✔ Review Required risk filter returns 6 routes
  ✔ Multi-filter (POST + /api/users) returns 1 route
  ✔ Alerts severity filter: CRITICAL returns 1 event
  ✔ Alerts severity filter: HIGH returns 4 events
  ✔ Alerts severity filter: MEDIUM returns 3 events
  ✔ Alerts severity filter: LOW returns 1 event
  ✔ Alerts search by Source IP matches target event
  ✔ Alerts search by Status Code matches target events

[GROUP 4] Parser Event Adapter (eventAdapter.js)
  ✔ adaptParserEvent correctly maps raw parser schema to frontend model
  ✔ adaptParserEvents handles batch of raw parser events
  ✔ Adapter rejects null or invalid events gracefully
  ✔ Adapter normalizes uppercase HTTP methods
  ✔ Adapter normalizes invalid status codes to 200
  ✔ Adapter correctly converts ISO timestamp to relative time string
  ✔ Adapter sanitizes authorization headers in raw events

[GROUP 5] Backend API Service Layer (api.js)
  ✔ apiService exports all 7 required contract methods
  ✔ apiService default base URL is http://localhost:8000
  ✔ PROPOSED_BACKEND_CONTRACTS documents all 6 primary routes

[GROUP 6] Security & Data Masking Assertions
  ✔ Event Detail Modal payload masking helper correctly protects sensitive JSON
  ✔ Authorization token redactor successfully masks bearer tokens

[GROUP 7] Production Build & Syntax Validation
  ✔ Production build artifacts exist in dist/
  ✔ index.html exists in dist/

============================================================
TEST SUMMARY:
  Total Assertions: 39
  Passed:           39
  Failed:           0
  Success Rate:     100.0%
============================================================
```

### Production Build Validation
- **Command**: `npm.cmd run build`
- **Output**: Clean compilation of 2,546 modules into optimized production bundles in `dist/` (5.74 seconds, 0 errors, 0 warnings).

---

## 6. Files Created & Modified in Week 2

| File Path | Type | Role & Description |
| :--- | :---: | :--- |
| `src/services/api.js` | **NEW** | Centralized API client with timeout handling, typed contracts, and `PROPOSED_BACKEND_CONTRACTS`. |
| `src/services/eventAdapter.js` | **NEW** | Adapter for Saidani's Python parser telemetry; validates, normalizes, and redacts raw events. |
| `src/components/EventDetailModal.jsx` | **NEW** | SOC deep event inspection modal with masked payload viewer, header sanitizer, and mitigation advice. |
| `docs/week2-dashboard-report.md` | **NEW** | Complete Week 2 technical, QA, and architecture report. |
| `src/data/mockData.js` | **MODIFIED** | Enriched 9 security alerts with `method`, `sourceIp`, `statusCode`, `requestHeaders`, `requestBody`, and `mitigation`. |
| `src/components/AlertTable.jsx` | **MODIFIED** | Added Method, Source IP, and Status Code columns, multi-field search, and "Inspect" button linking to modal. |
| `src/components/Header.jsx` | **MODIFIED** | Added `DEMO MODE` vs `BACKEND API` switcher toggle with active status badges. |
| `src/pages/Dashboard.jsx` | **MODIFIED** | Integrated modal state management, data source switching, and backend error diagnostic banner. |
| `src/components/DocumentationView.jsx` | **MODIFIED** | Added Week 2 architecture documentation, parser schema specifications, and backend contract tables. |
| `src/components/Sidebar.jsx` | **MODIFIED** | Updated version footer to "Week 2 Frontend Prototype". |
| `src/index.css` | **MODIFIED** | Added styling for modal overlay, inspector grid, data-source toggle, and diagnostic banners. |
| `scripts/test-suite.js` | **MODIFIED** | Expanded regression suite from 22 to 39 automated assertions. |
| `README.md` | **MODIFIED** | Updated documentation with Week 2 capabilities, adapter details, and test instructions. |

---

## 7. Remaining Dependencies for Week 3 Integration

To complete end-to-end integration during Week 3, the following tasks depend on teammate deliverables:
1. **Saidani's Python Parser Output**: Once the eBPF monitoring agent is operational, confirm whether it writes directly to `logs/parsed_events.json` or streams to a FastAPI ingestion endpoint. `src/services/eventAdapter.js` is already prepared to accept either batch JSON files or live JSON payloads.
2. **Backend API Endpoints**: Deployment of the FastAPI service at `http://localhost:8000` exposing the documented `/api/v1/` routes.
3. **CORS Configuration**: Ensure the FastAPI backend enables CORS origins for `http://localhost:3000` and `http://127.0.0.1:3000`.

---

## 8. Verification & Execution Commands

```bash
# 1. Start the Vite Development Server (Port 3000)
npm run dev
# Accessible at: http://127.0.0.1:3000

# 2. Run the 39-Assertion Automated Test Suite
node scripts/test-suite.js

# 3. Compile the Production Build
npm run build

# 4. Preview the Production Build Locally
npm run preview
```
