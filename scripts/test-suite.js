/**
 * API-Sentinel Week 1 Automated QA & Validation Test Suite
 */
import { 
  summaryStats, 
  endpointsData, 
  securityAlertsData, 
  trafficHistory, 
  methodDistribution, 
  alertDistribution 
} from '../src/data/mockData.js';

const results = [];

function assert(description, condition, evidence) {
  if (condition) {
    results.push({ test: description, status: 'PASS', evidence });
    console.log(`[PASS] ${description}: ${evidence}`);
  } else {
    results.push({ test: description, status: 'FAIL', evidence });
    console.error(`[FAIL] ${description}: ${evidence}`);
  }
}

console.log('=== RUNNING API-SENTINEL QA TEST SUITE ===\n');

// ----------------------------------------------------
// TEST GROUP 1: Mock Data Consistency & Math
// ----------------------------------------------------
console.log('--- Test Group 1: Data Integrity & Cross-Component Consistency ---');

// 1.1 Total Requests Math
const totalReqsInStats = summaryStats.find(s => s.id === 'total-requests').numericValue;
const sumMethodCounts = methodDistribution.reduce((acc, m) => acc + m.count, 0);
assert(
  'Total API Requests matches sum of HTTP method counts',
  totalReqsInStats === sumMethodCounts,
  `Stats value: ${totalReqsInStats}, Sum of method counts: ${sumMethodCounts}`
);

// 1.2 Method Percentages Sum to 100%
const sumPercentages = methodDistribution.reduce((acc, m) => acc + parseInt(m.percentage), 0);
assert(
  'HTTP Method distribution percentages sum to exactly 100%',
  sumPercentages === 100,
  `Sum of percentages: ${sumPercentages}%`
);

// 1.3 Discovered Endpoints Count
const discoveredInStats = summaryStats.find(s => s.id === 'discovered-endpoints').numericValue;
assert(
  'Discovered Endpoints count matches endpoints inventory count',
  discoveredInStats === endpointsData.length,
  `Card: ${discoveredInStats}, Endpoints array length: ${endpointsData.length}`
);

// 1.4 Shadow API Candidates Count
const shadowInStats = summaryStats.find(s => s.id === 'shadow-api-candidates').numericValue;
const shadowInEndpoints = endpointsData.filter(e => e.docStatus === 'Undocumented Candidate').length;
assert(
  'Shadow API Candidates matches undocumented endpoint count',
  shadowInStats === shadowInEndpoints,
  `Card: ${shadowInStats}, Undocumented count in inventory: ${shadowInEndpoints}`
);

// 1.5 BOLA Alert Candidates Count
const bolaInStats = summaryStats.find(s => s.id === 'bola-alert-candidates').numericValue;
const bolaInAlerts = securityAlertsData.filter(a => a.eventType === 'BOLA Suspicion').length;
assert(
  'BOLA Alert Candidates matches BOLA suspicion events in alerts table',
  bolaInStats === bolaInAlerts,
  `Card: ${bolaInStats}, BOLA events in security alerts: ${bolaInAlerts}`
);

// 1.6 Alert Distribution Consistency
const bolaDist = alertDistribution.find(d => d.name === 'BOLA Suspicion')?.count;
assert(
  'Alert category distribution for BOLA matches event count',
  bolaDist === bolaInAlerts,
  `Distribution count: ${bolaDist}, Alert records: ${bolaInAlerts}`
);

// ----------------------------------------------------
// TEST GROUP 2: Endpoint Filtering Logic
// ----------------------------------------------------
console.log('\n--- Test Group 2: Endpoint Inventory Filtering Logic ---');

// 2.1 HTTP Method Filters
const getEndpoints = endpointsData.filter(e => e.method === 'GET');
const postEndpoints = endpointsData.filter(e => e.method === 'POST');
const putEndpoints = endpointsData.filter(e => e.method === 'PUT');
const deleteEndpoints = endpointsData.filter(e => e.method === 'DELETE');

assert('GET method filter returns correct subset', getEndpoints.length > 0 && getEndpoints.every(e => e.method === 'GET'), `Found ${getEndpoints.length} GET routes`);
assert('POST method filter returns correct subset', postEndpoints.length > 0 && postEndpoints.every(e => e.method === 'POST'), `Found ${postEndpoints.length} POST routes`);
assert('PUT method filter returns correct subset', putEndpoints.length > 0 && putEndpoints.every(e => e.method === 'PUT'), `Found ${putEndpoints.length} PUT routes`);
assert('DELETE method filter returns correct subset', deleteEndpoints.length > 0 && deleteEndpoints.every(e => e.method === 'DELETE'), `Found ${deleteEndpoints.length} DELETE routes`);

