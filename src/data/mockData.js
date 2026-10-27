/**
 * API-Sentinel — Week 1 Mock Data
 * Runtime BOLA & Shadow API Detection Engine
 * 
 * NOTE: This file provides static simulated demo data for Week 1 frontend prototyping.
 * All metrics, endpoint records, and security alerts are synthetic examples and do not
 * represent live network captures or confirmed vulnerabilities.
 */

export const systemMeta = {
  mode: "DEMO MODE",
  environment: "Local Development Prototype (Week 1)",
  engineStatus: "Simulated Engine State",
  lastUpdated: new Date().toISOString(),
  backendIntegrationTarget: "Python FastAPI / eBPF Engine (Week 3)"
};

export const summaryStats = [
  {
    id: "total-requests",
    title: "Total API Requests",
    value: "1,284",
    numericValue: 1284,
    change: "+12.4%",
    changeType: "neutral",
    subtext: "Aggregated across simulated runtime sessions",
    icon: "Activity",
    badge: "Simulated Traffic"
  },
  {
    id: "discovered-endpoints",
    title: "Discovered Endpoints",
    value: "18",
    numericValue: 18,
    change: "+3 new",
    changeType: "positive",
    subtext: "Unique URI pathways identified in mock traffic",
    icon: "Layers",
    badge: "15 Documented"
  },
  {
    id: "shadow-api-candidates",
    title: "Shadow API Candidates",
    value: "3",
    numericValue: 3,
    change: "Undeclared",
    changeType: "warning",
    subtext: "Absent from OpenAPI registry (requires review)",
    icon: "EyeOff",
    badge: "Requires Audit"
  },
  {
    id: "bola-alert-candidates",
    title: "BOLA Alert Candidates",
    value: "5",
    numericValue: 5,
    change: "Attention",
    changeType: "critical",
    subtext: "Suspicious object parameter access attempts flagged",
    icon: "ShieldAlert",
    badge: "Heuristic Flags"
  }
];

export const endpointsData = [
  {
    id: "ep-01",
    endpoint: "/api/users",
    method: "GET",
    requestCount: 342,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "2 mins ago",
    avgLatency: "45ms",
    description: "Public user profile and catalog listing"
  },
  {
    id: "ep-02",
    endpoint: "/api/users/101",
    method: "GET",
    requestCount: 215,
    docStatus: "Documented",
    riskStatus: "Review Required",
    lastSeen: "4 mins ago",
    avgLatency: "62ms",
    description: "Individual user entity lookup; flagged for rapid ID switching"
  },
  {
    id: "ep-03",
    endpoint: "/api/users",
    method: "POST",
    requestCount: 98,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "12 mins ago",
    avgLatency: "110ms",
    description: "User registration endpoint with schema validation"
  },
  {
    id: "ep-04",
    endpoint: "/api/accounts",
    method: "GET",
    requestCount: 184,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "7 mins ago",
    avgLatency: "52ms",
    description: "Authenticated customer account summary list"
  },
  {
    id: "ep-05",
    endpoint: "/api/accounts/202",
    method: "GET",
    requestCount: 142,
    docStatus: "Documented",
    riskStatus: "Review Required",
    lastSeen: "1 min ago",
    avgLatency: "78ms",
    description: "Account details endpoint showing abnormal cross-session probing"
  },
  {
    id: "ep-06",
    endpoint: "/api/accounts/202",
    method: "PUT",
    requestCount: 31,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "18 mins ago",
    avgLatency: "125ms",
    description: "Account preference update with bearer token auth"
  },
  {
    id: "ep-07",
    endpoint: "/api/orders",
    method: "GET",
    requestCount: 110,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "9 mins ago",
    avgLatency: "48ms",
    description: "Customer purchase history query"
  },
  {
    id: "ep-08",
    endpoint: "/api/orders",
    method: "POST",
    requestCount: 45,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "14 mins ago",
    avgLatency: "140ms",
    description: "Checkout order submission"
  },
  {
    id: "ep-09",
    endpoint: "/api/internal/debug",
    method: "GET",
    requestCount: 19,
    docStatus: "Undocumented Candidate",
    riskStatus: "Review Required",
    lastSeen: "22 mins ago",
    avgLatency: "25ms",
    description: "Legacy diagnostic endpoint not present in published OpenAPI spec"
  },
  {
    id: "ep-10",
    endpoint: "/api/v1/export/data",
    method: "POST",
    requestCount: 14,
    docStatus: "Undocumented Candidate",
    riskStatus: "Review Required",
    lastSeen: "35 mins ago",
    avgLatency: "280ms",
    description: "Unregistered bulk export route discovered through route observation"
  },
  {
    id: "ep-11",
    endpoint: "/api/admin/metrics",
    method: "GET",
    requestCount: 28,
    docStatus: "Undocumented Candidate",
    riskStatus: "Review Required",
    lastSeen: "11 mins ago",
    avgLatency: "38ms",
    description: "Exposed management metrics path omitted from API gateway catalog"
  },
  {
    id: "ep-12",
    endpoint: "/api/auth/token",
    method: "POST",
    requestCount: 420,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "30 secs ago",
    avgLatency: "95ms",
    description: "OAuth2 authentication handler"
  },
  {
    id: "ep-13",
    endpoint: "/api/products",
    method: "GET",
    requestCount: 532,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "1 min ago",
    avgLatency: "32ms",
    description: "Public inventory catalog"
  },
  {
    id: "ep-14",
    endpoint: "/api/products/search",
    method: "GET",
    requestCount: 312,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "3 mins ago",
    avgLatency: "41ms",
    description: "Product search with filtering keywords"
  },
  {
    id: "ep-15",
    endpoint: "/api/cart/items",
    method: "POST",
    requestCount: 89,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "8 mins ago",
    avgLatency: "65ms",
    description: "Shopping cart item addition"
  },
  {
    id: "ep-16",
    endpoint: "/api/cart/items/5",
    method: "DELETE",
    requestCount: 12,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "25 mins ago",
    avgLatency: "54ms",
    description: "Cart item deletion"
  },
  {
    id: "ep-17",
    endpoint: "/api/checkout",
    method: "POST",
    requestCount: 64,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "6 mins ago",
    avgLatency: "180ms",
    description: "Order checkout pipeline"
  },
  {
    id: "ep-18",
    endpoint: "/api/payments/verify",
    method: "POST",
    requestCount: 58,
    docStatus: "Documented",
    riskStatus: "Normal",
    lastSeen: "5 mins ago",
    avgLatency: "210ms",
    description: "Payment gateway confirmation webhook"
  }
];

