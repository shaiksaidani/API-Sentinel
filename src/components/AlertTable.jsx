import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Clock,
  Info,
  Eye,
  Globe
} from 'lucide-react';
import EventDetailModal from './EventDetailModal';

export default function AlertTable({ alerts = [], globalSearch = '', onClearGlobalSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const effectiveSearch = (searchTerm || globalSearch).trim().toLowerCase();

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSearch =
        !effectiveSearch ||
        alert.id?.toLowerCase().includes(effectiveSearch) ||
        alert.endpoint?.toLowerCase().includes(effectiveSearch) ||
        alert.method?.toLowerCase().includes(effectiveSearch) ||
        alert.sourceIp?.toLowerCase().includes(effectiveSearch) ||
        String(alert.statusCode || '').includes(effectiveSearch) ||
        alert.eventType?.toLowerCase().includes(effectiveSearch) ||
        alert.severity?.toLowerCase().includes(effectiveSearch) ||
        alert.status?.toLowerCase().includes(effectiveSearch) ||
        alert.details?.toLowerCase().includes(effectiveSearch) ||
        alert.simulationNote?.toLowerCase().includes(effectiveSearch);

      const matchesSeverity =
        severityFilter === 'ALL' || alert.severity === severityFilter;

      const matchesType =
        typeFilter === 'ALL' ||
        alert.eventType === typeFilter ||
        (typeFilter === 'BOLA Suspicion' && alert.eventType === 'Potential Authorization Review Candidate') ||
        (typeFilter === 'Potential Authorization Review Candidate' && alert.eventType === 'BOLA Suspicion') ||
        (typeFilter === 'Shadow API Candidate' && alert.eventType === 'Uncataloged Route Observation') ||
        (typeFilter === 'Uncataloged Route Observation' && alert.eventType === 'Shadow API Candidate');

      return matchesSearch && matchesSeverity && matchesType;
    });
  }, [alerts, effectiveSearch, severityFilter, typeFilter]);

  const handleReset = () => {
    setSearchTerm('');
    setSeverityFilter('ALL');
    setTypeFilter('ALL');
    if (onClearGlobalSearch) {
      onClearGlobalSearch();
    }
  };

  const isFiltered = Boolean(
    searchTerm ||
    (globalSearch && globalSearch.trim()) ||
    severityFilter !== 'ALL' ||
    typeFilter !== 'ALL'
  );

  const getSeverityBadge = (severity) => {
    const s = severity?.toUpperCase() || 'LOW';
    let className = 'severity-pill ';
    if (s === 'CRITICAL') className += 'severity-critical';
    else if (s === 'HIGH') className += 'severity-high';
    else if (s === 'MEDIUM') className += 'severity-medium';
    else className += 'severity-low';

    return <span className={className}>{s}</span>;
  };

  const getMethodBadgeClass = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'method-badge method-get';
      case 'POST': return 'method-badge method-post';
      case 'PUT': return 'method-badge method-put';
      case 'DELETE': return 'method-delete';
      case 'PATCH': return 'method-badge method-patch';
      default: return 'method-badge method-get';
    }
  };

  const getStatusCodeBadge = (code) => {
    if (!code) return null;
    let badgeClass = 'status-pill ';
    if (code >= 200 && code < 300) badgeClass += 'status-documented';
    else if (code >= 400 && code < 500) badgeClass += 'status-review';
    else badgeClass += 'status-normal';

    return (
      <span className={badgeClass} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
        {code}
      </span>
    );
  };

  return (
    <>
      <div className="content-section" id="alerts-section">
        <div className="section-header">
          <div className="section-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3>Security Event Log</h3>
              <span className="table-count-badge">
                {filteredAlerts.length} of {alerts.length} events
              </span>
            </div>
            <p>Simulated detection events for Broken Object Level Authorization & Shadow endpoints</p>
          </div>

          {/* Filter Controls */}
          <div className="table-controls">
            <input
              type="text"
              className="control-input"
              placeholder={globalSearch ? `Filter (${globalSearch})...` : "Search alerts, IPs, endpoints..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="control-select"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <select
              className="control-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Event Types</option>
              <option value="BOLA Suspicion">BOLA Suspicion</option>
              <option value="Potential Authorization Review Candidate">BOLA Review Candidate</option>
              <option value="Shadow API Candidate">Shadow API Candidate</option>
              <option value="Uncataloged Route Observation">Uncataloged Route Observation</option>
              <option value="Unusual Access Pattern">Unusual Access Pattern</option>
            </select>

            {isFiltered && (
              <button className="btn-reset" onClick={handleReset} title="Reset filters">
                <RotateCcw size={13} />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Timestamp</th>
                <th>Method & Endpoint</th>
                <th>Source IP</th>
                <th>HTTP Status</th>
                <th>Event Type</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id}>
                    <td className="event-id-cell">
                      {alert.id}
                    </td>
                    <td className="timestamp-cell">
                      {alert.timestamp}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={getMethodBadgeClass(alert.method)}>
                          {alert.method || 'GET'}
                        </span>
                        <span className="endpoint-cell">
                          {alert.endpoint}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Globe size={12} color="var(--text-muted)" />
                        {alert.sourceIp || '127.0.0.1'}
                      </div>
                    </td>
                    <td>
                      {getStatusCodeBadge(alert.statusCode)}
                    </td>
                    <td>
                      <span className="event-type-pill">
                        {(alert.eventType === 'BOLA Suspicion' || alert.eventType === 'Potential Authorization Review Candidate') && (
                          <ShieldAlert size={14} color="var(--color-critical)" />
                        )}
                        {(alert.eventType === 'Shadow API Candidate' || alert.eventType === 'Uncataloged Route Observation') && (
                          <AlertTriangle size={14} color="var(--color-warning)" />
                        )}
                        {alert.eventType === 'Unusual Access Pattern' && (
                          <Clock size={14} color="var(--primary-blue)" />
                        )}
                        {alert.eventType}
                      </span>
                    </td>
                    <td>
                      {getSeverityBadge(alert.severity)}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: alert.status === 'Resolved' ? 'var(--color-success)' : 'var(--text-secondary)'
                      }}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-inspect"
                        onClick={() => setSelectedEvent(alert)}
                        title="Inspect event details and payload"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">
                    <div className="empty-state">
                      <ShieldAlert size={32} className="empty-state-icon" />
                      <h4>No Matching Security Alerts</h4>
                      <p>No simulated alerts match your current search or severity criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Inspector */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </>
  );
}

