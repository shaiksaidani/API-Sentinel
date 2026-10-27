/**
 * API-Sentinel — Event Adapter Service (Week 2 Provisional Module)
 *
 * Maps normalized event outputs from the Python parser (logs/parsed_events.json)
 * into API-Sentinel frontend internal representation.
 *
 * PROVISIONAL NOTICE:
 * Saidani's Python parser is developed separately. This adapter is built against the
 * agreed shared specification. If parser output is absent, this adapter operates safely
 * with strict validation, schema documentation, and clear error diagnostics.
 */

// Known valid HTTP Methods
export const VALID_HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']);

// Known Severity Levels
export const VALID_SEVERITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

/**
 * Sanitizes request headers by redacting sensitive tokens, cookies, auth headers, and keys.
 */
export function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
    return headers || null;
  }
  const SENSITIVE_PATTERNS = [
    'auth', 'token', 'cookie', 'secret', 'password', 'api-key', 'apikey', 'jwt', 'session', 'credential'
  ];
  const sanitized = {};
  for (const [key, val] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_PATTERNS.some(pat => lowerKey.includes(pat));
    if (isSensitive) {
      sanitized[key] = '[REDACTED_SENSITIVE_CREDENTIAL]';
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

/**
 * Recursively sanitizes payload objects, masking sensitive fields (passwords, secrets, cards).
 */
export function sanitizePayload(payload) {
  if (!payload) return null;
  if (typeof payload !== 'object') return payload;

  const SENSITIVE_KEYS = new Set([
    'password', 'passwd', 'secret', 'token', 'access_token', 'refresh_token',
    'credit_card', 'card_number', 'cvv', 'ssn', 'api_key', 'private_key', 'authorization'
  ]);

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item));
  }

  const sanitized = {};
  for (const [k, v] of Object.entries(payload)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.has(lower) || lower.includes('password') || lower.includes('secret')) {
      sanitized[k] = '[REDACTED_PII]';
    } else if (v && typeof v === 'object') {
      sanitized[k] = sanitizePayload(v);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

/**
 * Normalizes HTTP Method string.
 * Unknown or malformed verbs are marked as 'UNKNOWN' rather than guessing.
 */
export function normalizeMethod(method) {
  if (typeof method !== 'string') return 'UNKNOWN';
  const upper = method.trim().toUpperCase();
  return VALID_HTTP_METHODS.has(upper) ? upper : 'UNKNOWN';
}

/**
 * Normalizes HTTP Status Code.
 * Returns valid integer between 100 and 599, or null if invalid.
 */
export function normalizeStatusCode(code) {
  const parsed = parseInt(code, 10);
  if (Number.isInteger(parsed) && parsed >= 100 && parsed <= 599) {
    return parsed;
  }
  return null;
}

/**
 * Normalizes timestamp strings or epochs to standard readable 'YYYY-MM-DD HH:mm:ss'
 */
export function normalizeTimestamp(rawTimestamp) {
  if (!rawTimestamp) {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
  }

  // Handle UNIX epoch timestamp in seconds or milliseconds
  if (typeof rawTimestamp === 'number') {
    const epochMs = rawTimestamp < 10000000000 ? rawTimestamp * 1000 : rawTimestamp;
    const date = new Date(epochMs);
    if (!isNaN(date.getTime())) {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    }
  }

  // Handle ISO string or date string
  const date = new Date(rawTimestamp);
  if (!isNaN(date.getTime())) {
    return date.toISOString().replace('T', ' ').substring(0, 19);
  }

  // Fallback to string representation if unparseable
  return String(rawTimestamp);
}

/**
 * Validates whether a raw parser event contains minimum required fields.
 * An event MUST have at least an endpoint and identifiable traffic structure.
 */
export function validateParserEvent(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Event record must be a valid non-null object' };
  }

  const endpoint = raw.endpoint || raw.uri || raw.path;
  if (!endpoint || typeof endpoint !== 'string' || endpoint.trim().length === 0) {
    return { valid: false, error: 'Missing required field: endpoint / uri / path' };
  }

  return { valid: true };
}

/**
 * Adapts a single raw parser event object into the internal dashboard event schema.
 * Returns adapted event object or null if invalid/malformed.
 */