// 2.2 Documentation Status Filters
const docEndpoints = endpointsData.filter(e => e.docStatus === 'Documented');
const undocEndpoints = endpointsData.filter(e => e.docStatus === 'Undocumented Candidate');
assert('Documentation status "Documented" filter works', docEndpoints.length === 15, `Found ${docEndpoints.length} documented routes`);
assert('Documentation status "Undocumented Candidate" filter works', undocEndpoints.length === 3, `Found ${undocEndpoints.length} shadow candidates`);

// 2.3 Search for specific endpoint (/api/users)
const searchUsers = endpointsData.filter(e => e.endpoint.toLowerCase().includes('/api/users'));
assert('Search for "/api/users" matches exact and nested routes', searchUsers.length === 3, `Matched routes: ${searchUsers.map(u => `${u.method} ${u.endpoint}`).join(', ')}`);

// 2.4 Combined Search + Filter
const combinedSearchFilter = endpointsData.filter(e => 
  e.endpoint.toLowerCase().includes('/api/users') && e.method === 'POST'
);
assert('Combined search ("/api/users") and method (POST) works', combinedSearchFilter.length === 1, `Matched: ${combinedSearchFilter[0]?.method} ${combinedSearchFilter[0]?.endpoint}`);

// 2.5 Zero Results Filter Combination
const zeroResults = endpointsData.filter(e => e.method === 'DELETE' && e.docStatus === 'Undocumented Candidate');
assert('Filter combination yielding 0 results handles cleanly without crash', zeroResults.length === 0, `Returned 0 rows as expected`);

// ----------------------------------------------------
// TEST GROUP 3: Security Alerts Filtering Logic
// ----------------------------------------------------
console.log('\n--- Test Group 3: Security Alerts Filtering Logic ---');

const lowAlerts = securityAlertsData.filter(a => a.severity === 'LOW');
const medAlerts = securityAlertsData.filter(a => a.severity === 'MEDIUM');
const highAlerts = securityAlertsData.filter(a => a.severity === 'HIGH');
const critAlerts = securityAlertsData.filter(a => a.severity === 'CRITICAL');

assert('Severity filter LOW works', lowAlerts.length >= 1, `Found ${lowAlerts.length} LOW severity alerts`);
assert('Severity filter MEDIUM works', medAlerts.length >= 1, `Found ${medAlerts.length} MEDIUM severity alerts`);
assert('Severity filter HIGH works', highAlerts.length >= 1, `Found ${highAlerts.length} HIGH severity alerts`);
assert('Severity filter CRITICAL works', critAlerts.length >= 1, `Found ${critAlerts.length} CRITICAL severity alerts`);

// Search by alert ID
const searchEvt = securityAlertsData.filter(a => a.id.toLowerCase().includes('evt-2026-083'));
assert('Search by event ID "EVT-2026-083" matches exactly', searchEvt.length === 1 && searchEvt[0].severity === 'CRITICAL', `Matched: ${searchEvt[0]?.id} (${searchEvt[0]?.eventType})`);

// Search by heuristic context
const searchHeuristic = securityAlertsData.filter(a => a.details.toLowerCase().includes('sequential') || a.simulationNote.toLowerCase().includes('enumeration'));
assert('Search by heuristic details matches relevant detection records', searchHeuristic.length >= 1, `Matched ${searchHeuristic.length} records`);

// ----------------------------------------------------
// TEST GROUP 4: Traffic History & Tooltip Safety
// ----------------------------------------------------
console.log('\n--- Test Group 4: Traffic Telemetry Data Structure ---');
assert('Traffic history has time slots and numeric totals', 
  trafficHistory.length > 0 && trafficHistory.every(t => typeof t.total === 'number' && typeof t.time === 'string'),
  `${trafficHistory.length} time points verified`
);

// ----------------------------------------------------
// TEST GROUP 5: Week 2 Event Schema & Inspection Integrity
// ----------------------------------------------------
console.log('\n--- Test Group 5: Week 2 Event Schema & Inspection Integrity ---');

// 5.1 Enriched fields present on all events
const allHaveMethods = securityAlertsData.every(a => typeof a.method === 'string' && a.method.length > 0);
assert('All security events have valid HTTP method strings', allHaveMethods, `${securityAlertsData.length}/${securityAlertsData.length} events verified`);

const allHaveSourceIps = securityAlertsData.every(a => typeof a.sourceIp === 'string' && a.sourceIp.length > 0);
assert('All security events have client source IP addresses', allHaveSourceIps, `${securityAlertsData.length}/${securityAlertsData.length} events verified`);

const allHaveValidStatusCodes = securityAlertsData.every(a => typeof a.statusCode === 'number' && a.statusCode >= 100 && a.statusCode <= 599);
assert('All security events have valid HTTP status codes (100-599)', allHaveValidStatusCodes, `${securityAlertsData.length}/${securityAlertsData.length} status codes valid`);

