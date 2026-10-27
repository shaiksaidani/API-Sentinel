# API-Sentinel: Runtime BOLA & Shadow API Detection Engine

## Week 3 Deliverable — Python Traffic Parser Integration, FastAPI Gateway & Live SOC Dashboard

### 1. Project Introduction

API-Sentinel is an API cybersecurity monitoring engine designed to identify potential unauthorized resource access and API visibility blind spots.

Its primary capabilities include:

- **Shadow API Discovery:** Identifying observed endpoints absent from documented API specifications.
- **Runtime BOLA Detection:** Flagging potential Broken Object Level Authorization issues for further investigation.

### 2. Project Responsibilities and Milestones

**Assigned module:** Frontend Dashboard & Documentation

- **Week 1:** Built a responsive SOC-themed dashboard prototype with simulated telemetry, endpoint inventories, security events, and initial QA documentation.
- **Week 2:** Added HTTP method, source IP, and status code details; a security event inspector with masked payloads; a centralized API client; an event adapter; and Demo Mode/Backend API switching.
- **Week 3:** Integrated the Python traffic parser with the FastAPI gateway and React dashboard, added parser execution controls, and implemented security-event classification and automated tests.

### 3. Project Structure

```text
Axlero Project-1/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── test_backend.py
├── docs/
│   ├── PROJECT_PROGRESS_AND_IMPLEMENTATION_REPORT.md
│   ├── week1-qa-report.md
│   ├── week2-dashboard-report.md
│   └── week3-parser-integration-report.md
├── logs/
│   └── parsed_events.json
├── parser/
│   ├── sample_events.json
│   ├── traffic_parser.py
│   └── event_summary.py
├── scripts/
│   └── test-suite.js
├── src/
│   ├── components/
│   ├── data/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

### 4. Installation and Prerequisites

Install Node.js 18 or later, npm, Python 3.10 or later, and pip.

Check the installed versions:

```bash
node -v
npm -v
python --version
```

Install frontend dependencies:

```bash
npm install
```

Install backend dependencies:

```bash
pip install -r backend/requirements.txt
```

### 5. Run the Application

**Terminal 1 — FastAPI backend:**

```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

**Terminal 2 — React dashboard:**

```bash
npm run dev
```

Use the local URL printed by Vite.

### 6. Automated Testing

Run the backend tests:

```bash
python backend/test_backend.py
```

Run the frontend regression suite:

```bash
node scripts/test-suite.js
```

Run the traffic parser:

```bash
python parser/traffic_parser.py
```

Generate event summary metrics:

```bash
python parser/event_summary.py
```

Build and preview the frontend:

```bash
npm run build
npm run preview
```

### 7. Dashboard Features

| Feature | Description |
|---|---|
| Telemetry pipeline | Raw sample events → Python parser → normalized event logs → FastAPI → React dashboard |
| FastAPI gateway | REST endpoints, health checks, CORS configuration, and parser execution |
| Parser controls | In-app action to run the parser and refresh telemetry |
| Data modes | Switch between simulated Demo Mode and Backend API mode |
| Connection handling | Display backend connectivity errors instead of silently switching data sources |
| BOLA classification | Identify potential authorization review candidates without claiming an exploit is confirmed |
| Shadow API classification | Identify undocumented or uncataloged route observations for verification |
| Event inspection | Inspect security events with masked request payloads and sanitized headers |
| Filtering | Search and filter events using supported method, status, risk, severity, and documentation fields |

### 8. Completed Milestones

**Week 1**
- React and Vite dashboard scaffolding
- Metric cards, endpoint inventory, and alert tables
- Traffic charts and initial QA documentation

**Week 2**
- Enriched security alerts
- Event detail modal and payload masking
- Centralized API service and event adapter
- Demo Mode and Backend API mode
- Expanded frontend regression checks

**Week 3**
- Python traffic parser integration
- Event summary calculation
- FastAPI backend gateway
- Live dashboard integration
- Parser execution with concurrency protection
- Ethical BOLA and shadow API classifications
- Backend and frontend automated test suites
- Technical integration documentation

### 9. Current Limitations and Follow-up Work

- Live eBPF kernel collection requires validation in a suitable Linux environment.
- The dedicated server-side time-series telemetry endpoint remains to be implemented.
- External network vulnerability scanning has not yet been performed.
- Production bundle-size optimization remains a follow-up task.

Refer to the reports in `docs/` for detailed implementation and QA findings.
