import React from 'react';
import { BookOpen, Shield, Code, Server, CheckCircle2, AlertTriangle, Layers, Cpu, FileJson } from 'lucide-react';

export default function DocumentationView() {
  return (
    <div className="doc-wrapper">
      <div className="doc-header">
        <h2>API-Sentinel Documentation — Week 2</h2>
        <p>Runtime BOLA & Shadow API Detection Engine • Dashboard & Documentation Module</p>
      </div>

      <div className="doc-section">
        <h3><Shield size={18} /> 1. Project Overview & Module Role</h3>
        <p>
          <strong>API-Sentinel</strong> is an enterprise API security platform engineered to monitor network traffic, identify uncataloged (Shadow) API routes, detect runtime Broken Object Level Authorization (BOLA) exploitation attempts, and deliver operational security intelligence to SecOps teams.
        </p>
        <p style={{ marginTop: '8px' }}>
          <strong>Assigned Responsibility:</strong> Frontend Dashboard & Documentation.
          Week 2 focuses on incident event enrichment, deep row-level inspection, parser JSON normalization adapter, centralized backend service contracts, and explicit dual-mode operation (Demo vs Live Backend).
        </p>
      </div>

      <div className="doc-section">
        <h3><CheckCircle2 size={18} /> 2. Week 2 Objectives Implemented</h3>
        <ul>
          <li><strong>Event Telemetry Enrichment:</strong> Security events upgraded with HTTP method, client Source IP, HTTP response status code, sanitized request headers, and scoped payload contexts.</li>
          <li><strong>Deep Event Inspector Modal:</strong> Dedicated inspection modal allows deep forensic review of headers, detection heuristics, and recommended security remediation without cluttering the main table or leaking sensitive request bodies.</li>
          <li><strong>Provisional Parser JSON Adapter:</strong> Created <code>src/services/eventAdapter.js</code> to normalize Saidani's Python parser outputs (<code>logs/parsed_events.json</code>) with strict schema validation, timestamp normalization, and safe fallbacks.</li>
          <li><strong>Centralized API Service Client:</strong> Created <code>src/services/api.js</code> with configurable <code>VITE_API_BASE_URL</code>, timeout safeguards, error mapping, and health check utilities.</li>
          <li><strong>Dual-Mode Data Switcher:</strong> Header toggle supports explicit switching between <code>DEMO MODE</code> and <code>BACKEND API</code>. When backend is offline, clear diagnostics are displayed without silently substituting mock data.</li>
        </ul>
      </div>

      <div className="doc-section">
        <h3><FileJson size={18} /> 3. Parser Integration Contract (Provisional)</h3>
        <p>
          Saidani's Python parser operates as an independent telemetry engine writing normalized JSON lines or arrays to <code>logs/parsed_events.json</code>. The adapter validates and maps records into the internal dashboard representation:
        </p>
        <div className="doc-code-block">
          // Shared Parser Schema (src/services/eventAdapter.js):
          &#123;
            "method": "POST",
            "endpoint": "/api/v1/export/data",
            "source_ip": "10.0.2.14",
            "status_code": 202,
            "timestamp": "2026-10-18T10:30:00Z",
            "request_headers": &#123; "Content-Type": "application/json", "Authorization": "Bearer eyJhbGci...[REDACTED]" &#125;,
            "request_body": &#123; "format": "csv", "scope": "tenant_metrics" &#125;,
            "event_type": "Shadow API Candidate",
            "severity": "MEDIUM",
            "details": "Route detected in runtime network traffic but unregistered in API gateway routing table."
          &#125;
        </div>
      </div>

      <div className="doc-section">
        <h3><Server size={18} /> 4. Proposed Backend Service Contracts (Week 3 Preparation)</h3>
        <p>
          The centralized client (<code>src/services/api.js</code>) specifies the following REST endpoints for upcoming integration with the team's Python FastAPI/Flask backend:
        </p>
        <div className="doc-code-block">
          GET /api/v1/metrics/summary        -&gt; Aggregated metric cards (Requests, Endpoints, Shadow, BOLA)
          GET /api/v1/events                 -&gt; Normalized runtime security events
          GET /api/v1/endpoints              -&gt; Discovered endpoint catalog & documentation diff
          GET /api/v1/detections/shadow-apis -&gt; Undeclared route pathway candidates
          GET /api/v1/detections/bola        -&gt; Object ID parameter enumeration attempts
          GET /api/v1/telemetry              -&gt; Time-series request volume and method breakdown
        </div>
      </div>

      <div className="doc-section">
        <h3><AlertTriangle size={18} /> 5. Data Integrity & Ethical Rules</h3>
        <ul>
          <li>
            <strong>Shadow API Classification:</strong> Routes are designated shadow candidates solely due to absence from OpenAPI documentation catalog specifications, not an intrinsic code vulnerability.
          </li>
          <li>
            <strong>Heuristic Flags:</strong> BOLA alerts indicate suspicious object-level parameter iteration patterns requiring verification against business authorization rules.
          </li>
          <li>
            <strong>No Silent Fallback:</strong> If Backend Mode is selected and the service is unreachable, an explicit error banner is rendered. The platform never masks backend failures with mock data.
          </li>
        </ul>
      </div>
    </div>
  );
}