const allHaveHeaders = securityAlertsData.every(a => a.requestHeaders && typeof a.requestHeaders === 'object');
assert('All security events include sanitized request headers object', allHaveHeaders, `${securityAlertsData.length}/${securityAlertsData.length} header objects present`);

// 5.2 Token masking verification
const allTokensMasked = securityAlertsData.every(a => {
  if (a.requestHeaders?.Authorization) {
    return a.requestHeaders.Authorization.includes('[REDACTED');
  }
  return true;
});
assert('Authorization bearer tokens are sanitized and masked', allTokensMasked, 'All tokens safely redacted');

// ----------------------------------------------------
// TEST GROUP 6: Parser Event Adapter (src/services/eventAdapter.js)
// ----------------------------------------------------
console.log('\n--- Test Group 6: Python Parser Event Adapter ---');
import { 
  normalizeMethod, 
  normalizeStatusCode, 
  normalizeTimestamp, 
  validateParserEvent, 
  adaptParserEvent, 
  adaptParserEvents 
} from '../src/services/eventAdapter.js';

// 6.1 Method normalization
assert('Adapter normalizes lowercase "get" to "GET"', normalizeMethod('get') === 'GET', 'Result: GET');
assert('Adapter normalizes lowercase "post" to "POST"', normalizeMethod('post') === 'POST', 'Result: POST');
assert('Adapter normalizes invalid verb to "UNKNOWN"', normalizeMethod('INVALID_VERB') === 'UNKNOWN', 'Result: UNKNOWN');

// 6.2 Status code normalization
assert('Adapter normalizes numeric status code 200', normalizeStatusCode(200) === 200, 'Result: 200');
assert('Adapter parses string status code "403" to integer 403', normalizeStatusCode('403') === 403, 'Result: 403');
assert('Adapter rejects out-of-bounds status code 999', normalizeStatusCode(999) === null, 'Result: null');

// 6.3 Validation of malformed events
const validCheck = validateParserEvent({ endpoint: '/api/users', method: 'GET' });
assert('Adapter accepts event with valid endpoint', validCheck.valid === true, 'Valid: true');

const invalidCheck = validateParserEvent({ method: 'GET' }); // missing endpoint
assert('Adapter rejects malformed event lacking endpoint', invalidCheck.valid === false, `Error caught: ${invalidCheck.error}`);

const nonObjectCheck = validateParserEvent(null);
assert('Adapter rejects non-object inputs safely', nonObjectCheck.valid === false, 'Non-object rejected');

// 6.4 Batch adaptation
const testBatch = [
  { endpoint: '/api/accounts/202', method: 'GET', source_ip: '192.168.1.100', status_code: 403, event_type: 'BOLA Suspicion' },
  { endpoint: '/api/internal/test', method: 'POST', source_ip: '10.0.0.5', status_code: 200 },
  { method: 'GET' } // intentional malformed entry
];
const batchResult = adaptParserEvents(testBatch);
assert('Batch adapter adapts valid events and tracks rejected items', 
  batchResult.successCount === 2 && batchResult.rejectedCount === 1,
  `Adapted: ${batchResult.successCount}, Rejected: ${batchResult.rejectedCount}`
);

// ----------------------------------------------------
// TEST GROUP 7: Backend API Service Layer (src/services/api.js)
// ----------------------------------------------------
console.log('\n--- Test Group 7: Backend API Service Contracts ---');
import { API_BASE_URL, PROPOSED_BACKEND_CONTRACTS } from '../src/services/api.js';

assert('API_BASE_URL is defined and defaults to port 8000', 
  typeof API_BASE_URL === 'string' && API_BASE_URL.includes('8000'),
  `Configured API_BASE_URL: ${API_BASE_URL}`
);

const expectedEndpoints = [
  'GET /api/v1/metrics/summary',
  'GET /api/v1/events',
  'GET /api/v1/endpoints',
  'GET /api/v1/detections/shadow-apis',
  'GET /api/v1/detections/bola'
];
const contractsMatch = expectedEndpoints.every(ep => 
  PROPOSED_BACKEND_CONTRACTS.some(c => c.endpoint === ep)
);
assert('Proposed backend contracts contain all 5 required integration endpoints', 
  contractsMatch && PROPOSED_BACKEND_CONTRACTS.length >= 5,
  `${PROPOSED_BACKEND_CONTRACTS.length} proposed contracts documented`
);


// Summary of results
const totalPass = results.filter(r => r.status === 'PASS').length;
const totalFail = results.filter(r => r.status === 'FAIL').length;
console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${results.length} | PASSED: ${totalPass} | FAILED: ${totalFail}`);
console.log(`========================================\n`);

if (totalFail > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