export const securityAlertsData = [
  {
    id: "EVT-2026-081",
    timestamp: "2026-10-12 10:18:24",
    method: "GET",
    endpoint: "/api/accounts/202",
    sourceIp: "192.168.1.105",
    statusCode: 200,
    eventType: "BOLA Suspicion",
    severity: "HIGH",
    status: "Open",
    details: "User token with subject ID 109 queried account record 202 without verified ownership linkage.",
    simulationNote: "Simulated heuristic detection based on token claim vs resource ID parameter.",
    requestHeaders: {
      "Authorization": "Bearer eyJhbGci...[REDACTED_TOKEN_109]",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0"
    },
    requestBody: null,
    mitigation: "Enforce object-level access control check in AccountController.VerifyAccountOwnership()."
  },
  {
    id: "EVT-2026-082",
    timestamp: "2026-10-12 10:04:15",
    method: "GET",
    endpoint: "/api/internal/debug",
    sourceIp: "10.0.4.21",
    statusCode: 200,
    eventType: "Shadow API Candidate",
    severity: "HIGH",
    status: "Under Review",
    details: "Observed active HTTP GET requests on route missing from OpenAPI v3.0 documentation inventory.",
    simulationNote: "Identified solely by absence from documentation catalog, not confirmed vulnerability.",
    requestHeaders: {
      "Host": "api.internal.local",
      "User-Agent": "curl/7.88.1",
      "Accept": "*/*"
    },
    requestBody: null,
    mitigation: "Deprecate or register internal debug routes in API gateway routing table."
  },
  {
    id: "EVT-2026-083",
    timestamp: "2026-10-12 09:47:50",
    method: "GET",
    endpoint: "/api/users/101",
    sourceIp: "172.16.2.88",
    statusCode: 200,
    eventType: "BOLA Suspicion",
    severity: "CRITICAL",
    status: "Open",
    details: "Sequential integer permutation: single bearer credential invoked /api/users/100, 101, and 102 in 8s.",
    simulationNote: "Simulated enumeration pattern indicative of Broken Object Level Authorization probing.",
    requestHeaders: {
      "Authorization": "Bearer eyJhbGci...[REDACTED_ENUM_TOKEN]",
      "X-Forwarded-For": "203.0.113.42",
      "User-Agent": "Python-requests/2.31.0"
    },
    requestBody: null,
    mitigation: "Apply rate limiting on numerical entity lookups; replace sequential IDs with UUIDs."
  },
  {
    id: "EVT-2026-084",
    timestamp: "2026-10-12 09:22:11",
    method: "POST",
    endpoint: "/api/v1/export/data",
    sourceIp: "10.0.2.14",
    statusCode: 202,
    eventType: "Shadow API Candidate",
    severity: "MEDIUM",
    status: "Under Review",
    details: "Route detected in runtime network traffic but unregistered in API gateway routing table.",
    simulationNote: "Candidate flagged for catalog synchronization and architectural validation.",
    requestHeaders: {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJhbGci...[REDACTED_EXPORT_TOKEN]"
    },
    requestBody: { "format": "csv", "scope": "tenant_metrics", "range": "30d" },
    mitigation: "Review data export permissions and import schema into OpenAPI contract."
  },
  {
    id: "EVT-2026-085",
    timestamp: "2026-10-12 08:55:03",
    method: "GET",
    endpoint: "/api/admin/metrics",
    sourceIp: "10.0.1.99",
    statusCode: 200,
    eventType: "Shadow API Candidate",
    severity: "MEDIUM",
    status: "Open",
    details: "Internal diagnostic telemetry route exposed without swagger documentation annotation.",
    simulationNote: "Simulated shadow detection rule based on gateway schema diffing.",
    requestHeaders: {
      "X-Service-Name": "monitoring-daemon",
      "User-Agent": "Prometheus/2.45.0"
    },
    requestBody: null,
    mitigation: "Restrict metrics scrape endpoint to internal cluster CIDR and document in service mesh."
  },
  {
    id: "EVT-2026-086",
    timestamp: "2026-10-12 08:15:39",
    method: "GET",
    endpoint: "/api/orders",
    sourceIp: "198.51.100.23",
    statusCode: 429,
    eventType: "Unusual Access Pattern",
    severity: "LOW",
    status: "Resolved",
    details: "Temporary burst of 40 requests per second from single client IP exceeding baseline standard deviation.",
    simulationNote: "Simulated traffic spike scenario (rate anomaly heuristic).",
    requestHeaders: {
      "User-Agent": "ShopBot/1.2 (+https://crawler.example.com)",
      "Accept-Encoding": "gzip, deflate"
    },
    requestBody: null,
    mitigation: "Rate limiter throttled source with HTTP 429; no data leakage observed."
  },
  {
    id: "EVT-2026-087",
    timestamp: "2026-10-12 07:30:12",
    method: "GET",
    endpoint: "/api/accounts/202",
    sourceIp: "192.168.1.105",
    statusCode: 403,
    eventType: "BOLA Suspicion",
    severity: "HIGH",
    status: "Open",
    details: "Mismatched tenant header X-Tenant-ID 'US-EAST' requested European account resource 202.",
    simulationNote: "Simulated multi-tenant parameter cross-referencing rule.",
    requestHeaders: {
      "X-Tenant-ID": "US-EAST",
      "Authorization": "Bearer eyJhbGci...[REDACTED_CROSS_TENANT]"
    },
    requestBody: null,
    mitigation: "Ensure tenant boundary validator fails fast before repository query execution."
  },
  {
    id: "EVT-2026-088",
    timestamp: "2026-10-12 06:45:10",
    method: "PUT",
    endpoint: "/api/users/101",
    sourceIp: "192.168.1.18",
    statusCode: 403,
    eventType: "BOLA Suspicion",
    severity: "HIGH",
    status: "Open",
    details: "Horizontal parameter access attempt: User session 109 queried private user record 101.",
    simulationNote: "Simulated token subject claim vs URI object ID divergence.",
    requestHeaders: {
      "Content-Type": "application/json",
      "Authorization": "Bearer eyJhbGci...[REDACTED_USER_109]"
    },
    requestBody: { "email_notifications": true, "role": "editor" },
    mitigation: "Validate that req.user.id matches path parameter :id for all profile mutations."
  },
  {
    id: "EVT-2026-089",
    timestamp: "2026-10-12 06:12:30",
    method: "GET",
    endpoint: "/api/accounts/202",
    sourceIp: "10.0.3.50",
    statusCode: 403,
    eventType: "BOLA Suspicion",
    severity: "MEDIUM",
    status: "Under Review",
    details: "Cross-tenant resource request: Account entity 202 accessed without matching organization claim.",
    simulationNote: "Simulated multi-tenant permission boundary rule.",
    requestHeaders: {
      "X-Org-Unit": "finance-apac",
      "Authorization": "Bearer eyJhbGci...[REDACTED_APAC_TOKEN]"
    },
    requestBody: null,
    mitigation: "Validate organization claim hierarchy in JWT middleware."
  }
];

