/**
 * API-Sentinel — Backend Service Layer (Week 2 Architecture)
 *
 * Centralized API client for communicating with the team's Python FastAPI / Flask backend.
 * Uses configurable environment variable VITE_API_BASE_URL (default: http://localhost:8000).
 *
 * PROPOSED CONTRACT NOTICE:
 * The endpoints below are proposed contracts designed for Week 3 integration.
 * They are documented as PENDING implementation by the backend team.
 */

export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:8000';

const DEFAULT_TIMEOUT_MS = 6000;

/**
 * Generic fetch wrapper with timeout, network error detection, and error parsing.
 */
async function apiRequest(endpoint, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS);

  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetails = `HTTP error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && (errorJson.message || errorJson.detail || errorJson.error)) {
          errorDetails = errorJson.message || errorJson.detail || errorJson.error;
        }
      } catch {
        // Fall back to statusText
      }

      return {
        success: false,
        status: response.status,
        error: errorDetails
      };
    }

    const data = await response.json();
    return {
      success: true,
      status: response.status,
      data
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      return {
        success: false,
        error: `Request to ${url} timed out after ${options.timeout || DEFAULT_TIMEOUT_MS}ms. Backend engine did not respond.`
      };
    }

    return {
      success: false,
      error: `Network Connection Error: Unable to reach ${API_BASE_URL}. Ensure the Python FastAPI / Flask service is running and CORS is configured.`
    };
  }
}

/**
 * Checks backend health / connectivity.
 * Proposed: GET /api/v1/health or /api/v1/metrics/summary
 */
export async function checkBackendHealth() {
  return await apiRequest('/api/v1/health');
}

/**
 * Proposed: GET /api/v1/metrics/summary
 * Returns overview metric totals (Total Requests, Discovered Endpoints, Shadow APIs, BOLA Flags)
 */
export async function fetchSummaryMetrics() {
  return await apiRequest('/api/v1/metrics/summary');
}

/**
 * Proposed: GET /api/v1/events
 * Returns list of runtime traffic & security events
 */
export async function fetchSecurityEvents() {
  return await apiRequest('/api/v1/events');
}

/**
 * Proposed: GET /api/v1/endpoints
 * Returns inventory of observed route paths with OpenAPI catalog diff
 */
export async function fetchEndpoints() {
  return await apiRequest('/api/v1/endpoints');
}

/**
 * Proposed: GET /api/v1/detections/shadow-apis
 * Returns dedicated shadow API candidate route telemetry
 */
export async function fetchShadowDetections() {
  return await apiRequest('/api/v1/detections/shadow-apis');
}

/**
 * Proposed: GET /api/v1/detections/bola
 * Returns dedicated Broken Object Level Authorization heuristic events
 */
export async function fetchBolaDetections() {
  return await apiRequest('/api/v1/detections/bola');
}

/**
 * Proposed: GET /api/v1/telemetry
 * Returns time-series traffic volume and method breakdown
 */
export async function fetchTelemetryHistory() {
  return await apiRequest('/api/v1/telemetry');
}

/**
 * Triggers safe execution of Saidani's Python traffic parser via FastAPI.
 * Endpoint: POST /api/v1/parser/run
 */
export async function triggerParserRun() {
  return await apiRequest('/api/v1/parser/run', {
    method: 'POST'
  });
}

/**
 * Documented Backend Contracts for API-Sentinel Integration
 */
export const PROPOSED_BACKEND_CONTRACTS = [
  {
    endpoint: "GET /api/v1/health",
    description: "Backend health check, data source mode, and parser availability",
    status: "IMPLEMENTED (Week 3 FastAPI Gateway)"
  },
  {
    endpoint: "GET /api/v1/metrics/summary",
    description: "Aggregated counts for summary cards (total_requests, methods, status_categories, success_rate, error_count)",
    status: "IMPLEMENTED (Week 3 FastAPI Gateway)"
  },
  {
    endpoint: "GET /api/v1/events",
    description: "Validated event stream from logs/parsed_events.json",
    status: "IMPLEMENTED (Week 3 FastAPI Gateway)"
  },
  {
    endpoint: "POST /api/v1/parser/run",
    description: "Executes traffic_parser.py on sample_events.json in controlled subprocess",
    status: "IMPLEMENTED (Week 3 FastAPI Gateway)"
  },
  {
    endpoint: "GET /api/v1/endpoints",
    description: "Endpoint inventory reconcilation derived from parsed network traffic",
    status: "IMPLEMENTED (Week 3 FastAPI Gateway)"
  },
  {
    endpoint: "GET /api/v1/detections/shadow-apis",
    description: "Candidate routes observed in network traffic missing from OpenAPI spec",
    status: "IMPLEMENTED (Week 3 FastAPI Gateway)"
  },
  {
    endpoint: "GET /api/v1/detections/bola",
    description: "Object ID parameter enumeration and cross-tenant access violation events",
    status: "IMPLEMENTED (Week 4 FastAPI Gateway)"
  },
  {
    endpoint: "GET /api/v1/telemetry",
    description: "Time-series request volume, method breakdowns, and anomaly telemetry",
    status: "IMPLEMENTED (Week 4 FastAPI Gateway)"
  }
];