export function adaptParserEvent(raw, index = 0) {
  const validation = validateParserEvent(raw);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
      raw
    };
  }

  const endpoint = (raw.endpoint || raw.uri || raw.path).trim();
  const method = normalizeMethod(raw.method || raw.http_method);
  const statusCode = normalizeStatusCode(raw.status_code || raw.statusCode || raw.status);
  const timestamp = normalizeTimestamp(raw.timestamp || raw.time || raw.created_at);
  const sourceIp = raw.source_ip || raw.sourceIp || raw.client_ip || raw.ip || '127.0.0.1';

  // Event ID generation or mapping
  const id = raw.event_id || raw.id || `EVT-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`;

  // Optional authentication context
  const authenticatedUserId = raw.authenticated_user_id || raw.authenticatedUserId || null;
  const objectOwnerId = raw.object_owner_id || raw.objectOwnerId || null;

  // Heuristic classification mapping
  let eventType = raw.event_type || raw.eventType;
  let severity = (raw.severity || '').toUpperCase();
  let details = raw.details || raw.description;
  let simulationNote = raw.simulation_note || raw.simulationNote;
  let mitigation = raw.mitigation || raw.recommendation || null;

  if (!eventType) {
    if (authenticatedUserId && objectOwnerId && String(authenticatedUserId) !== String(objectOwnerId)) {
      eventType = 'Potential Authorization Review Candidate';
      severity = severity || 'MEDIUM';
      details = details || `Discrepancy observed between caller identity (${authenticatedUserId}) and target owner identity (${objectOwnerId}) on ${endpoint}.`;
      simulationNote = simulationNote || 'Preliminary traffic observation only; user/owner mismatch is not verified evidence of BOLA until confirmed against backend authorization policies.';
      mitigation = mitigation || 'Verify row-level access control rules and tenant boundary isolation in the resource handler.';
    } else if (raw.is_bola || raw.bola_detected) {
      eventType = 'BOLA Suspicion';
      severity = severity || 'HIGH';
    } else if (raw.is_shadow || raw.undocumented || raw.documented === false || endpoint.toLowerCase().includes('unknown') || statusCode === 404) {
      eventType = 'Uncataloged Route Observation';
      severity = severity || (statusCode < 400 ? 'MEDIUM' : 'LOW');
      details = details || `HTTP ${statusCode || 404} response observed on uncataloged path ${endpoint}.`;
      simulationNote = simulationNote || 'Candidate route detected in traffic; requires verification against official API schema before confirming as shadow API.';
      mitigation = mitigation || 'Audit routing tables and compare against the official OpenAPI specification.';
    } else if (statusCode === 429 || raw.rate_anomaly) {
      eventType = 'Unusual Access Pattern';
      severity = severity || 'LOW';
    } else {
      eventType = 'Observed API Event';
      severity = severity || 'LOW';
      details = details || `Standard API traffic observed on route ${endpoint} with status ${statusCode || 200}.`;
      simulationNote = simulationNote || 'Runtime traffic telemetry log.';
    }
  }

  // Severity normalization
  if (!VALID_SEVERITIES.has(severity)) {
    if (eventType === 'BOLA Suspicion') severity = 'HIGH';
    else if (eventType === 'Potential Authorization Review Candidate') severity = 'MEDIUM';
    else if (eventType === 'Shadow API Candidate') severity = 'MEDIUM';
    else severity = 'LOW';
  }

  // Sanitized headers
  const rawHeaders = raw.request_headers || raw.headers || null;
  const requestHeaders = sanitizeHeaders(rawHeaders);

  // Request body payload (never exposed on main table, for modal inspection only)
  let requestBody = raw.request_body !== undefined ? raw.request_body : (raw.body || null);
  if (typeof requestBody === 'string') {
    try {
      requestBody = JSON.parse(requestBody);
    } catch {
      // Keep as string if not JSON
    }
  }
  requestBody = sanitizePayload(requestBody);

  // Fallbacks for details and notes
  details = details || `Traffic observed on route ${endpoint} with status ${statusCode || 'unknown'}.`;
  simulationNote = simulationNote || 'Parsed from runtime network capture log.';
  const status = raw.status || (severity === 'CRITICAL' || severity === 'HIGH' ? 'Open' : 'Under Review');

  return {
    success: true,
    data: {
      id,
      timestamp,
      method,
      endpoint,
      sourceIp,
      statusCode,
      eventType,
      severity,
      status,
      details,
      simulationNote,
      requestHeaders,
      requestBody,
      mitigation,
      authenticatedUserId,
      objectOwnerId,
      _isAdaptedFromParser: true
    }
  };
}

/**
 * Batch-adapts an array of raw parser outputs.
 * Separates successfully adapted events from malformed/rejected records.
 */
export function adaptParserEvents(rawList = []) {
  if (!Array.isArray(rawList)) {
    return {
      adapted: [],
      rejected: [{ error: 'Input must be an array of event objects', raw: rawList }],
      totalParsed: 0,
      successCount: 0,
      rejectedCount: 1
    };
  }

  const adapted = [];
  const rejected = [];

  rawList.forEach((raw, idx) => {
    const result = adaptParserEvent(raw, idx);
    if (result.success) {
      adapted.push(result.data);
    } else {
      rejected.push({ index: idx, error: result.error, raw: result.raw });
    }
  });

  return {
    adapted,
    rejected,
    totalParsed: rawList.length,
    successCount: adapted.length,
    rejectedCount: rejected.length
  };
}

/**
 * Reference schema for Saidani's Python parser output.
 * Documented for team alignment and contract verification.
 */
export const PROVISIONAL_PARSER_SCHEMA = {
  description: "Shared event format for logs/parsed_events.json",
  sampleEntry: {
    method: "POST",
    endpoint: "/api/v1/export/data",
    source_ip: "10.0.2.14",
    status_code: 202,
    timestamp: "2026-10-18T10:30:00Z",
    request_headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJhbGci...[REDACTED]"
    },
    request_body: {
      "format": "csv",
      "scope": "tenant_metrics"
    },
    event_type: "Shadow API Candidate",
    severity: "MEDIUM",
    details: "Route detected in runtime network traffic but unregistered in API gateway routing table."
  }
};