export const trafficHistory = [
  { time: "00:00", total: 65, documented: 62, shadow: 2, flagged: 1 },
  { time: "02:00", total: 42, documented: 41, shadow: 1, flagged: 0 },
  { time: "04:00", total: 30, documented: 28, shadow: 1, flagged: 1 },
  { time: "06:00", total: 55, documented: 51, shadow: 2, flagged: 2 },
  { time: "08:00", total: 180, documented: 168, shadow: 8, flagged: 4 },
  { time: "10:00", total: 295, documented: 275, shadow: 12, flagged: 8 },
  { time: "12:00", total: 240, documented: 228, shadow: 7, flagged: 5 },
  { time: "14:00", total: 210, documented: 198, shadow: 8, flagged: 4 },
  { time: "16:00", total: 167, documented: 156, shadow: 7, flagged: 4 }
];

export const methodDistribution = [
  { method: "GET", count: 785, percentage: "61%", color: "#3B82F6" },
  { method: "POST", count: 348, percentage: "27%", color: "#10B981" },
  { method: "PUT", count: 85, percentage: "7%", color: "#F59E0B" },
  { method: "DELETE", count: 48, percentage: "4%", color: "#EF4444" },
  { method: "OTHER", count: 18, percentage: "1%", color: "#8B5CF6" }
];

export const alertDistribution = [
  { name: "BOLA Suspicion", count: 5, color: "#EF4444" },
  { name: "Shadow API Candidate", count: 3, color: "#F59E0B" },
  { name: "Unusual Access Pattern", count: 1, color: "#3B82F6" }
];

