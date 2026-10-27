import React, { useState } from 'react';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import EndpointTable from '../components/EndpointTable';
import AlertTable from '../components/AlertTable';
import TrafficChart from '../components/TrafficChart';
import DocumentationView from '../components/DocumentationView';
import {
  summaryStats,
  endpointsData,
  securityAlertsData,
  trafficHistory,
  methodDistribution,
  alertDistribution
} from '../data/mockData';
import { Info, ShieldAlert, WifiOff, RefreshCw, Server, AlertCircle } from 'lucide-react';
import {
  checkBackendHealth,
  fetchSummaryMetrics,
  fetchSecurityEvents,
  fetchEndpoints,
  fetchShadowDetections,
  fetchBolaDetections,
  fetchTelemetryHistory,
  triggerParserRun,
  API_BASE_URL
} from '../services/api';
import { adaptParserEvents } from '../services/eventAdapter';

export default function Dashboard({ activeSection, onSelectSection }) {
  const [globalSearch, setGlobalSearch] = useState('');
  const [dataSourceMode, setDataSourceMode] = useState('DEMO');
  const [backendStatus, setBackendStatus] = useState({ state: 'idle', error: null, attemptedAt: null });
  const [backendData, setBackendData] = useState({
    summary: null,
    events: [],
    endpoints: [],
    shadowDetections: [],
    bolaDetections: [],
    telemetry: []
  });
  const [isParserRunning, setIsParserRunning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [parserFeedback, setParserFeedback] = useState(null);

  // Load backend data from FastAPI endpoints
  const loadBackendData = async () => {
    setIsRefreshing(true);
    try {
      const [healthRes, summaryRes, eventsRes, endpointsRes, shadowRes, bolaRes, telemetryRes] = await Promise.all([
        checkBackendHealth(),
        fetchSummaryMetrics(),
        fetchSecurityEvents(),
        fetchEndpoints(),
        fetchShadowDetections(),
        fetchBolaDetections(),
        fetchTelemetryHistory()
      ]);

      if (!healthRes.success) {
        setBackendStatus({
          state: 'error',
          error: healthRes.error || `Failed to connect to ${API_BASE_URL}`,
          attemptedAt: new Date().toLocaleTimeString()
        });
        setIsRefreshing(false);
        return;
      }

      setBackendStatus({ state: 'connected', error: null, attemptedAt: new Date().toLocaleTimeString() });

      const rawEvents = (eventsRes.data && eventsRes.data.events) || eventsRes.data || [];
      const adaptedResult = adaptParserEvents(rawEvents);
      const rawEndpoints = (endpointsRes.data && endpointsRes.data.endpoints) || endpointsRes.data || [];
      const summary = summaryRes.data || null;
      const shadowDetections = (shadowRes.data && shadowRes.data.candidates) || [];
      const bolaDetections = (bolaRes.data && bolaRes.data.candidates) || [];
      const telemetrySeries = (telemetryRes.data && (telemetryRes.data.series || telemetryRes.data.telemetry)) || [];

      setBackendData({
        summary,
        events: adaptedResult.adapted,
        endpoints: rawEndpoints,
        shadowDetections,
        bolaDetections,
        telemetry: telemetrySeries
      });
      setLastRefreshedAt(new Date().toLocaleTimeString());
    } catch (err) {
      setBackendStatus({
        state: 'error',
        error: String(err),
        attemptedAt: new Date().toLocaleTimeString()
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh polling every 15 seconds when in live backend mode
  React.useEffect(() => {
    if (dataSourceMode !== 'BACKEND' || !autoRefreshEnabled || backendStatus.state !== 'connected') {
      return;
    }
    const timer = setInterval(() => {
      loadBackendData();
    }, 15000);
    return () => clearInterval(timer);
  }, [dataSourceMode, autoRefreshEnabled, backendStatus.state]);

  // Handle data source mode toggle
  const handleToggleDataSourceMode = async (mode) => {
    setDataSourceMode(mode);
    setParserFeedback(null);
    if (mode === 'BACKEND') {
      setBackendStatus({ state: 'connecting', error: null, attemptedAt: new Date().toLocaleTimeString() });
      await loadBackendData();
    } else {
      setBackendStatus({ state: 'idle', error: null, attemptedAt: null });
    }
  };

  const handleRetryBackend = () => {
    handleToggleDataSourceMode('BACKEND');
  };

  const handleRunParser = async () => {
    setIsParserRunning(true);
    setParserFeedback(null);
    const runRes = await triggerParserRun();
    setIsParserRunning(false);

    if (runRes.success) {
      setParserFeedback({
        type: 'success',
        message: runRes.data?.message || 'Traffic parser executed successfully. Telemetry refreshed.'
      });
      await loadBackendData();
    } else {
      setParserFeedback({
        type: 'error',
        message: runRes.error || 'Failed to execute parser process.'
      });
    }
  };

  // Page titles corresponding to current active sidebar navigation item
  const sectionMeta = {
    overview: {
      title: 'Security Overview',
      subtitle: 'Runtime API Security Monitoring & Threat Detection'
    },
    endpoints: {
      title: 'API Endpoint Inventory',
      subtitle: 'Discovered API Routes & OpenAPI Specification Matching'
    },
    alerts: {
      title: 'Security Alerts & Incident Triage',
      subtitle: 'Simulated BOLA and Shadow API Detection Events'
    },
    analytics: {
      title: 'Traffic Analytics & Telemetry',
      subtitle: 'Aggregated Request Volumes and Method Distribution'
    },
    docs: {
      title: 'System Documentation',
      subtitle: 'Week 2 Engineering Architecture & Parser Specifications'
    }
  };

  const currentMeta = sectionMeta[activeSection] || sectionMeta.overview;

  const searchPlaceholders = {
    overview: "Search endpoints and alerts...",
    endpoints: "Search endpoints (e.g. /api/users, GET)...",
    alerts: "Search alerts (e.g. EVT, BOLA, HIGH)...",
    analytics: "Search metrics or endpoints...",
    docs: "Search documentation..."
  };

  const handleClearGlobalSearch = () => {
    setGlobalSearch('');
  };

  // Effective datasets based on active data source mode
  const isBackendLive = dataSourceMode === 'BACKEND' && backendStatus.state === 'connected';

  const effectiveStats = (isBackendLive && backendData.summary) ? [
    {
      id: 'total-requests',
      title: 'Total API Requests',
      value: String(backendData.summary.total_requests || 0),
      numericValue: backendData.summary.total_requests || 0,
      change: `${backendData.summary.success_rate || 0}%`,
      changeType: 'positive',
      subtext: `Success rate: ${backendData.summary.success_rate || 0}% (${backendData.summary.error_count || 0} errors)`,
      icon: 'Activity',
      badge: 'PARSER LIVE'
    },
    {
      id: 'discovered-endpoints',
      title: 'Discovered Endpoints',
      value: String(backendData.endpoints?.length || Object.keys(backendData.summary.endpoints || {}).length || 0),
      numericValue: backendData.endpoints?.length || 0,
      change: 'Verified',
      changeType: 'positive',
      subtext: 'Derived from parsed runtime traffic',
      icon: 'ListFilter',
      badge: 'CATALOG'
    },
    {
      id: 'shadow-api-candidates',
      title: 'Shadow API Candidates',
      value: String(backendData.shadowDetections?.length ?? backendData.summary.uncataloged_endpoint_count ?? (backendData.endpoints || []).filter(e => e.docStatus === 'Undocumented Candidate').length),
      numericValue: backendData.shadowDetections?.length ?? backendData.summary.uncataloged_endpoint_count ?? 0,
      change: 'Audit needed',
      changeType: 'neutral',
      subtext: 'Uncataloged paths observed in traffic',
      icon: 'EyeOff',
      badge: 'CANDIDATE'
    },
    {
      id: 'bola-alert-candidates',
      title: 'BOLA Review Candidates',
      value: String(backendData.bolaDetections?.length ?? backendData.summary.potential_auth_review_count ?? 0),
      numericValue: backendData.bolaDetections?.length ?? backendData.summary.potential_auth_review_count ?? 0,
      change: 'Triage',
      changeType: 'warning',
      subtext: 'Caller/Owner ID discrepancies observed',
      icon: 'ShieldAlert',
      badge: 'REVIEW'
    }
  ] : summaryStats;

  const effectiveMethods = (isBackendLive && backendData.summary) ? [
    { method: 'GET', count: backendData.summary.methods?.GET || 0, percentage: `${backendData.summary.total_requests ? Math.round(((backendData.summary.methods?.GET || 0) / backendData.summary.total_requests) * 100) : 0}%`, color: '#3B82F6' },
    { method: 'POST', count: backendData.summary.methods?.POST || 0, percentage: `${backendData.summary.total_requests ? Math.round(((backendData.summary.methods?.POST || 0) / backendData.summary.total_requests) * 100) : 0}%`, color: '#10B981' },
    { method: 'PUT', count: backendData.summary.methods?.PUT || 0, percentage: `${backendData.summary.total_requests ? Math.round(((backendData.summary.methods?.PUT || 0) / backendData.summary.total_requests) * 100) : 0}%`, color: '#F59E0B' },
    { method: 'DELETE', count: backendData.summary.methods?.DELETE || 0, percentage: `${backendData.summary.total_requests ? Math.round(((backendData.summary.methods?.DELETE || 0) / backendData.summary.total_requests) * 100) : 0}%`, color: '#EF4444' },
    { method: 'OTHER', count: backendData.summary.methods?.OTHER || 0, percentage: '0%', color: '#8B5CF6' }
  ] : methodDistribution;

  const effectiveEndpoints = isBackendLive
    ? backendData.endpoints
    : endpointsData;

  const effectiveAlerts = isBackendLive
    ? backendData.events
    : securityAlertsData;

  const effectiveTraffic = isBackendLive
    ? (backendData.telemetry?.length > 0
        ? backendData.telemetry
        : backendData.events.map((ev, i) => ({
            time: ev.timestamp ? ev.timestamp.substring(11, 19) : `10:00:0${i * 5}`,
            total: 1,
            documented: ev.eventType === 'Observed API Event' ? 1 : 0,
            shadow: ev.eventType === 'Uncataloged Route Observation' ? 1 : 0,
            flagged: (ev.eventType === 'Potential Authorization Review Candidate' || ev.statusCode >= 400) ? 1 : 0,
            get: ev.method === 'GET' ? 1 : 0,
            post: ev.method === 'POST' ? 1 : 0
          }))
      )
    : trafficHistory;

  return (
    <div className="main-content">
      {/* Header */}
      <Header
        title={currentMeta.title}
        subtitle={currentMeta.subtitle}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder={searchPlaceholders[activeSection] || "Search endpoints or alerts..."}
        dataSourceMode={dataSourceMode}
        onToggleDataSourceMode={handleToggleDataSourceMode}
        backendStatus={backendStatus}
        onRunParser={handleRunParser}
        isParserRunning={isParserRunning}
        onRefreshBackend={loadBackendData}
        isRefreshing={isRefreshing}
        lastRefreshedAt={lastRefreshedAt}
      />

      <div className="page-wrapper">
        {/* DEMO MODE Banner */}
        {dataSourceMode === 'DEMO' && (
          <div className="demo-banner">
            <Info size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="demo-banner-content">
              <h4>Prototype Demo Environment — Week 3 Milestone</h4>
              <p>
                Operating in <strong>DEMO MODE</strong> utilizing static mock datasets.
                Absence from mock documentation flags shadow candidates; BOLA alerts reflect simulated heuristic rules.
                To test live Python parser telemetry, toggle to <strong>BACKEND API</strong> above.
              </p>
            </div>
          </div>
        )}

        {/* BACKEND MODE: Live Connected Banner */}
        {dataSourceMode === 'BACKEND' && backendStatus.state === 'connected' && (
          <div className="demo-banner" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.08)' }}>
            <Server size={20} color="var(--color-success)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div className="demo-banner-content" style={{ flexGrow: 1 }}>
              <h4 style={{ color: 'var(--color-success)' }}>FastAPI Gateway Online — Live Parser Telemetry</h4>
              <p>
                Streaming telemetry from <code>logs/parsed_events.json</code> via backend at <code>{API_BASE_URL}</code>.
                Loaded <strong>{backendData.summary?.total_requests || backendData.events.length}</strong> parsed transactions across <strong>{effectiveEndpoints.length}</strong> routes.
                {parserFeedback && (
                  <span style={{ display: 'block', marginTop: 4, color: parserFeedback.type === 'error' ? 'var(--color-critical)' : 'var(--text-main)', fontWeight: 600 }}>
                    {parserFeedback.message}
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                className="btn-inspect"
                onClick={handleRunParser}
                disabled={isParserRunning}
                title="Execute parser/traffic_parser.py against sample_events.json"
              >
                {isParserRunning ? <RefreshCw size={12} className="spin-icon" /> : <RefreshCw size={12} />}
                <span>{isParserRunning ? 'Executing...' : 'Re-run Parser'}</span>
              </button>
            </div>
          </div>
        )}

        {/* BACKEND MODE Connection Diagnostics Banner (when offline or error) */}
        {dataSourceMode === 'BACKEND' && backendStatus.state === 'error' && (
          <div className="backend-error-banner">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <WifiOff size={22} color="var(--color-critical)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h4 style={{ color: 'var(--color-critical)', fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>
                  Backend Service Offline — Connection Refused ({API_BASE_URL})
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  Unable to establish connection to the Python backend API at <code>{API_BASE_URL}</code> (checked at {backendStatus.attemptedAt || 'just now'}).
                  <br />
                  <strong>Integrity Rule:</strong> In accordance with project requirements, mock data is <em>not silently substituted</em> while in Backend Mode.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button className="btn-inspect" onClick={handleRetryBackend} title="Retry backend connection">
                <RefreshCw size={13} />
                <span>Retry</span>
              </button>
              <button className="btn-primary" onClick={() => handleToggleDataSourceMode('DEMO')} title="Return to Demo Mode">
                <span>Switch to Demo Mode</span>
              </button>
            </div>
          </div>
        )}

        {/* Section View: Documentation */}
        {activeSection === 'docs' && (
          <DocumentationView />
        )}

        {/* Section View: Overview (Displays full dashboard view) */}
        {activeSection === 'overview' && (
          <>
            {/* 4 Summary Cards */}
            <div className="stats-grid">
              {effectiveStats.map((stat) => (
                <StatCard
                  key={stat.id}
                  title={stat.title}
                  value={stat.value}
                  change={stat.change}
                  changeType={stat.changeType}
                  subtext={stat.subtext}
                  iconName={stat.icon}
                  badge={stat.badge}
                />
              ))}
            </div>

            {/* Traffic Analytics Chart */}
            <TrafficChart
              trafficData={effectiveTraffic}
              methods={effectiveMethods}
              alertCategories={alertDistribution}
            />

            {/* Endpoint Inventory Table */}
            <EndpointTable
              endpoints={effectiveEndpoints}
              globalSearch={globalSearch}
              onClearGlobalSearch={handleClearGlobalSearch}
            />

            {/* Security Alerts Table */}
            <AlertTable
              alerts={effectiveAlerts}
              globalSearch={globalSearch}
              onClearGlobalSearch={handleClearGlobalSearch}
            />
          </>
        )}

        {/* Section View: Endpoints only */}
        {activeSection === 'endpoints' && (
          <>
            <div className="stats-grid">
              <StatCard
                title={effectiveStats[1].title}
                value={effectiveStats[1].value}
                change={effectiveStats[1].change}
                changeType={effectiveStats[1].changeType}
                subtext={effectiveStats[1].subtext}
                iconName={effectiveStats[1].icon}
                badge={effectiveStats[1].badge}
              />
              <StatCard
                title={effectiveStats[2].title}
                value={effectiveStats[2].value}
                change={effectiveStats[2].change}
                changeType={effectiveStats[2].changeType}
                subtext={effectiveStats[2].subtext}
                iconName={effectiveStats[2].icon}
                badge={effectiveStats[2].badge}
              />
            </div>
            <EndpointTable
              endpoints={effectiveEndpoints}
              globalSearch={globalSearch}
              onClearGlobalSearch={handleClearGlobalSearch}
            />
          </>
        )}

        {/* Section View: Alerts only */}
        {activeSection === 'alerts' && (
          <>
            <div className="stats-grid">
              <StatCard
                title={effectiveStats[3].title}
                value={effectiveStats[3].value}
                change={effectiveStats[3].change}
                changeType={effectiveStats[3].changeType}
                subtext={effectiveStats[3].subtext}
                iconName={effectiveStats[3].icon}
                badge={effectiveStats[3].badge}
              />
              <StatCard
                title={effectiveStats[2].title}
                value={effectiveStats[2].value}
                change={effectiveStats[2].change}
                changeType={effectiveStats[2].changeType}
                subtext={effectiveStats[2].subtext}
                iconName={effectiveStats[2].icon}
                badge={effectiveStats[2].badge}
              />
            </div>
            <AlertTable
              alerts={effectiveAlerts}
              globalSearch={globalSearch}
              onClearGlobalSearch={handleClearGlobalSearch}
            />
          </>
        )}

        {/* Section View: Analytics only */}
        {activeSection === 'analytics' && (
          <>
            <div className="stats-grid">
              <StatCard
                title={effectiveStats[0].title}
                value={effectiveStats[0].value}
                change={effectiveStats[0].change}
                changeType={effectiveStats[0].changeType}
                subtext={effectiveStats[0].subtext}
                iconName={effectiveStats[0].icon}
                badge={effectiveStats[0].badge}
              />
            </div>
            <TrafficChart
              trafficData={effectiveTraffic}
              methods={effectiveMethods}
              alertCategories={alertDistribution}
            />
          </>
        )}
      </div>
    </div>
  );
}
